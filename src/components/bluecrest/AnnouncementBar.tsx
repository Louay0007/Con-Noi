import { ArrowUpRight } from "lucide-react";

export function AnnouncementBar() {
  return (
    <aside className="border-b border-bone bg-vapor px-5 py-2.5 text-carbon">
      <div className="mx-auto flex max-w-page items-center justify-center gap-3 text-center text-sm">
        <span>Bluecrest UI is ready for your next product.</span>
        <a href="#components" className="bluecrest-focus inline-flex items-center gap-1 rounded-full bg-signal-blue px-3 py-1 text-xs font-medium text-white">
          Explore <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}
