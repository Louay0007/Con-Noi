import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2, MapPin, Briefcase, Clock, Euro, Calendar, Users,
  FileText, Download, Heart, ChevronLeft, Eye, Share2,
} from "lucide-react";
import { api, type Post } from "@/lib/api";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";

function formatSalary(salary?: Post["salary"]): string {
  if (!salary) return "Trattativa riservata";
  if (salary.isNegotiable) return "Trattativa riservata";
  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: salary.currency || "EUR", maximumFractionDigits: 0 }).format(n);
  if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)}`;
  if (salary.min) return `da ${fmt(salary.min)}`;
  if (salary.max) return `fino a ${fmt(salary.max)}`;
  return "Trattativa riservata";
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Tempo pieno",
  part_time: "Part-time",
  contract: "Contratto",
  temporary: "Temporaneo",
  seasonal: "Stagionale",
  internship: "Stage",
};

const CONTRACT_LABELS: Record<string, string> = {
  permanent: "Indeterminato",
  fixed_term: "Determinato",
  seasonal: "Stagionale",
  noleggio: "Somministrazione",
  stage: "Stage",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await api.getPost(id);
        if (cancelled) return;
        setPost(p);
        // Fetch related posts by first speciality
        if (p.specialityIds.length > 0) {
          try {
            const browse = await api.browsePosts({
              specialityIds: p.specialityIds[0],
              limit: 4,
              sort: "recent",
            });
            if (!cancelled) {
              setRelatedPosts(browse.items.filter((rp) => rp._id !== id).slice(0, 3));
            }
          } catch {}
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    setLiked((prev) => !prev);
    try {
      const result = await api.toggleLike(post._id);
      setLiked(result.liked);
    } catch {
      setLiked((prev) => !prev);
    }
  };

  const handleApply = () => {
    if (post) navigate(`/apply/${post._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-[#E5E7EB]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-center">
        <Briefcase className="mb-4 size-12 text-[#6B7280]" />
        <h1 className="text-xl font-bold text-[#1A1A1A]">Opportunità non trovata</h1>
        <p className="mt-2 text-sm text-[#6B7280]">Questa posizione potrebbe essere stata chiusa o rimossa.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3d6b]"
        >
          <ChevronLeft className="size-4" /> Torna indietro
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Back nav */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#6B7280] hover:text-[#0F4C81]"
          >
            <ChevronLeft className="size-4" /> Indietro
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {post.coverFileId && (
            <div className="h-48 w-full bg-[#E5E7EB] sm:h-56">
              <img
                src={`/api/files/download/${post.coverFileId}`}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-6">
            {/* Company + location row */}
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FA] text-xl font-bold text-[#0F4C81]">
                {post.company.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#6B7280]">{post.company.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <MapPin className="size-3" />
                  {post.location.city}
                  {post.location.province ? `, ${post.location.province}` : ""}
                  {post.location.remote && <span className="ml-1 rounded bg-[#0F4C81]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#0F4C81]">Remoto</span>}
                </div>
              </div>
            </div>

            {/* Title + view counter */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight text-[#1A1A1A]">{post.title}</h1>
              <span className="flex shrink-0 items-center gap-1 text-xs text-[#6B7280]">
                <Eye className="size-3" /> {post.stats.views} visualizzazioni
              </span>
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {post.isUrgent && (
                <span className="rounded-full bg-[#DC2626]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#DC2626]">Urgente</span>
              )}
              {post.isFeatured && (
                <span className="rounded-full bg-[#E67E22]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#E67E22]">In evidenza</span>
              )}
            </div>
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <Briefcase className="mb-2 size-4 text-[#0F4C81]" />
            <p className="text-xs text-[#6B7280]">Tipo di impiego</p>
            <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">{EMPLOYMENT_LABELS[post.employmentType] || post.employmentType}</p>
          </div>
          {post.contractType && (
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <FileText className="mb-2 size-4 text-[#0F4C81]" />
              <p className="text-xs text-[#6B7280]">Contratto</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">{CONTRACT_LABELS[post.contractType] || post.contractType}</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <Euro className="mb-2 size-4 text-[#0F4C81]" />
            <p className="text-xs text-[#6B7280]">Retribuzione</p>
            <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">{formatSalary(post.salary)}</p>
          </div>
          {post.schedule && (
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <Clock className="mb-2 size-4 text-[#0F4C81]" />
              <p className="text-xs text-[#6B7280]">Orario</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">{post.schedule.hoursPerWeek}h/settimana</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <Users className="mb-2 size-4 text-[#0F4C81]" />
            <p className="text-xs text-[#6B7280]">Posizioni aperte</p>
            <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">{post.openings}</p>
          </div>
          {post.applicationDeadline && (
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <Calendar className="mb-2 size-4 text-[#0F4C81]" />
              <p className="text-xs text-[#6B7280]">Scadenza</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1A1A1A]">
                {new Date(post.applicationDeadline).toLocaleDateString("it-IT")}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <section className="mt-8 rounded-lg border border-[#E5E7EB] bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">Descrizione</h2>
          <div className="prose prose-sm max-w-none text-[#1A1A1A] whitespace-pre-line leading-relaxed">
            {post.description}
          </div>
        </section>

        {/* Requirements & Benefits side-by-side */}
        {(post.requirements.length > 0 || post.benefits.length > 0) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {post.requirements.length > 0 && (
              <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#1A1A1A]">Requisiti</h2>
                <ul className="space-y-2">
                  {post.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#0F4C81]" />
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {post.benefits.length > 0 && (
              <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#1A1A1A]">Benefit</h2>
                <ul className="space-y-2">
                  {post.benefits.map((ben, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                      {ben}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Gallery */}
        {post.galleryFileIds.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold text-[#1A1A1A]">Galleria</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {post.galleryFileIds.map((fileId) => (
                <img
                  key={fileId}
                  src={`/api/files/download/${fileId}`}
                  alt=""
                  className="h-40 w-56 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        {/* Attachments */}
        {post.attachments.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold text-[#1A1A1A]">Allegati</h2>
            <div className="space-y-2">
              {post.attachments.map((att, i) => (
                <a
                  key={i}
                  href={`/api/files/download/${att.fileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 transition-colors hover:bg-[#F8F9FA]"
                >
                  <FileText className="size-5 text-[#0F4C81]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{att.label || "Documento"}</p>
                    <p className="text-xs text-[#6B7280]">{att.kind}</p>
                  </div>
                  <Download className="size-4 text-[#6B7280]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">Altre opportunità simili</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((rp) => (
                <JobCard key={rp._id} post={rp} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex size-11 items-center justify-center rounded-full border transition-colors ${
              liked
                ? "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]"
                : "border-[#E5E7EB] bg-white text-[#6B7280]"
            }`}
            aria-label={liked ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-md bg-[#0F4C81] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b]"
          >
            Candidati
          </button>
        </div>
      </div>

      {/* Desktop CTA bar */}
      <div className="hidden sm:block">
        <div className="mx-auto mt-8 flex max-w-3xl items-center justify-end gap-3 px-4">
          <button
            onClick={handleLike}
            className={`flex size-11 items-center justify-center rounded-full border transition-colors ${
              liked
                ? "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]"
                : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8F9FA]"
            }`}
            aria-label={liked ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleApply}
            className="rounded-md bg-[#0F4C81] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b]"
          >
            Candidati
          </button>
        </div>
      </div>
    </div>
  );
}