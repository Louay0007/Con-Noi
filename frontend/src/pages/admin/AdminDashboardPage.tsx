import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, FileText, TrendingUp, Percent,
  Plus, Megaphone, ScrollText, Loader2, BarChart3,
} from "lucide-react";
import { api, type Post } from "@/lib/api";

type Stats = {
  totals: { users: number; activeWorkers: number; posts: number; publishedPosts: number; applications: number; acceptedApplications: number; rejectedApplications: number };
  last30Days: { signups: number; posts: number; applications: number };
  acceptanceRate: number;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [specialities, setSpecialities] = useState<Array<{ name: string; postCount: number; applicationCount: number }>>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.adminGetStats(),
      api.adminGetFunnel(),
      api.adminGetSpecialityDemand(),
      api.adminGetTopPosts(),
    ])
      .then(([s, f, sp, tp]) => {
        setStats(s);
        setFunnel(f);
        setSpecialities(sp);
        setTopPosts(tp);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: "Utenti totali", value: stats.totals.users, icon: Users, color: "text-[#0F4C81]", bg: "bg-[#0F4C81]/10" },
    { label: "Lavoratori attivi", value: stats.totals.activeWorkers, icon: Briefcase, color: "text-[#16A34A]", bg: "bg-[#16A34A]/10" },
    { label: "Annunci pubblicati", value: stats.totals.publishedPosts, icon: FileText, color: "text-[#E67E22]", bg: "bg-[#E67E22]/10" },
    { label: "Candidature (30gg)", value: stats.last30Days.applications, icon: TrendingUp, color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
    { label: "Tasso accettazione", value: `${stats.acceptanceRate}%`, icon: Percent, color: "text-[#DC2626]", bg: "bg-[#DC2626]/10" },
  ] : [];

  const funnelSteps = ["submitted", "reviewed", "accepted", "rejected", "withdrawn"];
  const funnelLabels: Record<string, string> = { submitted: "Inviate", reviewed: "Esaminate", accepted: "Accettate", rejected: "Rifiutate", withdrawn: "Ritirate" };
  const maxFunnel = Math.max(...funnelSteps.map((s) => funnel[s] || 0), 1);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard Amministrativa</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate("/admin/posts/new")} className="inline-flex items-center gap-1.5 rounded-md bg-[#0F4C81] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0a3d6b]">
              <Plus className="size-3.5" /> Nuovo annuncio
            </button>
            <button onClick={() => navigate("/admin/broadcast")} className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F8F9FA]">
              <Megaphone className="size-3.5" /> Broadcast
            </button>
            <button onClick={() => navigate("/admin/audit")} className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F8F9FA]">
              <ScrollText className="size-3.5" /> Audit Log
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                <div className={`mb-3 inline-flex size-9 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`size-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{card.value}</p>
                <p className="text-xs text-[#6B7280]">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Application Funnel */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
              <BarChart3 className="size-4 text-[#0F4C81]" /> Funnel candidature
            </h2>
            <div className="space-y-3">
              {funnelSteps.map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-[#6B7280]">{funnelLabels[step]}</span>
                  <div className="flex-1 h-6 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full bg-[#0F4C81] transition-all duration-500"
                      style={{ width: `${((funnel[step] || 0) / maxFunnel) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-[#1A1A1A]">{funnel[step] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Specialities */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
              <TrendingUp className="size-4 text-[#0F4C81]" /> Specialità più richieste
            </h2>
            <div className="space-y-3">
              {specialities.slice(0, 8).map((spec) => (
                <div key={spec.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs font-medium text-[#1A1A1A]">{spec.name}</span>
                  <div className="flex-1 h-5 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full bg-[#E67E22] transition-all duration-500"
                      style={{ width: `${Math.min((spec.applicationCount / Math.max(...specialities.map((s) => s.applicationCount), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[10px] text-[#6B7280]">{spec.applicationCount}</span>
                </div>
              ))}
              {specialities.length === 0 && <p className="text-sm text-[#6B7280]">Nessun dato disponibile</p>}
            </div>
          </div>
        </div>

        {/* Top Posts Table */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white">
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-base font-bold text-[#1A1A1A]">Annunci più popolari</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] text-xs uppercase text-[#6B7280]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Titolo</th>
                  <th className="px-6 py-3 font-semibold">Azienda</th>
                  <th className="px-6 py-3 font-semibold text-right">Visualizzazioni</th>
                  <th className="px-6 py-3 font-semibold text-right">Like</th>
                  <th className="px-6 py-3 font-semibold text-right">Candidature</th>
                  <th className="px-6 py-3 font-semibold">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {topPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-[#F8F9FA]">
                    <td className="px-6 py-3 font-medium text-[#1A1A1A]">{post.title}</td>
                    <td className="px-6 py-3 text-[#6B7280]">{post.company.name}</td>
                    <td className="px-6 py-3 text-right text-[#1A1A1A]">{post.stats.views}</td>
                    <td className="px-6 py-3 text-right text-[#1A1A1A]">{post.stats.likes}</td>
                    <td className="px-6 py-3 text-right font-semibold text-[#0F4C81]">{post.stats.applications}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        post.status === "published" ? "bg-[#16A34A]/10 text-[#16A34A]" :
                        post.status === "closed" ? "bg-[#6B7280]/10 text-[#6B7280]" :
                        "bg-[#D97706]/10 text-[#D97706]"
                      }`}>{post.status}</span>
                    </td>
                  </tr>
                ))}
                {topPosts.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-[#6B7280]">Nessun annuncio disponibile</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}