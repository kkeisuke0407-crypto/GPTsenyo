import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Plan } from "../lib/env";

export type UserRow = {
  line_user_id: string;
  display_name: string | null;
  birthdate: string | null; // ISO date
  plan: Plan;
  plan_until: string | null;
  stripe_customer_id: string | null;
  created_at: string;
};

export type SessionRow = {
  line_user_id: string;
  type: "astrology" | "tarot" | "numerology" | "sizhu" | "iching";
  question: string;
  facts: Record<string, unknown>;
  narration: string;
  tokens_used: number;
  created_at: string;
};

export function getDb(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function upsertUser(
  db: SupabaseClient,
  args: { lineUserId: string; displayName?: string | null }
): Promise<UserRow> {
  const { data, error } = await db
    .from("users")
    .upsert(
      {
        line_user_id: args.lineUserId,
        display_name: args.displayName ?? null,
      },
      { onConflict: "line_user_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();
  if (error) throw new Error(`upsertUser failed: ${error.message}`);
  return data as UserRow;
}

export async function getUser(db: SupabaseClient, lineUserId: string): Promise<UserRow | null> {
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();
  if (error) throw new Error(`getUser failed: ${error.message}`);
  return (data as UserRow | null) ?? null;
}

export async function setUserBirthdate(
  db: SupabaseClient,
  lineUserId: string,
  birthdate: string
): Promise<void> {
  const { error } = await db.from("users").update({ birthdate }).eq("line_user_id", lineUserId);
  if (error) throw new Error(`setUserBirthdate failed: ${error.message}`);
}

export async function setUserPlan(
  db: SupabaseClient,
  args: { lineUserId: string; plan: Plan; planUntil: string | null; stripeCustomerId?: string }
): Promise<void> {
  const update: Record<string, unknown> = { plan: args.plan, plan_until: args.planUntil };
  if (args.stripeCustomerId) update["stripe_customer_id"] = args.stripeCustomerId;
  const { error } = await db.from("users").update(update).eq("line_user_id", args.lineUserId);
  if (error) throw new Error(`setUserPlan failed: ${error.message}`);
}

export async function countMonthlySessions(
  db: SupabaseClient,
  lineUserId: string
): Promise<number> {
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await db
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("line_user_id", lineUserId)
    .gte("created_at", since.toISOString());
  if (error) throw new Error(`countMonthlySessions failed: ${error.message}`);
  return count ?? 0;
}

export async function insertSession(db: SupabaseClient, row: Omit<SessionRow, "created_at">): Promise<void> {
  const { error } = await db.from("sessions").insert(row);
  if (error) throw new Error(`insertSession failed: ${error.message}`);
}
