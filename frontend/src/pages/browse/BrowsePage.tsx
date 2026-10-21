import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Search, SlidersHorizontal, X, MapPin, Briefcase, Euro, Wifi } from "lucide-react";
import { api, type Post, type Speciality } from "@/lib/api";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";

const EMPLOYMENT_TYPES = [
  { value: "", label: "Tutti i tipi" },
  { value: "full_time", label: "Tempo pieno" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contratto" },
  { value: "temporary", label: "Temporaneo" },
  { value: "seasonal", label: "Stagionale" },
  { value: "internship", label: "Stage" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Più recenti" },
  { value: "salary", label: "Retribuzione" },
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state synced with URL
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    city: searchParams.get("city") || "",
    employmentType: searchParams.get("employmentType") || "",
    remote: searchParams.get("remote") === "true",
    sort: searchParams.get("sort") || "recent",
    specialityIds: searchParams.get("specialityIds")?.split(",").filter(Boolean) || [],
  });

  // Load specialities on mount
  useEffect(() => {
    api.getSpecialities().then(setSpecialities).catch(() => {});
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.city) params.set("city", filters.city);
    if (filters.employmentType) params.set("employmentType", filters.employmentType);
    if (filters.remote) params.set("remote", "true");
    if (filters.sort !== "recent") params.set("sort", filters.sort);
    if (filters.specialityIds.length) params.set("specialityIds", filters.specialityIds.join(","));
    setSearchParams(params, { replace: true });
  }, [filters]);

  // Fetch posts when filters change
  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: pageNum,
        limit: 20,
        sort: filters.sort,
      };
      if (filters.q) params.q = filters.q;
      if (filters.city) params.city = filters.city;
      if (filters.employmentType) params.employmentType = filters.employmentType;
      if (filters.remote) params.remote = true;
      if (filters.specialityIds.length) params.specialityIds = filters.specialityIds.join(",");

      const result = await api.browsePosts(params);
      if (append) {
        setPosts((prev) => [...prev, ...result.items]);
      } else {
        setPosts(result.items);
      }
      setTotal(result.total);
      setPage(pageNum);
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && posts.length < total) {
      fetchPosts(page + 1, true);
    }
  };

  const toggleSpeciality = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      specialityIds: prev.specialityIds.includes(id)
        ? prev.specialityIds.filter((s) => s !== id)
        : [...prev.specialityIds, id],
    }));
  };

  const clearFilters = () => {
    setFilters({ q: "", city: "", employmentType: "", remote: false, sort: "recent", specialityIds: [] });
  };

  const hasActiveFilters = filters.q || filters.city || filters.employmentType || filters.remote || filters.specialityIds.length > 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Sticky Filter Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Cerca posizione, azienda…"
                className="h-10 w-full rounded-md border border-[#E5E7EB] bg-[#F8F9FA] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:border-[#0F4C81] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81]"
                  : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8F9FA]"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filtri</span>
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-3 space-y-3 border-t border-[#E5E7EB] pt-3">
              {/* City */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7280]">Città</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="text"
                      placeholder="es. Milano"
                      className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                      value={filters.city}
                      onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7280]">Tipo di impiego</label>
                  <select
                    className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1A1A] focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                    value={filters.employmentType}
                    onChange={(e) => setFilters((p) => ({ ...p, employmentType: e.target.value }))}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remote toggle + Sort */}
              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => setFilters((p) => ({ ...p, remote: e.target.checked }))}
                    className="size-4 rounded border-[#E5E7EB] accent-[#0F4C81]"
                  />
                  <Wifi className="size-3.5 text-[#6B7280]" />
                  Solo remoto
                </label>
                <select
                  className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1A1A] focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                  value={filters.sort}
                  onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Specialities chips */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">Specialità</label>
                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                  {specialities.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className="speciality-chip text-[11px]"
                      data-selected={filters.specialityIds.includes(s._id)}
                      onClick={() => toggleSpeciality(s._id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline"
                >
                  <X className="size-3" /> Rimuovi tutti i filtri
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Results count */}
        {!loading && (
          <p className="mb-4 text-sm font-medium text-[#6B7280]">
            {total} opportunità trovata{total !== 1 ? "e" : ""}
          </p>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 size-12 text-[#6B7280]" />
            <p className="text-sm text-[#6B7280]">Nessun risultato con questi filtri.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm font-medium text-[#0F4C81] hover:underline">
                Rimuovi filtri
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <JobCard key={post._id} post={post} />
              ))}
            </div>

            {/* Load more */}
            {posts.length < total && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="size-4 animate-spin" /> : "Carica altri"}
                </button>
              </div>
            )}

            {posts.length >= total && total > 0 && (
              <p className="py-8 text-center text-xs text-[#6B7280]">
                Hai visto tutte le opportunità disponibili
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}