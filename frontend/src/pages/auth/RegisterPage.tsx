import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { isValidEmail } from "@/lib/auth";

type Speciality = { _id: string; name: string; category: string };

function getPasswordStrength(pw: string): "weak" | "fair" | "good" | "strong" {
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

const strengthLabels = { weak: "Debole", fair: "Discreta", good: "Buona", strong: "Forte" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getSpecialities().then(setSpecialities).catch(() => {});
  }, []);

  const toggleSpeciality = (id: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 6 ? [...prev, id] : prev,
    );
  };

  const grouped = specialities.reduce<Record<string, Speciality[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = "Inserisci un indirizzo email valido";
    if (password.length < 8) errs.password = "Minimo 8 caratteri";
    else if (!/[A-Z]/.test(password) || !/\d/.test(password)) errs.password = "Serve almeno una maiuscola e un numero";
    if (fullName.trim().length < 2) errs.fullName = "Inserisci il tuo nome completo";
    if (selectedSpecs.length === 0) errs.specialities = "Seleziona almeno una specialità";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await api.register({
        email,
        password,
        fullName,
        specialityIds: selectedSpecs,
        city: city || undefined,
        phone: phone || undefined,
        age: age ? Number(age) : undefined,
      });
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.statusCode === 429) setError("Troppi tentativi. Riprova tra un minuto.");
      else if (apiErr.message?.includes("already exists")) setError("Questa email è già registrata.");
      else setError(apiErr.message || "Errore durante la registrazione.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password ? getPasswordStrength(password) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <div className="auth-card card-brand-in max-w-[540px]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Crea il tuo account</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Unisciti a migliaia di lavoratori qualificati</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="auth-label">Nome completo *</label>
            <input id="reg-name" className={`auth-input ${fieldErrors.fullName ? "border-[#DC2626]" : ""}`} placeholder="Mario Rossi" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {fieldErrors.fullName && <p className="auth-error">{fieldErrors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="auth-label">Email *</label>
            <input id="reg-email" type="email" autoComplete="email" className={`auth-input ${fieldErrors.email ? "border-[#DC2626]" : ""}`} placeholder="mario@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {fieldErrors.email && <p className="auth-error">{fieldErrors.email}</p>}
          </div>

          {/* Password + Strength */}
          <div>
            <label htmlFor="reg-password" className="auth-label">Password *</label>
            <div className="relative">
              <input id="reg-password" type={showPw ? "text" : "password"} autoComplete="new-password" className={`auth-input pr-10 ${fieldErrors.password ? "border-[#DC2626]" : ""}`} placeholder="Minimo 8 caratteri" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A]" aria-label={showPw ? "Nascondi" : "Mostra"}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {(["weak", "fair", "good", "strong"] as const).map((level) => (
                    <div key={level} className="strength-bar" data-active={strength === level || (["weak", "fair", "good", "strong"].indexOf(strength!) > ["weak", "fair", "good", "strong"].indexOf(level))} data-level={level} />
                  ))}
                </div>
                <span className="text-xs text-[#6B7280]">{strength && strengthLabels[strength]}</span>
              </div>
            )}
            {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
          </div>

          {/* Optional fields row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-city" className="auth-label">Città</label>
              <input id="reg-city" className="auth-input" placeholder="Milano" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label htmlFor="reg-age" className="auth-label">Età</label>
              <input id="reg-age" type="number" min={16} max={99} className="auth-input" placeholder="34" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="reg-phone" className="auth-label">Telefono</label>
            <input id="reg-phone" type="tel" className="auth-input" placeholder="+39 333 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {/* Specialities */}
          <fieldset>
            <legend className="auth-label flex items-center justify-between">
              <span>Specialità * <span className="font-normal text-[#6B7280]">(max 6)</span></span>
              <span className="text-xs text-[#6B7280]">{selectedSpecs.length}/6 selezionate</span>
            </legend>
            {fieldErrors.specialities && <p className="auth-error mb-2">{fieldErrors.specialities}</p>}
            <div className="max-h-48 space-y-3 overflow-y-auto rounded-md border border-[#E5E7EB] p-3">
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
                        onClick={() => toggleSpeciality(s._id)}
                        disabled={!selectedSpecs.includes(s._id) && selectedSpecs.length >= 6}
                      >
                        {selectedSpecs.includes(s._id) && <Check className="size-3" />}
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {specialities.length === 0 && <p className="text-sm text-[#6B7280]">Caricamento specialità…</p>}
            </div>
          </fieldset>

          {error && <div className="rounded-md bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]" role="alert">{error}</div>}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Crea Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Hai già un account? <Link to="/auth/login" className="auth-link">Accedi</Link>
        </p>
      </div>
    </div>
  );
}