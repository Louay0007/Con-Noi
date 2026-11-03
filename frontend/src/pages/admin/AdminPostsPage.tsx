import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, Plus, Search, Archive, CheckCircle2, XCircle, Trash2,
} from "lucide-react";
import { api, type Post } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Seo } from "@/components/Seo";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { showSuccess, showError } from "@/utils/toast";

const STATUS_OPTIONS = [
  { value: "", label: "Tutti gli stati" },
  { value: "published", label: "Pubblicati" },
  { value: "draft", label: "Bozze" },
  { value: "closed", label: "Chiusi" },
  { value: "archived", label: "Archiviati" },
];

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  published: { cls: "status-pill--success", label: "Pubblicato" },
  draft: { cls: "status-pill--neutral", label: "Bozza" },
  closed: { cls: "status-pill--warning", label: "Chiuso" },
  archived: { cls: "status-pill--neutral", label: "Archiviato" },
};

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", city: "", q: "" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = { page: p, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.city) params.city = filters.city;
      if (filters.q) params.q = filters.q;
      const result = await api.adminGetPosts(params);
      setPosts(result.items);
      setTotal(result.total);
      setPage(p);
    } catch {
      showError("Non è stato possibile caricare gli annunci");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  const handleStatusChange = async (id: string, action: "publish" | "close" | "archive" | "restore") => {
    setActionLoading(id);
    try {
      await api.adminChangePostStatus(id, action);
      const labels = { publish: "Annuncio pubblicato", close: "Annuncio chiuso", archive: "Annuncio archiviato", restore: "Annuncio ripristinato" };
      showSuccess(labels[action]);
      fetchPosts(page);
    } catch {
      showError("Cambio di stato non riuscito");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (post: Post) => {
    setActionLoading(post._id);
    try {
      await api.adminDeletePost(post._id);
      showSuccess("Annuncio eliminato");
      setPendingDelete(null);
      fetchPosts(page);
    } catch {
      showError("Eliminazione non riuscita");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Seo title="Gestione annunci — Admin Con noi" description="Gestisci gli annunci di lavoro pubblicati." noindex />
      <AdminShell
        title="Gestione annunci"
        description={`${total} ${total === 1 ? "annuncio" : "annunci"} in totale`}
        actions={
          <button
            onClick={() => navigate("/admin/posts/new")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#0F4C81] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" /> Nuovo annuncio
          </button>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor="posts-search" className="sr-only">Cerca annunci</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4B5563]" aria-hidden="true" />
            <input
              id="posts-search"
              type="search"
              placeholder="Cerca titolo, azienda…"
              className="field-control field-control--sm bg-[#F8F9FA] pl-9"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="posts-status" className="sr-only">Filtra per stato</label>
            <select
              id="posts-status"
              className="field-control field-control--sm w-auto"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="posts-city" className="sr-only">Filtra per città</label>
            <input
              id="posts-city"
              type="search"
              placeholder="Città"
              className="field-control field-control--sm w-40"
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {loading ? (
            <div className="flex justify-center py-16">
              <h1 className="sr-only">Annunci</h1>
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento annunci" />
            </div>
          ) : (
            <div tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81]">
              <table className="w-full min-w-[820px] text-left text-sm">
                <caption className="sr-only">Elenco annunci con stato, città, data di pubblicazione e azioni</caption>
                <thead className="bg-[#F8F9FA] text-xs uppercase text-[#4B5563]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Titolo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Stato</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Città</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Pubblicato</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Views</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Apps</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {posts.map((post) => {
                    const pill = STATUS_PILL[post.status] ?? STATUS_PILL.draft;
                    return (
                      <tr key={post._id} className="hover:bg-[#F8F9FA]">
                        <td className="max-w-xs truncate px-4 py-3 font-medium text-[#1A1A1A]">
                          <Link
                            to={`/admin/posts/${post._id}/edit`}
                            className="rounded text-[#0F4C81] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
                          >
                            {post.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-pill ${pill.cls}`}>{pill.label}</span>
                        </td>
                        <td className="px-4 py-3 text-[#4B5563]">{post.location.city}</td>
                        <td className="px-4 py-3 text-[#4B5563]">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("it-IT") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-[#1A1A1A]">{post.stats.views}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#0F4C81]">{post.stats.applications}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {post.status === "draft" && (
                              <button
                                onClick={() => handleStatusChange(post._id, "publish")}
                                disabled={actionLoading === post._id}
                                className="icon-action text-[#15803D] hover:bg-[#E8F6ED]"
                                aria-label={`Pubblica ${post.title}`}
                              >
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                              </button>
                            )}
                            {post.status === "published" && (
                              <button
                                onClick={() => handleStatusChange(post._id, "close")}
                                disabled={actionLoading === post._id}
                                className="icon-action text-[#B45309] hover:bg-[#FDF2E9]"
                                aria-label={`Chiudi ${post.title}`}
                              >
                                <XCircle className="size-4" aria-hidden="true" />
                              </button>
                            )}
                            {(post.status === "closed" || post.status === "draft") && (
                              <button
                                onClick={() => handleStatusChange(post._id, "archive")}
                                disabled={actionLoading === post._id}
                                className="icon-action text-[#4B5563]"
                                aria-label={`Archivia ${post.title}`}
                              >
                                <Archive className="size-4" aria-hidden="true" />
                              </button>
                            )}
                            {post.status === "archived" && (
                              <button
                                onClick={() => handleStatusChange(post._id, "restore")}
                                disabled={actionLoading === post._id}
                                className="icon-action text-[#0F4C81] hover:bg-[#E8F0F9]"
                                aria-label={`Ripristina ${post.title}`}
                              >
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={() => setPendingDelete(post)}
                              disabled={actionLoading === post._id}
                              className="icon-action text-[#B91C1C] hover:bg-[#FCE9E9]"
                              aria-label={`Elimina ${post.title}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#4B5563]">
                        Nessun annuncio trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Paginazione annunci" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4B5563]">{total} risultati totali</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPosts(page - 1)}
                disabled={page <= 1 || loading}
                className="min-h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="px-1 text-sm text-[#4B5563]" aria-live="polite">
                Pagina {page} di {totalPages}
              </span>
              <button
                onClick={() => fetchPosts(page + 1)}
                disabled={page >= totalPages || loading}
                className="min-h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </nav>
        )}
      </AdminShell>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare questo annuncio?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" verrà eliminato definitivamente, insieme alle sue statistiche. L'operazione non può essere annullata.`
            : ""
        }
        confirmLabel="Elimina"
        destructive
        loading={actionLoading !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </>
  );
}
