import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — MindFlov" },
      { name: "description", content: "Completing your MindFlov sign-in." },
      { property: "og:title", content: "Signing you in — MindFlov" },
      { property: "og:description", content: "Completing your MindFlov sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const target =
      search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
        ? search.redirect
        : "/app";

    let settled = false;
    const go = () => {
      if (settled) return;
      settled = true;
      void navigate({ to: target });
    };

    // Wait for the session the provider/confirmation link established.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) go();
    };
    void check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    const timeout = setTimeout(() => {
      if (!settled) setFailed(true);
    }, 6000);

    return () => {
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [navigate, search.redirect]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4">
      {failed ? (
        <div className="max-w-sm rounded-2xl border border-red-500/30 bg-[#0f172a] p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
          <p className="mb-4 text-sm text-slate-300">
            We couldn't finish signing you in. The link may have expired — please try again.
          </p>
          <button
            onClick={() => void navigate({ to: "/auth", search: { mode: "signin", redirect: undefined } })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          <span className="text-sm">Signing you in…</span>
        </div>
      )}
    </main>
  );
}
