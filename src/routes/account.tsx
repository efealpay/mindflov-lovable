import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { getPaddleEnvironment } from "@/lib/paddle";
import { createBillingPortalSession } from "@/utils/payments.functions";
import { deleteAccount } from "@/lib/account.functions";
import { restartOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your MindFlov account & billing" },
      {
        name: "description",
        content:
          "Manage your MindFlov profile, plan, weekly AI usage, password and account deletion.",
      },
      { property: "og:title", content: "Your MindFlov account" },
      { property: "og:description", content: "Manage your profile, plan and usage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

const WEEKLY_LIMIT: Record<string, number> = { free: 10, plus: 200, pro: 1000 };

function isoWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function AccountPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [mapCount, setMapCount] = useState(0);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const subscription = useSubscription(userId);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      void navigate({ to: "/auth", search: { mode: "signin", redirect: "/account" } });
      return;
    }
    setUserId(auth.user.id);
    setEmail(auth.user.email ?? "");

    const [{ data: profile }, { count }, { data: usage }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle(),
      supabase
        .from("mindmaps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id),
      supabase
        .from("usage_weekly")
        .select("count")
        .eq("user_id", auth.user.id)
        .eq("week_key", isoWeekKey())
        .maybeSingle(),
    ]);

    const name = profile?.display_name ?? "";
    setDisplayName(name);
    setInitialName(name);
    setMapCount(count ?? 0);
    setWeeklyUsage(usage?.count ?? 0);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveName = async () => {
    if (!userId) return;
    setBusy("name");
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", userId);
    setBusy(null);
    if (error) {
      toast.error("Couldn't save your name", { description: error.message });
      return;
    }
    setInitialName(displayName.trim());
    toast.success("Profile updated");
  };

  const sendPasswordReset = async () => {
    setBusy("password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(null);
    if (error) {
      toast.error("Couldn't send the email", { description: error.message });
      return;
    }
    toast.success("Password reset link sent", { description: `Check ${email}.` });
  };

  const openBilling = async () => {
    setBusy("billing");
    try {
      const { url } = await createBillingPortalSession({
        data: { environment: getPaddleEnvironment() },
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (caught) {
      toast.error("Billing portal unavailable", {
        description:
          caught instanceof Error && caught.message.includes("No billing account")
            ? "You don't have a paid plan yet."
            : "Please try again in a moment.",
      });
    } finally {
      setBusy(null);
    }
  };

  const replayTour = async () => {
    if (!userId) return;
    setBusy("tour");
    await restartOnboarding(userId);
    setBusy(null);
    toast.success("Tutorial reset — opening the canvas");
    void navigate({ to: "/app" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  const removeAccount = async () => {
    setBusy("delete");
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted");
      void navigate({ to: "/" });
    } catch (caught) {
      toast.error("Couldn't delete the account", {
        description: caught instanceof Error ? caught.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </main>
    );
  }

  const tier = subscription.tier;
  const limit = WEEKLY_LIMIT[tier] ?? 10;
  const usagePercent = Math.min(100, Math.round((weeklyUsage / limit) * 100));
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-slate-200">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to canvas
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-white">Account</h1>

        {/* Profile */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-[#0f172a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="account-name"
                className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Display name
              </label>
              <input
                id="account-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-black/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Email
              </span>
              <p className="rounded-lg border border-slate-800 bg-black/30 px-3 py-2 text-slate-400">
                {email}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={saveName}
              disabled={busy === "name" || displayName.trim() === initialName}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
            >
              {busy === "name" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
            <button
              onClick={sendPasswordReset}
              disabled={busy === "password"}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              {busy === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send password reset link
            </button>
          </div>
        </section>

        {/* Plan + usage */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-[#0f172a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Plan & usage
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-sm font-bold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {TIER_LABEL[tier] ?? "Free"} plan
            </span>
            {subscription.interval && (
              <span className="text-xs text-slate-400">Billed {subscription.interval}</span>
            )}
            {subscription.cancelAtPeriodEnd && periodEnd && (
              <span className="text-xs text-amber-400">
                Cancels on {periodEnd} — full access until then
              </span>
            )}
            {!subscription.cancelAtPeriodEnd && periodEnd && tier !== "free" && (
              <span className="text-xs text-slate-400">Renews {periodEnd}</span>
            )}
          </div>

          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> AI generations this week
              </span>
              <span className="font-mono">
                {weeklyUsage} / {limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full rounded-full transition-all ${usagePercent > 85 ? "bg-red-500" : "bg-indigo-500"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {mapCount} saved {mapCount === 1 ? "map" : "maps"} in your workspace. Limits reset
              every Monday.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
            >
              <Sparkles className="h-4 w-4" />
              {tier === "free" ? "Upgrade plan" : "Change plan"}
            </Link>
            {tier !== "free" && (
              <button
                onClick={openBilling}
                disabled={busy === "billing"}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-40"
              >
                {busy === "billing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Manage billing
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </section>

        {/* Help */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-[#0f172a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Getting started
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Replay the guided walkthrough on the canvas any time.
          </p>
          <button
            onClick={replayTour}
            disabled={busy === "tour"}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-40"
          >
            {busy === "tour" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Restart the tutorial
          </button>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-400">
            <AlertTriangle className="h-4 w-4" /> Delete account
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            This permanently removes your maps, usage history and billing records. It cannot be
            undone.
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              <label htmlFor="confirm-delete" className="block text-xs text-slate-400">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </label>
              <input
                id="confirm-delete"
                value={confirmDelete}
                onChange={(event) => setConfirmDelete(event.target.value)}
                className="w-full max-w-xs rounded-lg border border-red-500/40 bg-black/50 px-3 py-2 text-white focus:border-red-400 focus:outline-none"
                placeholder="DELETE"
              />
              <div className="flex gap-3">
                <button
                  onClick={removeAccount}
                  disabled={confirmDelete !== "DELETE" || busy === "delete"}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                >
                  {busy === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Permanently delete
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setConfirmDelete("");
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
