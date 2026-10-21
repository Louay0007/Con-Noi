import { ClipboardList, Compass, MessageCircleQuestion } from "lucide-react";
import { MinimalistHero } from "@/components/ui/minimalist-hero";
import { MediterraLogo } from "@/components/MediterraLogo";

const footerLinks = [
  { label: "Scopri le opportunità di lavoro", icon: ClipboardList, href: "#testimonial-heading" },
  { label: "Domande su Con noi", icon: MessageCircleQuestion, href: "#faq" },
  { label: "Come funziona la piattaforma", icon: Compass, href: "#future-content" },
];

export function MediterraMinimalistHero() {
  return (
    <MinimalistHero
      logo={<MediterraLogo className="text-carbon" />}
      mainText="Il tuo prossimo lavoro inizia qui. Con noi trovi le migliori opportunità nel settore edile, meccanico e industriale. Crea il tuo profilo, carica il CV e candidati direttamente alle posizioni disponibili."
      readMoreLabel="Inizia ora gratuitamente"
      readMoreLink="#top"
      imageSrc="/images/hero/elseview-research-session.png"
      imageAlt="Illustrazione di un lavoratore che consulta le opportunità di lavoro sulla piattaforma Con noi."
      overlayText={{
        part1: "trova lavoro.",
        part2: "costruisci il futuro.",
      }}
      footerLinks={footerLinks}
      locationText="Piattaforma per lavoratori qualificati"
    />
  );
}