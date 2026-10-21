import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Briefcase, MapPin, Calendar, MessageSquare,
  XCircle, CheckCircle2, Clock, ChevronRight, FileText,
} from "lucide-react";
import { api, type Application, type SafeUser } from "@/lib/api";

const STATUS_TABS = [
  { key: "", label: "Tutte" },
  { key: "submitted", label: "Inviate" },
  { key: "reviewed", label: "Esaminate" },
  { key: "accepted", label: "Accettate" },
  { key: "rejected", label: "Rifiutate" },
  { key: "withdrawn", label: "Ritirate" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  submitted: { label: "Inviata", color: "bg-[#0F4C81]/10 text-[#0F4C81]", icon: Clock },
  reviewed: { label: "Esaminata", color: "bg-[#D97706]/10 text-[#D97706]", icon: FileText },
  accepted: { label: "Accettata", color: "bg-[#16A34A]/10 text-[#16A34A]", icon: CheckCircle2 },
  rejected: { label: "Rifiutata", color: "bg-[#DC2626]/10 text-[#DC2626]", icon: XCircle },
  withdrawn: { label: "Ritirata", color: "bg-[#6B7280]/10 text-[#6B7280]", icon: XCircle },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, applications] = await Promise.all([
          api.getMe(),
          api.getMyApplications(activeTab || undefined),
        ]);
        if (!cancelled) {
          setUser(me);
          setApps(applications);
        }
      } catch {
        if (!cancelled) navigate("/auth/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleWithdraw = async (id: string) => {
    if (!confirm("Sei sicuro di voler ritirare questa candidatura?")) return;
    setWithdrawing(id);
    try {
      const updated = await api.withdrawApplication(id);
      setApps((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch {}
    finally { setWithdrawing(null); }
  };

  const handleMessage = async (app: Application) => {
    try {
      // Find the company admin or post creator to message
      // For now, create a thread with context
      const thread = await api.createThread({
        recipientId: app.userId, // This would be the employer in production
        postId: app.postId,
        applicationId: app._id,
        context: "application",
      });
      navigate(`/messages?thread=${thread._id}`);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Le mie candidature</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Tieni traccia dello stato delle tue candidature
          </p>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoading(true); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#0F4C81] text-white"
                  : "bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {apps.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 size-12 text-[#6B7280]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">Nessuna candidatura</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              {activeTab
                ? `Non hai candidature con stato "${STATUS_TABS.find((t) => t.key === activeTab)?.label}"`
                : "Inizia a candidarti alle opportunità che ti interessano"}
            </p>
            {!activeTab && (
              <button
                onClick={() => navigate("/for-you")}
                className="mt-6 rounded-md bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3d6b]"
              >
                Esplora opportunità
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
              const StatusIcon = config.icon;
              return (
                <article
                  key={app._id}
                  className="rounded-lg border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                  {/* Post snapshot */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] text-sm font-bold text-[#0F4C81]">
                      {app.post?.company?.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#1A1A1A]">
                        {app.post?.title || "Posizione non disponibile"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                        <span>{app.post?.company?.name}</span>
                        {app.post?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {app.post.location.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${config.color}`}>
                      <StatusIcon className="size-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      Inviata: {formatDate(app.createdAt)}
                    </span>
                    {app.reviewedAt && (
                      <>
                        <ChevronRight className="size-3" />
                        <span>Esaminata: {formatDate(app.reviewedAt)}</span>
                      </>
                    )}
                  </div>

                  {/* Review notes */}
                  {app.reviewNotes && (
                    <div className="mt-3 rounded-md bg-[#F8F9FA] p-3 text-sm text-[#1A1A1A]">
                      <p className="mb-1 text-xs font-semibold text-[#6B7280]">Note del selezionatore:</p>
                      {app.reviewNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => app.post && navigate(`/posts/${app.post._id || app.postId}`)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#F8F9FA]"
                    >
                      Vedi dettagli
                    </button>
                    {app.status === "submitted" && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawing === app._id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#DC2626]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/5 disabled:opacity-50"
                      >
                        {withdrawing === app._id ? <Loader2 className="size-3 animate-spin" /> : "Ritira"}
                      </button>
                    )}
                    {app.status === "accepted" && (
                      <button
                        onClick={() => handleMessage(app)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#0F4C81] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a3d6b]"
                      >
                        <MessageSquare className="size-3" />
                        Messaggia datore
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}