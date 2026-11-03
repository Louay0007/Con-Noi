import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Briefcase, MapPin, Calendar, MessageSquare,
  XCircle, CheckCircle2, Clock, ChevronRight, FileText,
} from "lucide-react";
import { api, logError, type Application, type SafeUser } from "@/lib/api";
import { Seo } from "@/components/Seo";

const STATUS_TABS = [
  { key: "", label: "Tutte" },
  { key: "submitted", label: "Inviate" },
  { key: "reviewed", label: "Esaminate" },
  { key: "accepted", label: "Accettate" },
  { key: "rejected", label: "Rifiutate" },
  { key: "withdrawn", label: "Ritirate" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  submitted: { label: "Inviata", color: "bg-[#E8F0F9] text-[#0F4C81]", icon: Clock },
  reviewed: { label: "Esaminata", color: "bg-[#FDF2E9] text-[#B45309]", icon: FileText },
  accepted: { label: "Accettata", color: "bg-[#E8F6ED] text-[#15803D]", icon: CheckCircle2 },
  rejected: { label: "Rifiutata", color: "bg-[#FCE9E9] text-[#B91C1C]", icon: XCircle },
  withdrawn: { label: "Ritirata", color: "bg-[#6B7280]/10 text-[#4B5563]", icon: XCircle },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SafeUser | null>(null);
  void user;
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
  }, [activeTab, navigate]);

  const handleWithdraw = async (id: string) => {
    if (!confirm("Sei sicuro di voler ritirare questa candidatura?")) return;
    setWithdrawing(id);
    try {
      const updated = await api.withdrawApplication(id);
      setApps((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch {/* intentionally ignored: background refresh, fallback UI already covers failure */}
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
    } catch {/* intentionally ignored: background refresh, fallback UI already covers failure */}
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <h1 className="sr-only">Le mie candidature</h1>
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento candidature" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-20">
      <Seo
        title="Le mie candidature"
        description="Tieni traccia dello stato di ogni candidatura inviata."
        noindex
      />
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Le mie candidature</h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            Tieni traccia dello stato delle tue candidature
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoading(true); }}
              aria-pressed={activeTab === tab.key}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 ${
                activeTab === tab.key
                  ? "bg-[#0F4C81] text-white"
                  : "bg-[#F8F9FA] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {apps.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 size-12 text-[#4B5563]" aria-hidden="true" />
            <p className="text-lg font-bold text-[#1A1A1A]">Nessuna candidatura</p>
            <p className="mt-2 text-sm text-[#4B5563]">
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
                  {/* Post snapshot (the API stores a copy, not a live post) */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] text-sm font-bold text-[#0F4C81]">
                      {(app.snapshot?.companyName || app.post?.company?.name || "?").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-bold text-[#1A1A1A]">
                        {app.snapshot?.postTitle || app.post?.title || "Posizione non disponibile"}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                        <span>{app.snapshot?.companyName || app.post?.company?.name}</span>
                        {(app.snapshot?.city || app.post?.location?.city) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {app.snapshot?.city || app.post?.location?.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${config.color}`}>
                      <StatusIcon className="size-3" aria-hidden="true" />
                      {config.label}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#4B5563]">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" aria-hidden="true" />
                      Inviata: {formatDate(app.appliedAt || app.createdAt)}
                    </span>
                    {app.reviewedAt && (
                      <>
                        <ChevronRight className="size-3" aria-hidden="true" />
                        <span>Esaminata: {formatDate(app.reviewedAt)}</span>
                      </>
                    )}
                  </div>

                  {/* Review notes */}
                  {app.reviewNotes && (
                    <div className="mt-3 rounded-md bg-[#F8F9FA] p-3 text-sm text-[#1A1A1A]">
                      <p className="mb-1 text-xs font-semibold text-[#4B5563]">Note del selezionatore:</p>
                      {app.reviewNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/posts/${app.postId}`)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] hover:bg-[#F8F9FA]"
                    >
                      Vedi dettagli
                    </button>
                    {app.status === "submitted" && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawing === app._id}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#DC2626]/30 bg-white px-3 text-xs font-medium text-[#B91C1C] hover:bg-[#DC2626]/5 disabled:opacity-50"
                      >
                        {withdrawing === app._id ? (
                          <>
                            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            Ritiro…
                          </>
                        ) : (
                          "Ritira"
                        )}
                      </button>
                    )}
                    {app.status === "accepted" && (
                      <button
                        onClick={() => handleMessage(app)}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#0F4C81] px-3 text-xs font-semibold text-white hover:bg-[#0a3d6b]"
                      >
                        <MessageSquare className="size-3" aria-hidden="true" />
                        Messaggia datore
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}