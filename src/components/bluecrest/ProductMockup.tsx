import { ArrowUp, Check, Mic, MoreHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductMockupProps = {
  className?: string;
  compact?: boolean;
};

export function ProductMockup({ className, compact = false }: ProductMockupProps) {
  return (
    <div className={cn("overflow-hidden rounded-mockup border border-white/10 bg-[#151619] text-white shadow-frame", className)}>
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-signal-blue" /></div>
        <span className="font-mono text-[10px] text-white/40">workspace / live</span>
        <MoreHorizontal className="h-4 w-4 text-white/40" />
      </div>
      <div className={cn("grid", compact ? "gap-3 p-4" : "gap-4 p-4 sm:grid-cols-[1.35fr_0.65fr] sm:p-6")}>
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-[11px] text-white/40">Live workspace</p><h4 className="mt-1 text-sm font-medium">Product strategy sync</h4></div>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />Active</span>
          </div>
          <div className="space-y-3">
            {["Align launch timeline with the product team", "Review the highest-impact customer requests", "Confirm ownership for the next release"].map((text, index) => (
              <div key={text} className="flex items-start gap-3 rounded-lg bg-black/20 p-3">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", index === 0 ? "bg-signal-blue" : "border border-white/15")}>
                  {index === 0 && <Check className="h-3 w-3" />}
                </span>
                <span className="text-xs leading-5 text-white/70">{text}</span>
              </div>
            ))}
          </div>
        </section>
        {!compact && (
          <section className="flex min-h-52 flex-col rounded-xl border border-white/10 bg-[#1d1e22] p-4">
            <div className="flex items-center gap-2 text-xs font-medium"><Sparkles className="h-3.5 w-3.5 text-hover-glow" />Assistant</div>
            <p className="mt-4 text-xs leading-5 text-white/50">Your conversation highlights and next-step suggestions will appear here.</p>
            <div className="mt-auto rounded-lg border border-white/10 bg-black/20 p-2.5 shadow-inset">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-white/30" />
                <span className="flex-1 text-xs text-white/30">Ask a question...</span>
                <button aria-label="Send question" className="bluecrest-focus flex h-7 w-7 items-center justify-center rounded-full bg-signal-blue"><ArrowUp className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
