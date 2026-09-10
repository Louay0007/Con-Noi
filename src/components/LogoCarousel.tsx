import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const partners = [
  { name: "Siemens", logo: "https://cdn.simpleicons.org/siemens/73777C" },
  { name: "Roche", logo: "https://cdn.simpleicons.org/roche/73777C" },
  { name: "Pfizer", logo: "https://cdn.simpleicons.org/pfizer/73777C" },
  { name: "Sanofi", logo: "https://cdn.simpleicons.org/sanofi/73777C" },
  { name: "Novartis", logo: "https://cdn.simpleicons.org/novartis/73777C" },
  { name: "Bayer", logo: "https://cdn.simpleicons.org/bayer/73777C" },
  { name: "Abbott", logo: "https://cdn.simpleicons.org/abbott/73777C" },
  { name: "AstraZeneca", logo: "https://cdn.simpleicons.org/astrazeneca/73777C" },
];

export function LogoCarousel() {
  const marquee = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!track.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        track.current,
        { xPercent: 0 },
        {
          xPercent: -50,
          duration: 24,
          ease: "none",
          repeat: -1,
        },
      );
    }, marquee);

    return () => context.revert();
  }, []);

  return (
    <section className="overflow-hidden bg-white py-12 sm:py-14" aria-labelledby="partners-heading">
      <div className="bluecrest-container">
        <p id="partners-heading" className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b8d91]">
          Trusted healthcare ecosystem
        </p>
      </div>

      <div
        ref={marquee}
        className="logo-marquee relative mt-9 flex overflow-hidden"
        role="region"
        aria-label="Healthcare partners"
      >
        <div ref={track} className="flex w-max shrink-0 items-center will-change-transform">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {partners.map((partner) => (
                <div
                  key={`${copy}-${partner.name}`}
                  className="flex w-[180px] shrink-0 items-center justify-center px-8 sm:w-[220px] sm:px-10"
                >
                  <img
                    src={partner.logo}
                    alt={copy === 0 ? partner.name : ""}
                    className="h-8 max-w-[130px] object-contain opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 sm:h-9 sm:max-w-[150px]"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
