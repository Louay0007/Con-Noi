import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { api, type Post, type Speciality } from "@/lib/api";
import { Seo } from "@/components/Seo";
import { showSuccess, showError } from "@/utils/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Tempo pieno" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contratto" },
  { value: "temporary", label: "Somministrazione" },
  { value: "seasonal", label: "Stagionale" },
  { value: "internship", label: "Tirocinio" },
] as const;

const CONTRACT_TYPES = [
  { value: "permanent", label: "Tempo indeterminato" },
  { value: "fixed_term", label: "Tempo determinato" },
  { value: "seasonal", label: "Stagionale" },
  { value: "noleggio", label: "Noleggio / somministrazione" },
  { value: "stage", label: "Stage" },
] as const;

type FormState = {
  title: string;
  summary: string;
  description: string;
  companyName: string;
  companyWebsite: string;
  city: string;
  province: string;
  employmentType: string;
  contractType: string;
  salaryMin: string;
  salaryMax: string;
  salaryNegotiable: boolean;
  openings: string;
  isUrgent: boolean;
  isFeatured: boolean;
  specialityIds: string[];
  requirements: string[];
  benefits: string[];
  status: "draft" | "published";
};

const EMPTY: FormState = {
  title: "",
  summary: "",
  description: "",
  companyName: "",
  companyWebsite: "",
  city: "",
  province: "",
  employmentType: "full_time",
  contractType: "",
  salaryMin: "",
  salaryMax: "",
  salaryNegotiable: false,
  openings: "1",
  isUrgent: false,
  isFeatured: false,
  specialityIds: [],
  requirements: [""],
  benefits: [""],
  status: "draft",
};

export default function AdminPostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== "new");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useDocumentTitle(isEdit ? "Modifica annuncio" : "Nuovo annuncio");

  useEffect(() => {
    let alive = true;
    api
      .getSpecialities()
      .then((list) => alive && setSpecialities(list))
      .catch(() => alive && showError("Non è stato possibile caricare le specialità"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    setLoading(true);
    api
      .getPost(id)
      .then((post: Post) => {
        if (!alive) return;
        setForm({
          title: post.title ?? "",
          summary: post.summary ?? "",
          description: post.description ?? "",
          companyName: post.company?.name ?? "",
          companyWebsite: post.company?.website ?? "",
          city: post.location?.city ?? "",
          province: post.location?.province ?? "",
          employmentType: post.employmentType ?? "full_time",
          contractType: post.contractType ?? "",
          salaryMin: post.salary?.min ? String(post.salary.min) : "",
          salaryMax: post.salary?.max ? String(post.salary.max) : "",
          salaryNegotiable: Boolean(post.salary?.isNegotiable),
          openings: post.openings ? String(post.openings) : "1",
          isUrgent: Boolean(post.isUrgent),
          isFeatured: Boolean(post.isFeatured),
          specialityIds: post.specialityIds ?? [],
          requirements: post.requirements?.length ? post.requirements : [""],
          benefits: post.benefits?.length ? post.benefits : [""],
          status: post.status === "published" ? "published" : "draft",
        });
      })
      .catch(() => alive && showError("Annuncio non trovato"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: "" } : prev));
  };

  const toggleSpeciality = (specialityId: string) => {
    setForm((prev) => {
      const has = prev.specialityIds.includes(specialityId);
      if (has) return { ...prev, specialityIds: prev.specialityIds.filter((s) => s !== specialityId) };
      if (prev.specialityIds.length >= 6) {
        showError("Puoi selezionare al massimo 6 specialità");
        return prev;
      }
      return { ...prev, specialityIds: [...prev.specialityIds, specialityId] };
    });
    setErrors((prev) => (prev.specialityIds ? { ...prev, specialityIds: "" } : prev));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Speciality[]>();
    for (const s of specialities) {
      const key = s.category || "altro";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [specialities]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Il titolo è obbligatorio";
    else if (form.title.length > 160) next.title = "Massimo 160 caratteri";
    if (!form.description.trim()) next.description = "La descrizione è obbligatoria";
    if (!form.companyName.trim()) next.companyName = "Il nome dell'azienda è obbligatorio";
    if (!form.city.trim()) next.city = "La città è obbligatoria";
    if (form.specialityIds.length === 0) next.specialityIds = "Seleziona almeno una specialità";
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      next.salaryMax = "Il massimo non può essere inferiore al minimo";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent, status: "draft" | "published") {
    event.preventDefault();
    if (!validate()) {
      showError("Controlla i campi evidenziati");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        summary: form.summary.trim() || undefined,
        description: form.description.trim(),
        company: {
          name: form.companyName.trim(),
          website: form.companyWebsite.trim() || undefined,
        },
        location: {
          city: form.city.trim(),
          province: form.province.trim() || undefined,
          country: "Italia",
        },
        employmentType: form.employmentType,
        contractType: form.contractType || undefined,
        salary: form.salaryNegotiable
          ? { isNegotiable: true, currency: "EUR" }
          : form.salaryMin || form.salaryMax
            ? {
                min: form.salaryMin ? Number(form.salaryMin) : undefined,
                max: form.salaryMax ? Number(form.salaryMax) : undefined,
                currency: "EUR",
                isNegotiable: false,
              }
            : undefined,
        openings: Number(form.openings) || 1,
        isUrgent: form.isUrgent,
        isFeatured: form.isFeatured,
        specialityIds: form.specialityIds,
        requirements: form.requirements.map((r) => r.trim()).filter(Boolean),
        benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
        status,
      };

      if (isEdit && id) {
        await api.adminUpdatePost(id, payload);
        if (status === "published") await api.adminChangePostStatus(id, "publish");
        showSuccess("Annuncio aggiornato");
      } else {
        await api.adminCreatePost(payload);
        showSuccess(status === "published" ? "Annuncio pubblicato" : "Bozza salvata");
      }
      navigate("/admin/posts");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-7 animate-spin text-[#0F4C81]" aria-label="Caricamento annuncio" />
      </main>
    );
  }

  return (
    <>
      <Seo
        title={isEdit ? "Modifica annuncio — Admin Con noi" : "Nuovo annuncio — Admin Con noi"}
        description="Crea o modifica un annuncio di lavoro."
        noindex
      />
      <div className="min-h-screen bg-[#F8F9FA]">
        <main className="mx-auto max-w-[960px] px-4 py-6 sm:px-6 sm:py-8">
          <div className="border-b border-[#E5E7EB] bg-white">
            <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
              <Link
                to="/admin/posts"
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-[#4B5563] transition-colors hover:text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Annunci
              </Link>
              <h1 className="text-base font-bold text-[#1A1A1A]">
                {isEdit ? "Modifica annuncio" : "Nuovo annuncio"}
              </h1>
            </div>
          </div>
          <form onSubmit={(e) => handleSubmit(e, form.status)} noValidate className="space-y-6">
            <fieldset className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <legend className="px-1 text-sm font-bold text-[#1A1A1A]">Dettagli dell'annuncio</legend>
              <div className="mt-4 space-y-5">
                <div>
                  <label htmlFor="post-title" className="auth-label">
                    Titolo <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="post-title"
                    className="field-control"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    maxLength={160}
                    aria-required="true"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "post-title-error" : undefined}
                    placeholder="Muratore esperto per ristrutturazione"
                  />
                  {errors.title && (
                    <p id="post-title-error" className="auth-error">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="post-summary" className="auth-label">
                    Riepilogo
                  </label>
                  <input
                    id="post-summary"
                    className="field-control"
                    value={form.summary}
                    onChange={(e) => set("summary", e.target.value)}
                    maxLength={280}
                    placeholder="Una frase che riassume la posizione"
                  />
                </div>

                <div>
                  <label htmlFor="post-description" className="auth-label">
                    Descrizione <span className="text-[#B91C1C]">*</span>
                  </label>
                  <textarea
                    id="post-description"
                    className="field-control min-h-32 py-2"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={8000}
                    rows={6}
                    aria-required="true"
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? "post-description-error" : undefined}
                    placeholder="Mansioni, contesto di lavoro, orari."
                  />
                  {errors.description && (
                    <p id="post-description-error" className="auth-error">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <legend className="px-1 text-sm font-bold text-[#1A1A1A]">Azienda e sede</legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="post-company" className="auth-label">
                    Nome azienda <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="post-company"
                    className="field-control"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.companyName)}
                    aria-describedby={errors.companyName ? "post-company-error" : undefined}
                    placeholder="Edilizia Rossi Srl"
                  />
                  {errors.companyName && (
                    <p id="post-company-error" className="auth-error">
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="post-website" className="auth-label">
                    Sito aziendale
                  </label>
                  <input
                    id="post-website"
                    type="url"
                    className="field-control"
                    value={form.companyWebsite}
                    onChange={(e) => set("companyWebsite", e.target.value)}
                    placeholder="https://esempio.it"
                  />
                </div>
                <div>
                  <label htmlFor="post-city" className="auth-label">
                    Città <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="post-city"
                    className="field-control"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? "post-city-error" : undefined}
                    placeholder="Milano"
                  />
                  {errors.city && (
                    <p id="post-city-error" className="auth-error">
                      {errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="post-province" className="auth-label">
                    Provincia
                  </label>
                  <input
                    id="post-province"
                    className="field-control"
                    value={form.province}
                    onChange={(e) => set("province", e.target.value)}
                    placeholder="MI"
                    maxLength={4}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <legend className="px-1 text-sm font-bold text-[#1A1A1A]">Specialità</legend>
              <p className="mt-2 text-xs text-[#4B5563]">
                Seleziona da 1 a 6 specialità. {form.specialityIds.length}/6 selezionate.
              </p>
              {errors.specialityIds && (
                <p className="auth-error" role="alert">
                  {errors.specialityIds}
                </p>
              )}
              <div className="mt-4 space-y-4">
                {grouped.map(([category, list]) => (
                  <fieldset key={category}>
                    <legend className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                      {category}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {list.map((speciality) => {
                        const selected = form.specialityIds.includes(speciality._id);
                        return (
                          <button
                            key={speciality._id}
                            type="button"
                            onClick={() => toggleSpeciality(speciality._id)}
                            role="switch"
                            aria-checked={selected}
                            data-selected={selected}
                            className="speciality-chip"
                          >
                            {speciality.name}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <legend className="px-1 text-sm font-bold text-[#1A1A1A]">Contratto e retribuzione</legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="post-employment" className="auth-label">
                    Tipo di impiego
                  </label>
                  <select
                    id="post-employment"
                    className="field-control"
                    value={form.employmentType}
                    onChange={(e) => set("employmentType", e.target.value)}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="post-contract" className="auth-label">
                    Tipo di contratto
                  </label>
                  <select
                    id="post-contract"
                    className="field-control"
                    value={form.contractType}
                    onChange={(e) => set("contractType", e.target.value)}
                  >
                    <option value="">Non specificato</option>
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="post-salary-min" className="auth-label">
                    Retribuzione minima (€)
                  </label>
                  <input
                    id="post-salary-min"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="field-control"
                    value={form.salaryMin}
                    onChange={(e) => set("salaryMin", e.target.value)}
                    disabled={form.salaryNegotiable}
                  />
                </div>
                <div>
                  <label htmlFor="post-salary-max" className="auth-label">
                    Retribuzione massima (€)
                  </label>
                  <input
                    id="post-salary-max"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="field-control"
                    value={form.salaryMax}
                    onChange={(e) => set("salaryMax", e.target.value)}
                    disabled={form.salaryNegotiable}
                    aria-invalid={Boolean(errors.salaryMax)}
                    aria-describedby={errors.salaryMax ? "post-salary-error" : undefined}
                  />
                  {errors.salaryMax && (
                    <p id="post-salary-error" className="auth-error">
                      {errors.salaryMax}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="post-openings" className="auth-label">
                    Posizioni aperte
                  </label>
                  <input
                    id="post-openings"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    className="field-control"
                    value={form.openings}
                    onChange={(e) => set("openings", e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <label htmlFor="post-negotiable" className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
                    <input
                      id="post-negotiable"
                      type="checkbox"
                      className="size-5 rounded border-[#E5E7EB] accent-[#0F4C81]"
                      checked={form.salaryNegotiable}
                      onChange={(e) => set("salaryNegotiable", e.target.checked)}
                    />
                    Trattativa riservata
                  </label>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-5">
                <label htmlFor="post-urgent" className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
                  <input
                    id="post-urgent"
                    type="checkbox"
                    className="size-5 rounded border-[#E5E7EB] accent-[#0F4C81]"
                    checked={form.isUrgent}
                    onChange={(e) => set("isUrgent", e.target.checked)}
                  />
                  Urgente
                </label>
                <label htmlFor="post-featured" className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
                  <input
                    id="post-featured"
                    type="checkbox"
                    className="size-5 rounded border-[#E5E7EB] accent-[#0F4C81]"
                    checked={form.isFeatured}
                    onChange={(e) => set("isFeatured", e.target.checked)}
                  />
                  In evidenza
                </label>
              </div>
            </fieldset>

            <RepeatableList
              legend="Requisiti"
              hint="Facoltativo. Aggiungi i requisiti richiesti."
              fieldPrefix="requirement"
              values={form.requirements}
              onChange={(values) => set("requirements", values)}
            />
            <RepeatableList
              legend="Benefit"
              hint="Facoltativo. Cosa offre l'azienda."
              fieldPrefix="benefit"
              values={form.benefits}
              onChange={(values) => set("benefits", values)}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F1F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                Salva come bozza
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#0F4C81] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                {form.status === "published" ? "Salva modifiche" : "Pubblica annuncio"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

function RepeatableList({
  legend,
  hint,
  fieldPrefix,
  values,
  onChange,
}: {
  legend: string;
  hint: string;
  fieldPrefix: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const update = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };
  return (
    <fieldset className="rounded-lg border border-[#E5E7EB] bg-white p-5">
      <legend className="px-1 text-sm font-bold text-[#1A1A1A]">{legend}</legend>
      <p className="mt-2 text-xs text-[#4B5563]">{hint}</p>
      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <div key={`${fieldPrefix}-${index}`} className="flex items-center gap-2">
            <label htmlFor={`${fieldPrefix}-${index}`} className="sr-only">
              {legend} {index + 1}
            </label>
            <input
              id={`${fieldPrefix}-${index}`}
              className="field-control"
              value={value}
              onChange={(e) => update(index, e.target.value)}
              placeholder={index === 0 ? `Aggiungi ${legend.toLowerCase()}` : ""}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="icon-action shrink-0 hover:bg-[#FCE9E9] hover:text-[#B91C1C]"
              aria-label={`Rimuovi ${legend.toLowerCase()} ${index + 1}`}
              disabled={values.length === 1}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[#0F4C81] transition-colors hover:bg-[#E8F0F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
      >
        <Plus className="size-4" aria-hidden="true" />
        Aggiungi
      </button>
    </fieldset>
  );
}
