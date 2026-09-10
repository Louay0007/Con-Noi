import * as React from "react";
import { cn } from "@/lib/utils";

type FeatureCardProps = React.HTMLAttributes<HTMLElement> & {
  variant?: "white" | "frost";
  eyebrow?: string;
  title: string;
  description: string;
};

export function FeatureCard({ className, variant = "white", eyebrow, title, description, children, ...props }: FeatureCardProps) {
  return (
    <article
      className={cn(
        "rounded-feature p-6",
        variant === "frost" ? "bg-frost" : "border border-bone bg-white",
        className,
      )}
      {...props}
    >
      {eyebrow && <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-fog">{eyebrow}</p>}
      <h3 className="text-xl font-medium leading-[1.38] tracking-[-0.018em] text-carbon">{title}</h3>
      <p className="mt-2 text-base leading-6 tracking-[-0.01em] text-steel">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </article>
  );
}
