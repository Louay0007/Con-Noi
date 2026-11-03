import { NavLink, Outlet } from "react-router-dom";
import { Heart, Briefcase, MessageSquare, User, Search } from "lucide-react";
import { NotificationBell } from "./NotificationsPanel";

const NAV_ITEMS = [
  { to: "/for-you", label: "Per te", icon: Heart },
  { to: "/browse", label: "Cerca", icon: Search },
  { to: "/applications", label: "Candidature", icon: Briefcase },
  { to: "/messages", label: "Messaggi", icon: MessageSquare },
  { to: "/profile", label: "Profilo", icon: User },
];

export default function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Keyboard users should be able to jump the navigation on every screen. */}
      <a
        href="#main-content"
        className="sr-only rounded-md bg-[#0F4C81] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F4C81]"
      >
        Salta al contenuto
      </a>

      {/* Desktop top bar */}
      <header aria-label="Navigazione principale" className="hidden border-b border-[#E5E7EB] bg-white px-6 py-3 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <NavLink
            to="/for-you"
            className="rounded-md text-lg font-bold text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
          >
            Con noi
          </NavLink>
          <nav aria-label="Navigazione principale" className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 ${
                      isActive
                        ? "bg-[#E8F0F9] text-[#0F4C81]"
                        : "text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
                    }`
                  }
                  aria-current={undefined}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <NotificationBell />
        </div>
      </header>

      {/* Page content. Rendered as a plain container because each page supplies
          its own <main>, which avoids nested landmarks on every screen. */}
      <div id="main-content" className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children ?? <Outlet />}
      </div>

      {/* Mobile bottom nav. The safe-area padding keeps the labels clear of the
          iOS home indicator. */}
      <nav
        aria-label="Navigazione principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <div className="flex items-stretch justify-around px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-inset ${
                    isActive ? "text-[#0F4C81]" : "text-[#4B5563]"
                  }`
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
