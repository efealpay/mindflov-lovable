import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "FAQ — MindFlov";
const DESCRIPTION =
  "Answers on how MindFlov differs from ChatGPT and mind-mapping tools, the learning curve, data ownership, free limits, cancellation, and data usage.";

const FAQS = [
  {
    q: "How is MindFlov different from ChatGPT?",
    a: "ChatGPT gives you one line of thought that scrolls away as you go. MindFlov keeps every angle as a visible, connected node, so you can explore several directions from the same seed without losing any of them.",
  },
  {
    q: "How is this different from mind-mapping tools like Miro or MindMeister?",
    a: "Traditional mind-mapping tools are blank canvases you fill by hand. MindFlov's AI does the expanding for you — you plant a seed and it grows the branches, then you curate and synthesize.",
  },
  {
    q: "Is there a learning curve?",
    a: "Not really. If you can type a sentence and click a button, you can generate your first map in under a minute. The generation modes and contexts are there to explore once you're comfortable.",
  },
  {
    q: "Do I own my maps?",
    a: "Yes. Every map, node, and export you create is yours. You can export it as a document at any time and take it wherever you need it.",
  },
  {
    q: "What happens if I hit the free limit?",
    a: "Free accounts get 10 generations per week that refill automatically. If you hit the limit, you can wait for the refill or upgrade to Plus or Pro for a higher limit.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from inside the app whenever you like — you'll keep access through the end of your current billing period, with no additional charges.",
  },
  {
    q: "Is my data used to train AI models?",
    a: "No. Your ideas and maps are yours and are not used to train third-party or MindFlov models.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">FAQ</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Frequently asked questions.
          </h1>
        </section>
        <section className="border-t border-white/10 bg-[#0f172a]/40 py-16">
          <div className="mx-auto max-w-4xl divide-y divide-white/10 px-4 sm:px-6">
            {FAQS.map((item) => (
              <div key={item.q} className="py-8">
                <h2 className="text-lg font-semibold text-white">{item.q}</h2>
                <p className="mt-3 text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">Still have questions?</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-slate-300 hover:border-white/40 hover:text-white"
              >
                Contact us
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-indigo-400"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
