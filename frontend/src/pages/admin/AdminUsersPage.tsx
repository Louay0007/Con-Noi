import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Search, CheckCircle2, XCircle, Trash2, Edit3,
} from "lucide-react";
import { api, type SafeUser } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Seo } from "@/components/Seo";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { showSuccess, showError } from "@/utils/toast";

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
  const [pendingDelete, setPendingDelete] = useState<SafeUser | null>(null);

  const fetchUsers = useCallback(async (p: number) => {
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
    } catch {
      showError("Non è stato possibile caricare gli utenti");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleToggleStatus = async (user: SafeUser) => {
    setActionLoading(user.id);
    try {
      const newStatus = !(user.isActive ?? true);
      await api.adminUpdateUserStatus(user.id, newStatus);
      showSuccess(newStatus ? "Utente riattivato" : "Utente disattivato");
      fetchUsers(page);
    } catch {
      showError("Modifica dello stato non riuscita");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: SafeUser) => {
    setActionLoading(user.id);
    try {
      await api.adminDeleteUser(user.id);
      showSuccess("Utente eliminato");
      setPendingDelete(null);
      fetchUsers(page);
    } catch {
      showError("Eliminazione non riuscita");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Seo title="Gestione utenti — Admin Con noi" description="Gestisci gli account della piattaforma." noindex />
      <AdminShell title="Gestione utenti" description={`${total} ${total === 1 ? "utente" : "utenti"} in totale`}>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor="users-search" className="sr-only">Cerca utenti</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4B5563]" aria-hidden="true" />
            <input
              id="users-search"
              type="search"
              placeholder="Cerca nome, email, città…"
              className="field-control field-control--sm bg-[#F8F9FA] pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="users-role" className="sr-only">Filtra per ruolo</label>
            <select
              id="users-role"
              className="field-control field-control--sm w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tutti i ruoli</option>
              <option value="worker">Lavoratore</option>
              <option value="admin">Amministratore</option>
            </select>
          </div>
          <div>
            <label htmlFor="users-status" className="sr-only">Filtra per stato</label>
            <select
              id="users-status"
              className="field-control field-control--sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="inactive">Disattivati</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {loading ? (
            <div className="flex justify-center py-16">
              <h1 className="sr-only">Utenti</h1>
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento utenti" />
            </div>
          ) : (
            <div tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F4C81]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Elenco utenti con ruolo, città, stato e azioni</caption>
                <thead className="bg-[#F8F9FA] text-xs uppercase text-[#4B5563]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Ruolo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Città</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Stato</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {users.map((user) => {
                    const isActive = user.isActive !== false;
                    return (
                      <tr key={user.id} className="hover:bg-[#F8F9FA]">
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">{user.fullName}</td>
                        <td className="px-4 py-3 text-[#4B5563]">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`status-pill ${user.role === "admin" ? "status-pill--info" : "status-pill--neutral"}`}>
                            {user.role === "admin" ? "Admin" : "Lavoratore"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#4B5563]">{user.city || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`status-pill ${isActive ? "status-pill--success" : "status-pill--danger"}`}>
                            {isActive ? "Attivo" : "Disattivato"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="icon-action text-[#4B5563] hover:text-[#0F4C81]"
                              aria-label={`Dettagli di ${user.fullName}`}
                            >
                              <Edit3 className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={actionLoading === user.id}
                              className={`icon-action ${isActive ? "text-[#B91C1C] hover:bg-[#FCE9E9]" : "text-[#15803D] hover:bg-[#E8F6ED]"}`}
                              aria-label={`${isActive ? "Disattiva" : "Riattiva"} ${user.fullName}`}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              ) : isActive ? (
                                <XCircle className="size-4" aria-hidden="true" />
                              ) : (
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              onClick={() => setPendingDelete(user)}
                              disabled={actionLoading === user.id}
                              className="icon-action text-[#B91C1C] hover:bg-[#FCE9E9]"
                              aria-label={`Elimina ${user.fullName}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#4B5563]">
                        Nessun utente trovato
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
          <nav aria-label="Paginazione utenti" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4B5563]">{total} utenti totali</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page <= 1 || loading}
                className="min-h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="px-1 text-sm text-[#4B5563]" aria-live="polite">Pagina {page} di {totalPages}</span>
              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page >= totalPages || loading}
                className="min-h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium transition-colors hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </nav>
        )}
      </AdminShell>

      {/* User detail drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
            aria-label="Chiudi il dettaglio"
          />
          <div className="relative w-full max-w-md animate-in slide-in-from-right-4 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 id="user-detail-title" className="text-lg font-bold text-[#1A1A1A]">Dettaglio utente</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="icon-action text-[#4B5563]"
                  aria-label="Chiudi il dettaglio"
                  autoFocus
                >
                  <XCircle className="size-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#E8F0F9] text-xl font-bold text-[#0F4C81]" aria-hidden="true">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-[#1A1A1A]">{selectedUser.fullName}</p>
                    <p className="truncate text-sm text-[#4B5563]">{selectedUser.email}</p>
                  </div>
                </div>
                <dl className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#4B5563]">Ruolo</dt>
                    <dd className="font-medium text-[#1A1A1A]">{selectedUser.role === "admin" ? "Amministratore" : "Lavoratore"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#4B5563]">Città</dt>
                    <dd className="font-medium text-[#1A1A1A]">{selectedUser.city || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#4B5563]">Specialità</dt>
                    <dd className="font-medium text-[#1A1A1A]">{selectedUser.specialityIds?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#4B5563]">Onboarding</dt>
                    <dd className={`font-medium ${selectedUser.onboardingCompleted ? "text-[#15803D]" : "text-[#B45309]"}`}>
                      {selectedUser.onboardingCompleted ? "Completato" : "Incompleto"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare questo utente?"
        description={
          pendingDelete
            ? `L'account di ${pendingDelete.fullName} (${pendingDelete.email}) verrà eliminato definitivamente insieme ai suoi dati. L'operazione non può essere annullata.`
            : ""
        }
        confirmLabel="Elimina utente"
        destructive
        loading={actionLoading !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </>
  );
}
