import { useEffect, useRef, useState } from "react";
import { BellRing, Check, ClipboardCheck, FileText, Stethoscope, type LucideIcon } from "lucide-react";

interface WorkflowStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: WorkflowStep[] = [
  {
    title: "Need detected",
    description: "A clinician request, shortage risk, or patient concern appears.",
    icon: BellRing,
  },
  {
    title: "Context prepared",
    description: "Relevant records are structured, translated, and verified.",
    icon: FileText,
  },
  {
    title: "Right person notified",
    description: "The appropriate specialist or care team receives the task.",
    icon: Stethoscope,
  },
  {
    title: "Action completed",
    description: "Advice, follow-up, or operational intervention is recorded.",
    icon: Check,
  },
  {
    title: "Outcome measured",
    description: "The team confirms what happened and whether it helped.",
    icon: ClipboardCheck,
  },
];

export function WorkflowSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1900);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  const progress = `${(activeStep / (steps.length - 1)) * 100}%`;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="workflow-heading"
      className="relative overflow-hidden bg-white py-24 font-sans sm:py-28 lg:py-32"
    >
      <div className="bluecrest-container relative">
        <div className="mx-auto max-w-[810px] text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0a84ff]">
            How Mediterra works
          </p>
          <h2
            id="workflow-heading"
            className="mt-5 text-[38px] font-semibold leading-[1.06] tracking-[-0.045em] text-[#18181b] sm:text-[44px] lg:text-[48px]"
          >
            Care moves forward when every signal has an owner.
          </h2>
          <p className="mx-auto mt-5 max-w-[680px] text-[16px] leading-[1.65] tracking-[-0.015em] text-[#62646a] sm:text-[17px]">
            Mediterra turns clinical needs, operational risks, and patient signals into clear, accountable actions.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1160px] lg:mt-20">
          <div className="absolute bottom-[48px] left-[31px] top-[48px] w-px bg-[#dce9f8] md:hidden">
            <div
              className="w-full bg-[#0a84ff] transition-[height] duration-700 ease-out"
              style={{ height: progress }}
            />
          </div>

          <div className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-[#dce9f8] md:block">
            <div
              className="h-full bg-[#0a84ff] transition-[width] duration-700 ease-out"
              style={{ width: progress }}
            />
          </div>

          <ol className="relative grid gap-4 md:grid-cols-5 md:gap-3 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isComplete = index < activeStep;

              return (
                <li key={step.title} className="relative pl-[78px] md:pl-0 md:pt-14">
                  <div
                    className={`absolute left-2 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-500 md:left-1/2 md:top-0 md:-translate-x-1/2 ${
                      isActive
                        ? "border-[#0a84ff] bg-[#0a84ff] text-white"
                        : isComplete
                          ? "border-[#a9d3ff] bg-[#eaf4ff] text-[#0a84ff]"
                          : "border-[#dfe4ea] bg-white text-[#74777d]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>

                  <article
                    className={`min-h-[164px] rounded-[20px] border p-5 transition-colors duration-500 md:min-h-[238px] md:px-4 md:py-6 lg:min-h-[220px] lg:p-6 ${
                      isActive ? "border-[#b9d9fb] bg-[#edf6ff]" : "border-[#e4e4e7] bg-white"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-[11px] font-semibold tracking-[0.12em] ${isActive ? "text-[#0a84ff]" : "text-[#a0a2a7]"}`}>
                        0{index + 1}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-[#0a84ff]" : "bg-[#d4d4d8]"}`}
                      />
                    </div>
                    <h3 className="mt-5 text-[18px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#27272a]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.55] tracking-[-0.01em] text-[#6b6d72]">
                      {step.description}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
