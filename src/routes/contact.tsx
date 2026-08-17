import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const TITLE = "Contact MindFlov";
const DESCRIPTION = "Get in touch with the MindFlov team at support@mindflov.com.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mindflov.com/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">Contact</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Talk to us.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Questions, billing issues, bug reports, or partnership ideas — reach us directly.
          </p>
          <a
            href="mailto:support@mindflov.com"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-slate-200 hover:border-white/40 hover:text-white"
          >
            <Mail className="h-4 w-4" /> support@mindflov.com
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
