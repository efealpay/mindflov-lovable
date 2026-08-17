import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Clock,
  Coins,
  CreditCard,
  Crown,
  Loader2,
  Map as MapIcon,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  deleteUserAsAdmin,
  getAdminStats,
  listUsersForAdmin,
  resetUserWeeklyUsage,
  setUserAdminRole,
  setUserTier,
  type AdminStats,
  type AdminUserRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MindFlov admin — users & usage analytics" },
      {
        name: "description",
        content:
          "Internal MindFlov admin: growth metrics, subscription mix, context and generation-mode usage, and user management.",
      },
      { property: "og:title", content: "MindFlov admin" },
      { property: "og:description", content: "Internal admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const TIERS = ["free", "plus", "pro"] as const;
const TIER_COLOR: Record<string, string> = {
  free: "#64748b",
  plus: "#6366f1",
  pro: "#f59e0b",
};

function formatNumber(value: number) {
  return value.toLocaleString();
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "text-indigo-400",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        {label}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Leaderboard({
  title,
  icon: Icon,
  rows,
  emptyLabel,
}: {
  title: string;
  icon: typeof Brain;
  rows: { key: string; label: string; count: number }[];
  emptyLabel: string;
}) {
  const max = rows[0]?.count ?? 0;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
        <Icon className="h-4 w-4 text-indigo-400" />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 10).map((row) => (
            <li key={row.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-200">{row.label}</span>
                <span className="font-mono text-xs text-slate-400">{formatNumber(row.count)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [days, setDays] = useState(30);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  const pageSize = 25;

  useEffect(() => {
    const verify = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        void navigate({ to: "/auth", search: { mode: "signin", redirect: "/admin" } });
        return;
      }
      try {
        const { isAdmin } = await checkIsAdmin();
        setAccess(isAdmin ? "granted" : "denied");
      } catch {
        setAccess("denied");
      }
    };
    void verify();
  }, [navigate]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      setStats(await getAdminStats({ data: { days } }));
    } catch (caught) {
      toast.error("Couldn't load analytics", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setLoadingStats(false);
    }
  }, [days]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const result = await listUsersForAdmin({
        data: { search, page, pageSize, tier: tierFilter },
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (caught) {
      toast.error("Couldn't load users", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    if (access !== "granted") return;
    void loadStats();
  }, [access, loadStats]);

  useEffect(() => {
    if (access !== "granted") return;
    const timeout = setTimeout(() => void loadUsers(), 250);
    return () => clearTimeout(timeout);
  }, [access, loadUsers]);

  const pieData = useMemo(
    () => (stats?.tierBreakdown ?? []).map((row) => ({ name: row.tier, value: row.count })),
    [stats],
  );

  const handleTier = async (user: AdminUserRow, tier: (typeof TIERS)[number]) => {
    setRowBusy(user.id);
    try {
      await setUserTier({ data: { userId: user.id, tier } });
      toast.success(`${user.email ?? "User"} set to ${tier}`);
      await loadUsers();
    } catch (caught) {
      toast.error("Couldn't change the plan", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setRowBusy(null);
    }
  };

  const handleAdminToggle = async (user: AdminUserRow) => {
    setRowBusy(user.id);
    try {
      await setUserAdminRole({ data: { userId: user.id, makeAdmin: !user.isAdmin } });
      toast.success(user.isAdmin ? "Admin access removed" : "Admin access granted");
      await loadUsers();
    } catch (caught) {
      toast.error("Couldn't update the role", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setRowBusy(null);
    }
  };

  const handleResetUsage = async (user: AdminUserRow) => {
    setRowBusy(user.id);
    try {
      await resetUserWeeklyUsage({ data: { userId: user.id } });
      toast.success("Weekly usage reset");
      await loadUsers();
    } catch (caught) {
      toast.error("Couldn't reset usage", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setRowBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setRowBusy(pendingDelete.id);
    try {
      await deleteUserAsAdmin({ data: { userId: pendingDelete.id } });
      toast.success("User deleted");
      setPendingDelete(null);
      await Promise.all([loadUsers(), loadStats()]);
    } catch (caught) {
      toast.error("Couldn't delete the user", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setRowBusy(null);
    }
  };

  if (access === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4">
        <div className="max-w-sm rounded-2xl border border-red-500/30 bg-[#0f172a] p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <h1 className="mb-2 text-lg font-bold text-white">Admins only</h1>
          <p className="mb-4 text-sm text-slate-400">
            This area is restricted to MindFlov administrators.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the canvas
          </Link>
        </div>
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-slate-200">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin</h1>
            <p className="text-sm text-slate-400">Growth, usage analytics and user management</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              aria-label="Analytics window"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={() => {
                void loadStats();
                void loadUsers();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStats ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" /> Canvas
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total users"
            value={formatNumber(stats?.totals.users ?? 0)}
            hint={`${formatNumber(stats?.totals.newUsers ?? 0)} new in window`}
          />
          <StatCard
            icon={CreditCard}
            label="Paying users"
            value={formatNumber(stats?.totals.paidUsers ?? 0)}
            hint={`$${(stats?.totals.mrr ?? 0).toLocaleString()} MRR`}
            accent="text-emerald-400"
          />
          <StatCard
            icon={Activity}
            label="Active (7d)"
            value={formatNumber(stats?.totals.activeUsers ?? 0)}
            hint={`${formatNumber(stats?.totals.maps ?? 0)} maps created`}
            accent="text-sky-400"
          />
          <StatCard
            icon={Zap}
            label="AI generations"
            value={formatNumber(stats?.totals.generations ?? 0)}
            hint={`${formatNumber(stats?.totals.failedGenerations ?? 0)} failed`}
            accent="text-amber-400"
          />
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Coins}
            label="Tokens used"
            value={formatNumber(stats?.totals.tokens ?? 0)}
            accent="text-fuchsia-400"
          />
          <StatCard
            icon={Clock}
            label="Avg latency"
            value={`${formatNumber(stats?.totals.avgLatencyMs ?? 0)} ms`}
            accent="text-cyan-400"
          />
          <StatCard
            icon={MapIcon}
            label="Maps per user"
            value={
              stats && stats.totals.users
                ? (stats.totals.maps / stats.totals.users).toFixed(1)
                : "0.0"
            }
            accent="text-lime-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Gen. per active user"
            value={
              stats && stats.totals.activeUsers
                ? (stats.totals.generations / stats.totals.activeUsers).toFixed(1)
                : "0.0"
            }
            accent="text-rose-400"
          />
        </section>

        {/* Charts */}
        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <BarChart3 className="h-4 w-4 text-indigo-400" /> Activity over time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily ?? []}>
                  <defs>
                    <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(value: string) => value.slice(5)}
                    stroke="#1e293b"
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} stroke="#1e293b" />
                  <ChartTooltip
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="generations"
                    name="Generations"
                    stroke="#6366f1"
                    fill="url(#genFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    name="Signups"
                    stroke="#22d3ee"
                    fill="url(#signupFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Crown className="h-4 w-4 text-amber-400" /> Plan mix
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={TIER_COLOR[entry.name] ?? "#475569"} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {(stats?.tierBreakdown ?? []).map((row) => (
                <li key={row.tier} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 capitalize text-slate-300">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: TIER_COLOR[row.tier] ?? "#475569" }}
                    />
                    {row.tier}
                  </span>
                  <span className="font-mono text-slate-400">{formatNumber(row.count)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Usage leaderboards */}
        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <Leaderboard
            title="Context modes used"
            icon={Brain}
            rows={stats?.contextBreakdown ?? []}
            emptyLabel="No context data in this window yet."
          />
          <Leaderboard
            title="Generation modes used"
            icon={Zap}
            rows={stats?.modeBreakdown ?? []}
            emptyLabel="No generation-mode data in this window yet."
          />
          <Leaderboard
            title="AI actions"
            icon={Activity}
            rows={stats?.actionBreakdown ?? []}
            emptyLabel="No AI activity in this window yet."
          />
        </section>

        {/* Users */}
        <section className="rounded-xl border border-white/10 bg-[#0f172a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Users className="h-4 w-4 text-indigo-400" /> Users ({formatNumber(total)})
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Search email or name"
                  className="w-56 rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <select
                value={tierFilter}
                onChange={(event) => {
                  setTierFilter(event.target.value);
                  setPage(0);
                }}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                aria-label="Filter by plan"
              >
                <option value="all">All plans</option>
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/30 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Maps</th>
                  <th className="px-5 py-3">Week</th>
                  <th className="px-5 py-3">Total gen.</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      No users match this filter.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200">{user.email ?? "—"}</span>
                          {user.isAdmin && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                              admin
                            </span>
                          )}
                        </div>
                        {user.displayName && (
                          <span className="text-xs text-slate-500">{user.displayName}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={user.tier}
                          disabled={rowBusy === user.id}
                          onChange={(event) =>
                            void handleTier(user, event.target.value as (typeof TIERS)[number])
                          }
                          className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs capitalize text-slate-200 focus:border-indigo-500 focus:outline-none"
                          aria-label={`Plan for ${user.email ?? user.id}`}
                        >
                          {TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              {tier}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {user.status}
                        {user.interval ? ` · ${user.interval}` : ""}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">{user.mapCount}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">
                        {user.weeklyUsage}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">
                        {user.generations}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => void handleResetUsage(user)}
                            disabled={rowBusy === user.id}
                            title="Reset this week's usage"
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleAdminToggle(user)}
                            disabled={rowBusy === user.id}
                            title={user.isAdmin ? "Revoke admin" : "Make admin"}
                            className={`rounded p-1.5 hover:bg-white/10 disabled:opacity-40 ${user.isAdmin ? "text-amber-400" : "text-slate-400 hover:text-white"}`}
                          >
                            <Crown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPendingDelete(user)}
                            disabled={rowBusy === user.id}
                            title="Delete user"
                            className="rounded p-1.5 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 p-4 text-xs text-slate-400">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="rounded border border-white/10 px-3 py-1.5 font-bold hover:bg-white/5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
                disabled={page + 1 >= totalPages}
                className="rounded border border-white/10 px-3 py-1.5 font-bold hover:bg-white/5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#0f172a] p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
              <ShieldAlert className="h-5 w-5 text-red-400" /> Delete user
            </h2>
            <p className="mb-5 text-sm text-slate-400">
              {pendingDelete.email ?? pendingDelete.id} and all of their maps, usage and billing
              records will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={rowBusy === pendingDelete.id}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {rowBusy === pendingDelete.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
