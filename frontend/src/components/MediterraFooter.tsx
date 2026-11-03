import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import { MediterraLogo } from "@/components/MediterraLogo";

export function MediterraFooter() {
  const [submitted, setSubmitted] = useState(false);

  const columns = [
    { title: "Lavoratori", links: [{ label: "Come funziona", href: "#how-it-works" }] },
    { title: "Esplora", links: [{ label: "Opportunità", href: "#testimonial-heading" }, { label: "Domande frequenti", href: "#faq" }, { label: "Torna in cima", href: "#top" }] },
    { title: "Azienda", links: [{ label: "Chi siamo", href: "#top" }] },
    { title: "Informazioni", links: [{ label: "Privacy e dati", href: "/legal/privacy" }, { label: "Termini di utilizzo", href: "/legal/terms" }, { label: "Supporto", href: "#faq" }] },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <RuixenGradientFooter
      gradientHeight="40vh"
      className="relative z-30 bg-white font-sans text-[#0F4C81]"
    >
      <div className="bluecrest-container pt-20 sm:pt-24 lg:pt-28">
        <p className="pb-20 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#0F4C81]/82 sm:pb-28">
          Scorri per scoprire di più
          <span aria-hidden="true" className="ml-2">↓</span>
        </p>

        <div className="grid gap-12 pb-12 sm:grid-cols-2 lg:grid-cols-6 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-2">
            <a
              href="#top"
              aria-label="Con noi home"
              className="bluecrest-focus inline-flex min-h-11 items-center gap-2 text-[#0F4C81]"
            >
              <MediterraLogo />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#0F4C81]/82">
              La piattaforma che connette lavoratori qualificati con le migliori aziende italiane. Trova lavoro, gestisci candidature e costruisci la tua carriera professionale.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 max-w-sm" aria-label="Modulo email Con noi">
              <div className="flex gap-2">
                <label htmlFor="footer-email" className="sr-only">Indirizzo email</label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  onChange={() => setSubmitted(false)}
                  aria-describedby="footer-email-status"
                  placeholder="La tua email"
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#0F4C81]/20 bg-transparent px-3 text-sm text-[#0F4C81] outline-none transition-colors placeholder:text-[#0F4C81]/82 focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-md bg-[#0F4C81] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
                >
                  Iscriviti
                </button>
              </div>
              <p
                id="footer-email-status"
                aria-live="polite"
                className="mt-2 min-h-5 text-xs text-[#0F4C81]/82"
              >
                {submitted ? "Grazie! Ti contatteremo presto." : "Ricevi aggiornamenti sulle nuove opportunità di lavoro."}
              </p>
            </form>
          </div>

          <nav
            aria-label="Navigazione footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 text-xs uppercase tracking-[0.12em] sm:col-span-2 sm:grid-cols-4 lg:col-span-4"
          >
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="font-semibold text-[#0F4C81]">{column.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {/* In-page anchors stay plain links; internal routes use
                          Link so they do not trigger a full document reload. */}
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="bluecrest-focus inline-flex min-h-11 items-center text-[#0F4C81]/82 transition-colors hover:text-[#0F4C81]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="bluecrest-focus inline-flex min-h-11 items-center text-[#0F4C81]/82 transition-colors hover:text-[#0F4C81]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#0F4C81]/10 pb-3 pt-6 text-xs uppercase tracking-[0.1em] text-[#0F4C81]/82 sm:flex-row">
          <span>© 2026 Con noi</span>
          <span className="flex items-center gap-2 text-[#0F4C81]/82">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#30d158]" />
            Piattaforma attiva
          </span>
          <span>Trova lavoro. Costruisci il futuro.</span>
        </div>
      </div>
    </RuixenGradientFooter>
  );
}