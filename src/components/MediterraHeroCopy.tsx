import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { MediterraLogo } from "./MediterraLogo";

const headline = "Care connected across borders".split(" ");
const description = "Connecting Tunisia’s care teams with trusted specialist expertise, coordinated action, and continuous human support.".split(" ");

export function MediterraHeroCopy() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        gsap.set("[data-hero-reveal]", { opacity: 1, y: 0 });
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo("[data-hero-mark]", { opacity: 0, y: 10, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 })
        .fromTo(
          "[data-hero-word]",
          { opacity: 0, yPercent: 115, rotateX: -18 },
          { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.82, stagger: 0.1 },
          "-=0.35",
        )
        .fromTo(
          "[data-hero-description-word]",
          { opacity: 0, yPercent: 90 },
          { opacity: 1, yPercent: 0, duration: 0.5, stagger: 0.035 },
          "-=0.22",
        );
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="bluecrest-container relative z-10 flex justify-center pt-[17vh] text-center sm:pt-[16vh]">
      <div className="max-w-[680px]">
        <div data-hero-mark data-hero-reveal className="mb-5 flex justify-center opacity-0">
          <div className="inline-flex rounded-full border border-white/35 bg-white/[0.18] px-3.5 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_35px_rgba(20,63,105,0.1)] backdrop-blur-xl">
            <MediterraLogo />
          </div>
        </div>
        <h1 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#f9fcff] [text-shadow:0_2px_24px_rgba(9,47,88,0.28)] sm:text-[48px] lg:text-[56px]">
          {headline.map((word, index) => (
            <span key={`${word}-${index}`} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-top last:mr-0">
              <span data-hero-word data-hero-reveal className="inline-block opacity-0 [transform-origin:50%_100%]">{word}</span>
            </span>
          ))}
        </h1>
        <p className="mx-auto mt-4 max-w-[570px] text-[15px] font-medium leading-[1.5] tracking-[-0.018em] text-white/[0.82] [text-shadow:0_1px_14px_rgba(7,41,80,0.3)] sm:text-[17px]">
          {description.map((word, index) => (
            <span key={`${word}-${index}`} className="mr-[0.24em] inline-block overflow-hidden align-top last:mr-0">
              <span data-hero-description-word data-hero-reveal className="inline-block opacity-0">
                {word}
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
