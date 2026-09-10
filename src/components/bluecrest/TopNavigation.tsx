import { Menu } from "lucide-react";
import { BluecrestButton } from "./BluecrestButton";

export function TopNavigation() {
  return (
    <nav className="absolute inset-x-0 top-0 z-20 border-b border-white/15 text-white" aria-label="Main navigation">
      <div className="bluecrest-container flex h-[72px] items-center justify-between">
        <a href="#top" className="bluecrest-focus rounded text-xl font-semibold tracking-[-0.02em]">Bluecrest</a>
        <div className="hidden items-center gap-7 text-sm font-normal md:flex">
          <a className="transition-opacity hover:opacity-70" href="#foundations">Foundations</a>
          <a className="transition-opacity hover:opacity-70" href="#components">Components</a>
          <a className="transition-opacity hover:opacity-70" href="#patterns">Patterns</a>
        </div>
        <BluecrestButton size="sm" className="hidden sm:inline-flex" onClick={() => document.querySelector("#components")?.scrollIntoView({ behavior: "smooth" })}>Get started</BluecrestButton>
        <a className="bluecrest-focus rounded-[4px] p-2 sm:hidden" aria-label="Jump to components" href="#components"><Menu className="h-5 w-5" /></a>
      </div>
    </nav>
  );
}
