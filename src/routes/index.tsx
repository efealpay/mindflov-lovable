import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, GitBranch, FileOutput, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { NodeMotif, LineMotif } from "@/components/marketing/NodeMotif";

const TITLE = "MindFlov — Expand One Idea Into a Map of Angles";
const DESCRIPTION =
  "MindFlov turns one seed idea into a visual map of angles with AI — instead of a linear chat that forgets where you started.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "MindFlov",
          applicationCategory: "ProductivityApplication",
          operatingSystem: "Web",
          offers: [
            { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
            { "@type": "Offer", price: "11.99", priceCurrency: "USD", name: "Plus" },
            { "@type": "Offer", price: "29.99", priceCurrency: "USD", name: "Pro" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MindFlov",
          url: "https://mindflov.com",
          logo: "https://mindflov.com/logo.svg",
        }),
      },
    ],
  }),
  component: HomePage,
});

const FAILURES = [
  {
    problem: "Memory",
    body: "Chat forgets the shape of the idea the moment it scrolls off-screen.",
    solution: "Every angle stays pinned as a node you can return to at any time.",
  },
  {
    problem: "Context",
    body: "A linear thread flattens every angle into the same voice and the same assumptions.",
    solution: "23 professional contexts reframe generation for the discipline you're actually in.",
  },
  {
    problem: "Continuity",
    body: "Branch a chat and you lose the rest of the conversation, or drown it in scroll.",
    solution: "Expand any node without losing any other branch — the whole map stays alive.",
  },
];

const ACTS = [
  { n: "01", title: "Seed", body: "Drop in one idea, however rough. A single sentence is enough." },
  { n: "02", title: "Expand", body: "AI grows the seed into multiple angles — critique, metaphor, strategy, hooks." },
  { n: "03", title: "Synthesize", body: "Pull the strongest threads together into a coherent plan or document." },
  { n: "04", title: "Export", body: "Ship it out as a brief, a doc, or a plan your team can act on today." },
];

const PLANS = [
  { name: "Free", price: "$0", detail: "10 generations / week, refills automatically." },
  { name: "Plus", price: "$11.99/mo", detail: "or $119.90/yr — 2 months free." },
  { name: "Pro", price: "$29.99/mo", detail: "or $299.90/yr — 2 months free." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            AI mind mapping
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            You're not out of ideas. You're out of angles.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            MindFlov expands one seed idea into a visual map of angles with AI — critique,
            metaphor, strategy, and hooks, all connected, none of it lost.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-indigo-400"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-slate-300 transition-colors hover:border-white/40 hover:text-white"
            >
              See how it works
            </Link>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              A line vs. a territory
            </p>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold text-white">Chat is a line</h2>
                <p className="mt-3 max-w-md text-slate-400">
                  Every reply pushes the last idea further off-screen. Going back to explore an
                  earlier fork means re-explaining everything, or losing it.
                </p>
                <LineMotif className="mt-8 h-12 w-full max-w-sm text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">A map is a territory</h2>
                <p className="mt-3 max-w-md text-slate-400">
                  Every angle is a node you can revisit, expand, or connect — the whole
                  exploration stays visible and alive at once.
                </p>
                <NodeMotif className="mt-8 h-32 w-full max-w-sm text-slate-700" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Three failures of linear chat
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-white">
            Answered by three things a map does that a thread can't.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {FAILURES.map((f) => (
              <div key={f.problem} className="rounded-2xl border border-white/10 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-red-400">
                  {f.problem} — broken
                </p>
                <p className="mt-3 text-sm text-slate-400">{f.body}</p>
                <div className="my-4 h-px bg-white/10" />
                <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                  Fixed
                </p>
                <p className="mt-3 text-sm text-slate-300">{f.solution}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              The loop
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-white">
              Seed. Expand. Synthesize. Export.
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {ACTS.map((act) => (
                <div key={act.n}>
                  <p className="font-mono text-4xl font-semibold text-indigo-500/60">{act.n}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{act.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{act.body}</p>
                </div>
              ))}
            </div>
            <Link
              to="/how-it-works"
              className="mt-12 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
            >
              Walk through the full loop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
                One idea, five minds
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Generation modes for every angle you need.
              </h2>
              <p className="mt-4 text-slate-400">
                Neural Bridge, Devil's Advocate, Visual Metaphor, Strategic Logic, and
                Viral Hook slots — renamed and retuned per discipline.
              </p>
              <Link
                to="/generation-modes"
                className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
              >
                Explore the modes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
                23 professional contexts
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Built for how you actually think.
              </h2>
              <p className="mt-4 text-slate-400">
                From startup founder to architect to curriculum designer — the framework
                changes what MindFlov looks for in every idea.
              </p>
              <Link
                to="/contexts"
                className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
              >
                See all contexts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Pricing</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Simple, and free to start.</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div key={plan.name} className="rounded-2xl border border-white/10 p-6">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400">
                    {plan.name}
                  </h3>
                  <p className="mt-3 text-2xl font-semibold text-white">{plan.price}</p>
                  <p className="mt-3 text-sm text-slate-400">{plan.detail}</p>
                </div>
              ))}
            </div>
            <Link
              to="/pricing"
              className="mt-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
            >
              Full pricing details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            Still deciding? A few quick answers.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="font-medium text-white">How is this different from ChatGPT?</p>
              <p className="mt-2 text-sm text-slate-400">
                ChatGPT gives you one line of thought. MindFlov gives you a whole map of them,
                at once, connected.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="font-medium text-white">Do I own my maps?</p>
              <p className="mt-2 text-sm text-slate-400">
                Yes — every map, node, and export is yours to keep and take with you.
              </p>
            </div>
          </div>
          <Link
            to="/faq"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
          >
            Read the full FAQ <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <Sparkles className="h-8 w-8 text-indigo-400" aria-hidden="true" />
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Stop chatting in a straight line. Start mapping in every direction.
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
