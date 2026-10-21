import { useState, useEffect, useRef, useCallback, type FormEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Check, Upload, FileText, X, Plus, Trash2,
  Briefcase, Calendar, MapPin, ChevronRight, Confetti,
} from "lucide-react";
import { api, type SafeUser, type Speciality, type WorkHistoryEntry, type UploadedFile } from "@/lib/api";

// ─── Step Indicator ──────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Specialità" },
  { id: 2, label: "Curriculum" },
  { id: 3, label: "Esperienza" },
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = step.id === current;
        const isDone = step.id < current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                isDone
                  ? "bg-[#16A34A] text-white"
                  : isActive
                    ? "bg-[#0F4C81] text-white"
                    : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {isDone ? <Check className="size-4" /> : step.id}
            </div>
            <span
              className={`hidden text-sm font-medium sm:block ${
                isActive ? "text-[#0F4C81]" : "text-[#6B7280]"
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${isDone ? "bg-[#16A34A]" : "bg-[#E5E7EB]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Specialities ────────────────────────────────────────
function StepSpecialities({
  user,
  specialities,
  selected,
  onChange,
  onNext,
  onSkip,
}: {
  user: SafeUser;
  specialities: Speciality[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const grouped = specialities.reduce<Record<string, Speciality[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : selected.length < 6
          ? [...selected, id]
          : selected,
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Conferma le tue specialità</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Seleziona fino a 6 specialità per ricevere le migliori opportunità
        </p>
      </div>

      <div className="max-h-[400px] space-y-4 overflow-y-auto rounded-lg border border-[#E5E7EB] p-4">
        {Object.entries(grouped).map(([category, specs]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {specs.map((s) => {
                const isSelected = selected.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggle(s._id)}
                    disabled={!isSelected && selected.length >= 6}
                    className="speciality-chip"
                    data-selected={isSelected}
                  >
                    {isSelected && <Check className="size-3" />}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {specialities.length === 0 && (
          <p className="py-8 text-center text-sm text-[#6B7280]">Caricamento…</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[#6B7280]">{selected.length}/6 selezionate</span>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onSkip} className="flex-1 rounded-md border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F8F9FA]">
          Salta per ora
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selected.length === 0}
          className="auth-btn-primary flex-1"
        >
          Continua
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Resume Upload ───────────────────────────────────────
function StepResume({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const MAX_SIZE = 10 * 1024 * 1024;

  const validateAndSet = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Solo file PDF o DOCX sono accettati");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Il file supera i 10MB consentiti");
      return;
    }
    setError(null);
    setFile(f);
    setUploaded(null);
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }, []);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    try {
      // Simulate progress for UX
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);
      const result = await api.uploadFile(file, "resume");
      clearInterval(interval);
      setProgress(100);
      setUploaded(result);
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      setProgress(0);
      setError(err.message || "Errore durante il caricamento");
    }
  };

  useEffect(() => {
    if (file && !uploaded && !uploading) upload();
  }, [file]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Carica il tuo CV</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          PDF o DOCX, massimo 10MB
        </p>
      </div>

      {/* Drop zone */}
      {!uploaded && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
            dragOver
              ? "border-[#0F4C81] bg-[#0F4C81]/5"
              : "border-[#E5E7EB] bg-[#F8F9FA] hover:border-[#0F4C81]/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
          />
          {uploading ? (
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Caricamento…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#0F4C81] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="mb-3 size-10 text-[#6B7280]" />
              <p className="text-sm font-medium text-[#1A1A1A]">
                Trascina il file qui o clicca per selezionare
              </p>
              <div className="mt-3 flex gap-3 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1"><FileText className="size-3" /> PDF</span>
                <span className="flex items-center gap-1"><FileText className="size-3" /> DOCX</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Success preview */}
      {uploaded && (
        <div className="flex items-center gap-4 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#16A34A]/10">
            <FileText className="size-6 text-[#16A34A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1A1A1A]">{uploaded.originalName}</p>
            <p className="text-xs text-[#6B7280]">
              {(uploaded.sizeBytes / 1024).toFixed(0)} KB · Caricato con successo
            </p>
          </div>
          <button
            onClick={() => { setUploaded(null); setFile(null); setProgress(0); }}
            className="shrink-0 rounded-md p-1.5 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#DC2626]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Riprova</button>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onSkip} className="flex-1 rounded-md border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F8F9FA]">
          Aggiungerò dopo
        </button>
        <button
          type="button"
          onClick={onNext}
          className="auth-btn-primary flex-1"
        >
          {uploaded ? "Continua" : "Salta e continua"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Work History ────────────────────────────────────────
type WHForm = {
  positionTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  specialityIds: string[];
  location: string;
};

const emptyForm: WHForm = {
  positionTitle: "",
  companyName: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  specialityIds: [],
  location: "",
};

function StepWorkHistory({
  specialities,
  onComplete,
  onSkip,
}: {
  specialities: Speciality[];
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [entries, setEntries] = useState<WorkHistoryEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<WHForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkHistory()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const close = () => setShowModal(false);

  const save = async () => {
    setFormError(null);
    if (!form.positionTitle.trim()) { setFormError("Inserisci il titolo della posizione"); return; }
    if (!form.companyName.trim()) { setFormError("Inserisci il nome dell'azienda"); return; }
    if (!form.startDate) { setFormError("Inserisci la data di inizio"); return; }
    if (!form.isCurrent && !form.endDate) { setFormError("Inserisci la data di fine o spunta 'Attuale'"); return; }
    if (!form.isCurrent && form.endDate && form.endDate <= form.startDate) {
      setFormError("La data di fine deve essere successiva alla data di inizio");
      return;
    }
    if (form.isCurrent && entries.some((e) => e.isCurrent)) {
      setFormError("Puoi avere solo una posizione attuale");
      return;
    }
    if (entries.length >= 30) {
      setFormError("Massimo 30 posizioni consentite");
      return;
    }

    setSaving(true);
    try {
      const created = await api.createWorkHistory({
        positionTitle: form.positionTitle,
        companyName: form.companyName,
        startDate: form.startDate,
        endDate: form.isCurrent ? undefined : form.endDate,
        isCurrent: form.isCurrent,
        description: form.description || undefined,
        specialityIds: form.specialityIds.length ? form.specialityIds : undefined,
        location: form.location || undefined,
      });
      setEntries((prev) => [created, ...prev]);
      close();
    } catch (err: any) {
      setFormError(err.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteWorkHistory(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {}
  };

  const toggleSpec = (id: string) => {
    setForm((f) => ({
      ...f,
      specialityIds: f.specialityIds.includes(id)
        ? f.specialityIds.filter((s) => s !== id)
        : [...f.specialityIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1A1A1A]">La tua esperienza lavorativa</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Aggiungi le tue posizioni precedenti (opzionale)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#0F4C81]" />
        </div>
      ) : (
        <>
          {/* Timeline */}
          {entries.length > 0 && (
            <div className="relative space-y-0 pl-4">
              <div className="absolute left-[23px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
              {entries.map((entry, i) => (
                <div key={entry._id} className="relative flex gap-4 pb-6 last:pb-0">
                  <div
                    className={`relative z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 ${
                      entry.isCurrent
                        ? "border-[#16A34A] bg-[#16A34A]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  />
                  <div className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{entry.positionTitle}</p>
                        <p className="text-sm text-[#6B7280]">{entry.companyName}</p>
                      </div>
                      <button
                        onClick={() => remove(entry._id)}
                        className="shrink-0 rounded p-1 text-[#6B7280] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(entry.startDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })}
                        {" – "}
                        {entry.isCurrent
                          ? "Attuale"
                          : entry.endDate
                            ? new Date(entry.endDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })
                            : ""}
                      </span>
                      {entry.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {entry.location}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[#6B7280] line-clamp-2">
                        {entry.description}
                      </p>
                    )}
                    {entry.isCurrent && (
                      <span className="mt-2 inline-block rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-xs font-medium text-[#16A34A]">
                        Posizione attuale
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] py-12 text-center">
              <Briefcase className="mx-auto mb-3 size-10 text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Nessuna esperienza aggiunta</p>
            </div>
          )}

          <button
            type="button"
            onClick={openAdd}
            disabled={entries.length >= 30}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#0F4C81] bg-[#0F4C81]/5 py-3 text-sm font-medium text-[#0F4C81] transition-colors hover:bg-[#0F4C81]/10 disabled:opacity-50"
          >
            <Plus className="size-4" /> Aggiungi posizione
          </button>
        </>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onSkip} className="flex-1 rounded-md border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F8F9FA]">
          Salta
        </button>
        <button type="button" onClick={onComplete} className="auth-btn-primary flex-1">
          Completa profilo
        </button>
      </div>

      {/* Slide-over Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 rounded-t-xl bg-white p-6 shadow-xl sm:rounded-xl sm:slide-in-from-bottom-0">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Nuova posizione</h3>
              <button onClick={close} className="rounded-md p-1 text-[#6B7280] hover:bg-[#E5E7EB]">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="auth-label">Titolo posizione *</label>
                <input className="auth-input" value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })} placeholder="es. Muratore Senior" />
              </div>
              <div>
                <label className="auth-label">Azienda *</label>
                <input className="auth-input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="es. Edilizia Rossi Srl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Data inizio *</label>
                  <input type="month" className="auth-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value + "-01" })} />
                </div>
                <div>
                  <label className="auth-label">Data fine</label>
                  <input
                    type="month"
                    className="auth-input"
                    disabled={form.isCurrent}
                    value={form.endDate ? form.endDate.slice(0, 7) : ""}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value + "-01" })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, endDate: "" })}
                  className="size-4 rounded border-[#E5E7EB] accent-[#0F4C81]"
                />
                Posizione attuale
              </label>
              <div>
                <label className="auth-label">Sede</label>
                <input className="auth-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Milano" />
              </div>
              <div>
                <label className="auth-label">Descrizione</label>
                <textarea
                  className="auth-input min-h-[80px] resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Responsabilità e risultati principali…"
                  maxLength={1000}
                />
              </div>
              <div>
                <label className="auth-label">Specialità correlate</label>
                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-[#E5E7EB] p-2">
                  {specialities.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className="speciality-chip text-[11px]"
                      data-selected={form.specialityIds.includes(s._id)}
                      onClick={() => toggleSpec(s._id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">
                  {formError}
                </div>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="auth-btn-primary"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Salva posizione"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Page ────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    Promise.all([api.getMe(), api.getSpecialities()])
      .then(([me, specs]) => {
        setUser(me);
        setSpecialities(specs);
        setSelectedSpecs(me.specialityIds || []);
        if (me.onboardingCompleted) navigate("/for-you", { replace: true });
      })
      .catch(() => navigate("/auth/login", { replace: true }));
  }, []);

  const saveSpecialities = async () => {
    if (selectedSpecs.length > 0) {
      try { await api.updateMySpecialities(selectedSpecs); } catch {}
    }
    setStep(2);
  };

  const completeOnboarding = async () => {
    setCompleting(true);
    try {
      await api.completeOnboarding();
      setShowConfetti(true);
      setTimeout(() => navigate("/for-you", { replace: true }), 2500);
    } catch {
      setCompleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8 sm:py-12">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce text-center">
            <div className="text-6xl">🎉</div>
            <p className="mt-4 text-2xl font-bold text-[#0F4C81]">Benvenuto!</p>
            <p className="text-sm text-[#6B7280]">Reindirizzamento in corso…</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[540px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#0F4C81]">Con noi</h1>
          <p className="text-sm text-[#6B7280]">Completa il tuo profilo in pochi passi</p>
        </div>

        <StepIndicator current={step} />

        <div className="auth-card card-brand-in">
          {step === 1 && (
            <StepSpecialities
              user={user}
              specialities={specialities}
              selected={selectedSpecs}
              onChange={setSelectedSpecs}
              onNext={saveSpecialities}
              onSkip={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepResume
              onNext={() => setStep(3)}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepWorkHistory
              specialities={specialities}
              onComplete={completeOnboarding}
              onSkip={completeOnboarding}
            />
          )}
        </div>

        {completing && !showConfetti && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="size-5 animate-spin text-[#0F4C81]" />
          </div>
        )}
      </div>
    </div>
  );
}