import { useState } from "react";
import { Pause, Play } from "lucide-react";
import "./LogoCarousel.css";

const sequences = [
  [
    "Edilizia Rossi",
    "Meccanica Veneta",
    "Gruppo Ferretti",
    "Cantieri Navali Napoli",
    "Elettrica Lombardia",
    "Salerno Costruzioni",
    "Idraulica Toscana",
  ],
  [
    "Fonderie Bresciane",
    "Saldatura Piemonte",
    "Trasporti Emiliani",
    "Impianti Milano",
    "Carpenteria Siciliana",
    "Manutenzioni Roma",
    "Ferramenta Bergamo",
  ],
];

export function LogoCarousel() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="brand-showcase" aria-labelledby="partners-heading">
      <h2 id="partners-heading">Aziende che assumono con noi</h2>

      <div className="brand-showcase__rows" data-paused={paused}>
        <div className="brand-showcase__track">
          {[...sequences, ...sequences].map((sequence, index) => (
            <div
              className="brand-showcase__sequence"
              key={index}
              aria-hidden={index >= sequences.length ? "true" : undefined}
            >
              {sequence.map((name) => (
                <span className="brand-showcase__logo" key={`${index}-${name}`}>
                  <span className="brand-showcase__name">{name}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="brand-showcase__caption">
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          className="brand-showcase__toggle bluecrest-focus"
          aria-label={paused ? "Riprendi lo scorrimento dei nomi" : "Metti in pausa lo scorrimento dei nomi"}
          aria-pressed={paused}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
        <span>Oltre 2.000 aziende italiane cercano personale qualificato ogni giorno</span>
      </div>
    </section>
  );
}