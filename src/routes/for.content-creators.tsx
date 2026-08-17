import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "MindFlov for Content Creators — A Week of Angles From One Theme";
const DESCRIPTION =
  "Stop staring at a blank content calendar. MindFlov expands one theme into a week of distinct angles, hooks, and formats.";

export const Route = createFileRoute("/for/content-creators")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/for/content-creators" }],
  }),
  component: ContentCreatorsPage,
});

function ContentCreatorsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            For content creators
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            A week of angles from one theme.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            You don't need ten new ideas a week — you need ten angles on the one idea you
            already have.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-red-400">Pain</p>
              <p className="mt-3 text-slate-300">
                You post the same three angles on every theme because that's as far as brainstorming
                alone gets you before a deadline.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Workflow</p>
              <p className="mt-3 text-slate-300">
                Seed a theme, run Social Creator context with Viral Hook and Visual Metaphor modes,
                then export the strongest seven as a ready-made content calendar.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Outcome</p>
              <p className="mt-3 text-slate-300">
                A full week of distinct hooks and formats from one theme, mapped and ready to
                schedule.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Turn your next theme into a week of content.
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
