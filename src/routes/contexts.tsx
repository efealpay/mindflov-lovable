import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "23 Professional Contexts — MindFlov";
const DESCRIPTION =
  "MindFlov reframes idea generation for 23 professional contexts, from startup founders to architects to curriculum designers.";

export const Route = createFileRoute("/contexts")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/contexts" }],
  }),
  component: ContextsPage,
});

const CATEGORIES: { category: string; roles: { label: string; body: string }[] }[] = [
  {
    category: "Core",
    roles: [
      { label: "General Framework", body: "The default lens — balanced, broad, no domain bias." },
      { label: "Startup Founder", body: "Focuses on market viability, monetization, metrics, and growth." },
      { label: "Custom Context", body: "Write your own framework prompt for anything not listed here." },
    ],
  },
  {
    category: "Creative Industries",
    roles: [
      { label: "Storyteller", body: "Focuses on character, conflict, theme, world, and emotional arc." },
      { label: "Brand Architect", body: "Focuses on positioning, personality, visual language, and voice." },
      { label: "Music Conceptor", body: "Focuses on mood, sonic texture, and the world the sound evokes." },
    ],
  },
  {
    category: "Architecture & Spaces",
    roles: [
      { label: "Architect", body: "Focuses on program, site and context, material and form, human experience." },
      { label: "Urbanist", body: "Focuses on mobility, density, ecology, economy, and community at urban scale." },
      { label: "Interior (Res)", body: "Focuses on mood, materials, spatial function, and daily-life constraints." },
      { label: "Hospitality Design", body: "Focuses on concept, guest experience, and the memorable moment." },
    ],
  },
  {
    category: "Marketing & Content",
    roles: [
      { label: "Campaign Strategist", body: "Focuses on audience, message, channel, and the tying creative idea." },
      { label: "Content Strategist", body: "Focuses on topic territories, formats, and repeatable series." },
      { label: "Social Creator", body: "Focuses on hooks, trends, emotion, and immediate shareability." },
      { label: "Comm. Design", body: "Focuses on message clarity, medium, and narrative flow of information." },
    ],
  },
  {
    category: "Product & Design",
    roles: [
      { label: "Product (UX)", body: "Focuses on user goals, friction points, and usability over feature count." },
      { label: "Graphic Design", body: "Focuses on typography, layout, hierarchy, and aesthetic narrative." },
      { label: "Industrial Design", body: "Focuses on form, materials, ergonomics, and manufacturing constraints." },
      { label: "Fashion Designer", body: "Focuses on inspiration, silhouette, material, and collection cohesion." },
      { label: "Game Designer", body: "Focuses on core mechanics, player experience, and the engagement loop." },
    ],
  },
  {
    category: "Experiences & Events",
    roles: [
      { label: "Event Designer", body: "Focuses on theme, guest experience, logistics, and memorable moments." },
      { label: "Culinary Creator", body: "Focuses on flavor, technique, ingredient story, and eating progression." },
      { label: "Gift Curator", body: "Focuses on recipient, occasion, budget, and the element of surprise." },
      { label: "Curriculum Design", body: "Focuses on concepts to teach, relevance, activities, and assessment." },
      { label: "Author", body: "Focuses on ideas, narrative structure, voice, and reader takeaway." },
    ],
  },
];

function ContextsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Professional contexts
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            23 ways to think about your idea.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Pick a context and MindFlov changes what it looks for — the questions it asks,
            the risks it flags, the angles it prioritizes.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <h2 className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                  {cat.category}
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.roles.map((role) => (
                    <div key={role.label} className="rounded-2xl border border-white/10 p-5">
                      <p className="font-medium text-white">{role.label}</p>
                      <p className="mt-2 text-sm text-slate-400">{role.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold text-white">
              Not seeing your discipline? Build a custom context.
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
