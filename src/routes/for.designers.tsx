import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "MindFlov for Designers — Directions, Not Mood Boards";
const DESCRIPTION =
  "Mood boards collect references. MindFlov generates actual directions — connected, arguable, ready to present.";

export const Route = createFileRoute("/for/designers")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/for/designers" }],
  }),
  component: DesignersPage,
});

function DesignersPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            For designers
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Directions, not mood boards.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            A mood board collects what already exists. MindFlov generates directions —
            reasoned, connected, and ready to defend in a review.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-red-400">Pain</p>
              <p className="mt-3 text-slate-300">
                A stack of references doesn't tell you why one direction is right — it just shows
                you what's out there.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Workflow</p>
              <p className="mt-3 text-slate-300">
                Seed the brief in Graphic Design or Product (UX) context, expand with Visual
                Metaphor and Strategic Logic, then synthesize the top branches into a rationale.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Outcome</p>
              <p className="mt-3 text-slate-300">
                Two or three defensible directions, each with its own logic, ready for a client
                or stakeholder review.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Walk into your next review with real directions.
            </h2>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-indigo-400"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
