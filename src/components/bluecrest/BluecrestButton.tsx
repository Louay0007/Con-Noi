import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BluecrestButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  showArrow?: boolean;
};

export const BluecrestButton = React.forwardRef<HTMLButtonElement, BluecrestButtonProps>(
  ({ className, children, size = "md", showArrow = false, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "bluecrest-focus inline-flex items-center justify-center gap-2 rounded-[4px] bg-signal-blue font-medium text-white transition-[box-shadow,background-color,transform] duration-200 hover:bg-[#3378ea] hover:shadow-subtle active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "px-5 py-2.5 text-base" : "px-3.5 py-2 text-xs",
        className,
      )}
      {...props}
    >
      {children}
      {showArrow && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
    </button>
  ),
);
BluecrestButton.displayName = "BluecrestButton";
