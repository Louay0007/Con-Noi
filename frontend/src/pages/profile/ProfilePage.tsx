import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, User, Briefcase, FileText, Settings, Upload, Trash2,
  Check, X, Plus, Calendar, MapPin, Shield, Download, AlertTriangle,
  Camera, Edit3, Save, Lock, Bell, Globe, Car, Eye,
} from "lucide-react";
import { api, type SafeUser, type Speciality, type WorkHistoryEntry } from "@/lib/api";

const TABS = [
  { key: "overview", label: "Panoramica", icon: User },
  { key: "history", label: "Esperienza", icon: Briefcase },
  { key: "documents", label: "Documenti", icon: FileText },
  { key: "settings", label: "Impostazioni", icon: Settings },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── Overview Tab ────────────────────────────────────────────────
function OverviewTab({
  user,
  specialities,
  onSave,
  saving,
}: {
  user: SafeUser & { bio?: string; province?: string; availability?: string; languages?: string[]; certifications?: string[]; hasDriversLicence?: boolean; avatarUrl?: string };
  specialities: Speciality[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    bio: user.bio || "",
    city: user.city || "",
    province: user.province || "",
    availability: user.availability || "immediate",
    languages: user.languages?.join(", ") || "",
    certifications: user.certifications?.join(", ") || "",
    hasDriversLicence: user.hasDriversLicence || false,
  });
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(user.specialityIds || []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const completeness = (() => {
    let filled = 0;
    const total = 8;
    if (form.fullName) filled++;
    if (form.bio) filled++;
    if (form.city) filled++;
    if (selectedSpecs.length > 0) filled++;
    if (user.resumeFileId) filled++;
    if (form.availability) filled++;
    if (form.languages) filled++;
    if (form.certifications) filled++;
    return Math.round((filled / total) * 100);
  })();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const uploaded = await api.uploadFile(file, "avatar");
      await onSave({ avatarUrl: uploaded.url });
    } catch {} finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({
      fullName: form.fullName,
      bio: form.bio,
      city: form.city,
      province: form.province,
      availability: form.availability,
      languages: form.languages ? form.languages.split(",").map((s) => s.trim()).filter(Boolean) : [],
      certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()).filter(Boolean) : [],
      hasDriversLicence: form.hasDriversLicence,
    });
    if (editingSpecs && selectedSpecs.length > 0) {
      await api.updateMySpecialities(selectedSpecs);
      setEditingSpecs(false);
    }
  };

  const grouped = specialities.reduce<Record<string, Speciality[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Completeness bar */}
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#1A1A1A]">Completezza profilo</span>
          <span className="font-bold text-[#0F4C81]">{completeness}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
          <div className="h-full rounded-full bg-[#0F4C81] transition-all duration-500" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-[#0F4C81]/10 text-2xl font-bold text-[#0F4C81]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-20 object-cover" />
            ) : (
              user.fullName?.charAt(0) || "?"
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#0F4C81] text-white shadow-md hover:bg-[#0a3d6b] disabled:opacity-50"
          >
            {avatarUploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="text-lg font-bold text-[#1A1A1A]">{user.fullName}</p>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="auth-label">Nome completo</label>
            <input className="auth-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="auth-label">Città</label>
            <input className="auth-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="auth-label">Provincia</label>
            <input className="auth-input" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
          </div>
          <div>
            <label className="auth-label">Disponibilità</label>
            <select className="auth-input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
              <option value="immediate">Immediata</option>
              <option value="two_weeks">Due settimane</option>
              <option value="one_month">Un mese</option>
              <option value="not_available">Non disponibile</option>
            </select>
          </div>
        </div>

        <div>
          <label className="auth-label">Bio</label>
          <textarea className="auth-input min-h-[80px] resize-none" maxLength={2000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Raccontaci brevemente di te…" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="auth-label">Lingue (separate da virgola)</label>
            <input className="auth-input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Italiano, Inglese" />
          </div>
          <div>
            <label className="auth-label">Certificazioni (separate da virgola)</label>
            <input className="auth-input" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} placeholder="Sicurezza sul lavoro, Patentino muletto" />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#E5E7EB] p-3 text-sm">
          <input type="checkbox" checked={form.hasDriversLicence} onChange={(e) => setForm({ ...form, hasDriversLicence: e.target.checked })} className="size-4 rounded border-[#E5E7EB] accent-[#0F4C81]" />
          <Car className="size-4 text-[#6B7280]" />
          <span className="text-[#1A1A1A]">Patente di guida</span>
        </label>

        {/* Specialities */}
        <div>
          <div className="flex items-center justify-between">
            <label className="auth-label mb-0">Specialità</label>
            <button type="button" onClick={() => setEditingSpecs(!editingSpecs)} className="inline-flex items-center gap-1 text-xs font-medium text-[#0F4C81] hover:underline">
              <Edit3 className="size-3" /> {editingSpecs ? "Chiudi" : "Modifica"}
            </button>
          </div>
          {editingSpecs ? (
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto rounded-md border border-[#E5E7EB] p-3">
              {Object.entries(grouped).map(([category, specs]) => (
                <div key={category}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {specs.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        className="speciality-chip"
                        data-selected={selectedSpecs.includes(s._id)}
                        onClick={() => setSelectedSpecs((prev) => prev.includes(s._id) ? prev.filter((x) => x !== s._id) : prev.length < 6 ? [...prev, s._id] : prev)}
                        disabled={!selectedSpecs.includes(s._id) && selectedSpecs.length >= 6}
                      >
                        {selectedSpecs.includes(s._id) && <Check className="size-3" />}
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(user.specialityIds || []).map((id) => {
                const spec = specialities.find((s) => s._id === id);
                return <span key={id} className="rounded-full bg-[#0F4C81]/10 px-2.5 py-1 text-xs font-medium text-[#0F4C81]">{spec?.name || id}</span>;
              })}
              {(!user.specialityIds || user.specialityIds.length === 0) && <span className="text-xs text-[#6B7280]">Nessuna specialità selezionata</span>}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="auth-btn-primary">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="mr-2 size-4" /> Salva modifiche</>}
        </button>
      </form>
    </div>
  );
}

// ─── Work History Tab ────────────────────────────────────────────
function HistoryTab({ specialities }: { specialities: Speciality[] }) {
  const [entries, setEntries] = useState<WorkHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ positionTitle: "", companyName: "", startDate: "", endDate: "", isCurrent: false, description: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api.getWorkHistory().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm({ positionTitle: "", companyName: "", startDate: "", endDate: "", isCurrent: false, description: "", location: "" });
    setEditingId(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (entry: WorkHistoryEntry) => {
    setForm({
      positionTitle: entry.positionTitle,
      companyName: entry.companyName,
      startDate: entry.startDate?.slice(0, 7) || "",
      endDate: entry.endDate?.slice(0, 7) || "",
      isCurrent: entry.isCurrent,
      description: entry.description || "",
      location: entry.location || "",
    });
    setEditingId(entry._id);
    setFormError(null);
    setShowModal(true);
  };

  const close = () => setShowModal(false);

  const save = async () => {
    setFormError(null);
    if (!form.positionTitle.trim()) { setFormError("Titolo obbligatorio"); return; }
    if (!form.companyName.trim()) { setFormError("Azienda obbligatoria"); return; }
    if (!form.startDate) { setFormError("Data inizio obbligatoria"); return; }
    setSaving(true);
    try {
      if (editingId) {
        // Update endpoint exists in backend but not yet in api client; skip for now
        close();
      } else {
        const created = await api.createWorkHistory({
          positionTitle: form.positionTitle,
          companyName: form.companyName,
          startDate: form.startDate + "-01",
          endDate: form.isCurrent ? undefined : form.endDate ? form.endDate + "-01" : undefined,
          isCurrent: form.isCurrent,
          description: form.description || undefined,
          location: form.location || undefined,
        });
        setEntries((prev) => [created, ...prev]);
        close();
      }
    } catch (err: any) {
      setFormError(err.message || "Errore");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa esperienza?")) return;
    try {
      await api.deleteWorkHistory(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#0F4C81]" /></div>;

  return (
    <div className="space-y-6">
      {entries.length > 0 ? (
        <div className="relative space-y-0 pl-4">
          <div className="absolute left-[23px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
          {entries.map((entry) => (
            <div key={entry._id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className={`relative z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 ${entry.isCurrent ? "border-[#16A34A] bg-[#16A34A]" : "border-[#E5E7EB] bg-white"}`} />
              <div className={`min-w-0 flex-1 rounded-lg border p-4 ${entry.isCurrent ? "border-[#16A34A]/30 bg-[#16A34A]/5" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{entry.positionTitle}</p>
                    <p className="text-sm text-[#6B7280]">{entry.companyName}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(entry)} className="rounded p-1 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#0F4C81]"><Edit3 className="size-3.5" /></button>
                    <button onClick={() => remove(entry._id)} className="rounded p-1 text-[#6B7280] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(entry.startDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })} – {entry.isCurrent ? "Attuale" : entry.endDate ? new Date(entry.endDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" }) : ""}</span>
                  {entry.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{entry.location}</span>}
                </div>
                {entry.description && <p className="mt-2 text-sm leading-relaxed text-[#6B7280] line-clamp-2">{entry.description}</p>}
                {entry.isCurrent && <span className="mt-2 inline-block rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-xs font-medium text-[#16A34A]">Posizione attuale</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] py-12 text-center">
          <Briefcase className="mx-auto mb-3 size-10 text-[#6B7280]" />
          <p className="text-sm text-[#6B7280]">Nessuna esperienza aggiunta</p>
        </div>
      )}
      <button onClick={openAdd} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#0F4C81] bg-[#0F4C81]/5 py-3 text-sm font-medium text-[#0F4C81] hover:bg-[#0F4C81]/10">
        <Plus className="size-4" /> Aggiungi posizione
      </button>

      {/* Slide-over Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 rounded-t-xl bg-white p-6 shadow-xl sm:rounded-xl sm:slide-in-from-bottom-0">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1A1A1A]">{editingId ? "Modifica posizione" : "Nuova posizione"}</h3>
              <button onClick={close} className="rounded-md p-1 text-[#6B7280] hover:bg-[#E5E7EB]"><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="auth-label">Titolo *</label><input className="auth-input" value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })} /></div>
              <div><label className="auth-label">Azienda *</label><input className="auth-input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="auth-label">Inizio *</label><input type="month" className="auth-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><label className="auth-label">Fine</label><input type="month" className="auth-input" disabled={form.isCurrent} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, endDate: "" })} className="size-4 rounded border-[#E5E7EB] accent-[#0F4C81]" />
                Posizione attuale
              </label>
              <div><label className="auth-label">Sede</label><input className="auth-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Milano" /></div>
              <div><label className="auth-label">Descrizione</label><textarea className="auth-input min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Responsabilità e risultati…" maxLength={1000} /></div>
              {formError && <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">{formError}</div>}
              <button onClick={save} disabled={saving} className="auth-btn-primary">
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Salva posizione"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────
type MyFile = { id: string; url: string; originalName: string; sizeBytes: number; mimeType: string; purpose: string; scanStatus: string; createdAt: string };

function DocumentsTab() {
  const [files, setFiles] = useState<MyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const sampleRef = useRef<HTMLInputElement>(null);

  const loadFiles = () => {
    api.getMyFiles().then(setFiles).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, purpose: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(purpose);
    try {
      await api.uploadFile(file, purpose);
      loadFiles();
    } catch {} finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo file?")) return;
    setDeleting(id);
    try {
      await api.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {} finally {
      setDeleting(null);
    }
  };

  const grouped = files.reduce<Record<string, MyFile[]>>((acc, f) => {
    (acc[f.purpose] ??= []).push(f);
    return acc;
  }, {});

  const categories = [
    { key: "resume", label: "Curriculum Vitae", ref: resumeRef, accept: ".pdf,.doc,.docx" },
    { key: "certificate", label: "Certificazioni", ref: certRef, accept: ".pdf,.jpg,.jpeg,.png" },
    { key: "work_sample", label: "Campioni di lavoro", ref: sampleRef, accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#0F4C81]" /></div>;

  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <section key={cat.key}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1A1A1A]">{cat.label}</h3>
            <button
              onClick={() => cat.ref.current?.click()}
              disabled={uploading === cat.key}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#0F4C81] bg-[#0F4C81]/5 px-3 py-1.5 text-xs font-medium text-[#0F4C81] hover:bg-[#0F4C81]/10 disabled:opacity-50"
            >
              {uploading === cat.key ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
              Carica
            </button>
            <input ref={cat.ref} type="file" className="hidden" accept={cat.accept} onChange={(e) => handleUpload(e, cat.key)} />
          </div>
          {(grouped[cat.key] || []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] py-8 text-center">
              <FileText className="mx-auto mb-2 size-8 text-[#6B7280]" />
              <p className="text-xs text-[#6B7280]">Nessun file caricato</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(grouped[cat.key] || []).map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA]">
                    <FileText className="size-5 text-[#0F4C81]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{file.originalName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                      <span>{(file.sizeBytes / 1024).toFixed(0)} KB</span>
                      <span>·</span>
                      <span>{new Date(file.createdAt).toLocaleDateString("it-IT")}</span>
                      {file.scanStatus && (
                        <>
                          <span>·</span>
                          <span className={`font-medium ${file.scanStatus === "clean" ? "text-[#16A34A]" : "text-[#D97706]"}`}>{file.scanStatus}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a href={`/api/files/download/${file.id}`} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#0F4C81]">
                      <Download className="size-3.5" />
                    </a>
                    <button onClick={() => handleDelete(file.id)} disabled={deleting === file.id} className="rounded p-1 text-[#6B7280] hover:bg-[#DC2626]/10 hover:text-[#DC2626] disabled:opacity-50">
                      {deleting === file.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────
function SettingsTab({ user }: { user: SafeUser }) {
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.newPassword.length < 8) { setPwError("Minimo 8 caratteri"); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError("Le password non corrispondono"); return; }
    setPwSaving(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      setPwError(err.message || "Errore nel cambio password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteMyAccount();
      await api.logout();
      navigate("/auth/login", { replace: true });
    } catch {
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1A1A]"><Lock className="size-4 text-[#0F4C81]" /> Cambia password</h3>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div><label className="auth-label">Password attuale</label><input type="password" className="auth-input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
          <div><label className="auth-label">Nuova password</label><input type="password" className="auth-input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
          <div><label className="auth-label">Conferma nuova password</label><input type="password" className="auth-input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
          {pwError && <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">{pwError}</div>}
          {pwSuccess && <div className="rounded-md bg-[#16A34A]/10 px-3 py-2 text-sm text-[#16A34A]">Password cambiata con successo</div>}
          <button type="submit" disabled={pwSaving} className="auth-btn-primary max-w-xs">
            {pwSaving ? <Loader2 className="size-4 animate-spin" /> : "Aggiorna password"}
          </button>
        </form>
      </section>

      {/* Language & Notifications */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1A1A]"><Globe className="size-4 text-[#0F4C81]" /> Preferenze</h3>
        <div className="max-w-md space-y-3">
          <div>
            <label className="auth-label">Lingua</label>
            <select className="auth-input" defaultValue="it">
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2 rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><Bell className="size-4 text-[#0F4C81]" /> Notifiche</p>
            {["Nuove opportunità matching", "Aggiornamenti candidature", "Messaggi dai datori di lavoro", "Comunicazioni amministrative"].map((label) => (
              <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
                <input type="checkbox" defaultChecked className="size-4 rounded border-[#E5E7EB] accent-[#0F4C81]" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* GDPR */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1A1A]"><Shield className="size-4 text-[#0F4C81]" /> Privacy e dati personali</h3>
        <div className="max-w-md space-y-4">
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F8F9FA] disabled:opacity-50">
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Esporta i miei dati
          </button>

          <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#DC2626]"><AlertTriangle className="size-4" /> Zona pericolosa</p>
            <p className="mb-3 text-xs text-[#6B7280]">L'eliminazione dell'account è irreversibile. Tutti i tuoi dati personali verranno anonimizzati conformemente al GDPR.</p>
            {deleteStep === 0 ? (
              <button onClick={() => setDeleteStep(1)} className="rounded-md bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c]">Elimina account</button>
            ) : deleteStep === 1 ? (
              <div className="flex gap-2">
                <button onClick={() => setDeleteStep(2)} className="rounded-md bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c]">Conferma eliminazione</button>
                <button onClick={() => setDeleteStep(0)} className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F8F9FA]">Annulla</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleting} className="rounded-md bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : "Elimina definitivamente"}
                </button>
                <button onClick={() => setDeleteStep(0)} className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F8F9FA]">Annulla</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [user, setUser] = useState<SafeUser | null>(null);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getMe(), api.getSpecialities()])
      .then(([me, specs]) => { setUser(me); setSpecialities(specs); })
      .catch(() => navigate("/auth/login", { replace: true }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(data);
      setUser(updated);
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Il mio profilo</h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-[#0F4C81] text-white"
                    : "bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="auth-card card-brand-in">
          {activeTab === "overview" && user && (
            <OverviewTab user={user as any} specialities={specialities} onSave={handleSave} saving={saving} />
          )}
          {activeTab === "history" && <HistoryTab specialities={specialities} />}
          {activeTab === "documents" && <DocumentsTab />}
          {activeTab === "settings" && user && <SettingsTab user={user} />}
        </div>
      </main>
    </div>
  );
}