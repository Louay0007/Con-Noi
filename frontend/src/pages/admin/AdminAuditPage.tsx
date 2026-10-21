import { useState, useEffect } from "react";
import {
  Loader2, Search, Calendar, Download, ChevronDown,
  ChevronRight, ScrollText, Filter,
} from "lucide-react";
import { api } from "@/lib/api";

type AuditEntry = {
  _id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  ip?: string;
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

  const fetchAudit = async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, limit: 30 };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (actionFilter) params.action = actionFilter;
      const result = await api.adminGetAuditLog(params);
      setEntries(result.items);
      setTotal(result.total);
      setPage(p);
    } catch {
      // Audit endpoint may not exist yet; show empty state gracefully
      setEntries([]);
      setTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAudit(1); }, [dateFrom, dateTo, actionFilter]);

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
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Audit Log</h1>
          <button onClick={handleExportCSV} disabled={entries.length === 0} className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#F8F9FA] disabled:opacity-50">
            <Download className="size-4" /> Esporta CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#6B7280]" />
            <input type="date" className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-sm text-[#6B7280]">→</span>
            <input type="date" className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Tutte le azioni</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="status_change">Status Change</option>
            <option value="login">Login</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#0F4C81]" /></div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <ScrollText className="mx-auto mb-4 size-12 text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Nessun evento audit trovato</p>
              <p className="mt-1 text-xs text-[#6B7280]">L'endpoint audit potrebbe non essere ancora implementato nel backend</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] text-xs uppercase text-[#6B7280]">
                  <tr>
                    <th className="w-8 px-4 py-3"></th>
                    <th className="px-6 py-3 font-semibold">Timestamp</th>
                    <th className="px-6 py-3 font-semibold">Attore</th>
                    <th className="px-6 py-3 font-semibold">Azione</th>
                    <th className="px-6 py-3 font-semibold">Entità</th>
                    <th className="px-6 py-3 font-semibold">Entity ID</th>
                    <th className="px-6 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {entries.map((entry) => {
                    const isExpanded = expandedIds.has(entry._id);
                    const hasDiff = entry.before || entry.after;
                    return (
                      <>
                        <tr key={entry._id} className={`hover:bg-[#F8F9FA] ${isExpanded ? "bg-[#0F4C81]/[0.02]" : ""}`}>
                          <td className="px-4 py-3">
                            {hasDiff && (
                              <button onClick={() => toggleExpand(entry._id)} className="rounded p-1 text-[#6B7280] hover:bg-[#E5E7EB]">
                                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              </button>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-[#6B7280]">{new Date(entry.timestamp).toLocaleString("it-IT")}</td>
                          <td className="px-6 py-3 font-medium text-[#1A1A1A]">{entry.actor}</td>
                          <td className="px-6 py-3">
                            <span className="inline-block rounded-full bg-[#0F4C81]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F4C81]">{entry.action}</span>
                          </td>
                          <td className="px-6 py-3 text-[#6B7280] capitalize">{entry.entity}</td>
                          <td className="max-w-[120px] truncate px-6 py-3 font-mono text-xs text-[#6B7280]">{entry.entityId}</td>
                          <td className="px-6 py-3 font-mono text-xs text-[#6B7280]">{entry.ip || "—"}</td>
                        </tr>
                        {isExpanded && hasDiff && (
                          <tr key={`${entry._id}-diff`}>
                            <td colSpan={7} className="bg-[#F8F9FA] px-6 py-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                {entry.before && (
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase text-[#DC2626]">Before</p>
                                    <pre className="max-h-48 overflow-auto rounded-md bg-white p-3 text-xs text-[#1A1A1A] border border-[#E5E7EB]">{JSON.stringify(entry.before, null, 2)}</pre>
                                  </div>
                                )}
                                {entry.after && (
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase text-[#16A34A]">After</p>
                                    <pre className="max-h-48 overflow-auto rounded-md bg-white p-3 text-xs text-[#1A1A1A] border border-[#E5E7EB]">{JSON.stringify(entry.after, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
            <p className="text-sm text-[#6B7280]">{total} eventi totali</p>
            <div className="flex gap-2">
              <button onClick={() => fetchAudit(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Precedente</button>
              <span className="flex items-center px-3 text-sm text-[#6B7280]">Pagina {page} di {totalPages}</span>
              <button onClick={() => fetchAudit(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Successiva</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}