import { useRef, useState, type SyntheticEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./MediterraCareRelay.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const chapters = [
  { title: "Need detected", body: "A clinical question, operational risk, or patient concern enters the system." },
  { title: "Context prepared", body: "Relevant information is structured, translated, checked, and prepared for review." },
  { title: "Expertise connected", body: "The request reaches the right verified specialist or responsible care team." },
  { title: "Action completed", body: "Advice, follow-up, or an operational intervention is assigned and recorded." },
  { title: "Outcome recorded", body: "The team confirms what happened, whether it helped, and what comes next." },
];

const assets = {
  landscape: { src: "/images/care-relay/mediterranean-landscape.png", file: "mediterranean-landscape.png", width: 1600, height: 1200 },
  clinic: { src: "/images/care-relay/local-clinic.png", file: "local-clinic.png", width: 768, height: 768 },
  documents: { src: "/images/care-relay/case-documents.png", file: "case-documents.png", width: 1024, height: 768 },
  specialist: { src: "/images/care-relay/specialist-node.png", file: "specialist-node.png", width: 768, height: 768 },
  outcome: { src: "/images/care-relay/outcome-loop.png", file: "outcome-loop.png", width: 768, height: 768 },
};

type AssetKey = keyof typeof assets;

function RelayAsset({ name, className, eager = false }: { name: AssetKey; className: string; eager?: boolean }) {
  const asset = assets[name];
  const [missing, setMissing] = useState(false);
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = "none";
    setMissing(true);
  };

  return (
    <div className={`${styles.asset} ${className}`} data-layer={name} aria-hidden="true">
      {!missing && (
        <img
          src={asset.src}
          width={asset.width}
          height={asset.height}
          alt=""
          loading={eager ? "eager" : "lazy"}
          onError={handleError}
        />
      )}
      {missing && (
        <div className={styles.fallback}>
          <strong>{asset.file}</strong>
          <span>{asset.width} × {asset.height}px</span>
        </div>
      )}
    </div>
  );
}

function RelayVisual({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`${styles.visual} ${mobile ? styles.mobileVisual : styles.desktopVisual}`} role="img" aria-label="A healthcare request is prepared, connected to specialist expertise, returned as an action, and followed through to an outcome.">
      <RelayAsset name="landscape" className={styles.landscape} eager />
      <svg className={styles.route} viewBox="0 0 1600 1200" aria-hidden="true">
        <path className={styles.routeBase} pathLength="1" d="M210 930 C360 795 445 760 590 700 C790 615 840 310 1190 270 C1370 250 1360 510 1165 650 C1005 765 980 930 1100 1010" />
        <path data-route className={styles.routeActive} pathLength="1" d="M210 930 C360 795 445 760 590 700 C790 615 840 310 1190 270 C1370 250 1360 510 1165 650 C1005 765 980 930 1100 1010" />
        <circle data-signal-dot className={styles.signalDot} cx="210" cy="930" r="11" />
      </svg>
      <RelayAsset name="clinic" className={styles.clinic} />
      <RelayAsset name="documents" className={styles.documents} />
      <div className={`${styles.asset} ${styles.specialist}`} data-layer="specialist" aria-hidden="true">
        <span data-halo className={styles.halo} />
        <RelayAsset name="specialist" className="!inset-0 !h-full !w-full" />
      </div>
      <RelayAsset name="outcome" className={styles.outcome} />
      <svg data-confirmation className={styles.confirmation} viewBox="0 0 34 34" aria-hidden="true">
        <circle cx="17" cy="17" r="15" />
        <path d="m10.5 17 4.2 4.2 8.8-9" />
      </svg>
    </div>
  );
}

export function MediterraCareRelay() {
  const container = useRef<HTMLElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);

  useGSAP(() => {
    const root = container.current;
    if (!root || window.matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)").matches) return;

    const stage = root.querySelector<HTMLElement>("[data-pinned-stage]");
    const chapterEls = gsap.utils.toArray<HTMLElement>("[data-chapter]", root);
    const route = root.querySelector<SVGPathElement>("[data-route]");
    const dot = root.querySelector<SVGCircleElement>("[data-signal-dot]");
    const clinic = root.querySelector<HTMLElement>('[data-layer="clinic"]');
    const documents = root.querySelector<HTMLElement>('[data-layer="documents"]');
    const specialist = root.querySelector<HTMLElement>('[data-layer="specialist"]');
    const outcome = root.querySelector<HTMLElement>('[data-layer="outcome"]');
    const landscape = root.querySelector<HTMLElement>('[data-layer="landscape"]');
    const halo = root.querySelector<HTMLElement>("[data-halo]");
    const confirmation = root.querySelector<SVGElement>("[data-confirmation]");
    const rail = root.querySelector<HTMLElement>("[data-rail-active]");
    const cta = root.querySelector<HTMLElement>("[data-relay-cta]");
    if (!stage || !route || !dot || !clinic || !documents || !specialist || !outcome || !landscape || !halo || !confirmation || !rail || !cta) return;

    const pathLength = route.getTotalLength();
    gsap.set(route, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.set(dot, { opacity: 0 });

    const pointOnPath = (progress: number) => {
      const point = route.getPointAtLength(pathLength * progress);
      return { attr: { cx: point.x, cy: point.y } };
    };
    const activate = (index: number) => {
      setActiveChapter(index);
      chapterEls.forEach((chapter, chapterIndex) => chapter.setAttribute("aria-current", chapterIndex === index ? "step" : "false"));
    };
    const showChapter = (index: number, position: number) => {
      chapterEls.forEach((chapter, chapterIndex) => {
        if (chapterIndex !== index) gsap.to(chapter, { opacity: .4, y: chapterIndex < index ? -18 : 18, color: "#777a88", duration: .22, overwrite: true });
      });
      timeline.to(chapterEls[index], { opacity: 1, y: 0, color: "#18181b", duration: .35 }, position);
      timeline.call(() => activate(index), [], position);
    };

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "+=400%",
        pin: stage,
        scrub: .8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(clinic, { opacity: 1, scale: 1, duration: .55 }, 0)
      .to(clinic, { scale: 1.035, duration: .16, yoyo: true, repeat: 1 }, .42);
    showChapter(0, 0);
    timeline
      .to(documents, { opacity: 1, y: 0, scale: 1, duration: .7 }, 1)
      .to(route, { strokeDashoffset: pathLength * .72, duration: .7, ease: "none" }, 1)
      .to(rail, { scaleY: .25, duration: .7 }, 1);
    showChapter(1, 1);
    timeline
      .to(route, { strokeDashoffset: pathLength * .4, duration: .8, ease: "none" }, 2)
      .to(dot, { opacity: 1, duration: .1 }, 2)
      .to(dot, { ...pointOnPath(.62), duration: .8, ease: "none" }, 2)
      .to(specialist, { opacity: 1, scale: 1, duration: .65 }, 2)
      .to(halo, { opacity: 1, scale: 1, duration: .55 }, 2.1)
      .to(landscape, { yPercent: -8, duration: 1, ease: "none" }, 2)
      .to(rail, { scaleY: .5, duration: .7 }, 2);
    showChapter(2, 2);
    timeline
      .to(route, { strokeDashoffset: pathLength * .16, duration: .8, ease: "none" }, 3)
      .to(dot, { ...pointOnPath(.84), duration: .8, ease: "none" }, 3)
      .to(documents, { scale: 1.025, duration: .18, yoyo: true, repeat: 1 }, 3.2)
      .to(confirmation, { opacity: 1, scale: 1, duration: .4 }, 3.35)
      .to(rail, { scaleY: .75, duration: .7 }, 3);
    showChapter(3, 3);
    timeline
      .to(outcome, { opacity: 1, scale: 1, duration: .7 }, 4)
      .to(route, { strokeDashoffset: 0, duration: .7, ease: "none" }, 4)
      .to(dot, { ...pointOnPath(1), duration: .7, ease: "none" }, 4)
      .to(stage, { filter: "contrast(1.03) saturate(1.03)", duration: .6 }, 4)
      .to(rail, { scaleY: 1, duration: .7 }, 4)
      .to(cta, { opacity: 1, y: 0, duration: .5 }, 4.25);
    showChapter(4, 4);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    root.querySelectorAll("img").forEach((image) => {
      if (!image.complete) image.addEventListener("load", refresh, { once: true });
    });

    return () => {
      root.querySelectorAll("img").forEach((image) => image.removeEventListener("load", refresh));
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { scope: container });

  return (
    <section ref={container} className={styles.section} aria-labelledby="care-relay-heading">
      <div data-pinned-stage className={styles.pinnedStage}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div>
              <p className={styles.eyebrow}>From signal to action</p>
              <h2 id="care-relay-heading" className={styles.heading}>Care moves when the right person sees the right signal.</h2>
              <p className={styles.intro}>Mediterra transforms fragmented clinical needs into clear, accountable actions—connecting local teams, trusted expertise, and continuous follow-up.</p>

              <div className={styles.storyArea}>
                <div className={styles.rail} aria-label={`Step ${activeChapter + 1} of ${chapters.length}`}>
                  <span className={styles.railBase} />
                  <span data-rail-active className={styles.railActive} />
                  {chapters.map((_, index) => (
                    <span key={index} className={`${styles.marker} ${index === activeChapter ? styles.markerCurrent : ""}`} style={{ top: `${(index / 4) * 100}%` }} aria-hidden="true">0{index + 1}</span>
                  ))}
                </div>
                <div className={styles.chapterStack}>
                  {chapters.map((chapter, index) => (
                    <article key={chapter.title} data-chapter className={styles.chapter} aria-current={index === activeChapter ? "step" : "false"}>
                      <span className={styles.chapterNumber}>0{index + 1}</span>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.body}</p>
                      {index === chapters.length - 1 && <a data-relay-cta className={styles.cta} href="#future-content">Explore Mediterra Bridge</a>}
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <RelayVisual />
          </div>

          <div className={styles.mobileStories}>
            {chapters.map((chapter, index) => (
              <article key={chapter.title} className={styles.mobileChapter}>
                <div className={styles.mobileCopy}>
                  <span className={styles.chapterNumber}>0{index + 1}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                </div>
                <RelayVisual mobile />
                {index === chapters.length - 1 && <a className={`${styles.cta} ${styles.mobileCta}`} href="#future-content">Explore Mediterra Bridge</a>}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
