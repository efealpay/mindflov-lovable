import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "Generation Modes — One Idea, Five Minds | MindFlov";
const DESCRIPTION =
  "MindFlov expands every seed idea through five generation modes — Neural Bridge, Devil's Advocate, Visual Metaphor, Strategic Logic, and Viral Hook — renamed for every discipline.";

export const Route = createFileRoute("/generation-modes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/generation-modes" }],
  }),
  component: GenerationModesPage,
});

const MODES = [
  {
    name: "Neural Bridge",
    color: "text-indigo-400",
    body: "Branches your seed into adjacent, highly relevant concepts you hadn't connected yet.",
    seed: "A subscription box for houseplants",
    output: "→ A care-reminder app add-on that upsells replacement plants automatically.",
  },
  {
    name: "Devil's Advocate",
    color: "text-red-400",
    body: "Actively critiques the idea — market risk, logical gaps, and what could break it.",
    seed: "A subscription box for houseplants",
    output: "→ Shipping live plants has high damage/return rates in cold climates — needs a fallback SKU.",
  },
  {
    name: "Visual Metaphor",
    color: "text-fuchsia-400",
    body: "Reframes the idea as an image or scene that makes an abstract concept concrete.",
    seed: "A subscription box for houseplants",
    output: "→ \"A monthly letter from a garden that's slowly becoming yours.\"",
  },
  {
    name: "Strategic Logic",
    color: "text-cyan-400",
    body: "Converts the concept into pricing, positioning, or a structural plan.",
    seed: "A subscription box for houseplants",
    output: "→ Tiered pricing by plant difficulty, with a beginner tier priced as a gift entry-point.",
  },
  {
    name: "Viral Hook",
    color: "text-orange-400",
    body: "Generates the hook, headline, or unconventional distribution angle that gets attention.",
    seed: "A subscription box for houseplants",
    output: "→ \"I killed 12 plants before this box taught me why.\"",
  },
];

const RENAMES = [
  { discipline: "Founder", slot: "Monetization / Growth Hack / Success Metrics" },
  { discipline: "Storyteller", slot: "Story Threads" },
  { discipline: "Brand Architect", slot: "Positioning Angles" },
  { discipline: "Campaign Strategist", slot: "Channel & Message Fit" },
  { discipline: "Architect", slot: "Site & Program Response" },
  { discipline: "Game Designer", slot: "Core Loop Variant" },
];

function GenerationModesPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Generation modes
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            One idea. Five minds.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Every seed is expanded through a set of generation slots, each one thinking about
            your idea in a fundamentally different way.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
            {MODES.map((mode) => (
              <div key={mode.name} className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-[220px_1fr]">
                <h2 className={`font-mono text-sm uppercase tracking-widest ${mode.color}`}>
                  {mode.name}
                </h2>
                <div>
                  <p className="text-slate-300">{mode.body}</p>
                  <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm">
                    <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
                      Seed
                    </p>
                    <p className="mt-1 text-slate-400">{mode.seed}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-widest text-slate-500">
                      Output
                    </p>
                    <p className="mt-1 text-slate-200">{mode.output}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Same slots, different names
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-white">
            Every discipline gets its own vocabulary.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            The underlying slots stay the same, but MindFlov renames and retunes them so they
            speak the language of your context.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">
                    Discipline
                  </th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">
                    Renamed slot
                  </th>
                </tr>
              </thead>
              <tbody>
                {RENAMES.map((row) => (
                  <tr key={row.discipline} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-4 text-slate-200">{row.discipline}</td>
                    <td className="px-6 py-4 text-slate-400">{row.slot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            to="/contexts"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
          >
            See all 23 contexts <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Run all five modes on your next idea.
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
