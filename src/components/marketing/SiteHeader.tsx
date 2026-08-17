import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/generation-modes", label: "Modes" },
  { to: "/contexts", label: "Contexts" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="MindFlov home">
          <img src="/logo.svg" alt="MindFlov" className="h-6 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-mono text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
              activeProps={{ className: "text-white" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            to="/app"
            className="rounded-full bg-indigo-500 px-5 py-2 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-indigo-400"
          >
            Open app
          </Link>
        </div>

        <button
          type="button"
          className="text-slate-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-white/10 bg-[#020617] px-4 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block font-mono text-xs uppercase tracking-widest text-slate-300"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/app"
                className="mt-2 block rounded-full bg-indigo-500 px-5 py-2 text-center font-mono text-xs uppercase tracking-widest text-white"
                onClick={() => setOpen(false)}
              >
                Open app
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
