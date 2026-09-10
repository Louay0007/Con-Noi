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
  return (
    <section className="overflow-hidden bg-[#f2f2f0] py-12 sm:py-14" aria-labelledby="partners-heading">
      <div className="bluecrest-container">
        <p id="partners-heading" className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b8d91]">
          Trusted healthcare ecosystem
        </p>
      </div>

      <div
        className="logo-marquee relative mt-9 flex overflow-hidden"
        role="region"
        aria-label="Healthcare partners"
      >
        <div className="logo-marquee-track flex w-max shrink-0 items-center">
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex w-[180px] shrink-0 items-center justify-center px-8 sm:w-[220px] sm:px-10"
              aria-hidden={index >= partners.length}
            >
              <img
                src={partner.logo}
                alt={index < partners.length ? partner.name : ""}
                className="h-8 max-w-[130px] object-contain opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 sm:h-9 sm:max-w-[150px]"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
