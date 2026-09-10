import { cn } from "@/lib/utils";

type MediterraLogoProps = {
  className?: string;
  compact?: boolean;
};

export function MediterraLogo({ className, compact = false }: MediterraLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border border-current/20 bg-current/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      >
        <span className="font-sans text-[16px] font-semibold leading-none tracking-[-0.08em]">M</span>
        <span className="absolute right-[4px] top-[4px] h-1.5 w-1.5 rounded-full bg-[#64d2ff] shadow-[0_0_7px_rgba(100,210,255,0.9)]" />
      </span>
      {!compact && <span className="text-[18px] font-semibold tracking-[-0.045em]">Mediterra</span>}
    </span>
  );
}
