import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, Upload, FileText, X, MapPin, Briefcase } from "lucide-react";
import { api, getErrorMessage, logError, type ApiError, type Post, type SafeUser, type UploadedFile, type Application } from "@/lib/api";
import { Seo } from "@/components/Seo";

export default function ApplyPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!postId) return;
    Promise.all([api.getPost(postId), api.getMe(), api.getMyApplications()])
      .then(([p, me, apps]) => {
        setPost(p);
        setUser(me);
        setEmail(me.email || "");
        const existing = apps.find((a) => a.postId === postId);
        if (existing) setExistingApp(existing);
      })
      .catch((err) => {
        logError("ApplyPage:init", err);
        navigate("/auth/login", { replace: true });
      });
  }, [postId, navigate]);

  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((f) => api.uploadFile(f, "application_attachment")),
      );
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      logError("ApplyPage:upload", err);
      setError(getErrorMessage(err, "Errore nel caricamento allegati"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postId) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.apply(postId, {
        coverLetter: coverLetter.trim() || undefined,
        attachmentFileIds: attachments.map((a) => a.id),
        contact: {
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          availabilityNote: availabilityNote.trim() || undefined,
        },
      });
      setSuccess(true);
    } catch (err) {
      const apiErr = err as Partial<ApiError> & { message?: string };
      if (apiErr.statusCode === 409 || apiErr.message?.includes("already")) {
        setError("Hai già inviato una candidatura per questa posizione.");
      } else {
        setError(getErrorMessage(err, "Errore durante l'invio della candidatura."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!post && !existingApp) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento candidatura" />
      </main>
    );
  }

  // Duplicate prevention
  if (existingApp) {
    const statusLabels: Record<string, { label: string; color: string }> = {
      submitted: { label: "Inviata", color: "bg-[#E8F0F9] text-[#0F4C81]" },
      reviewed: { label: "Esaminata", color: "bg-[#FDF2E9] text-[#B45309]" },
      accepted: { label: "Accettata", color: "bg-[#E8F6ED] text-[#15803D]" },
      rejected: { label: "Rifiutata", color: "bg-[#FCE9E9] text-[#B91C1C]" },
      withdrawn: { label: "Ritirata", color: "bg-[#6B7280]/10 text-[#4B5563]" },
    };
    const st = statusLabels[existingApp.status] || statusLabels.submitted;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-center">
        <Briefcase className="mb-4 size-12 text-[#4B5563]" aria-hidden="true" />
        <h1 className="text-xl font-bold text-[#1A1A1A]">Candidatura già inviata</h1>
        <p className="mt-2 text-sm text-[#4B5563]">
          Hai già candidato per <strong>{post?.title}</strong>.
        </p>
        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${st.color}`}>
          Stato: {st.label}
        </span>
        <Link
          to="/applications"
          className="mt-6 rounded-md bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3d6b]"
        >
          Vai alle mie candidature
        </Link>
      </main>
    );
  }

  // Success state
  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-center">
        <CheckCircle2 className="mb-4 size-16 text-[#15803D]" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Candidatura inviata!</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#4B5563]">
          La tua candidatura per <strong>{post?.title}</strong> è stata ricevuta con successo. Riceverai aggiornamenti sullo stato della selezione.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/applications"
            className="rounded-md bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3d6b]"
          >
            Vedi le mie candidature
          </Link>
          <button
            onClick={() => navigate("/for-you")}
            className="rounded-md border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#F8F9FA]"
          >
            Torna al feed
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-8 sm:py-12">
      <Seo
        title={`Candidatura: ${post?.title ?? "posizione"}`}
        description="Invia la tua candidatura con lettera di presentazione e allegati."
        noindex
      />
      <div className="mx-auto max-w-[540px]">
        {/* Post snapshot */}
        <div className="mb-6 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] text-sm font-bold text-[#0F4C81]">
              {post.company.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1A1A1A]">{post.title}</p>
              <p className="text-xs text-[#4B5563]">{post.company.name}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-[#4B5563]">
                <MapPin className="size-3" aria-hidden="true" />
                {post.location.city}{post.location.province ? `, ${post.location.province}` : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card card-brand-in">
          <h1 className="mb-6 text-xl font-bold text-[#1A1A1A]">Invia Candidatura</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cover Letter */}
            <div>
              <label htmlFor="cover-letter" className="auth-label flex justify-between">
                <span>Lettera di presentazione</span>
                <span className="font-normal text-[#4B5563]">{coverLetter.length}/4000</span>
              </label>
              <textarea
                id="cover-letter"
                className="auth-input min-h-[120px] resize-y"
                maxLength={4000}
                placeholder="Presentati brevemente all'azienda…"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="apply-phone" className="auth-label">Telefono</label>
                <input
                  id="apply-phone"
                  type="tel"
                  className="auth-input"
                  placeholder="+39 333 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="apply-email" className="auth-label">Email</label>
                <input
                  id="apply-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="apply-avail" className="auth-label">Disponibilità</label>
              <input
                id="apply-avail"
                className="auth-input"
                placeholder="es. Disponibile da subito"
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
              />
            </div>

            {/* Attachments */}
            <div>
              <p className="auth-label" id="apply-allegati">Allegati aggiuntivi</p>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2">
                    <FileText className="size-4 text-[#0F4C81]" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[#1A1A1A]">{att.originalName}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Rimuovi allegato ${att.originalName}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded text-[#4B5563] hover:text-[#B91C1C]"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-describedby="apply-allegati"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#E5E7EB] py-2.5 text-sm font-medium text-[#4B5563] transition-colors hover:border-[#0F4C81] hover:bg-[#0F4C81]/5 hover:text-[#0F4C81] disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                  {uploading ? "Caricamento…" : "Aggiungi allegato"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleAttachFiles}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-[#FCE9E9] px-3 py-2 text-sm text-[#B91C1C]" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="auth-btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Invio in corso…
                </>
              ) : (
                "Invia Candidatura"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}