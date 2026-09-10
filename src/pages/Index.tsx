import { LogoCarousel } from "@/components/LogoCarousel";
import { MediterraCareRelay } from "@/components/MediterraCareRelay";
import { MediterraHeader } from "@/components/MediterraHeader";
import { MediterraHeroCopy } from "@/components/MediterraHeroCopy";
import { WorkflowSection } from "@/components/WorkflowSection";

const Index = () => {
  return (
    <main id="top" className="min-h-screen bg-white">
      <MediterraHeader />
      <section
        aria-label="Mediterranean coastal landscape"
        className="min-h-screen w-full bg-white bg-cover bg-top bg-no-repeat md:bg-center"
        style={{ backgroundImage: "url('/mediterra-hero.png')" }}
      >
        <MediterraHeroCopy />
      </section>
      <LogoCarousel />
      <MediterraCareRelay />
      <WorkflowSection />
      <section
        id="future-content"
        aria-label="Reserved for future content"
        className="min-h-screen bg-white"
      />
    </main>
  );
};

export default Index;
