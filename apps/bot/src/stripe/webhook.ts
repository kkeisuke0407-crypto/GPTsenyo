import { getDb, setUserPlan } from "../db/supabase";
import type { Env } from "../lib/env";
import { priceToPlan } from "./checkout";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

/**
 * Stripe Webhook 署名検証（v=1 HMAC-SHA256）
 * https://docs.stripe.com/webhooks/signatures
 */
export async function verifyStripeSignature(
  secret: string,
  payload: string,
  signatureHeader: string | null,
  toleranceSeconds = 300
): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k ?? "", v ?? ""] as const;
    })
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  if (Math.abs(Date.now() / 1000 - Number.parseInt(timestamp, 10)) > toleranceSeconds) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(expected, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function handleStripeEvent(env: Env, event: StripeEvent): Promise<void> {
  const db = getDb(env);

  // 冪等化: 同一 event.id は1度だけ処理
  const { data: existing } = await db.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (existing) return;
  await db.from("stripe_events").insert({ id: event.id, type: event.type, payload: event });

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const obj = event.data.object as Record<string, unknown>;
      const lineUserId = extractLineUserId(obj);
      const priceId = extractPriceId(obj);
      const stripeCustomerId = (obj["customer"] as string | undefined) ?? undefined;
      const planUntil = extractPeriodEnd(obj);
      if (!lineUserId || !priceId) return;
      const plan = priceToPlan(env, priceId);
      if (!plan || plan === "free") {
        console.warn("Unmapped price id", priceId);
        return;
      }
      await setUserPlan(db, { lineUserId, plan, planUntil, stripeCustomerId });
      break;
    }
    case "customer.subscription.deleted": {
      const obj = event.data.object as Record<string, unknown>;
      const lineUserId = extractLineUserId(obj);
      if (!lineUserId) return;
      await setUserPlan(db, { lineUserId, plan: "free", planUntil: null });
      break;
    }
    default:
      // 未対応イベントは無視
      break;
  }
}

function extractLineUserId(obj: Record<string, unknown>): string | null {
  // metadata.line_user_id を Checkout Session 作成時に必ず付与する想定
  const md = (obj["metadata"] as Record<string, string> | undefined) ?? {};
  const direct = md["line_user_id"];
  if (direct) return direct;
  const client = obj["client_reference_id"];
  return typeof client === "string" ? client : null;
}

function extractPriceId(obj: Record<string, unknown>): string | null {
  const items = obj["items"] as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const id = items?.data?.[0]?.price?.id;
  if (id) return id;
  // checkout.session の場合は line_items を expand する必要があるため、metadata に price_id を入れる運用を推奨
  const md = (obj["metadata"] as Record<string, string> | undefined) ?? {};
  return md["price_id"] ?? null;
}

function extractPeriodEnd(obj: Record<string, unknown>): string | null {
  const end = obj["current_period_end"];
  if (typeof end === "number") return new Date(end * 1000).toISOString();
  return null;
}
