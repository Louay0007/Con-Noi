import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { isValidEmail } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!isValidEmail(email)) errs.email = "Inserisci un indirizzo email valido";
    if (!password) errs.password = "Inserisci la password";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await api.login(email, password);
      navigate("/for-you", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.statusCode === 429) {
        setError("Troppi tentativi. Riprova tra un minuto.");
      } else {
        setError("Credenziali non valide. Controlla email e password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <div className="auth-card card-brand-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Accedi a Con noi</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Inserisci le tue credenziali per continuare</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="login-email" className="auth-label">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`auth-input ${fieldErrors.email ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20" : ""}`}
              placeholder="mario@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              onBlur={() => email && !isValidEmail(email) && setFieldErrors((p) => ({ ...p, email: "Email non valida" }))}
            />
            {fieldErrors.email && <p className="auth-error">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="auth-label">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className={`auth-input pr-10 ${fieldErrors.password ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A]"
                aria-label={showPw ? "Nascondi password" : "Mostra password"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
          </div>

          {error && (
            <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Accedi"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/auth/recover" className="auth-link">Password dimenticata?</Link>
          <span className="text-[#6B7280]">
            Non hai un account?{" "}
            <Link to="/auth/signup" className="auth-link">Registrati</Link>
          </span>
        </div>
      </div>
    </div>
  );
}