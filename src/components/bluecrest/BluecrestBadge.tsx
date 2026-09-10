import * as React from "react";
import { cn } from "@/lib/utils";

type BluecrestBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "active" | "blue";
};

export function BluecrestBadge({ className, tone = "neutral", ...props }: BluecrestBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-carbon",
        tone === "neutral" && "bg-vapor",
        tone === "active" && "border border-neon bg-white",
        tone === "blue" && "bg-signal-blue/10 text-[#145fcf]",
        className,
      )}
      {...props}
    />
  );
}
