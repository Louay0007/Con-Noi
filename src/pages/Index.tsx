import { BluecrestBadge, BluecrestButton, ProductMockup } from "@/components/bluecrest";

const Index = () => {
  const revealPreview = () => {
    document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#082861]">
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#b6e1ff_0%,#5babf4_24%,#2064db_52%,#082861_100%)] text-white">
        <div aria-hidden="true" className="absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-cyan-veil/30 blur-[100px]" />
        <div aria-hidden="true" className="absolute right-[-8%] top-[12%] h-[460px] w-[460px] rounded-full bg-[#9c8cff]/25 blur-[110px]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[46%] opacity-80">
          <div className="absolute -bottom-20 left-[-8%] h-80 w-[65%] rotate-[-4deg] rounded-[50%] bg-[#092e78]/65 blur-[2px]" />
          <div className="absolute -bottom-28 right-[-12%] h-96 w-[75%] rotate-[5deg] rounded-[50%] bg-[#031d56]/75 blur-[1px]" />
          <div className="absolute bottom-10 left-[10%] h-40 w-[80%] rounded-[50%] bg-[#74b8ff]/20 blur-3xl" />
        </div>

        <div className="bluecrest-container relative z-10 flex flex-col items-center pt-24 text-center sm:pt-28">
          <BluecrestBadge className="liquid-glass-dark border-white/20 text-white" tone="neutral">
            Designed for spatial clarity
          </BluecrestBadge>
          <h1 className="mt-7 max-w-4xl text-[54px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[72px] lg:text-[88px]">
            Interfaces that feel alive.
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-[1.5] tracking-[-0.02em] text-white/75 sm:text-[20px]">
            A fluid design system shaped by depth, light, and the precision of SF Pro Display.
          </p>
          <div className="mt-8">
            <BluecrestButton showArrow onClick={revealPreview}>Explore the interface</BluecrestButton>
          </div>
        </div>

        <div id="preview" className="bluecrest-container relative z-10 mt-14 max-w-[980px] translate-y-8 px-0 pb-8 sm:translate-y-12 sm:pb-12">
          <div className="origin-center -rotate-[1deg] px-2 sm:px-6">
            <ProductMockup />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
