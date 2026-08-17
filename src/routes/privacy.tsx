import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "Privacy Policy — MindFlov";
const DESCRIPTION = "How MindFlov collects, uses, and protects your data, and your rights over your maps and account.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">Legal</p>
          <h1 className="mt-6 text-4xl font-semibold text-white">Privacy Policy</h1>
          <p className="mt-4 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
          <div className="mt-10 space-y-8 text-slate-400">
            <section>
              <h2 className="text-lg font-semibold text-white">What we collect</h2>
              <p className="mt-2">
                We collect account information (name, email), the ideas and maps you create, and
                basic usage data needed to operate and improve the product.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">How we use your data</h2>
              <p className="mt-2">
                Your maps are used only to provide the service to you — generating, storing, and
                exporting your maps. We do not use your content to train third-party or MindFlov
                AI models.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Data retention & deletion</h2>
              <p className="mt-2">
                You can delete your maps or your account at any time from inside the app. Deleted
                data is removed from active systems within a reasonable period.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Third parties</h2>
              <p className="mt-2">
                We use trusted infrastructure and AI providers to operate MindFlov. These providers
                process data only as needed to deliver the service, under contractual
                confidentiality obligations.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Contact</h2>
              <p className="mt-2">
                Questions about this policy can be sent to support@mindflov.com.
              </p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
