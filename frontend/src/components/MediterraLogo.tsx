import { cn } from "@/lib/utils";

type MediterraLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
};

export function MediterraLogo({ className, compact = false, variant = "light" }: MediterraLogoProps) {
  const logoSrc = variant === "dark"
    ? "/images/brand/mediterra-living-bridge-dark.png"
    : "/images/brand/mediterra-living-bridge-light.png";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={logoSrc}
        width={2048}
        height={2048}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 shrink-0 object-contain"
      />
      {!compact && <span className="text-[18px] font-semibold tracking-[-0.045em]">Mediterra</span>}
    </span>
  );
}
