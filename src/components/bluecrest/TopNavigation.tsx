import { Menu } from "lucide-react";
import { BluecrestButton } from "./BluecrestButton";

export function TopNavigation() {
  return (
    <nav className="absolute inset-x-0 top-4 z-20 text-white" aria-label="Main navigation">
      <div className="bluecrest-container liquid-glass-dark flex h-[64px] items-center justify-between rounded-full px-4 sm:px-5">
        <a href="#top" className="bluecrest-focus rounded-full px-2 text-[19px] font-semibold tracking-[-0.035em]">Bluecrest</a>
        <div className="hidden items-center gap-1 rounded-full bg-black/10 p-1 text-[13px] font-medium md:flex">
          <a className="rounded-full px-4 py-2 transition hover:bg-white/15" href="#foundations">Foundations</a>
          <a className="rounded-full px-4 py-2 transition hover:bg-white/15" href="#components">Components</a>
          <a className="rounded-full px-4 py-2 transition hover:bg-white/15" href="#patterns">Patterns</a>
        </div>
        <BluecrestButton size="sm" className="hidden bg-white text-signal-blue shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_8px_20px_rgba(0,30,90,.15)] hover:bg-white sm:inline-flex" onClick={() => document.querySelector("#components")?.scrollIntoView({ behavior: "smooth" })}>Get started</BluecrestButton>
        <a className="bluecrest-focus rounded-full bg-white/15 p-2.5 sm:hidden" aria-label="Jump to components" href="#components"><Menu className="h-5 w-5" /></a>
      </div>
    </nav>
  );
}
