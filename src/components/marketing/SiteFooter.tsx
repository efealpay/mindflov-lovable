import { Link } from "@tanstack/react-router";

const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { to: "/how-it-works", label: "How it works" },
      { to: "/generation-modes", label: "Generation modes" },
      { to: "/contexts", label: "Contexts" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "For you",
    links: [
      { to: "/for/content-creators", label: "Content creators" },
      { to: "/for/marketers", label: "Marketers" },
      { to: "/for/designers", label: "Designers" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#020617]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-mono text-xs uppercase tracking-widest text-slate-500">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="MindFlov" className="h-5 w-auto" />
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
            © {new Date().getFullYear()} MindFlov. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
