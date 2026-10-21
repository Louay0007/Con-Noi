import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const faqs = [
  { question: "Cos'è Con noi?", answer: "Con noi è la piattaforma che connette lavoratori qualificati con aziende italiane nei settori edile, meccanico, elettrico e industriale. Puoi creare un profilo, caricare il CV e candidarti direttamente alle posizioni disponibili." },
  { question: "Per chi è pensata la piattaforma?", answer: "Con noi è pensata per muratori, saldatori, elettricisti, idraulici, meccanici e tutti i lavoratori specializzati che cercano nuove opportunità di lavoro in Italia." },
  { question: "Come posso candidarmi a una posizione?", answer: "Crea un account, completa il tuo profilo con le tue specialità e il CV, poi sfoglia le opportunità nella sezione 'Per te' o 'Sfoglia'. Clicca su 'Candidati' per inviare la tua candidatura direttamente all'azienda." },
  { question: "Posso caricare certificazioni e documenti?", answer: "Sì. Puoi caricare CV, certificazioni professionali, foto dei tuoi lavori e altri documenti rilevanti nella sezione Profilo > Documenti. Tutti i file vengono scansionati per sicurezza." },
  { question: "Come funziona la messaggistica?", answer: "Una volta che la tua candidatura viene accettata, puoi comunicare direttamente con l'azienda tramite la chat integrata. Anche gli amministratori possono contattarti per supporto." },
  { question: "I miei dati sono al sicuro?", answer: "Assolutamente sì. Rispettiamo il GDPR e i tuoi dati personali sono protetti. Puoi esportare o eliminare i tuoi dati in qualsiasi momento dalla sezione Impostazioni del profilo." },
  { question: "È gratuito?", answer: "Sì, l'iscrizione e l'utilizzo della piattaforma sono completamente gratuiti per i lavoratori. Le aziende pagano per pubblicare annunci e accedere ai candidati." },
  { question: "Come posso iniziare?", answer: "Registrati con la tua email, scegli le tue specialità, carica il CV e inizia a cercare lavoro. Il processo di onboarding ti guiderà passo dopo passo." },
];

export function MediterraFaq() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const heading = section.querySelector<HTMLElement>("[data-faq-heading]");
      const intro = section.querySelector<HTMLElement>("[data-faq-intro]");
      const items = gsap.utils.toArray<HTMLElement>("[data-faq-item]", section);
      const targets = [heading, intro, ...items].filter(Boolean);

      gsap.set(targets, { autoAlpha: 0, y: reducedMotion ? 0 : 12 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        })
        .to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: reducedMotion ? 0.2 : 0.4,
          ease: "power1.out",
        })
        .to(
          intro,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0.2 : 0.35,
            ease: "power1.out",
          },
          "-=0.18",
        )
        .to(
          items,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0.18 : 0.36,
            stagger: reducedMotion ? 0.02 : 0.055,
            ease: "power1.out",
          },
          "-=0.12",
        );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-white py-24 font-sans sm:py-28 lg:py-36"
    >
      <div className="bluecrest-container relative grid gap-14 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)] lg:gap-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div data-faq-heading>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a84ff]">
              Domande frequenti
            </p>
            <h2
              id="faq-heading"
              className="mt-5 max-w-[10ch] text-[clamp(3rem,5.4vw,6rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#07172f]"
            >
              Hai domande? Abbiamo le risposte.
            </h2>
          </div>
          <p
            data-faq-intro
            className="mt-7 max-w-md text-base leading-relaxed text-[#07172f]/65 sm:text-lg"
          >
            Scopri come funziona Con noi: registrazione, candidature, messaggistica e tutto ciò che devi sapere per trovare il lavoro giusto.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="border-t border-[#07172f]/15"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index + 1}`}
              data-faq-item
              className="border-[#07172f]/15"
            >
              <AccordionTrigger className="min-h-20 gap-5 py-5 text-left text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-[#07172f] hover:text-[#0a84ff] hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:ring-offset-4 focus-visible:ring-offset-white sm:min-h-24 sm:py-6 sm:text-xl [&>svg]:size-5 [&>svg]:text-[#0a84ff]">
                <span className="flex items-start gap-4 sm:gap-6">
                  <span className="mt-0.5 shrink-0 font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-[#0a84ff] sm:mt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{faq.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-7 pl-[2.7rem] pr-10 text-[0.98rem] leading-relaxed text-[#07172f]/68 sm:pb-8 sm:pl-[3.8rem] sm:pr-14 sm:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}