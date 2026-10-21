import { useState, type FormEvent } from "react";

import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import { MediterraLogo } from "@/components/MediterraLogo";

export function MediterraFooter() {
  const [submitted, setSubmitted] = useState(false);

  const columns = [
    { title: "Lavoratori", links: [{ label: "Come funziona", href: "#future-content" }] },
    { title: "Esplora", links: [{ label: "Opportunità", href: "#testimonial-heading" }, { label: "Domande frequenti", href: "#faq" }, { label: "Torna in cima", href: "#top" }] },
    { title: "Azienda", links: [{ label: "Chi siamo", href: "#top" }] },
    { title: "Informazioni", links: [{ label: "Privacy e dati", href: "#faq" }, { label: "Termini di utilizzo", href: "#faq" }, { label: "Supporto", href: "#faq" }] },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <RuixenGradientFooter
      gradientHeight="40vh"
      className="relative z-30 bg-white font-sans text-[#07172f]"
    >
      <div className="bluecrest-container pt-20 sm:pt-24 lg:pt-28">
        <p className="pb-20 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#07172f]/48 sm:pb-28">
          Scorri per scoprire di più
          <span aria-hidden="true" className="ml-2">↓</span>
        </p>

        <div className="grid gap-12 pb-12 sm:grid-cols-2 lg:grid-cols-6 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-2">
            <a
              href="#top"
              aria-label="Con noi home"
              className="bluecrest-focus inline-flex min-h-11 items-center gap-2 text-[#07172f]"
            >
              <MediterraLogo />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#07172f]/58">
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
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#07172f]/15 bg-transparent px-3 text-sm text-[#07172f] outline-none transition-colors placeholder:text-[#07172f]/38 focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/20"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-md bg-[#07172f] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#0a84ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:ring-offset-2"
                >
                  Iscriviti
                </button>
              </div>
              <p
                id="footer-email-status"
                aria-live="polite"
                className="mt-2 min-h-5 text-xs text-[#07172f]/58"
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
                <h2 className="font-semibold text-[#07172f]">{column.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="bluecrest-focus inline-flex min-h-7 items-center text-[#07172f]/52 transition-colors hover:text-[#0a84ff]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#07172f]/10 pb-3 pt-6 text-xs uppercase tracking-[0.1em] text-[#07172f]/52 sm:flex-row">
          <span>© 2026 Con noi</span>
          <span className="flex items-center gap-2 text-[#07172f]/62">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#30d158]" />
            Piattaforma attiva
          </span>
          <span>Trova lavoro. Costruisci il futuro.</span>
        </div>
      </div>
    </RuixenGradientFooter>
  );
}