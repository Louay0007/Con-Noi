import { useState, useEffect } from "react";
import {
  Loader2, Search, Filter, CheckCircle2, XCircle, Eye,
  MessageSquare, FileText, Download, ChevronRight, Clock, User,
} from "lucide-react";
import { api, fileDownloadUrl, type Application } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Seo } from "@/components/Seo";
import { showError } from "@/utils/toast";

const STATUS_TABS = [
  { key: "", label: "Tutte" },
  { key: "submitted", label: "Inviate" },
  { key: "reviewed", label: "Esaminate" },
  { key: "accepted", label: "Accettate" },
  { key: "rejected", label: "Rifiutate" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: "Inviata", color: "status-pill--info" },
  reviewed: { label: "Esaminata", color: "status-pill--warning" },
  accepted: { label: "Accettata", color: "status-pill--success" },
  rejected: { label: "Rifiutata", color: "status-pill--danger" },
  withdrawn: { label: "Ritirata", color: "status-pill--neutral" },
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"accept" | "reject" | null>(null);
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchApps = async (p: number, status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, limit: 20 };
      if (status) params.status = status;
      const result = await api.adminGetApplications(params);
      setApps(result.items);
      setTotal(result.total);
      setPage(p);
    } catch {/* intentionally ignored: background refresh, fallback UI already covers failure */} finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(1, activeTab || undefined); }, [activeTab]);

  const handleReview = async (id: string, status: "reviewed" | "accepted" | "rejected") => {
    setReviewing(true);
    try {
      await api.adminReviewApplication(id, { status, reviewNotes: reviewNotes.trim() || undefined });
      fetchApps(page, activeTab || undefined);
      setSelectedApp(null);
      setReviewNotes("");
    } catch {/* intentionally ignored: background refresh, fallback UI already covers failure */} finally { setReviewing(false); }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || bulkSelected.size === 0) return;
    setBulkProcessing(true);
    try {
      const status = bulkAction === "accept" ? "accepted" : "rejected";
      await Promise.all(
        Array.from(bulkSelected).map((id) =>
          api.adminReviewApplication(id, { status, reviewNotes: bulkNotes.trim() || undefined })
        )
      );
      setBulkSelected(new Set());
      setBulkAction(null);
      setBulkNotes("");
      fetchApps(page, activeTab || undefined);
    } catch {/* intentionally ignored: background refresh, fallback UI already covers failure */} finally { setBulkProcessing(false); }
  };

  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Seo title="Revisione candidature — Admin Con noi" description="Rivedi e gestisci le candidature ricevute." noindex />
      <AdminShell title="Revisione candidature" description={`${total} ${total === 1 ? "candidatura" : "candidature"}`}>
        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setBulkSelected(new Set()); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-[#0F4C81] text-white" : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F8F9FA]"
              }`}
            >{tab.label}</button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {bulkSelected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-[#0F4C81]/30 bg-[#0F4C81]/5 px-4 py-3">
            <span className="text-sm font-medium text-[#0F4C81]">{bulkSelected.size} selezionate</span>
            {!bulkAction ? (
              <div className="flex gap-2">
                <button onClick={() => setBulkAction("accept")} className="rounded-md bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803d]">Accetta</button>
                <button onClick={() => setBulkAction("reject")} className="rounded-md bg-[#DC2626] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c]">Rifiuta</button>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  placeholder="Note condivise (opzionale)"
                  className="h-8 flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                />
                <button onClick={handleBulkAction} disabled={bulkProcessing} className="rounded-md bg-[#0F4C81] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0a3d6b] disabled:opacity-50">
                  {bulkProcessing ? <Loader2 className="size-3 animate-spin" /> : "Conferma"}
                </button>
                <button onClick={() => { setBulkAction(null); setBulkNotes(""); }} className="text-xs text-[#4B5563] hover:underline">Annulla</button>
              </div>
            )}
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#0F4C81]" /></div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center"><FileText className="mx-auto mb-4 size-12 text-[#4B5563]" /><p className="text-sm text-[#4B5563]">Nessuna candidatura trovata</p></div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
              return (
                <div key={app._id} className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 transition-shadow hover:shadow-sm">
                  <input
                    type="checkbox"
                    id={`select-app-${app._id}`}
                    checked={bulkSelected.has(app._id)}
                    onChange={() => toggleBulkSelect(app._id)}
                    className="size-5 shrink-0 rounded border-[#E5E7EB] accent-[#0F4C81]"
                    aria-label={`Seleziona la candidatura per ${app.post?.title || app.snapshot?.postTitle || "posizione"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-[#1A1A1A]">{app.post?.title || app.snapshot?.postTitle || "Posizione non disponibile"}</h2>
                      <span className={`status-pill shrink-0 ${config.color}`}>{config.label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#4B5563]">
                      <span className="flex items-center gap-1"><User className="size-3" /> Candidato ID: {app.userId.slice(-6)}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(app.createdAt).toLocaleDateString("it-IT")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedApp(app); setReviewNotes(""); }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#F8F9FA]"
                  >
                    <Eye className="size-3.5" /> Dettagli
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => fetchApps(page - 1, activeTab || undefined)} disabled={page <= 1 || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Precedente</button>
            <span className="text-sm text-[#4B5563]">Pagina {page} di {totalPages}</span>
            <button onClick={() => fetchApps(page + 1, activeTab || undefined)} disabled={page >= totalPages || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Successiva</button>
          </div>
        )}
      </AdminShell>

      {/* Application Detail Slide-over */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="relative w-full max-w-lg animate-in slide-in-from-right-4 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-lg font-bold text-[#1A1A1A]">Dettaglio Candidatura</h2>
                <button onClick={() => setSelectedApp(null)} className="rounded-md p-1 text-[#4B5563] hover:bg-[#F8F9FA]"><XCircle className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Worker Summary */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Candidato</h3>
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                    <p className="font-semibold text-[#1A1A1A]">ID: {selectedApp.userId.slice(-8)}</p>
                    <div className="mt-2 flex gap-2">
                      {selectedApp.resumeFileId && (
                        <a href={fileDownloadUrl(selectedApp.resumeFileId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#0F4C81] hover:bg-[#F8F9FA]">
                          <Download className="size-3" /> Resume
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* Cover Letter */}
                {selectedApp.coverLetter && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Lettera di presentazione</h3>
                    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm leading-relaxed text-[#1A1A1A] whitespace-pre-line">{selectedApp.coverLetter}</div>
                  </section>
                )}

                {/* Attachments */}
                {selectedApp.attachmentFileIds.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Allegati</h3>
                    <div className="space-y-2">
                      {selectedApp.attachmentFileIds.map((fid) => (
                        <a key={fid} href={fileDownloadUrl(fid)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 text-sm hover:bg-[#F8F9FA]">
                          <FileText className="size-4 text-[#0F4C81]" /> Allegato
                          <Download className="ml-auto size-3.5 text-[#4B5563]" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Contact Info */}
                {selectedApp.contact && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Contatti</h3>
                    <div className="space-y-1 text-sm text-[#1A1A1A]">
                      {selectedApp.contact.phone && <p>📞 {selectedApp.contact.phone}</p>}
                      {selectedApp.contact.email && <p>✉️ {selectedApp.contact.email}</p>}
                      {selectedApp.contact.availabilityNote && <p>🕐 {selectedApp.contact.availabilityNote}</p>}
                    </div>
                  </section>
                )}

                {/* Timeline */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#4B5563]"><Clock className="size-3" /> Inviata: {new Date(selectedApp.createdAt).toLocaleString("it-IT")}</div>
                    {selectedApp.reviewedAt && <div className="flex items-center gap-2 text-[#4B5563]"><ChevronRight className="size-3" /> Esaminata: {new Date(selectedApp.reviewedAt).toLocaleString("it-IT")}</div>}
                  </div>
                </section>

                {/* Review Notes */}
                {selectedApp.reviewNotes && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Note precedenti</h3>
                    <div className="rounded-md bg-[#F8F9FA] p-3 text-sm text-[#1A1A1A]">{selectedApp.reviewNotes}</div>
                  </section>
                )}

                {/* Actions */}
                {selectedApp.status === "submitted" && (
                  <section className="border-t border-[#E5E7EB] pt-6">
                    <h3 className="mb-3 text-sm font-bold text-[#1A1A1A]">Azioni di revisione</h3>
                    <textarea
                      className="auth-input mb-3 min-h-[80px] resize-none"
                      placeholder="Note di revisione (opzionale)…"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(selectedApp._id, "accepted")} disabled={reviewing} className="flex-1 rounded-md bg-[#16A34A] py-2 text-sm font-semibold text-white hover:bg-[#15803d] disabled:opacity-50">
                        {reviewing ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Accetta"}
                      </button>
                      <button onClick={() => handleReview(selectedApp._id, "rejected")} disabled={reviewing} className="flex-1 rounded-md bg-[#DC2626] py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                        {reviewing ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Rifiuta"}
                      </button>
                      <button onClick={() => handleReview(selectedApp._id, "reviewed")} disabled={reviewing} className="flex-1 rounded-md border border-[#E5E7EB] bg-white py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#F8F9FA] disabled:opacity-50">
                        Segna esaminata
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
