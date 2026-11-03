import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Seo } from "@/components/Seo";
import { showSuccess, showError } from "@/utils/toast";

const AUDIENCES = [
  { value: "all", label: "Tutti gli utenti attivi", hint: "Lavoratori e amministratori" },
  { value: "workers", label: "Solo lavoratori", hint: "Chi cerca lavoro" },
  { value: "admins", label: "Solo amministratori", hint: "Il team interno" },
] as const;

const TITLE_MAX = 120;
const BODY_MAX = 500;

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "workers" | "admins">("all");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [lastSent, setLastSent] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: { title?: string; body?: string } = {};
    if (!title.trim()) next.title = "Il titolo è obbligatorio";
    if (!body.trim()) next.body = "Il messaggio è obbligatorio";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    setLastSent(null);
    try {
      const { sent } = await api.adminBroadcast({ title: title.trim(), body: body.trim(), audience });
      setLastSent(sent);
      showSuccess(`Notifica inviata a ${sent} ${sent === 1 ? "utente" : "utenti"}`);
      setTitle("");
      setBody("");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Invio non riuscito");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Seo
        title="Invia comunicazione — Admin Con noi"
        description="Invia una notifica a tutti gli utenti attivi della piattaforma."
        noindex
      />
      <div className="min-h-screen bg-[#F8F9FA]">
        <main className="mx-auto max-w-[720px] px-4 py-6 sm:px-6 sm:py-8">
          <div className="border-b border-[#E5E7EB] bg-white">
            <div className="mx-auto flex max-w-[720px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
              <Link
                to="/admin/dashboard"
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-[#4B5563] transition-colors hover:text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Dashboard
              </Link>
              <h1 className="text-base font-bold text-[#1A1A1A]">Invia comunicazione</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[#4B5563]">
            La notifica compare nel pannello notifiche degli utenti selezionati. Viene inviata
            immediatamente e non può essere annullata.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5 rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div>
              <label htmlFor="broadcast-title" className="auth-label">
                Titolo <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="broadcast-title"
                className="field-control"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((p) => ({ ...p, title: "" }));
                }}
                maxLength={TITLE_MAX}
                aria-required="true"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={`broadcast-title-help${errors.title ? " broadcast-title-error" : ""}`}
                placeholder="Nuove offerte nella tua zona"
              />
              <p id="broadcast-title-help" className="mt-1 text-xs text-[#4B5563]">
                {title.length}/{TITLE_MAX} caratteri
              </p>
              {errors.title && (
                <p id="broadcast-title-error" className="auth-error" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="broadcast-body" className="auth-label">
                Messaggio <span className="text-[#B91C1C]">*</span>
              </label>
              <textarea
                id="broadcast-body"
                className="field-control min-h-28 py-2"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setErrors((p) => ({ ...p, body: "" }));
                }}
                maxLength={BODY_MAX}
                rows={4}
                aria-required="true"
                aria-invalid={Boolean(errors.body)}
                aria-describedby={`broadcast-body-help${errors.body ? " broadcast-body-error" : ""}`}
                placeholder="Abbiamo pubblicato 12 nuove posizioni vicino a te."
              />
              <p id="broadcast-body-help" className="mt-1 text-xs text-[#4B5563]">
                {body.length}/{BODY_MAX} caratteri
              </p>
              {errors.body && (
                <p id="broadcast-body-error" className="auth-error" role="alert">
                  {errors.body}
                </p>
              )}
            </div>

            <fieldset>
              <legend className="auth-label">Destinatari</legend>
              <div className="mt-1 space-y-2">
                {AUDIENCES.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`audience-${option.value}`}
                    className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors hover:bg-[#F8F9FA] has-[:checked]:border-[#0F4C81] has-[:checked]:bg-[#E8F0F9]"
                  >
                    <input
                      id={`audience-${option.value}`}
                      type="radio"
                      name="audience"
                      value={option.value}
                      checked={audience === option.value}
                      onChange={() => setAudience(option.value)}
                      className="mt-0.5 size-5 shrink-0 accent-[#0F4C81]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#1A1A1A]">{option.label}</span>
                      <span className="block text-xs text-[#4B5563]">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-[#E5E7EB] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="text-sm text-[#15803D]">
                {lastSent !== null ? `Inviata a ${lastSent} ${lastSent === 1 ? "utente" : "utenti"}.` : ""}
              </p>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0F4C81] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {sending ? "Invio in corso…" : "Invia notifica"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
