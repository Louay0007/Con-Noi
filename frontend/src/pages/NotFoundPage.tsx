import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import { Seo } from "@/components/Seo";

/** Unknown path. Kept public: a signed-in user who mistypes a URL should get a
 *  way back, not a login prompt. */
export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Pagina non trovata — Con noi"
        description="La pagina che cerchi non esiste o è stata spostata."
        noindex
      />
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-5 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#E8F0F9]">
          <SearchX className="size-7 text-[#0F4C81]" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#4B5563]">Errore 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1A1A1A] sm:text-3xl">
          Non troviamo questa pagina
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4B5563]">
          Il link potrebbe essere vecchio o contenere un errore di battitura. Puoi tornare alle
          opportunità di lavoro oppure alla home.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link
            to="/browse"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#0F4C81] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
          >
            Sfoglia le offerte
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F1F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Torna alla home
          </Link>
        </div>
      </main>
    </>
  );
}
