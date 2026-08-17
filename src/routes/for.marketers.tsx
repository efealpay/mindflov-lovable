import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "MindFlov for Marketers — Past the Obvious Three Angles";
const DESCRIPTION =
  "Campaign brainstorms usually stop at the first three angles. MindFlov keeps expanding until you find the one that's actually differentiated.";

export const Route = createFileRoute("/for/marketers")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/for/marketers" }],
  }),
  component: MarketersPage,
});

function MarketersPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            For marketers
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Past the obvious three angles.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Every brainstorm converges on the same safe options. MindFlov keeps branching
            until the differentiated angle shows up.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-red-400">Pain</p>
              <p className="mt-3 text-slate-300">
                A room full of smart people still lands on the same three campaign concepts every
                planning cycle.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Workflow</p>
              <p className="mt-3 text-slate-300">
                Seed the brief in Campaign Strategist context, run Devil's Advocate against your
                top pick, then synthesize the survivors into a media-ready plan.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Outcome</p>
              <p className="mt-3 text-slate-300">
                A stress-tested campaign concept with the weak angles filtered out before the
                client sees them.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Find the angle your competitors haven't run yet.
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
