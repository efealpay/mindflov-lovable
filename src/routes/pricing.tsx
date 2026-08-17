import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "Pricing — MindFlov";
const DESCRIPTION =
  "MindFlov pricing: Free with 10 weekly generations, Plus at $11.99/mo, Pro at $29.99/mo. Save two months with annual billing.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: BILLING_FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: ["10 generations per week, refills automatically", "All 23 professional contexts", "Core generation modes", "Standard exports"],
  },
  {
    name: "Plus",
    price: "$11.99",
    period: "/mo",
    yearly: "$119.90/yr — 2 months free",
    features: ["Everything in Free", "Higher weekly generation limit", "All generation modes", "Priority exports"],
  },
  {
    name: "Pro",
    price: "$29.99",
    period: "/mo",
    yearly: "$299.90/yr — 2 months free",
    features: ["Everything in Plus", "Highest generation limit", "Advanced synthesis tools", "Early access to new modes"],
  },
];

const COMPARISON = [
  { feature: "Weekly generations", free: "10 (refills)", plus: "Higher limit", pro: "Highest limit" },
  { feature: "Professional contexts", free: "All 23", plus: "All 23", pro: "All 23" },
  { feature: "Generation modes", free: "Core modes", plus: "All modes", pro: "All modes" },
  { feature: "Synthesis documents", free: "Basic", plus: "Advanced", pro: "Advanced" },
  { feature: "Exports", free: "Standard", plus: "Priority", pro: "Priority" },
];

const BILLING_FAQ = [
  { q: "Can I switch between monthly and yearly billing?", a: "Yes, you can switch your billing cycle at any time from inside the app." },
  { q: "What happens if I downgrade?", a: "You keep every map you've already made — only your weekly generation limit changes." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from inside the app and you'll keep access through the end of your current billing period." },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">Pricing</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Free to start. Priced to grow with you.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Checkout happens inside the app — every plan below links you straight there.
          </p>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className="flex flex-col rounded-2xl border border-white/10 p-8">
                <h2 className="font-mono text-xs uppercase tracking-widest text-slate-400">{plan.name}</h2>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {plan.price}
                  <span className="text-base text-slate-500">{plan.period}</span>
                </p>
                {plan.yearly && <p className="mt-1 text-xs text-emerald-400">{plan.yearly}</p>}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-indigo-400"
                >
                  Choose {plan.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold text-white">Compare plans</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">Feature</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">Free</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">Plus</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-widest">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-4 text-slate-200">{row.feature}</td>
                    <td className="px-6 py-4 text-slate-400">{row.free}</td>
                    <td className="px-6 py-4 text-slate-400">{row.plus}</td>
                    <td className="px-6 py-4 text-slate-400">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0f172a]/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-white">Billing FAQ</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {BILLING_FAQ.map((item) => (
                <div key={item.q}>
                  <p className="font-medium text-white">{item.q}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.a}</p>
                </div>
              ))}
            </div>
            <Link
              to="/faq"
              className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
            >
              Read the full FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
