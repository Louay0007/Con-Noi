import { ArrowRight, Check, Circle, Command, Layers3, Palette, Type } from "lucide-react";
import {
  AnnouncementBar,
  BluecrestBadge,
  BluecrestButton,
  FeatureCard,
  ProductMockup,
  TopNavigation,
} from "@/components/bluecrest";

const colors = [
  ["System blue", "#0a84ff"], ["Deep dusk", "#001b45"], ["Azure", "#0066cc"],
  ["Sky", "#9bd0ff"], ["Label", "#1d1d1f"], ["Secondary", "#6e6e73"],
  ["Tertiary", "#aeaeb2"], ["Grouped", "#f2f2f7"], ["Frost", "#f5f9ff"], ["Separator", "#dedee2"],
];

const tools = ["MEET", "FRAME", "ORBIT", "THREAD", "ROOM"];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-signal-blue">{eyebrow}</p>
      <h2 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.045em] text-carbon sm:text-[44px]">{title}</h2>
      <p className="mt-4 text-[17px] leading-[1.5] tracking-[-0.02em] text-steel sm:text-[19px]">{description}</p>
    </div>
  );
}

const Index = () => {
  return (
    <main id="top" className="overflow-hidden bg-white">
      <AnnouncementBar />
      <section className="relative min-h-[800px] overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#b6e1ff_0%,#5babf4_24%,#2064db_52%,#082861_100%)] text-white">
        <div aria-hidden="true" className="absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-cyan-veil/30 blur-[100px]" />
        <div aria-hidden="true" className="absolute right-[-8%] top-[12%] h-[460px] w-[460px] rounded-full bg-[#9c8cff]/25 blur-[110px]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[46%] opacity-80">
          <div className="absolute -bottom-20 left-[-8%] h-80 w-[65%] rotate-[-4deg] rounded-[50%] bg-[#092e78]/65 blur-[2px]" />
          <div className="absolute -bottom-28 right-[-12%] h-96 w-[75%] rotate-[5deg] rounded-[50%] bg-[#031d56]/75 blur-[1px]" />
          <div className="absolute bottom-10 left-[10%] h-40 w-[80%] rounded-[50%] bg-[#74b8ff]/20 blur-3xl" />
        </div>
        <TopNavigation />
        <div className="bluecrest-container relative z-10 flex flex-col items-center pt-40 text-center sm:pt-44">
          <BluecrestBadge className="liquid-glass-dark border-white/20 text-white" tone="neutral">Designed for spatial clarity</BluecrestBadge>
          <h1 className="mt-7 max-w-4xl text-[54px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[72px] lg:text-[88px]">
            Interfaces that feel alive.
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-[1.5] tracking-[-0.02em] text-white/75 sm:text-[20px]">
            A fluid design system shaped by depth, light, and the precision of SF Pro Display.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <BluecrestButton showArrow onClick={() => document.querySelector("#components")?.scrollIntoView({ behavior: "smooth" })}>Browse components</BluecrestButton>
            <a href="#foundations" className="bluecrest-focus liquid-glass-dark rounded-full px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-white/20">View foundations</a>
          </div>
        </div>
        <div className="bluecrest-container relative z-10 mt-14 max-w-[980px] translate-y-8 px-0 sm:translate-y-12">
          <div className="origin-center -rotate-[1deg] px-2 sm:px-6"><ProductMockup /></div>
        </div>
      </section>

      <section id="foundations" className="relative bg-[linear-gradient(180deg,#eef7ff_0%,#f8f9fc_45%,#ffffff_100%)] pb-20 pt-36 sm:pb-28 sm:pt-44">
        <div aria-hidden="true" className="absolute left-[12%] top-16 h-64 w-64 rounded-full bg-signal-blue/10 blur-[90px]" />
        <div className="bluecrest-container relative">
          <SectionHeading eyebrow="01 — Foundations" title="Familiar, fluid, and dimensional." description="System colors, generous curves, and layered materials create hierarchy without visual noise." />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {colors.map(([name, value]) => (
              <div key={name} className="liquid-glass overflow-hidden rounded-[22px]">
                <div className="m-1 h-20 rounded-[18px]" style={{ backgroundColor: value }} />
                <div className="p-3.5 pt-2"><p className="text-[13px] font-semibold text-carbon">{name}</p><p className="mt-1 font-mono text-[10px] uppercase text-fog">{value}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="liquid-glass rounded-[30px] p-7 sm:p-9">
              <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-steel"><Type className="h-4 w-4 text-signal-blue" /> Typography</div>
              <p className="text-5xl font-semibold leading-[.98] tracking-[-0.055em] text-carbon sm:text-6xl">SF Pro Display</p>
              <div className="mt-9 border-t border-black/[0.07] pt-7">
                <p className="text-3xl font-semibold tracking-[-0.04em] text-carbon">Clear at every scale</p>
                <p className="mt-2 text-[17px] tracking-[-0.02em] text-steel">Apple's system typography is used across display, interface, and control text.</p>
              </div>
            </div>
            <div className="liquid-glass rounded-[30px] p-7 sm:p-9">
              <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-steel"><Layers3 className="h-4 w-4 text-signal-blue" /> Shape & material</div>
              <div className="grid grid-cols-3 gap-3">
                {["14px", "22px", "30px"].map((radius, index) => <div key={radius} className="flex aspect-square items-center justify-center border border-white/80 bg-white/55 text-center text-sm font-semibold text-carbon shadow-[inset_0_1px_0_white]" style={{ borderRadius: radius }}>{["Control", "Card", "Panel"][index]}</div>)}
              </div>
              <div className="mt-6 flex items-end gap-2">
                {[8, 12, 16, 24, 40].map(size => <div key={size} className="flex flex-1 items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-medium text-fog" style={{ height: `${size + 24}px` }}>{size}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="components" className="relative py-20 sm:py-28">
        <div aria-hidden="true" className="absolute right-[-10%] top-20 h-96 w-96 rounded-full bg-[#64d2ff]/10 blur-[100px]" />
        <div className="bluecrest-container relative">
          <SectionHeading eyebrow="02 — Components" title="Controls with a sense of touch." description="Soft capsules and translucent materials make every interaction feel direct, responsive, and familiar." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <FeatureCard variant="frost" eyebrow="Actions" title="Primary controls" description="System blue identifies the clearest next action while secondary controls blend into the material.">
              <div className="flex flex-wrap items-center gap-3"><BluecrestButton showArrow>Continue</BluecrestButton><BluecrestButton size="sm">Small action</BluecrestButton><button className="bluecrest-focus rounded-full border border-black/[0.05] bg-black/[0.055] px-6 py-3 text-[15px] font-semibold text-carbon transition hover:bg-black/[0.09]">Secondary</button></div>
            </FeatureCard>
            <FeatureCard eyebrow="Status" title="Capsules and states" description="Compact labels use system tints and blur to stay legible across layered surfaces.">
              <div className="flex flex-wrap gap-3"><BluecrestBadge>Neutral</BluecrestBadge><BluecrestBadge tone="blue">Selected</BluecrestBadge><BluecrestBadge tone="active"><Circle className="mr-1.5 h-2 w-2 fill-current" />Available</BluecrestBadge></div>
            </FeatureCard>
            <FeatureCard className="lg:col-span-2" eyebrow="Composition" title="A focused workspace" description="Dark interface material floats above the canvas with internal translucency and reflected light.">
              <ProductMockup className="mt-2" />
            </FeatureCard>
          </div>
        </div>
      </section>

      <section id="patterns" className="relative border-y border-black/[0.06] bg-[#f5f5f7] py-20 sm:py-28">
        <div className="bluecrest-container">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow="03 — Patterns" title="Depth that guides, never distracts." description="Layer glass over atmospheric color and keep content surfaces calm, bright, and effortless." /><a href="#top" className="bluecrest-focus inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-signal-blue shadow-[0_8px_24px_rgba(0,0,0,.06)]">Back to top <ArrowRight className="h-4 w-4 -rotate-45" /></a></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [Palette, "System color", "Use familiar semantic tints and reserve blue for the primary path."],
              [Command, "Fluid controls", "Use pill-shaped actions and large hit areas that feel naturally touchable."],
              [Check, "Layered material", "Build depth with blur, highlights, and subtle translucency instead of hard lines."],
            ].map(([Icon, title, copy]) => {
              const IconComponent = Icon as typeof Palette;
              return <div key={title as string} className="liquid-glass rounded-[30px] p-7"><div className="mb-14 flex h-11 w-11 items-center justify-center rounded-[15px] bg-signal-blue text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_8px_20px_rgba(10,132,255,.22)]"><IconComponent className="h-5 w-5" /></div><h3 className="text-xl font-semibold tracking-[-0.035em] text-carbon">{title as string}</h3><p className="mt-2 text-[15px] leading-6 tracking-[-0.015em] text-steel">{copy as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="bluecrest-container text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fog">Made for every workflow</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
            {tools.map(tool => <div key={tool} className="flex items-center gap-2 text-sm font-semibold tracking-[-0.01em] text-mist"><span className="h-6 w-6 rounded-[8px] bg-[linear-gradient(145deg,#fff,#e8f3ff)] shadow-[inset_0_1px_0_white,0_4px_12px_rgba(0,80,180,.12)]" />{tool}</div>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] bg-white py-8">
        <div className="bluecrest-container flex flex-col gap-3 text-sm text-fog sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold tracking-[-0.02em] text-carbon">Bluecrest UI</p><p>Fluid foundations for focused products.</p></div>
      </footer>
    </main>
  );
};

export default Index;
