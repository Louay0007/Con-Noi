import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, FileText, TrendingUp, Percent,
  Plus, Megaphone, ScrollText, Loader2, BarChart3,
} from "lucide-react";
import { api, type Post } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Seo } from "@/components/Seo";
import { showError } from "@/utils/toast";

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
      .catch(() => showError("Non è stato possibile caricare le statistiche"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <h1 className="sr-only">Dashboard</h1>
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento dashboard" />
      </main>
    );
  }

  const statCards = stats ? [
    { label: "Utenti totali", value: stats.totals.users, icon: Users, color: "text-[#0F4C81]", bg: "bg-[#E8F0F9]" },
    { label: "Lavoratori attivi", value: stats.totals.activeWorkers, icon: Briefcase, color: "text-[#15803D]", bg: "bg-[#E8F6ED]" },
    { label: "Annunci pubblicati", value: stats.totals.publishedPosts, icon: FileText, color: "text-[#B45309]", bg: "bg-[#FDF2E9]" },
    { label: "Candidature (30gg)", value: stats.last30Days.applications, icon: TrendingUp, color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
    { label: "Tasso accettazione", value: `${stats.acceptanceRate}%`, icon: Percent, color: "text-[#B91C1C]", bg: "bg-[#FCE9E9]" },
  ] : [];

  const funnelSteps = ["submitted", "reviewed", "accepted", "rejected", "withdrawn"];
  const funnelLabels: Record<string, string> = { submitted: "Inviate", reviewed: "Esaminate", accepted: "Accettate", rejected: "Rifiutate", withdrawn: "Ritirate" };
  const maxFunnel = Math.max(...funnelSteps.map((s) => funnel[s] || 0), 1);

  return (
    <>
      <Seo title="Dashboard — Admin Con noi" description="Statistiche e stato della piattaforma." noindex />
      <AdminShell
        title="Dashboard"
        description="Panoramica della piattaforma"
        actions={
          /* Wraps instead of overflowing at 375px, where this cluster used to
             push the document 81px wide. */
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/admin/posts/new")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#0F4C81] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#0a3d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
            >
              <Plus className="size-3.5" aria-hidden="true" /> Nuovo annuncio
            </button>
            <button
              onClick={() => navigate("/admin/broadcast")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
            >
              <Megaphone className="size-3.5" aria-hidden="true" /> Broadcast
            </button>
          </div>
        }
      >
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
                <p className="text-xs text-[#4B5563]">{card.label}</p>
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
                  <span className="w-20 shrink-0 text-xs font-medium text-[#4B5563]">{funnelLabels[step]}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]" role="img" aria-label={`${funnelLabels[step]}: ${funnel[step] || 0} candidature`}>
                    <div
                      className="h-full rounded-full bg-[#0F4C81] transition-[width] duration-500 ease-out"
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
                      className="h-full rounded-full bg-[#B45309] transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.min((spec.applicationCount / Math.max(...specialities.map((s) => s.applicationCount), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-[#4B5563]">{spec.applicationCount}</span>
                </div>
              ))}
              {specialities.length === 0 && <p className="text-sm text-[#4B5563]">Nessun dato disponibile</p>}
            </div>
          </div>
        </div>

        {/* Top Posts Table */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white">
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-base font-bold text-[#1A1A1A]">Annunci più popolari</h2>
          </div>
          <div tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Annunci più popolari con visualizzazioni, like e candidature</caption>
              <thead className="bg-[#F8F9FA] text-xs uppercase text-[#4B5563]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Titolo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Azienda</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Visualizzazioni</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Like</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Candidature</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {topPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-[#F8F9FA]">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{post.title}</td>
                    <td className="px-4 py-3 text-[#4B5563]">{post.company.name}</td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]">{post.stats.views}</td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]">{post.stats.likes}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0F4C81]">{post.stats.applications}</td>
                    <td className="px-4 py-3">
                      <span className={`status-pill ${
                        post.status === "published" ? "status-pill--success" :
                        post.status === "closed" ? "status-pill--neutral" :
                        "status-pill--warning"
                      }`}>
                        {post.status === "published" ? "Pubblicato" : post.status === "closed" ? "Chiuso" : "Bozza"}
                      </span>
                    </td>
                  </tr>
                ))}
                {topPosts.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-[#4B5563]">Nessun annuncio disponibile</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminShell>
    </>
  );
}