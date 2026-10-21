import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Briefcase, Heart } from "lucide-react";
import { api, type Post, type SafeUser } from "@/lib/api";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";

export default function ForYouPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load user + initial feed + liked IDs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, feed, liked] = await Promise.all([
          api.getMe(),
          api.getFeed(undefined, 20),
          api.getLikedIds(),
        ]);
        if (cancelled) return;
        setUser(me);
        setPosts(feed.items);
        setCursor(feed.nextCursor);
        setLikedIds(new Set(liked));
      } catch {
        navigate("/auth/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const feed = await api.getFeed(cursor, 20);
      setPosts((prev) => [...prev, ...feed.items]);
      setCursor(feed.nextCursor);
    } catch {}
    finally { setLoadingMore(false); }
  }, [cursor, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Pull-to-refresh (simple implementation)
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const feed = await api.getFeed(undefined, 20);
      setPosts(feed.items);
      setCursor(feed.nextCursor);
    } catch {}
    finally { setRefreshing(false); }
  };

  const handleApply = (post: Post) => {
    navigate(`/apply/${post._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // Empty state: no specialities
  if (user && (!user.specialityIds || user.specialityIds.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#0F4C81]/10">
          <Search className="size-10 text-[#0F4C81]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Completa il tuo profilo</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6B7280]">
          Aggiungi le tue specialità per ricevere opportunità di lavoro personalizzate e pertinenti alla tua esperienza.
        </p>
        <button
          onClick={() => navigate("/onboarding")}
          className="mt-6 rounded-md bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b]"
        >
          Completa profilo
        </button>
      </div>
    );
  }

  const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <Loader2 className="size-5 animate-spin text-[#0F4C81]" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Opportunità per te</h1>
            <p className="text-xs text-[#6B7280]">Aggiornato alle {now}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-md p-2 text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#0F4C81] disabled:opacity-50"
            aria-label="Aggiorna feed"
          >
            <Loader2 className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Feed grid */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 size-12 text-[#6B7280]" />
            <p className="text-sm text-[#6B7280]">Nessuna opportunità disponibile al momento.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <JobCard
                key={post._id}
                post={post}
                liked={likedIds.has(post._id)}
                showMatchScore
                onApply={handleApply}
              />
            ))}
          </div>
        )}

        {/* Loading more skeleton */}
        {loadingMore && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        )}

        {/* End of feed */}
        {!cursor && posts.length > 0 && (
          <p className="py-8 text-center text-xs text-[#6B7280]">
            Hai visto tutte le opportunità disponibili
          </p>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </main>
    </div>
  );
}