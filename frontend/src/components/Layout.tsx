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

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Desktop top bar */}
      <header className="hidden border-b border-[#E5E7EB] bg-white px-6 py-3 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-lg font-bold text-[#0F4C81]">JobPlatform</span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#0F4C81]/10 text-[#0F4C81]"
                        : "text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
                    }`
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <NotificationBell />
        </div>
      </header>

      {/* Page content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-md px-3 py-2 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "text-[#0F4C81]"
                      : "text-[#6B7280]"
                  }`
                }
              >
                <Icon className="size-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}