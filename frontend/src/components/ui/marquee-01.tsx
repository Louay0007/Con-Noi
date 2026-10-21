import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee-01-utils/marquee";

type Review = { id: string; name: string; username: string; body: string; profile: string };

const reviews: Review[] = [
  { id: "marco-edile", name: "Muratore specializzato", username: "Esperienza reale", body: "Ho trovato lavoro in due settimane grazie a Con noi. Il profilo completo e il CV caricato hanno fatto la differenza. L'azienda mi ha contattato direttamente tramite la chat.", profile: "https://cdn.21st.dev/assets/mirror/b5/b539abc60701ab9cbcd73f9241d13a14a09582a4fd06c65784cb5567d77a2e0e.webp" },
  { id: "luca-saldatore", name: "Saldatore certificato", username: "Esperienza reale", body: "La possibilità di caricare le certificazioni professionali è fondamentale. Ho ricevuto tre proposte in un mese e ho scelto quella più vicina a casa mia.", profile: "https://cdn.21st.dev/assets/mirror/2b/2bc5f22fa3400c61a2161d14e3dce5a0804badebfc1b3d9cbe844feaa3b72180.webp" },
  { id: "giulia-elettricista", name: "Elettricista industriale", username: "Esperienza reale", body: "Finalmente una piattaforma pensata per i lavoratori qualificati. Il matching è preciso e le offerte sono reali, non annunci generici.", profile: "https://cdn.21st.dev/assets/mirror/a1/a1c4d8e9f2b3a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9.webp" },
  { id: "antonio-idraulico", name: "Idraulico civile", username: "Esperienza reale", body: "La messaggistica diretta con le aziende cambia tutto. Niente attese, niente intermediari. Ho firmato il contratto in dieci giorni dalla prima candidatura.", profile: "https://cdn.21st.dev/assets/mirror/c3/d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5.webp" },
  { id: "francesco-meccanico", name: "Meccanico auto", username: "Esperienza reale", body: "Ho aggiunto la cronologia lavorativa e le foto dei miei lavori al profilo. Le aziende apprezzano vedere cosa sai fare davvero, non solo il CV.", profile: "https://cdn.21st.dev/assets/mirror/e5/f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7.webp" },
  { id: "roberta-carpentiere", name: "Carpentiera edile", username: "Esperienza reale", body: "Mi piace poter gestire tutto dalla piattaforma: candidature, messaggi, documenti. E il supporto GDPR mi dà tranquillità sui miei dati personali.", profile: "https://cdn.21st.dev/assets/mirror/g7/h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7f8.webp" },
  { id: "stefano-imbianchino", name: "Imbianchino professionista", username: "Esperienza reale", body: "Il feed personalizzato mi propone solo lavori nella mia zona e nelle mie specialità. Non perdo tempo a filtrare annunci irrilevanti.", profile: "https://cdn.21st.dev/assets/mirror/i9/j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7f8a9.webp" },
  { id: "paolo-fabbro", name: "Fabbro artigiano", username: "Esperienza reale", body: "Dopo anni di passaparola, finalmente uno strumento professionale per trovare clienti seri. La verifica dei documenti dà fiducia alle aziende.", profile: "https://cdn.21st.dev/assets/mirror/k1/l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.webp" },
];

export function TestimonialMarquee() {
  return (
    <section
      id="testimonial-heading"
      aria-labelledby="testimonial-title"
      className="relative overflow-hidden bg-[#fafafa] py-24 font-sans sm:py-28 lg:py-36"
    >
      <div className="bluecrest-container mb-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a84ff]">
          Storie di successo
        </p>
        <h2
          id="testimonial-title"
          className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-[#07172f]"
        >
          Chi trova lavoro con noi
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#07172f]/60 sm:text-lg">
          Esperienze reali di lavoratori qualificati che hanno trovato nuove opportunità tramite la piattaforma.
        </p>
      </div>

      <Marquee pauseOnHover className="[--duration:40s] [--gap:1.5rem]">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="w-[22rem] shrink-0 border-[#07172f]/10 bg-white shadow-[0_2px_12px_rgba(7,23,47,0.06)] sm:w-[26rem]"
          >
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={review.profile}
                  alt=""
                  aria-hidden="true"
                  className="size-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-[#07172f]">{review.name}</p>
                  <p className="text-xs text-[#07172f]/50">{review.username}</p>
                </div>
              </div>
              <blockquote className="text-sm leading-relaxed text-[#07172f]/70">
                "{review.body}"
              </blockquote>
            </CardContent>
          </Card>
        ))}
      </Marquee>
    </section>
  );
}

export default TestimonialMarquee;