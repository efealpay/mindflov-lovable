import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { NodeMotif } from "@/components/marketing/NodeMotif";

const TITLE = "How MindFlov Works — Seed, Expand, Synthesize, Export";
const DESCRIPTION =
  "A step-by-step look at MindFlov's loop for turning one idea into a full map of angles, plus the anatomy of every map you build.";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    n: "01",
    title: "Seed",
    body:
      "Type in one idea — a product concept, a scene, a campaign brief, a single sentence. There's no wrong size for a seed; MindFlov works from a fragment as well as a paragraph.",
  },
  {
    n: "02",
    title: "Expand",
    body:
      "Pick a generation mode, or run several at once. Each mode grows a different kind of branch off your seed — a critique, a metaphor, a strategic angle, a hook — and drops it onto the map as a new node.",
  },
  {
    n: "03",
    title: "Synthesize",
    body:
      "Select the nodes that matter and ask MindFlov to pull them together. It writes a synthesis document that reconciles the angles into one coherent point of view, instead of leaving you to do it by hand.",
  },
  {
    n: "04",
    title: "Export",
    body:
      "Take the finished map, the synthesis, or any branch of it out of MindFlov as a document, a brief, or a plan ready to hand to a team or a client.",
  },
];

const ANATOMY = [
  { term: "Nodes", body: "A single angle, idea, or observation — the atomic unit of the map." },
  { term: "Links", body: "Explicit connections between nodes that show how one angle leads to another." },
  { term: "Insights", body: "Short callouts MindFlov surfaces when it notices a pattern across nodes." },
  { term: "Plans", body: "Action-oriented groupings of nodes turned into ordered, executable steps." },
  { term: "Synthesis document", body: "The written reconciliation of selected nodes into one coherent narrative." },
  { term: "Exports", body: "The map, a plan, or the synthesis document, delivered as a file you can share." },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            How it works
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            One loop, four acts, an entire map of angles.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Every MindFlov session follows the same rhythm — plant a seed, let it branch,
            pull it back together, then take it with you.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
            {STEPS.map((step) => (
              <div key={step.n} className="grid gap-6 border-t border-white/10 pt-10 md:grid-cols-[120px_1fr]">
                <p className="font-mono text-5xl font-semibold text-indigo-500/60">{step.n}</p>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{step.title}</h2>
                  <p className="mt-3 max-w-2xl text-slate-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Anatomy of a map
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-white">
            The parts that make a MindFlov map more than a chat log.
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <NodeMotif className="h-56 w-full text-slate-700" />
            <dl className="grid gap-6 sm:grid-cols-2">
              {ANATOMY.map((item) => (
                <div key={item.term}>
                  <dt className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                    {item.term}
                  </dt>
                  <dd className="mt-2 text-sm text-slate-400">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Ready to see your first map take shape?
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
