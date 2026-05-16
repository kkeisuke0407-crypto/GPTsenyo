import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "../lib/env";

export type Stats = {
  totalUsers: number;
  usersWithBirthdate: number;
  activeUsers30d: number;
  payingUsers: Record<Exclude<Plan, "free">, number>;
  mrrJpy: number;
  sessionsByType30d: Record<string, number>;
  sessionsLast14Days: Array<{ date: string; count: number }>;
};

const PRICE: Record<Exclude<Plan, "free">, number> = {
  light: 980,
  standard: 1980,
  premium: 4980,
};

export async function loadStats(db: SupabaseClient): Promise<Stats> {
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since14 = new Date(Date.now() - 13 * 86400000);
  since14.setUTCHours(0, 0, 0, 0);

  const totalUsersP = db.from("users").select("*", { count: "exact", head: true });
  const usersWithBirthdateP = db
    .from("users")
    .select("*", { count: "exact", head: true })
    .not("birthdate", "is", null);
  const activeUsersP = db
    .from("sessions")
    .select("line_user_id", { count: "exact" })
    .gte("created_at", since30);
  const planCountsP = db.from("users").select("plan");
  const sessionsByTypeP = db
    .from("sessions")
    .select("type")
    .gte("created_at", since30);
  const sessionsRecentP = db
    .from("sessions")
    .select("created_at")
    .gte("created_at", since14.toISOString());

  const [tu, ub, au, pc, st, sr] = await Promise.all([
    totalUsersP, usersWithBirthdateP, activeUsersP, planCountsP, sessionsByTypeP, sessionsRecentP,
  ]);

  if (tu.error) throw tu.error;
  if (ub.error) throw ub.error;
  if (au.error) throw au.error;
  if (pc.error) throw pc.error;
  if (st.error) throw st.error;
  if (sr.error) throw sr.error;

  const paying: Record<Exclude<Plan, "free">, number> = { light: 0, standard: 0, premium: 0 };
  for (const row of (pc.data ?? []) as Array<{ plan: Plan }>) {
    if (row.plan === "free") continue;
    paying[row.plan]++;
  }
  const mrr = paying.light * PRICE.light + paying.standard * PRICE.standard + paying.premium * PRICE.premium;

  const sessionsByType: Record<string, number> = {};
  for (const row of (st.data ?? []) as Array<{ type: string }>) {
    sessionsByType[row.type] = (sessionsByType[row.type] ?? 0) + 1;
  }

  // Distinct active users
  const activeIds = new Set<string>();
  for (const row of (au.data ?? []) as Array<{ line_user_id: string }>) {
    activeIds.add(row.line_user_id);
  }

  // Daily session counts for last 14 days
  const dayCounts = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since14.getTime() + i * 86400000);
    dayCounts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of (sr.data ?? []) as Array<{ created_at: string }>) {
    const k = row.created_at.slice(0, 10);
    if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  const sessionsLast14Days = [...dayCounts.entries()].map(([date, count]) => ({ date, count }));

  return {
    totalUsers: tu.count ?? 0,
    usersWithBirthdate: ub.count ?? 0,
    activeUsers30d: activeIds.size,
    payingUsers: paying,
    mrrJpy: mrr,
    sessionsByType30d: sessionsByType,
    sessionsLast14Days,
  };
}
