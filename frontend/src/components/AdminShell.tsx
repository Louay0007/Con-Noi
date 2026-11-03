import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  FileText,
  Megaphone,
  ScrollText,
  Users,
} from "lucide-react";

const LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/admin/posts", label: "Annunci", icon: Briefcase },
  { to: "/admin/applications", label: "Candidature", icon: FileText },
  { to: "/admin/users", label: "Utenti", icon: Users },
  { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { to: "/admin/audit", label: "Audit", icon: ScrollText },
] as const;

type AdminShellProps = {
  title: string;
  description?: string;
  /** Page-level primary action, rendered on the right of the title row. */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared chrome for every admin screen.
 *
 * Previously each admin page rendered its own header with no navigation, so
 * the sections were islands: from "Utenti" there was no way to reach "Annunci"
 * without editing the URL. The tab bar also carries the responsive behaviour in
 * one place instead of five.
 */
export default function AdminShell({ title, description, actions, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header aria-label="Intestazione amministrazione" className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#1A1A1A] sm:text-xl">{title}</h1>
              {description && <p className="mt-1 text-sm text-[#4B5563]">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>

          {/* Horizontal scroll on narrow screens beats wrapping into two rows
              and pushing the table below the fold. */}
          <nav
            aria-label="Sezioni amministrazione"
            tabIndex={0}
            className="-mx-4 mt-4 overflow-x-auto px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81] sm:mx-0 sm:px-0"
          >
            <ul className="flex min-w-full items-stretch gap-1">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <li key={to} className="shrink-0">
                  <NavLink
                    to={to}
                    end={to === "/admin/posts"}
                    className={({ isActive }) =>
                      `inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-t-md border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81] ${
                        isActive
                          ? "border-[#0F4C81] text-[#0F4C81]"
                          : "border-transparent text-[#4B5563] hover:border-[#E5E7EB] hover:text-[#1A1A1A]"
                      }`
                    }
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
        {children}
        <p className="pb-3">
          <Link
            to="/for-you"
            className="text-sm text-[#4B5563] underline underline-offset-2 transition-colors hover:text-[#0F4C81]"
          >
            Torna all'app lavoratore
          </Link>
        </p>
      </main>
    </div>
  );
}
