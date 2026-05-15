import type { Env, Plan } from "../lib/env";

export function priceIdForPlan(env: Env, plan: Exclude<Plan, "free">): string {
  switch (plan) {
    case "light":
      return env.STRIPE_PRICE_LIGHT;
    case "standard":
      return env.STRIPE_PRICE_STANDARD;
    case "premium":
      return env.STRIPE_PRICE_PREMIUM;
  }
}

export function priceToPlan(env: Env, priceId: string): Plan | null {
  if (priceId === env.STRIPE_PRICE_LIGHT) return "light";
  if (priceId === env.STRIPE_PRICE_STANDARD) return "standard";
  if (priceId === env.STRIPE_PRICE_PREMIUM) return "premium";
  return null;
}

/**
 * Stripe Checkout Session を作成し、決済URLを返す。
 * SDK を使わずフォームエンコードで Stripe API を直接叩く（Workers でバンドル軽量化のため）。
 */
export async function createCheckoutSession(args: {
  env: Env;
  lineUserId: string;
  plan: Exclude<Plan, "free">;
}): Promise<string> {
  const priceId = priceIdForPlan(args.env, args.plan);
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("client_reference_id", args.lineUserId);
  body.set("metadata[line_user_id]", args.lineUserId);
  body.set("metadata[plan]", args.plan);
  body.set("metadata[price_id]", priceId);
  body.set("subscription_data[metadata][line_user_id]", args.lineUserId);
  body.set("subscription_data[metadata][plan]", args.plan);
  body.set("subscription_data[metadata][price_id]", priceId);
  body.set("success_url", `${args.env.PUBLIC_BASE_URL}/checkout/success`);
  body.set("cancel_url", `${args.env.PUBLIC_BASE_URL}/checkout/cancel`);
  body.set("allow_promotion_codes", "true");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${args.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Stripe checkout error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error("Stripe response missing url");
  return json.url;
}
