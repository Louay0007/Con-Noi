import { LogoCarousel } from "@/components/LogoCarousel";
import { Seo } from "@/components/Seo";
import { MediterraFaq } from "@/components/MediterraFaq";
import { MediterraFooter } from "@/components/MediterraFooter";
import { MediterraMinimalistHero } from "@/components/MediterraMinimalistHero";
import TestimonialMarquee from "@/components/ui/marquee-01";
import SmoothScroll from "@/components/ui/smooth-scroll";

const Index = () => {
  return (
    <main id="top" className="min-h-screen bg-white">
      <Seo
        title="Con noi — Trova lavoro nel settore edile e industriale"
        description="Con noi è la piattaforma che connette lavoratori qualificati con le migliori aziende italiane. Crea il tuo profilo, carica il CV e candidati direttamente alle posizioni disponibili nei settori edile, meccanico, elettrico e industriale."
      />
      <MediterraMinimalistHero />
      <LogoCarousel />
      <SmoothScroll />
      <TestimonialMarquee />
      <MediterraFaq />
      <MediterraFooter />
    </main>
  );
};

export default Index;