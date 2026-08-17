import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "Terms of Service — MindFlov";
const DESCRIPTION = "The terms governing your use of MindFlov, including billing, cancellation, and content ownership.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">Legal</p>
          <h1 className="mt-6 text-4xl font-semibold text-white">Terms of Service</h1>
          <p className="mt-4 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
          <div className="mt-10 space-y-8 text-slate-400">
            <section>
              <h2 className="text-lg font-semibold text-white">Using MindFlov</h2>
              <p className="mt-2">
                By using MindFlov you agree to use the service lawfully and not to abuse, resell,
                or attempt to circumvent generation limits or billing.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Your content</h2>
              <p className="mt-2">
                You own the ideas, maps, and exports you create with MindFlov. We claim no
                ownership over your content.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Billing & cancellation</h2>
              <p className="mt-2">
                Paid plans renew automatically on a monthly or yearly cycle until cancelled. You
                can cancel at any time from inside the app and retain access through the end of
                the current billing period.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Service availability</h2>
              <p className="mt-2">
                We aim for high availability but do not guarantee uninterrupted access. Features
                may change as the product evolves.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Contact</h2>
              <p className="mt-2">Questions about these terms can be sent to support@mindflov.com.</p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
