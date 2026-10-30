"use client";

import "lenis/dist/lenis.css";

import { ReactLenis } from "lenis/react";
import {
  ArrowUpRight,
  Briefcase,
  FileCheck,
  MessageSquare,
  Search,
  type LucideIcon,
} from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type SmoothScrollProps = ComponentPropsWithoutRef<"section">;
type PanelTone = "navy" | "light" | "blue";

type StoryPanel = {
  eyebrow: string;
  title: string;
  description: string;
  footnote: string;
  icon: LucideIcon;
  tone: PanelTone;
};

const panels: StoryPanel[] = [
  {
    eyebrow: "01 / Scopri",
    title: "Trova le opportunità giuste.",
    description:
      "Il feed 'Per te' utilizza un algoritmo di matching intelligente basato sulle tue specialità, esperienza e posizione geografica. Più completo è il tuo profilo, più precise saranno le proposte.",
    footnote: "Completa il profilo per ricevere match migliori.",
    icon: Search,
    tone: "light",
  },
  {
    eyebrow: "02 / Candidati",
    title: "Candidatura semplice e diretta.",
    description:
      "Carica il CV una volta sola e candidati con un click. Aggiungi una lettera di presentazione, certificazioni e documenti rilevanti. Le aziende ricevono subito la tua candidatura.",
    footnote: "Puoi ritirare la candidatura finché non viene esaminata.",
    icon: FileCheck,
    tone: "blue",
  },
  {
    eyebrow: "03 / Comunica",
    title: "Parla direttamente con l'azienda.",
    description:
      "Quando la tua candidatura viene accettata, si apre una chat diretta con il datore di lavoro. Nessun intermediario, nessuna attesa. Gestisci tutto dalla piattaforma.",
    footnote: "Messaggistica sicura e tracciabile.",
    icon: MessageSquare,
    tone: "navy",
  },
  {
    eyebrow: "04 / Cresci",
    title: "Costruisci la tua carriera.",
    description:
      "Aggiungi esperienze lavorative, certificazioni e competenze al tuo profilo. Ogni candidatura e ogni lavoro completato rafforzano la tua reputazione professionale sulla piattaforma.",
    footnote: "Il tuo profilo è il tuo biglietto da visita.",
    icon: Briefcase,
    tone: "light",
  },
];

const toneClasses: Record<PanelTone, string> = {
  navy: "bg-[#07172f] text-white",
  light: "bg-white text-[#07172f]",
  blue: "bg-[#0a84ff] text-white",
};

export const SmoothScroll = forwardRef<HTMLElement, SmoothScrollProps>(
  ({ className, ...props }, ref) => {
    return (
      <ReactLenis root options={{ lerp: 0.09, duration: 1.4 }}>
        <section
          ref={ref}
          {...props}
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className={cn("relative font-sans", className)}
        >
          <h2 id="how-it-works-heading" className="sr-only">
            Come funziona Con noi
          </h2>
          {panels.map((panel, index) => {
            const Icon = panel.icon;
            const isLast = index === panels.length - 1;

            return (
              <article
                key={panel.eyebrow}
                className={cn(
                  "relative flex min-h-screen flex-col justify-center px-6 py-24 sm:px-10 lg:px-16",
                  toneClasses[panel.tone],
                )}
              >
                <div className="mx-auto w-full max-w-5xl">
                  <div className="flex items-start gap-6">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.2em]",
                        panel.tone === "light" ? "text-[#0a84ff]" : "text-white/70",
                      )}
                    >
                      {panel.eyebrow}
                    </span>
                  </div>

                  <h3 className="mt-6 max-w-3xl text-[clamp(2.2rem,4.8vw,4.5rem)] font-semibold leading-[0.94] tracking-[-0.05em]">
                    {panel.title}
                  </h3>

                  <p
                    className={cn(
                      "mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl",
                      panel.tone === "light" ? "text-[#07172f]/65" : "text-white/75",
                    )}
                  >
                    {panel.description}
                  </p>

                  <div className="mt-12 flex items-center gap-4">
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-10 shrink-0",
                        panel.tone === "light" ? "text-[#0a84ff]" : "text-white",
                      )}
                      strokeWidth={1.4}
                    />
                    <p
                      className={cn(
                        "text-sm font-medium italic",
                        panel.tone === "light" ? "text-[#07172f]/55" : "text-white/60",
                      )}
                    >
                      {panel.footnote}
                    </p>
                  </div>
                </div>

                {!isLast && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <ArrowUpRight
                      aria-hidden="true"
                      className={cn(
                        "size-5",
                        panel.tone === "light" ? "text-[#07172f]/30" : "text-white/30",
                      )}
                    />
                    <span className="sr-only">Scorri per continuare</span>
                  </div>
                )}

                {isLast && (
                  <div className="mt-16 flex justify-center">
                    <a
                      href="#top"
                      className={cn(
                        "bluecrest-focus inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
                        panel.tone === "light"
                          ? "bg-[#07172f] text-white hover:bg-[#0a84ff]"
                          : "bg-white text-[#07172f] hover:bg-white/90",
                      )}
                    >
                      Torna all'inizio
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </ReactLenis>
    );
  },
);

SmoothScroll.displayName = "SmoothScroll";

export default SmoothScroll;