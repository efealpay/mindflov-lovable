import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Throws unless the caller holds the admin role (checked as the user, via RLS-safe RPC). */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export interface AdminUserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  tier: string;
  status: string;
  interval: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  mapCount: number;
  weeklyUsage: number;
  generations: number;
  isAdmin: boolean;
}

function isoWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Paginated, searchable user directory with plan, usage and activity per row. */
export const listUsersForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string; page?: number; pageSize?: number; tier?: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const pageSize = Math.min(100, Math.max(10, data.pageSize ?? 25));
    const page = Math.max(0, data.page ?? 0);
    const search = data.search?.trim();

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, subscription_tier, created_at, last_active_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (search) query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    if (data.tier && data.tier !== "all") query = query.eq("subscription_tier", data.tier);

    const { data: profiles, count, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((row) => row.id);
    if (ids.length === 0) return { users: [] as AdminUserRow[], total: count ?? 0, page, pageSize };

    const weekKey = isoWeekKey();
    const [subs, maps, usage, roles, events] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, status, interval, current_period_end, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("mindmaps").select("user_id").in("user_id", ids),
      supabaseAdmin.from("usage_weekly").select("user_id, count").in("user_id", ids).eq("week_key", weekKey),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("ai_events").select("user_id").in("user_id", ids),
    ]);

    const countBy = (rows: { user_id: string | null }[] | null) => {
      const totals = new Map<string, number>();
      for (const row of rows ?? []) {
        if (!row.user_id) continue;
        totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + 1);
      }
      return totals;
    };

    const mapTotals = countBy(maps.data);
    const eventTotals = countBy(events.data);
    const usageTotals = new Map((usage.data ?? []).map((row) => [row.user_id, row.count]));
    const adminIds = new Set(
      (roles.data ?? []).filter((row) => row.role === "admin").map((row) => row.user_id),
    );
    const subByUser = new Map<string, (typeof subs.data)[number]>();
    for (const row of subs.data ?? []) {
      if (!subByUser.has(row.user_id)) subByUser.set(row.user_id, row);
    }

    const users: AdminUserRow[] = (profiles ?? []).map((profile) => {
      const sub = subByUser.get(profile.id);
      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        tier: profile.subscription_tier ?? "free",
        status: sub?.status ?? "inactive",
        interval: sub?.interval ?? null,
        currentPeriodEnd: sub?.current_period_end ?? null,
        createdAt: profile.created_at,
        lastActiveAt: profile.last_active_at ?? null,
        mapCount: mapTotals.get(profile.id) ?? 0,
        weeklyUsage: usageTotals.get(profile.id) ?? 0,
        generations: eventTotals.get(profile.id) ?? 0,
        isAdmin: adminIds.has(profile.id),
      };
    });

    return { users, total: count ?? 0, page, pageSize };
  });

/** Manual tier override (comped accounts, support fixes). */
export const setUserTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; tier: "free" | "plus" | "pro" }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ subscription_tier: data.tier })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const setUserAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; makeAdmin: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.makeAdmin) {
      throw new Error("You can't remove your own admin access");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

/** Deletes a user and every row they own. */
export const deleteUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Use the account page to delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("mindmaps").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("usage_weekly").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("ai_events").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const resetUserWeeklyUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("usage_weekly")
      .update({ count: 0 })
      .eq("user_id", data.userId)
      .eq("week_key", isoWeekKey());
    if (error) throw new Error(error.message);
    return { success: true };
  });

export interface AdminStats {
  totals: {
    users: number;
    newUsers: number;
    paidUsers: number;
    activeUsers: number;
    maps: number;
    generations: number;
    failedGenerations: number;
    tokens: number;
    avgLatencyMs: number;
    mrr: number;
  };
  tierBreakdown: { tier: string; count: number }[];
  actionBreakdown: { key: string; label: string; count: number }[];
  contextBreakdown: { key: string; label: string; count: number }[];
  modeBreakdown: { key: string; label: string; count: number }[];
  daily: { date: string; generations: number; signups: number }[];
}

const TIER_PRICE: Record<string, number> = { plus: 11.99, pro: 29.99 };

const ACTION_LABEL: Record<string, string> = {
  expand: "Expand node",
  insight: "Deep insight",
  plan: "Action plan",
  neural_analysis: "Neural analysis",
  converge: "Converge nodes",
  synthesis: "Synthesis / brief",
  seed: "Seed concept",
  other: "Other",
};

/** Aggregated product analytics for the admin dashboard. */
export const getAdminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => data)
  .handler(async ({ data, context }): Promise<AdminStats> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const days = Math.min(90, Math.max(7, data.days ?? 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [profilesRes, mapsRes, eventsRes, subsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, subscription_tier, created_at, last_active_at"),
      supabaseAdmin.from("mindmaps").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("ai_events")
        .select(
          "action_type, context_role, mode_key, mode_label, tokens_in, tokens_out, latency_ms, success, created_at",
        )
        .gte("created_at", since),
      supabaseAdmin.from("subscriptions").select("user_id, tier, status, interval"),
    ]);

    const profiles = profilesRes.data ?? [];
    const events = eventsRes.data ?? [];

    const tierCounts = new Map<string, number>();
    for (const profile of profiles) {
      const tier = profile.subscription_tier ?? "free";
      tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);
    }

    const activeSince = new Date(Date.now() - 7 * 86400000).getTime();
    const activeUsers = profiles.filter(
      (profile) => profile.last_active_at && new Date(profile.last_active_at).getTime() > activeSince,
    ).length;
    const newUsers = profiles.filter(
      (profile) => new Date(profile.created_at).toISOString() >= since,
    ).length;

    let mrr = 0;
    const paidUsers = new Set<string>();
    for (const sub of subsRes.data ?? []) {
      if (!["active", "trialing", "past_due"].includes(sub.status)) continue;
      const price = TIER_PRICE[sub.tier] ?? 0;
      if (price === 0) continue;
      paidUsers.add(sub.user_id);
      // Yearly plans bill 10 months' worth up front — normalise to a monthly figure.
      mrr += sub.interval === "year" ? (price * 10) / 12 : price;
    }

    const tally = (
      rows: typeof events,
      pick: (row: (typeof events)[number]) => { key: string; label: string } | null,
    ) => {
      const totals = new Map<string, { label: string; count: number }>();
      for (const row of rows) {
        const entry = pick(row);
        if (!entry) continue;
        const current = totals.get(entry.key);
        totals.set(entry.key, { label: entry.label, count: (current?.count ?? 0) + 1 });
      }
      return [...totals.entries()]
        .map(([key, value]) => ({ key, label: value.label, count: value.count }))
        .sort((a, b) => b.count - a.count);
    };

    const dailyMap = new Map<string, { generations: number; signups: number }>();
    for (let index = days - 1; index >= 0; index -= 1) {
      const key = new Date(Date.now() - index * 86400000).toISOString().slice(0, 10);
      dailyMap.set(key, { generations: 0, signups: 0 });
    }
    for (const row of events) {
      const key = row.created_at.slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.generations += 1;
    }
    for (const profile of profiles) {
      const key = new Date(profile.created_at).toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.signups += 1;
    }

    const latencies = events
      .map((row) => row.latency_ms)
      .filter((value): value is number => typeof value === "number" && value > 0);

    return {
      totals: {
        users: profiles.length,
        newUsers,
        paidUsers: paidUsers.size,
        activeUsers,
        maps: mapsRes.count ?? 0,
        generations: events.length,
        failedGenerations: events.filter((row) => !row.success).length,
        tokens: events.reduce((sum, row) => sum + (row.tokens_in ?? 0) + (row.tokens_out ?? 0), 0),
        avgLatencyMs: latencies.length
          ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
          : 0,
        mrr: Math.round(mrr * 100) / 100,
      },
      tierBreakdown: [...tierCounts.entries()]
        .map(([tier, count]) => ({ tier, count }))
        .sort((a, b) => b.count - a.count),
      actionBreakdown: tally(events, (row) => ({
        key: row.action_type,
        label: ACTION_LABEL[row.action_type] ?? row.action_type,
      })),
      contextBreakdown: tally(events, (row) =>
        row.context_role ? { key: row.context_role, label: row.context_role } : null,
      ),
      modeBreakdown: tally(events, (row) =>
        row.mode_key ? { key: row.mode_key, label: row.mode_label ?? row.mode_key } : null,
      ),
      daily: [...dailyMap.entries()].map(([date, value]) => ({ date, ...value })),
    };
  });

/** Global plan limits and feature flags stored in app_config. */
export const getAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("app_config").select("key, value");
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

export const updateAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { key: string; value: unknown }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("app_config")
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });
