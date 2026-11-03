import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { Seo } from "@/components/Seo";

type Strength = "weak" | "fair" | "good" | "strong";

function getStrength(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return "weak";
  if (score <= 2) return "fair";
  if (score <= 3) return "good";
  return "strong";
}

const strengthLabels: Record<Strength, string> = {
  weak: "Debole",
  fair: "Discreta",
  good: "Buona",
  strong: "Forte",
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // A link without a token can never succeed; say so before the user types.
  const missingToken = token === "";

  useEffect(() => {
    document.title = "Reimposta password — Con noi";
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (password.length < 8) errs.password = "Minimo 8 caratteri";
    else if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      errs.password = "Serve almeno una maiuscola e un numero";
    }
    if (confirm !== password) errs.confirm = "Le password non corrispondono";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      // Give the confirmation a moment, then send them to sign in.
      setTimeout(() => navigate("/auth/login", { replace: true }), 2500);
    } catch (err) {
      setError(getErrorMessage(err, "Impossibile reimpostare la password."));
    } finally {
      setLoading(false);
    }
  };

  const strength = password ? getStrength(password) : null;

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
        <div className="auth-card card-brand-in text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-[#15803D]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Password aggiornata</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
            Ora puoi accedere con la nuova password. Ti stiamo reindirizzando al login…
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0F4C81] hover:underline"
          >
            <ArrowLeft className="size-4" /> Vai al login
          </Link>
        </div>
      </div>
    );
  }

  if (missingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
        <div className="auth-card card-brand-in text-center">
          <AlertTriangle className="mx-auto mb-4 size-12 text-[#B45309]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Link non valido</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
            Questo link non contiene un token di reimpostazione. Richiedine uno nuovo.
          </p>
          <Link
            to="/auth/recover"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0F4C81] hover:underline"
          >
            <ArrowLeft className="size-4" /> Richiedi un nuovo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <Seo title="Scegli una nuova password" description="Imposta una nuova password per il tuo account." noindex />
      <div className="auth-card card-brand-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Scegli una nuova password</h1>
          <p className="mt-2 text-sm text-[#4B5563]">
            Il link è valido una sola volta. Scegli una password che non usi altrove.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="reset-password" className="auth-label">
              Nuova password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className={`auth-input pr-10 ${fieldErrors.password ? "border-[#DC2626]" : ""}`}
                placeholder="Minimo 8 caratteri"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#1A1A1A]"
                aria-label={showPw ? "Nascondi password" : "Mostra password"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {password && strength && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {(["weak", "fair", "good", "strong"] as const).map((level) => (
                    <div
                      key={level}
                      className="strength-bar"
                      data-active={
                        strength === level ||
                        ["weak", "fair", "good", "strong"].indexOf(strength) >
                          ["weak", "fair", "good", "strong"].indexOf(level)
                      }
                      data-level={level}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#4B5563]">{strengthLabels[strength]}</span>
              </div>
            )}
            {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="reset-confirm" className="auth-label">
              Conferma password
            </label>
            <input
              id="reset-confirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className={`auth-input ${fieldErrors.confirm ? "border-[#DC2626]" : ""}`}
              placeholder="Ripeti la password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setFieldErrors((p) => ({ ...p, confirm: "" }));
              }}
            />
            {fieldErrors.confirm && <p className="auth-error">{fieldErrors.confirm}</p>}
          </div>

          {error && (
            <div className="rounded-md bg-[#FCE9E9] px-3 py-2 text-sm text-[#B91C1C]" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Salva nuova password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0F4C81] hover:underline"
          >
            <ArrowLeft className="size-4" /> Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}
