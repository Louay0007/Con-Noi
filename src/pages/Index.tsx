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
  ["Signal blue", "#3c83f6"], ["Deep dusk", "#022c70"], ["Azure crest", "#0544a5"],
  ["Hover glow", "#81b6ff"], ["Carbon", "#18181b"], ["Steel", "#5e616e"],
  ["Mist", "#afb3c4"], ["Vapor", "#edeef2"], ["Frost", "#f3f8ff"], ["Bone", "#e4e4e7"],
];

const tools = ["MEET", "FRAME", "ORBIT", "THREAD", "ROOM"];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-fog">{eyebrow}</p>
      <h2 className="text-3xl font-medium leading-[1.2] tracking-[-0.031em] text-carbon sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-6 tracking-[-0.01em] text-steel sm:text-lg">{description}</p>
    </div>
  );
}

const Index = () => {
  return (
    <main id="top" className="overflow-hidden bg-white">
      <AnnouncementBar />
      <section className="relative min-h-[760px] overflow-hidden bg-[radial-gradient(circle_at_50%_2%,#8bc2f0_0%,#478ce4_25%,#263ce0_58%,#082d74_100%)] text-white">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] opacity-75">
          <div className="absolute -bottom-20 left-[-8%] h-80 w-[65%] rotate-[-4deg] rounded-[50%] bg-[#092e78]/70 blur-[2px]" />
          <div className="absolute -bottom-28 right-[-12%] h-96 w-[75%] rotate-[5deg] rounded-[50%] bg-[#031d56]/80 blur-[1px]" />
          <div className="absolute bottom-10 left-[10%] h-40 w-[80%] rounded-[50%] bg-[#4c71dc]/25 blur-3xl" />
        </div>
        <TopNavigation />
        <div className="bluecrest-container relative z-10 flex flex-col items-center pt-36 text-center sm:pt-40">
          <BluecrestBadge className="border border-white/20 bg-white/10 text-white backdrop-blur" tone="neutral">Bluecrest design system</BluecrestBadge>
          <h1 className="mt-6 max-w-4xl font-display text-[52px] font-medium leading-[1.02] tracking-[-0.012em] sm:text-[68px] lg:text-[80px]">
            Build products with atmospheric clarity.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-6 tracking-[-0.01em] text-white/75 sm:text-lg">
            A focused UI foundation balancing cinematic blue depth with precise, compact product surfaces.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <BluecrestButton showArrow onClick={() => document.querySelector("#components")?.scrollIntoView({ behavior: "smooth" })}>Browse components</BluecrestButton>
            <a href="#foundations" className="bluecrest-focus rounded-[4px] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">View foundations</a>
          </div>
        </div>
        <div className="bluecrest-container relative z-10 mt-14 max-w-[980px] translate-y-6 px-0 sm:translate-y-10">
          <div className="origin-center -rotate-[1.2deg] px-2 sm:px-6"><ProductMockup /></div>
        </div>
      </section>

      <section id="foundations" className="bg-frost pb-20 pt-32 sm:pb-24 sm:pt-40">
        <div className="bluecrest-container">
          <SectionHeading eyebrow="01 — Foundations" title="One vivid signal. A quiet workspace." description="The palette keeps functional surfaces achromatic, reserving blue for moments that deserve attention." />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {colors.map(([name, value]) => (
              <div key={name} className="overflow-hidden rounded-card border border-bone bg-white">
                <div className="h-20" style={{ backgroundColor: value }} />
                <div className="p-3"><p className="text-xs font-medium text-carbon">{name}</p><p className="mt-1 font-mono text-[10px] uppercase text-fog">{value}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-feature border border-bone bg-white p-6 sm:p-8">
              <div className="mb-8 flex items-center gap-2 text-sm font-medium text-steel"><Type className="h-4 w-4" /> Typography</div>
              <p className="text-5xl font-medium leading-none tracking-[-0.04em] text-carbon sm:text-6xl">Engineered clarity</p>
              <div className="mt-8 border-t border-bone pt-6">
                <p className="text-3xl font-medium tracking-[-0.031em] text-carbon">Geist across the interface</p>
                <p className="mt-2 text-base tracking-[-0.01em] text-steel">The editorial serif display is reserved exclusively for the hero statement above.</p>
              </div>
            </div>
            <div className="rounded-feature border border-bone bg-white p-6 sm:p-8">
              <div className="mb-8 flex items-center gap-2 text-sm font-medium text-steel"><Layers3 className="h-4 w-4" /> Shape & spacing</div>
              <div className="grid grid-cols-3 gap-3">
                {["4px", "12px", "24px"].map((radius, index) => <div key={radius} className="flex aspect-square items-center justify-center border border-bone bg-frost text-sm font-medium text-carbon" style={{ borderRadius: radius }}>{["Button", "Card", "Feature"][index]}<br /></div>)}
              </div>
              <div className="mt-6 flex items-end gap-2">
                {[8, 12, 16, 24, 40].map(size => <div key={size} className="flex flex-1 items-center justify-center rounded-[4px] bg-vapor text-[10px] text-fog" style={{ height: `${size + 24}px` }}>{size}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="components" className="py-20 sm:py-24">
        <div className="bluecrest-container">
          <SectionHeading eyebrow="02 — Components" title="Compact, calm, and ready to compose." description="Reusable primitives hold a consistent hierarchy without decorative weight or excessive radius." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <FeatureCard variant="frost" eyebrow="Actions" title="Primary conversion" description="Signal blue anchors focused actions while low-emphasis choices remain quiet.">
              <div className="flex flex-wrap items-center gap-3"><BluecrestButton showArrow>Continue</BluecrestButton><BluecrestButton size="sm">Small action</BluecrestButton><button className="bluecrest-focus rounded-[4px] border border-bone bg-white px-5 py-2.5 text-sm font-medium text-carbon hover:bg-vapor">Secondary</button></div>
            </FeatureCard>
            <FeatureCard eyebrow="Status" title="Badges and indicators" description="Pills are reserved for metadata, compact states, and low-frequency emphasis.">
              <div className="flex flex-wrap gap-3"><BluecrestBadge>Neutral</BluecrestBadge><BluecrestBadge tone="blue">Selected</BluecrestBadge><BluecrestBadge tone="active"><Circle className="mr-1.5 h-2 w-2 fill-carbon" />Active edge</BluecrestBadge></div>
            </FeatureCard>
            <FeatureCard className="lg:col-span-2" eyebrow="Composition" title="Product mockup frame" description="Dark product UI becomes the focal point inside a restrained, border-led frame.">
              <ProductMockup className="mt-2" />
            </FeatureCard>
          </div>
        </div>
      </section>

      <section id="patterns" className="border-y border-bone bg-[#fbfcff] py-20 sm:py-24">
        <div className="bluecrest-container">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow="03 — Patterns" title="A system designed for product stories." description="Use frost to bridge atmospheric moments into structured white content." /><a href="#top" className="bluecrest-focus inline-flex shrink-0 items-center gap-2 rounded-[4px] text-sm font-medium text-signal-blue">Back to top <ArrowRight className="h-4 w-4 -rotate-45" /></a></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [Palette, "Restrained color", "Keep saturated color focused on actions and active navigation."],
              [Command, "Compact controls", "Use 4px buttons, 8px inputs, and tight labels for engineered clarity."],
              [Check, "Border-led layers", "Separate white surfaces with Bone hairlines instead of drop shadows."],
            ].map(([Icon, title, copy]) => {
              const IconComponent = Icon as typeof Palette;
              return <div key={title as string} className="rounded-card border border-bone bg-white p-6"><div className="mb-12 flex h-9 w-9 items-center justify-center rounded-lg border border-bone bg-frost text-signal-blue"><IconComponent className="h-4 w-4" /></div><h3 className="text-lg font-semibold tracking-[-0.018em] text-carbon">{title as string}</h3><p className="mt-2 text-sm leading-6 text-steel">{copy as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="bluecrest-container text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-fog">Compatible with every workflow</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
            {tools.map(tool => <div key={tool} className="flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-mist"><span className="h-5 w-5 rounded-[6px] border border-bone bg-frost" />{tool}</div>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-bone bg-white py-8">
        <div className="bluecrest-container flex flex-col gap-3 text-sm text-fog sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-carbon">Bluecrest UI</p><p>Atmospheric foundations for focused products.</p></div>
      </footer>
    </main>
  );
};

export default Index;
