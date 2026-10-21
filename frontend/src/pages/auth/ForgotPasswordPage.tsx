import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { isValidEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setFieldError("Inserisci un indirizzo email valido");
      return;
    }
    setFieldError(null);
    setLoading(true);

    try {
      // Backend may not have this endpoint yet; handle gracefully
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({ message: "Errore sconosciuto" }));
        throw { message: body.message, statusCode: res.status } as ApiError;
      }
      setSent(true);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.statusCode === 429) {
        setError("Troppi tentativi. Riprova tra un minuto.");
      } else {
        // Don't reveal whether the email exists
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
        <div className="auth-card card-brand-in text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-[#16A34A]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Email inviata</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
            Se esiste un account associato a <strong>{email}</strong>, riceverai un'email con le istruzioni per reimpostare la password. Controlla anche la cartella spam.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0F4C81] hover:text-[#0a3d6b] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <div className="auth-card card-brand-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Password dimenticata?</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Inserisci la tua email e ti invieremo le istruzioni per reimpostarla.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="recover-email" className="auth-label">Email</label>
            <input
              id="recover-email"
              type="email"
              autoComplete="email"
              className={`auth-input ${fieldError ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20" : ""}`}
              placeholder="mario@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(null); }}
              onBlur={() => email && !isValidEmail(email) && setFieldError("Email non valida")}
            />
            {fieldError && <p className="auth-error">{fieldError}</p>}
          </div>

          {error && (
            <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Invia istruzioni"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0F4C81] hover:text-[#0a3d6b] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}