import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Key, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new MindFlov password" },
      {
        name: "description",
        content: "Set a new password for your MindFlov account.",
      },
      { property: "og:title", content: "Choose a new MindFlov password" },
      { property: "og:description", content: "Set a new password for your MindFlov account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link puts a session in place; wait for it before showing the form.
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    };
    void check();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasSession(true);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use a password of at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => void navigate({ to: "/app" }), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-indigo-500/20 bg-[#0f172a] p-6 shadow-2xl">
        <h1 className="mb-6 text-center text-xl font-bold text-white">Choose a new password</h1>

        {!ready ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : !hasSession ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-300">
              This reset link is invalid or has expired. Request a new one and try again.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signin", redirect: undefined }}
              className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
            >
              Back to sign in
            </Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-slate-300">Password updated. Taking you to the canvas…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                New password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/50 py-2 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Repeat password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/50 py-2 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
