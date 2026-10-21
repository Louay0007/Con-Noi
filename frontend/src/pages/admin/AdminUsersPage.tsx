import { useState, useEffect } from "react";
import {
  Loader2, Search, User, Shield, MapPin, Clock,
  CheckCircle2, XCircle, Trash2, Edit3, MoreVertical,
} from "lucide-react";
import { api, type SafeUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  const fetchUsers = async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = { page: p, limit: 20 };
      if (search) params.q = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter === "active") params.isActive = true;
      if (statusFilter === "inactive") params.isActive = false;
      const result = await api.adminGetUsers(params);
      setUsers(result.items);
      setTotal(result.total);
      setPage(p);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1); }, [search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: SafeUser) => {
    setActionLoading(user.id);
    try {
      const newStatus = !(user as any).isActive;
      await api.adminUpdateUserStatus(user.id, newStatus);
      fetchUsers(page);
    } catch {} finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo utente? L'azione è irreversibile.")) return;
    setActionLoading(id);
    try {
      await api.adminDeleteUser(id);
      fetchUsers(page);
    } catch {} finally { setActionLoading(null); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-5">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Gestione Utenti</h1>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Cerca nome, email, città…"
              className="h-9 w-full rounded-md border border-[#E5E7EB] bg-[#F8F9FA] pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tutti i ruoli</option>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
          <select className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#0F4C81] focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tutti gli stati</option>
            <option value="active">Attivi</option>
            <option value="inactive">Disattivati</option>
          </select>
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
                    <th className="px-6 py-3 font-semibold">Nome</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Ruolo</th>
                    <th className="px-6 py-3 font-semibold">Città</th>
                    <th className="px-6 py-3 font-semibold">Stato</th>
                    <th className="px-6 py-3 font-semibold text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {users.map((user) => {
                    const isActive = (user as any).isActive !== false;
                    return (
                      <tr key={user.id} className="hover:bg-[#F8F9FA]">
                        <td className="px-6 py-3 font-medium text-[#1A1A1A]">{user.fullName}</td>
                        <td className="px-6 py-3 text-[#6B7280]">{user.email}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            user.role === "admin" ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-[#0F4C81]/10 text-[#0F4C81]"
                          }`}>{user.role}</span>
                        </td>
                        <td className="px-6 py-3 text-[#6B7280]">{user.city || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isActive ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#DC2626]/10 text-[#DC2626]"
                          }`}>{isActive ? "Attivo" : "Disattivato"}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelectedUser(user)} className="rounded p-1.5 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#0F4C81]" title="Dettagli"><Edit3 className="size-4" /></button>
                            <button onClick={() => handleToggleStatus(user)} disabled={actionLoading === user.id} className={`rounded p-1.5 hover:bg-[#F8F9FA] disabled:opacity-50 ${isActive ? "text-[#DC2626] hover:bg-[#DC2626]/10" : "text-[#16A34A] hover:bg-[#16A34A]/10"}`} title={isActive ? "Disattiva" : "Attiva"}>
                              {actionLoading === user.id ? <Loader2 className="size-4 animate-spin" /> : isActive ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                            </button>
                            <button onClick={() => handleDelete(user.id)} disabled={actionLoading === user.id} className="rounded p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 disabled:opacity-50" title="Elimina"><Trash2 className="size-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7280]">Nessun utente trovato</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">{total} utenti totali</p>
            <div className="flex gap-2">
              <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Precedente</button>
              <span className="flex items-center px-3 text-sm text-[#6B7280]">Pagina {page} di {totalPages}</span>
              <button onClick={() => fetchUsers(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50">Successiva</button>
            </div>
          </div>
        )}
      </main>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md animate-in slide-in-from-right-4 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-lg font-bold text-[#1A1A1A]">Dettaglio Utente</h2>
                <button onClick={() => setSelectedUser(null)} className="rounded-md p-1 text-[#6B7280] hover:bg-[#F8F9FA]"><XCircle className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#0F4C81]/10 text-xl font-bold text-[#0F4C81]">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">{selectedUser.fullName}</p>
                    <p className="text-sm text-[#6B7280]">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-sm">
                  <div className="flex justify-between"><span className="text-[#6B7280]">Ruolo</span><span className="font-medium text-[#1A1A1A] capitalize">{selectedUser.role}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Città</span><span className="font-medium text-[#1A1A1A]">{selectedUser.city || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Specialità</span><span className="font-medium text-[#1A1A1A]">{selectedUser.specialityIds?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Onboarding</span><span className={`font-medium ${selectedUser.onboardingCompleted ? "text-[#16A34A]" : "text-[#D97706]"}`}>{selectedUser.onboardingCompleted ? "Completato" : "Incompleto"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}