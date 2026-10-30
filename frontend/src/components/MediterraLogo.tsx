import { cn } from "@/lib/utils";

type MediterraLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
};

export function MediterraLogo({ className, compact = false, variant = "light" }: MediterraLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", variant === "dark" && "text-white", className)}>
      {!compact && (
        <span className="text-[26px] font-semibold tracking-normal sm:text-[30px]">
          Con noi
        </span>
      )}
      {compact && (
        <span className="text-lg font-semibold tracking-normal">
          Con noi
        </span>
      )}
    </span>
  );
}