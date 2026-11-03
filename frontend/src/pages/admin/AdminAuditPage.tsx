import { Fragment, useState, useEffect, useCallback } from "react";
import {
  Loader2, Calendar, Download, ChevronDown,
  ChevronRight, ScrollText,
} from "lucide-react";
import { api } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Seo } from "@/components/Seo";
import { showError } from "@/utils/toast";

type AuditEntry = {
  _id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  ip?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchAudit = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, limit: 30 };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (actionFilter) params.action = actionFilter;
      const result = await api.adminGetAuditLog(params);
      setEntries(result.items);
      setTotal(result.total);
      setPage(result.page ?? p);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally { setLoading(false); }
  }, [dateFrom, dateTo, actionFilter]);

  useEffect(() => { fetchAudit(1); }, [fetchAudit]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Actor", "Action", "Entity", "Entity ID", "IP"];
    const rows = entries.map((e) => [
      e.timestamp, e.actor, e.action, e.entity, e.entityId, e.ip || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <>
      <Seo title="Audit log — Admin Con noi" description="Registro delle azioni amministrative." noindex />
      <AdminShell
        title="Audit log"
        description={`${total} ${total === 1 ? "evento" : "eventi"} registrati`}
        actions={
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" /> Esporta CSV
          </button>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="audit-from" className="auth-label text-xs">Dal</label>
              <input id="audit-from" type="date" className="field-control field-control--sm w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <span className="pb-2.5 text-sm text-[#4B5563]" aria-hidden="true">→</span>
            <div>
              <label htmlFor="audit-to" className="auth-label text-xs">Al</label>
              <input id="audit-to" type="date" className="field-control field-control--sm w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="audit-action" className="auth-label text-xs">Azione</label>
            <select id="audit-action" className="field-control field-control--sm w-auto" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">Tutte le azioni</option>
              <option value="create">Creazione</option>
              <option value="update">Modifica</option>
              <option value="delete">Eliminazione</option>
              <option value="status_change">Cambio di stato</option>
              <option value="login">Accesso</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#0F4C81]" /></div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <ScrollText className="mx-auto mb-4 size-12 text-[#4B5563]" />
              <p className="text-sm text-[#4B5563]">Nessun evento audit trovato</p>
            </div>
          ) : (
            <div tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81]">
              <table className="w-full min-w-[860px] text-left text-sm">
                <caption className="sr-only">Registro delle azioni amministrative</caption>
                <thead className="bg-[#F8F9FA] text-xs uppercase text-[#4B5563]">
                  <tr>
                    <th scope="col" className="w-8 px-4 py-3"><span className="sr-only">Dettagli</span></th>
                    <th scope="col" className="px-4 py-3 font-semibold">Timestamp</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Attore</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Azione</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Entità</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Entity ID</th>
                    <th scope="col" className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {entries.map((entry) => {
                    const isExpanded = expandedIds.has(entry._id);
                    const hasDiff = Boolean(entry.before || entry.after);
                    return (
                      <Fragment key={entry._id}>
                        <tr className={`hover:bg-[#F8F9FA] ${isExpanded ? "bg-[#0F4C81]/[0.02]" : ""}`}>
                          <td className="px-4 py-3">
                            {hasDiff && (
                              <button onClick={() => toggleExpand(entry._id)} className="rounded p-1 text-[#4B5563] hover:bg-[#E5E7EB]" aria-label={isExpanded ? "Nascondi dettagli" : "Mostra dettagli"} aria-expanded={isExpanded}>
                                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              </button>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[#4B5563]">{new Date(entry.timestamp).toLocaleString("it-IT")}</td>
                          <td className="px-4 py-3 font-medium text-[#1A1A1A]">{entry.actor}</td>
                          <td className="px-4 py-3">
                            <span className="status-pill status-pill--info uppercase">{entry.action}</span>
                          </td>
                          <td className="px-4 py-3 text-[#4B5563] capitalize">{entry.entity}</td>
                          <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-[#4B5563]">{entry.entityId}</td>
                          <td className="px-4 py-3 font-mono text-xs text-[#4B5563]">{entry.ip || "—"}</td>
                        </tr>
                        {isExpanded && hasDiff && (
                          <tr>
                            <td colSpan={7} className="bg-[#F8F9FA] px-6 py-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                {entry.before && (
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase text-[#B91C1C]">Prima</p>
                                    <pre className="max-h-48 overflow-auto rounded-md border border-[#E5E7EB] bg-white p-3 text-xs text-[#1A1A1A]">{JSON.stringify(entry.before, null, 2)}</pre>
                                  </div>
                                )}
                                {entry.after && (
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase text-[#15803D]">Dopo</p>
                                    <pre className="max-h-48 overflow-auto rounded-md border border-[#E5E7EB] bg-white p-3 text-xs text-[#1A1A1A]">{JSON.stringify(entry.after, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#4B5563]">{total} eventi totali</p>
            <div className="flex gap-2">
              <button onClick={() => fetchAudit(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Precedente</button>
              <span className="flex items-center px-3 text-sm text-[#4B5563]">Pagina {page} di {totalPages}</span>
              <button onClick={() => fetchAudit(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Successiva</button>
            </div>
          </div>
        )}
      </AdminShell>
    </>
  );
}