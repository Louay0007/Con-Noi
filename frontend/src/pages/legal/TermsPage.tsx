import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { MediterraLogo } from "@/components/MediterraLogo";

const UPDATED = "2 novembre 2026";

const SECTIONS = [
  {
    title: "1. Oggetto del servizio",
    body: [
      "Con noi è una piattaforma che mette in contatto lavoratori in cerca di occupazione e aziende che cercano personale nei settori edile, meccanico, elettrico e industriale.",
      "Con noi non è un'agenzia per il lavoro e non intermedia il rapporto di lavoro: le candidature vengono inviate direttamente alle aziende, che decidono in autonomia chi assumere.",
    ],
  },
  {
    title: "2. Requisiti per l'utilizzo",
    body: [
      "Per creare un account devi avere almeno 18 anni e la capacità giuridica di stipulare un contratto.",
      "Ti impegni a fornire informazioni veritiere sul tuo profilo professionale, incluse esperienze, qualifiche e disponibilità. Informazioni false possono comportare la sospensione dell'account.",
    ],
  },
  {
    title: "3. Account e sicurezza",
    body: [
      "Sei responsabile della riservatezza delle credenziali del tuo account e di tutte le attività svolte tramite esse.",
      "Se ritieni che il tuo account sia stato compromesso, cambia la password e contattaci immediatamente.",
    ],
  },
  {
    title: "4. Contenuti pubblicati",
    body: [
      "Le aziende sono responsabili degli annunci pubblicati, che devono rispettare la normativa vigente in materia di lavoro e di pari opportunità.",
      "Non è consentito pubblicare annunci discriminatori, contenuti illeciti o richieste di pagamento ai candidati per l'invio di una candidatura.",
    ],
  },
  {
    title: "5. Sospensione e chiusura",
    body: [
      "Puoi chiudere il tuo account in qualsiasi momento dalla sezione profilo.",
      "Possiamo sospendere o chiudere un account che violi questi termini, dandone comunicazione ove possibile.",
    ],
  },
  {
    title: "6. Limitazioni di responsabilità",
    body: [
      "Forniamo la piattaforma \"così com'è\". Pur impegnandoci a mantenerla disponibile e sicura, non garantiamo che ogni annuncio porti a un'assunzione né che il servizio sia privo di interruzioni.",
      "Nei limiti consentiti dalla legge, non rispondiamo delle trattative e degli accordi intercorsi direttamente tra aziende e candidati.",
    ],
  },
  {
    title: "7. Modifiche ai termini",
    body: [
      "Possiamo aggiornare questi termini per riflettere cambiamenti normativi o del servizio. In caso di modifiche sostanziali ti avviseremo prima che entrino in vigore.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Termini di utilizzo — Con noi"
        description="Condizioni di utilizzo della piattaforma Con noi: servizio, account, contenuti pubblicati e responsabilità."
      />
      <div className="min-h-screen bg-white">
        <header className="border-b border-[#E5E7EB] bg-white">
          <div className="bluecrest-container flex min-h-[64px] items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
              aria-label="Con noi — home"
            >
              <MediterraLogo />
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-[#4B5563] transition-colors hover:text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Link>
          </div>
        </header>

        <main className="bluecrest-container max-w-[760px] py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
            Ultimo aggiornamento: {UPDATED}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            Termini di utilizzo
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#4B5563]">
            Questi termini regolano l'uso di Con noi. Utilizzando la piattaforma accetti le
            condizioni descritte di seguito.
          </p>

          <div className="mt-10 space-y-9">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-[#1A1A1A]">{section.title}</h2>
                <div className="mt-2 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-[#4B5563]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A]">8. Contatti</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                Per domande su questi termini scrivi a{" "}
                <a
                  href="mailto:info@con-noi.dev"
                  className="font-medium text-[#0F4C81] underline underline-offset-2 hover:text-[#0a3d6b]"
                >
                  info@con-noi.dev
                </a>
                .
              </p>
            </section>
          </div>

          <p className="mt-12 border-t border-[#E5E7EB] pt-6 text-sm text-[#4B5563]">
            Vedi anche{" "}
            <Link to="/legal/privacy" className="font-medium text-[#0F4C81] underline underline-offset-2 hover:text-[#0a3d6b]">
              l'informativa sulla privacy
            </Link>
            .
          </p>
        </main>
      </div>
    </>
  );
}
