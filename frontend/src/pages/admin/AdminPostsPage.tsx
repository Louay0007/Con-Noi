import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Plus, Search, Filter, MoreVertical, Eye, Heart,
  Briefcase, Trash2, Archive, CheckCircle2, XCircle, Edit3,
} from "lucide-react";
import { api, type Post, type Speciality } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "", label: "Tutti gli stati" },
  { value: "published", label: "Pubblicati" },
  { value: "draft", label: "Bozze" },
  { value: "closed", label: "Chiusi" },
  { value: "archived", label: "Archiviati" },
];

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", city: "", q: "" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.getSpecialities().then(setSpecialities).catch(() => {});
  }, []);

  const fetchPosts = async (p: number) => {
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
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(1); }, [filters]);

  const handleStatusChange = async (id: string, action: "publish" | "close" | "archive" | "restore") => {
    setActionLoading(id);
    try {
      await api.adminChangePostStatus(id, action);
      fetchPosts(page);
    } catch {} finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare definitivamente questo annuncio?")) return;
    setActionLoading(id);
    try {
      await api.adminDeletePost(id);
      fetchPosts(page);
    } catch {} finally { setActionLoading(null); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Gestione Annunci</h1>
          <button onClick={() => navigate("/admin/posts/new")} className="inline-flex items-center gap-1.5 rounded-md bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a3d6b]">
            <Plus className="size-4" /> Nuovo annuncio
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Cerca titolo, azienda…"
              className="h-9 w-full rounded-md border border-[#E5E7EB] bg-[#F8F9FA] pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            />
          </div>
          <select
            className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Città"
            className="h-9 w-40 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none"
            value={filters.city}
            onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#0F4C81]" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] text-xs uppercase text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Titolo</th>
                    <th className="px-6 py-3 font-semibold">Stato</th>
                    <th className="px-6 py-3 font-semibold">Città</th>
                    <th className="px-6 py-3 font-semibold">Pubblicato</th>
                    <th className="px-6 py-3 font-semibold text-right">Views</th>
                    <th className="px-6 py-3 font-semibold text-right">Apps</th>
                    <th className="px-6 py-3 font-semibold text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-[#F8F9FA]">
                      <td className="max-w-xs truncate px-6 py-3 font-medium text-[#1A1A1A]">{post.title}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          post.status === "published" ? "bg-[#16A34A]/10 text-[#16A34A]" :
                          post.status === "closed" ? "bg-[#6B7280]/10 text-[#6B7280]" :
                          post.status === "archived" ? "bg-[#D97706]/10 text-[#D97706]" :
                          "bg-[#E5E7EB] text-[#6B7280]"
                        }`}>{post.status}</span>
                      </td>
                      <td className="px-6 py-3 text-[#6B7280]">{post.location.city}</td>
                      <td className="px-6 py-3 text-[#6B7280]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("it-IT") : "—"}</td>
                      <td className="px-6 py-3 text-right text-[#1A1A1A]">{post.stats.views}</td>
                      <td className="px-6 py-3 text-right font-semibold text-[#0F4C81]">{post.stats.applications}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {post.status === "draft" && (
                            <button onClick={() => handleStatusChange(post._id, "publish")} disabled={actionLoading === post._id} className="rounded p-1.5 text-[#16A34A] hover:bg-[#16A34A]/10 disabled:opacity-50" title="Pubblica"><CheckCircle2 className="size-4" /></button>
                          )}
                          {post.status === "published" && (
                            <button onClick={() => handleStatusChange(post._id, "close")} disabled={actionLoading === post._id} className="rounded p-1.5 text-[#D97706] hover:bg-[#D97706]/10 disabled:opacity-50" title="Chiudi"><XCircle className="size-4" /></button>
                          )}
                          {(post.status === "closed" || post.status === "draft") && (
                            <button onClick={() => handleStatusChange(post._id, "archive")} disabled={actionLoading === post._id} className="rounded p-1.5 text-[#6B7280] hover:bg-[#E5E7EB] disabled:opacity-50" title="Archivia"><Archive className="size-4" /></button>
                          )}
                          {post.status === "archived" && (
                            <button onClick={() => handleStatusChange(post._id, "restore")} disabled={actionLoading === post._id} className="rounded p-1.5 text-[#0F4C81] hover:bg-[#0F4C81]/10 disabled:opacity-50" title="Ripristina"><CheckCircle2 className="size-4" /></button>
                          )}
                          <button onClick={() => handleDelete(post._id)} disabled={actionLoading === post._id} className="rounded p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 disabled:opacity-50" title="Elimina"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6B7280]">Nessun annuncio trovato</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">{total} risultati totali</p>
            <div className="flex gap-2">
              <button onClick={() => fetchPosts(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Precedente</button>
              <span className="flex items-center px-3 text-sm text-[#6B7280]">Pagina {page} di {totalPages}</span>
              <button onClick={() => fetchPosts(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Successiva</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}