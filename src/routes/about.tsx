import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "About MindFlov";
const DESCRIPTION =
  "MindFlov exists because chat is a line and ideas need a territory. Learn why we built a visual, AI-driven mind-mapping tool.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">About</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            We think chat is the wrong shape for thinking.
          </h1>
          <div className="mt-8 max-w-2xl space-y-5 text-lg text-slate-400">
            <p>
              MindFlov started from a simple frustration: every AI chat conversation about a new
              idea eventually collapses into a straight line, and the moment you want to explore
              a fork, you lose the rest of the thread.
            </p>
            <p>
              Ideas don't work like that. They branch, contradict, circle back, and connect in ways
              a scrolling transcript can't hold. So we built MindFlov as a map instead of a thread —
              a place where one seed idea can grow in five directions at once, and none of them get
              lost.
            </p>
            <p>
              Today MindFlov is used by founders, storytellers, marketers, architects, and dozens of
              other disciplines to turn a single idea into a fully explored set of angles, ready to
              synthesize and ship.
            </p>
          </div>
        </section>
        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">Try it on your next idea.</h2>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-indigo-400"
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
