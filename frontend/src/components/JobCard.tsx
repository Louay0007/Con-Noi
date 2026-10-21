import { useState } from "react";
import { Heart, MapPin, Clock, Briefcase, Euro } from "lucide-react";
import { api, type Post } from "@/lib/api";

type JobCardProps = {
  post: Post;
  liked?: boolean;
  showMatchScore?: boolean;
  onApply?: (post: Post) => void;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g fa`;
  return `${Math.floor(days / 30)}m fa`;
}

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

function matchColor(score: number): string {
  if (score >= 75) return "bg-[#16A34A]";
  if (score >= 50) return "bg-[#D97706]";
  return "bg-[#DC2626]";
}

export function JobCard({ post, liked: initialLiked, showMatchScore, onApply }: JobCardProps) {
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [toggling, setToggling] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setLiked((prev) => !prev);
    setToggling(true);
    try {
      const result = await api.toggleLike(post._id);
      setLiked(result.liked);
    } catch {
      setLiked((prev) => !prev);
    } finally {
      setToggling(false);
    }
  };

  const visibleSpecs = post.specialityIds.slice(0, 3);
  const overflowCount = post.specialityIds.length - 3;

  return (
    <article className="group relative flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-5 transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
      {/* Badges */}
      {(post.isUrgent || post.isFeatured) && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          {post.isUrgent && (
            <span className="rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
              Urgente
            </span>
          )}
          {post.isFeatured && (
            <span className="rounded-full bg-[#E67E22]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E67E22]">
              In evidenza
            </span>
          )}
        </div>
      )}

      {/* Company row */}
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] text-lg font-bold text-[#0F4C81]">
          {post.company.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#6B7280]">{post.company.name}</p>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <MapPin className="size-3" />
            <span className="truncate">
              {post.location.city}
              {post.location.province ? `, ${post.location.province}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-[#1A1A1A] group-hover:text-[#0F4C81]">
        {post.title}
      </h3>

      {/* Salary */}
      <div className="mt-2 flex items-center gap-1.5">
        <Euro className="size-3.5 text-[#6B7280]" />
        <span className="text-sm font-medium text-[#1A1A1A]">{formatSalary(post.salary)}</span>
      </div>

      {/* Speciality chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleSpecs.map((specId) => (
          <span
            key={specId}
            className="rounded-full bg-[#F8F9FA] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]"
          >
            {specId}
          </span>
        ))}
        {overflowCount > 0 && (
          <span className="rounded-full bg-[#F8F9FA] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]">
            +{overflowCount}
          </span>
        )}
      </div>

      {/* Match score */}
      {showMatchScore && post.matchScore !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#6B7280]">Match</span>
            <span className="font-bold text-[#1A1A1A]">{Math.round(post.matchScore)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${matchColor(post.matchScore)}`}
              style={{ width: `${post.matchScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeAgo(post.publishedAt || post.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`flex size-9 items-center justify-center rounded-full transition-colors ${
              liked
                ? "bg-[#DC2626]/10 text-[#DC2626]"
                : "bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]"
            }`}
            aria-label={liked ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          </button>
          {onApply && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply(post); }}
              className="rounded-md bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0a3d6b]"
            >
              Candidati
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-lg bg-[#E5E7EB]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-[#E5E7EB]" />
          <div className="h-3 w-1/3 rounded bg-[#E5E7EB]" />
        </div>
      </div>
      <div className="mt-3 h-5 w-3/4 rounded bg-[#E5E7EB]" />
      <div className="mt-2 h-4 w-1/2 rounded bg-[#E5E7EB]" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-[#E5E7EB]" />
        <div className="h-5 w-16 rounded-full bg-[#E5E7EB]" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
        <div className="h-9 w-20 rounded-md bg-[#E5E7EB]" />
      </div>
    </div>
  );
}