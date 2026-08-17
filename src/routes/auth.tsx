import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Globe, Key, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to MindFlov" },
      {
        name: "description",
        content:
          "Sign in or create a free MindFlov account to expand ideas into visual maps with AI.",
      },
      { property: "og:title", content: "Sign in to MindFlov" },
      {
        property: "og:description",
        content: "Sign in or create a free MindFlov account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search["mode"] === "string" ? (search["mode"] as string) : undefined,
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

/** Turns backend auth errors into text a person can act on. */
function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "That email and password don't match.";
  if (lower.includes("already registered") || lower.includes("already been registered"))
    return "An account with this email already exists — sign in instead.";
  if (lower.includes("password should be")) return "Use a password of at least 6 characters.";
  if (lower.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox, or resend the link below.";
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (lower.includes("network")) return "Network problem — check your connection and try again.";
  return message;
}

/** Only same-origin paths are accepted as a post-login destination. */
function safeRedirect(target?: string) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/app";
  return target;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const destination = safeRedirect(search.redirect);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy("email");
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setNotice("Reset link sent. Check your inbox for a link to set a new password.");
      } else if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        void navigate({ to: destination });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(destination)}`,
            data: name.trim() ? { full_name: name.trim() } : {},
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          void navigate({ to: destination });
        } else {
          setAwaitingConfirm(true);
          setNotice(`We sent a confirmation link to ${email}. Open it to activate your account.`);
        }
      }
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : "Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    setBusy("resend");
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) throw resendError;
      setNotice("Confirmation email sent again.");
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : "Could not resend."));
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setBusy("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      void navigate({ to: destination });
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : "Google sign-in failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img src="/logo.svg" alt="MindFlov" className="h-7 w-auto" />
        </Link>

        <div className="rounded-2xl border border-indigo-500/20 bg-[#0f172a] p-6 shadow-2xl">
          <h1 className="mb-1 text-center text-xl font-bold text-white">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your free account"
                : "Reset your password"}
          </h1>
          <p className="mb-6 text-center text-xs text-slate-400">
            {mode === "forgot"
              ? "We'll email you a link to choose a new password."
              : "10 free AI generations every week. No card needed."}
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {notice && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{notice}</p>
            </div>
          )}

          {awaitingConfirm ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-300">
                Didn't get it? Check spam, or send the link again.
              </p>
              <button
                onClick={handleResend}
                disabled={busy === "resend"}
                className="w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {busy === "resend" ? "Sending…" : "Resend confirmation email"}
              </button>
              <button
                onClick={() => {
                  setAwaitingConfirm(false);
                  setMode("signin");
                  setNotice("");
                }}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                      Name
                    </label>
                    <input
                      id="auth-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-black/50 px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                      placeholder="How should we greet you?"
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="auth-email"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-black/50 py-2 pl-10 pr-4 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-bold uppercase tracking-widest text-slate-400"
                      >
                        Password
                      </label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setError("");
                          }}
                          className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-black/50 py-2 pl-10 pr-4 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={Boolean(busy)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {busy === "email" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "signin" ? (
                    "Sign in"
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      or
                    </span>
                    <div className="h-px flex-1 bg-slate-700" />
                  </div>
                  <button
                    onClick={handleGoogle}
                    disabled={Boolean(busy)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {busy === "google" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    Continue with Google
                  </button>
                </>
              )}

              <p className="mt-6 text-center text-sm text-slate-400">
                {mode === "signup" ? "Already have an account? " : "New to MindFlov? "}
                <button
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setError("");
                    setNotice("");
                  }}
                  className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  {mode === "signup" ? "Sign in" : "Create a free account"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300">
            Back to mindflov.com
          </Link>
        </p>
      </div>
    </main>
  );
}
