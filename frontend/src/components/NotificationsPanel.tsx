import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, CheckCheck, Briefcase, MessageSquare,
  Star, Megaphone, Loader2, X,
} from "lucide-react";
import { api } from "@/lib/api";

type Notification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; route?: string }> = {
  application_status: { icon: Briefcase, color: "text-[#0F4C81]", route: "/applications" },
  new_message: { icon: MessageSquare, color: "text-[#E67E22]", route: "/messages" },
  matching_post: { icon: Star, color: "text-[#16A34A]", route: "/for-you" },
  admin_broadcast: { icon: Megaphone, color: "text-[#DC2626]" },
};

function groupByDate(notifications: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Oggi", items: [] },
    { label: "Ieri", items: [] },
    { label: "Precedenti", items: [] },
  ];

  for (const n of notifications) {
    const t = new Date(n.createdAt).getTime();
    if (t >= today) groups[0].items.push(n);
    else if (t >= yesterday) groups[1].items.push(n);
    else groups[2].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
    finally { setMarkingAll(false); }
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try { await api.markNotificationRead(n._id); } catch {}
      setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, read: true } : x));
    }
    const config = TYPE_CONFIG[n.type];
    if (config?.route) {
      onClose();
      navigate(config.route);
    } else {
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = groupByDate(notifications);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[#0F4C81]" />
          <h3 className="text-sm font-bold text-[#1A1A1A]">Notifiche</h3>
          {unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#0F4C81] text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="rounded-md px-2 py-1 text-xs font-medium text-[#0F4C81] hover:bg-[#0F4C81]/5 disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="size-3 animate-spin" /> : "Segna tutte lette"}
            </button>
          )}
          <button onClick={onClose} className="rounded-md p-1 text-[#6B7280] hover:bg-[#F8F9FA]">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-[#0F4C81]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto mb-3 size-10 text-[#E5E7EB]" />
            <p className="text-sm font-medium text-[#6B7280]">Nessuna notifica</p>
            <p className="mt-1 text-xs text-[#6B7280]">Sei aggiornato!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 bg-[#F8F9FA] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                {group.label}
              </div>
              {group.items.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.admin_broadcast;
                const Icon = config.icon;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-[#E5E7EB]/50 px-4 py-3 text-left transition-colors hover:bg-[#F8F9FA] ${
                      !n.read ? "bg-[#0F4C81]/[0.03]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F8F9FA] ${config.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-[#1A1A1A]" : "text-[#1A1A1A]"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#0F4C81]" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280]">{n.body}</p>
                      <p className="mt-1 text-[10px] text-[#6B7280]">{formatTime(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Bell Button with Badge ──────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.getNotificationUnreadCount()
      .then((res) => setUnreadCount(res.count))
      .catch(() => {});
  }, [open]); // Re-fetch when panel closes

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative rounded-md p-2 transition-colors ${
          open ? "bg-[#0F4C81]/10 text-[#0F4C81]" : "text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
        }`}
        aria-label="Notifiche"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}