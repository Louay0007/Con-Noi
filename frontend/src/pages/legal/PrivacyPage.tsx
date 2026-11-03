import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { MediterraLogo } from "@/components/MediterraLogo";

const UPDATED = "2 novembre 2026";

const SECTIONS = [
  {
    title: "1. Titolare del trattamento",
    body: [
      "Con noi tratta i dati personali degli utenti per erogare il servizio di incontro tra domanda e offerta di lavoro, ai sensi del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003.",
      "Per esercitare i tuoi diritti scrivi a info@con-noi.dev.",
    ],
  },
  {
    title: "2. Quali dati raccogliamo",
    body: [
      "Dati di account: nome, indirizzo email e password (conservata solo in forma crittografata).",
      "Dati di profilo professionale: esperienze, qualifiche, specializzazioni, disponibilità, città e provincia. Il CV che carichi è conservato per essere allegato alle candidature che invii.",
      "Dati di utilizzo: annunci visualizzati, candidature inviate, messaggi scambiati con le aziende.",
    ],
  },
  {
    title: "3. Finalità e basi giuridiche",
    body: [
      "Esecuzione del contratto: creare e gestire l'account, mostrare il profilo alle aziende a cui ti candidi, consegnare le candidature.",
      "Consenso: invio di comunicazioni sulle nuove opportunità, revocabile in ogni momento.",
      "Obblighi di legge: conservazione dei dati necessari ad adempiere a obblighi fiscali e amministrativi.",
    ],
  },
  {
    title: "4. Chi può vedere il tuo profilo",
    body: [
      "Il tuo profilo e il CV sono visibili alle aziende a cui invii una candidatura. Non vendiamo i tuoi dati e non li rendiamo pubblici sui motori di ricerca.",
      "I messaggi scambiati con un'azienda sono visibili solo ai partecipanti alla conversazione.",
    ],
  },
  {
    title: "5. Conservazione",
    body: [
      "Conserviamo i dati del profilo finché l'account resta attivo. Se chiudi l'account, cancelliamo i dati personali entro 30 giorni, salvo quanto la legge ci impone di conservare più a lungo.",
    ],
  },
  {
    title: "6. I tuoi diritti",
    body: [
      "Puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei tuoi dati, oppure opporti al trattamento.",
      "Puoi proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it) se ritieni che il trattamento violi la normativa.",
    ],
  },
  {
    title: "7. Sicurezza",
    body: [
      "Adottiamo misure tecniche e organizzative per proteggere i dati: password crittografate, sessioni autenticate tramite token e accesso ai dati limitato a chi ne ha necessità.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Seo
        title="Informativa privacy — Con noi"
        description="Come Con noi raccoglie, utilizza e protegge i dati personali di lavoratori e aziende, ai sensi del GDPR."
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
            Informativa sulla privacy
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#4B5563]">
            Questa informativa spiega quali dati personali raccogliamo, perché li trattiamo e quali
            diritti hai.
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
          </div>

          <p className="mt-12 border-t border-[#E5E7EB] pt-6 text-sm text-[#4B5563]">
            Vedi anche{" "}
            <Link to="/legal/terms" className="font-medium text-[#0F4C81] underline underline-offset-2 hover:text-[#0a3d6b]">
              i termini di utilizzo
            </Link>
            .
          </p>
        </main>
      </div>
    </>
  );
}
