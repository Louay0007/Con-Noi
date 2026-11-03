import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export interface MinimalistHeroProps {
  logo: ReactNode;
  mainText: string;
  readMoreLabel: string;
  readMoreLink: string;
  onCtaClick?: () => void;
  /**
   * Path prefix for the responsive hero variants, without size or extension:
   * a value of "/images/hero/hero" resolves to e.g. "/images/hero/hero-960.avif".
   */
  imageBasePath: string;
  imageAlt: string;
  overlayText: {
    part1: string;
    part2: string;
  };
  footerLinks: { label: string; icon: LucideIcon; href: string }[];
  locationText: string;
  className?: string;
}

export function MinimalistHero({
  logo,
  mainText,
  readMoreLabel,
  readMoreLink,
  onCtaClick,
  imageBasePath,
  imageAlt,
  overlayText,
  footerLinks,
  locationText,
  className,
}: MinimalistHeroProps) {
  const hero = useRef<HTMLElement>(null);
  const heroCircle = useRef<HTMLDivElement>(null);
  const heroImage = useRef<HTMLImageElement>(null);
  const heroImageFade = useRef<HTMLDivElement>(null);
  const heroCopy = useRef<HTMLDivElement>(null);
  // Entry animations are CSS keyframes (see `.hero-enter*` in globals.css) so the
  // landing route no longer ships a motion runtime. The delay is applied by the
  // per-element animation-delay classes below.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useGSAP(() => {
    const circle = heroCircle.current;
    const image = heroImage.current;
    const imageFade = heroImageFade.current;
    const copy = heroCopy.current;
    const headlineLines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", hero.current);
    if (!circle || !image || !imageFade || !copy || headlineLines.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const travelDistance = Math.max(360, Math.min(window.innerHeight * 0.72, 680));
    const animatedElements = [circle, image, imageFade, copy, ...headlineLines];
    const timeline = gsap.timeline({ delay: 0.24 });

    timeline
      .set(animatedElements, { willChange: "transform, opacity" })
      .fromTo(
        circle,
        { autoAlpha: 0, scale: 0.14, y: 46 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 1.35,
          ease: "expo.out",
          transformOrigin: "50% 50%",
        },
      )
      .fromTo(
        image,
        {
          autoAlpha: 0,
          y: travelDistance,
          scale: 0.88,
          rotate: 1.2,
          transformOrigin: "50% 100%",
        },
        {
          autoAlpha: 1,
          y: -18,
          scale: 1.012,
          rotate: -0.2,
          duration: 1.35,
          ease: "power3.out",
        },
        ">+=0.1",
      )
      .to(image, {
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.35,
        ease: "power2.out",
      })
      .fromTo(
        imageFade,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" },
        "-=0.18",
      )
      // Slide only, no autoAlpha: each line sits inside an overflow-hidden mask, so
      // yPercent alone already reveals it. autoAlpha would set visibility:hidden,
      // which drops the text out of the accessibility tree (and makes the <h1> an
      // empty heading) for the whole first second of the timeline.
      .fromTo(
        headlineLines,
        { yPercent: 125, rotate: 5 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          stagger: 0.18,
          ease: "power4.out",
          transformOrigin: "0% 100%",
        },
        ">+=0.08",
      )
      .fromTo(
        copy,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.82, ease: "power3.out" },
        "-=0.4",
      )
      .set(animatedElements, { clearProps: "transform,willChange" });

    return () => timeline.kill();
  }, { scope: hero });

  return (
    <section
      ref={hero}
      className={cn(
        "relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-white px-5 pb-6 pt-5 text-carbon sm:min-h-[760px] sm:px-8 sm:pb-8 sm:pt-7 md:h-[100svh] md:min-h-[720px] md:px-12 md:pb-9 md:pt-9",
        className,
      )}
      aria-labelledby="mediterra-hero-heading"
    >
      <header className="relative z-40 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
        <a
          href="#top"
          className={`hero-enter ${reduceMotion ? "" : "hero-enter--left"} bluecrest-focus rounded-md text-[20px] font-bold tracking-[-0.045em] text-carbon sm:text-[22px]`}
          aria-label="Con noi, torna alla home"
        >
          {logo}
        </a>

        <div className="flex items-center gap-3">
          {onCtaClick ? (
            <button
              type="button"
              onClick={onCtaClick}
              className={`hero-enter ${reduceMotion ? "" : "hero-enter--right"} bluecrest-focus inline-flex min-h-11 items-center justify-center rounded-full bg-[#0F4C81] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#0a2d5c]`}
            >
              {readMoreLabel}
            </button>
          ) : (
            <a
              href={readMoreLink}
              className={`hero-enter ${reduceMotion ? "" : "hero-enter--right"} bluecrest-focus inline-flex min-h-11 items-center justify-center rounded-full bg-[#0F4C81] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#0a2d5c]`}
            >
              {readMoreLabel}
            </a>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-center py-5 sm:py-7 md:grid-cols-[0.8fr_1.18fr_1fr] md:gap-3 md:py-0 lg:grid-cols-[0.78fr_1.15fr_1.07fr]">
        <div
          ref={heroCopy}
          data-hero-copy
          className="invisible order-3 z-20 mx-auto max-w-[350px] text-center opacity-0 md:order-1 md:mx-0 md:max-w-[300px] md:text-left"
        >
          <p className="text-[16px] leading-[1.65] tracking-[-0.012em] text-carbon/68 md:text-[14px] lg:text-[15px]">
            {mainText}
          </p>
          {onCtaClick ? (
            <button
              type="button"
              onClick={onCtaClick}
              className="bluecrest-focus mt-4 inline-block rounded-sm border-b border-carbon pb-0.5 text-[13px] font-semibold tracking-[-0.01em] text-carbon transition-colors hover:border-signal-blue hover:text-signal-blue"
            >
              {readMoreLabel}
            </button>
          ) : (
            <a
              href={readMoreLink}
              className="bluecrest-focus mt-4 inline-block rounded-sm border-b border-carbon pb-0.5 text-[13px] font-semibold tracking-[-0.01em] text-carbon transition-colors hover:border-signal-blue hover:text-signal-blue"
            >
              {readMoreLabel}
            </a>
          )}
        </div>

        <div className="relative order-1 flex h-[340px] items-center justify-center sm:h-[420px] md:order-2 md:h-full">
          <div
            ref={heroCircle}
            data-hero-circle
            className="invisible absolute z-0 h-[285px] w-[285px] rounded-full bg-signal-blue opacity-0 sm:h-[370px] sm:w-[370px] md:h-[min(37vw,530px)] md:w-[min(37vw,530px)]"
            aria-hidden="true"
          />
          {/* The hero is a transparent cutout, so AVIF/WebP keep the alpha while
              cutting the payload from 5.2MB to ~88KB at the size actually used.
              `fetchPriority` stays high because this is the LCP element. */}
          <picture>
            <source
              type="image/avif"
              srcSet={`${imageBasePath}-640.avif 640w, ${imageBasePath}-960.avif 960w, ${imageBasePath}-1280.avif 1280w`}
              sizes="(max-width: 640px) 390px, (max-width: 1024px) 490px, min(78vh, 830px)"
            />
            <source
              type="image/webp"
              srcSet={`${imageBasePath}-640.webp 640w, ${imageBasePath}-960.webp 960w, ${imageBasePath}-1280.webp 1280w`}
              sizes="(max-width: 640px) 390px, (max-width: 1024px) 490px, min(78vh, 830px)"
            />
            <img
              ref={heroImage}
              src={`${imageBasePath}-960.png`}
              alt={imageAlt}
              width={640}
              height={960}
              fetchPriority="high"
              decoding="async"
              className="invisible relative z-10 h-[390px] w-auto max-w-none object-contain opacity-0 max-md:[mask-image:linear-gradient(to_bottom,#000_65%,transparent_90%)] sm:h-[490px] md:h-[min(78vh,830px)]"
            />
          </picture>
          <div
            ref={heroImageFade}
            data-hero-image-fade
            className="pointer-events-none invisible absolute inset-x-[-12%] bottom-0 z-20 h-[34%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_35%,rgba(255,255,255,0.96)_62%,#fff_84%,#fff_100%)] opacity-0 sm:h-[32%] md:h-[29%]"
            aria-hidden="true"
          />
        </div>

        <div className="order-2 z-20 -mt-7 mb-6 text-center sm:-mt-10 md:order-3 md:m-0 md:text-left">
          <h1
            id="mediterra-hero-heading"
            className="text-balance text-[54px] font-extrabold leading-[0.84] tracking-[-0.075em] text-carbon sm:text-[70px] md:text-[clamp(68px,7.1vw,116px)]"
          >
            {/* The copy is visible by default and GSAP only layers the entrance on
                top. It used to start at `invisible opacity-0` and rely entirely on
                the timeline, so the <h1> was empty for assistive tech and stayed
                blank if the animation never ran. */}
            <span className="-my-[0.08em] block overflow-hidden py-[0.08em]">
              <span data-hero-line className="block">{overlayText.part1}</span>
            </span>
            <span className="-my-[0.08em] block overflow-hidden py-[0.08em]">
              <span data-hero-line className="block">{overlayText.part2}</span>
            </span>
          </h1>
        </div>
      </div>

      <footer className="relative z-30 mx-auto flex w-full max-w-[1440px] items-end justify-between gap-5">
        <nav className="flex items-center gap-1" aria-label="Footer links">
          {footerLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              className={`hero-enter ${reduceMotion ? "" : "hero-enter--up hero-enter--delay-1"} bluecrest-focus inline-flex h-11 w-11 items-center justify-center rounded-full text-carbon/60 transition-colors hover:bg-frost hover:text-signal-blue`}
              aria-label={label}
              title={label}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </a>
          ))}
        </nav>
        <p
          className={`hero-enter ${reduceMotion ? "" : "hero-enter--up hero-enter--delay-2"} pb-2 text-right text-[12px] font-semibold tracking-[0.04em] text-carbon/60 sm:text-[13px]`}
        >
          {locationText}
        </p>
      </footer>
    </section>
  );
}
