import { useState } from "react";
import {
  calcABV,
  correctHydrometer,
  parseGravityInput as parseGravity,
  platoToSg,
  primingSugar,
  residualCO2,
  sgToPlato,
} from "@/utils/brewCalc";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 outline-none focus:border-amber-500"
        />
        {suffix && <span className="shrink-0 text-stone-500">{suffix}</span>}
      </span>
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{children}</div>;
}

function BlgSgConverter() {
  const [blg, setBlg] = useState("12");
  const [sg, setSg] = useState(platoToSg(12).toFixed(3));

  return (
    <Card title="🔄 Przelicznik Blg ↔ SG">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Ekstrakt"
          value={blg}
          suffix="°Blg"
          onChange={(v) => {
            setBlg(v);
            const p = parseFloat(v.replace(",", "."));
            if (Number.isFinite(p)) setSg(platoToSg(p).toFixed(3));
          }}
        />
        <Field
          label="Gęstość"
          value={sg}
          suffix="SG"
          onChange={(v) => {
            setSg(v);
            const g = parseFloat(v.replace(",", "."));
            if (Number.isFinite(g) && g > 0.98) setBlg(sgToPlato(g).toFixed(1));
          }}
        />
      </div>
    </Card>
  );
}

function HydrometerCorrection() {
  const [reading, setReading] = useState("1.050");
  const [sampleTemp, setSampleTemp] = useState("35");
  const [calibTemp, setCalibTemp] = useState("20");

  const sg = parseGravity(reading);
  const t = parseFloat(sampleTemp.replace(",", "."));
  const tc = parseFloat(calibTemp.replace(",", "."));
  const corrected =
    Number.isFinite(sg) && Number.isFinite(t) && Number.isFinite(tc) ? correctHydrometer(sg, t, tc) : NaN;

  return (
    <Card title="🌡️ Korekta hydrometru">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Pomiar" value={reading} onChange={setReading} />
        <Field label="Temp. próbki" value={sampleTemp} onChange={setSampleTemp} suffix="°C" />
        <Field label="Kalibracja" value={calibTemp} onChange={setCalibTemp} suffix="°C" />
      </div>
      {Number.isFinite(corrected) ? (
        <Result>
          Skorygowana gęstość: <b>{corrected.toFixed(3)} SG</b> ({sgToPlato(corrected).toFixed(1)} °Blg)
        </Result>
      ) : (
        <p className="text-xs text-stone-400">Podaj pomiar jako SG (np. 1.050) lub Blg (np. 12.5).</p>
      )}
    </Card>
  );
}

function AbvCalculator() {
  const [ogRaw, setOgRaw] = useState("12.5");
  const [fgRaw, setFgRaw] = useState("3");

  const og = parseGravity(ogRaw);
  const fg = parseGravity(fgRaw);
  const valid = Number.isFinite(og) && Number.isFinite(fg) && og > fg;
  const abv = valid ? calcABV(og, fg) : NaN;
  const attenuation = valid ? ((og - fg) / (og - 1)) * 100 : NaN;

  return (
    <Card title="🍷 ABV z pomiarów">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gęstość początkowa (OG)" value={ogRaw} onChange={setOgRaw} />
        <Field label="Gęstość końcowa (FG)" value={fgRaw} onChange={setFgRaw} />
      </div>
      {valid ? (
        <Result>
          Alkohol: <b>{abv.toFixed(1)}% obj.</b> · odfermentowanie pozorne {attenuation.toFixed(0)}%
          <br />
          <span className="text-xs font-normal">
            OG {og.toFixed(3)} ({sgToPlato(og).toFixed(1)} °Blg) → FG {fg.toFixed(3)} ({sgToPlato(fg).toFixed(1)}{" "}
            °Blg)
          </span>
        </Result>
      ) : (
        <p className="text-xs text-stone-400">Wpisz wartości w Blg (np. 12.5) lub SG (np. 1.050).</p>
      )}
    </Card>
  );
}

const CARBONATION_PRESETS: { label: string; vols: number }[] = [
  { label: "Angielskie ale (1,8)", vols: 1.8 },
  { label: "Lager / ale (2,4)", vols: 2.4 },
  { label: "Pszeniczne (3,2)", vols: 3.2 },
  { label: "Belgijskie (3,6)", vols: 3.6 },
];

function PrimingCalculator() {
  const [liters, setLiters] = useState("20");
  const [temp, setTemp] = useState("20");
  const [vols, setVols] = useState("2.4");
  const [sugar, setSugar] = useState<"sacharoza" | "glukoza">("glukoza");

  const l = parseFloat(liters.replace(",", "."));
  const t = parseFloat(temp.replace(",", "."));
  const v = parseFloat(vols.replace(",", "."));
  const valid = [l, t, v].every(Number.isFinite) && l > 0;
  const grams = valid ? primingSugar(l, v, t, sugar) : NaN;

  return (
    <Card title="🫧 Refermentacja w butelkach">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Piwo" value={liters} onChange={setLiters} suffix="L" />
        <Field label="Temp. ferm." value={temp} onChange={setTemp} suffix="°C" />
        <Field label="Wysycenie" value={vols} onChange={setVols} suffix="obj." />
      </div>
      <div className="flex flex-wrap gap-2">
        {CARBONATION_PRESETS.map((p) => (
          <button
            key={p.vols}
            onClick={() => setVols(String(p.vols))}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-amber-100"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {(["glukoza", "sacharoza"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSugar(s)}
            className={
              sugar === s
                ? "flex-1 rounded-lg bg-amber-600 py-1.5 text-sm font-semibold text-white"
                : "flex-1 rounded-lg bg-stone-100 py-1.5 text-sm text-stone-600 hover:bg-amber-100"
            }
          >
            {s === "glukoza" ? "Glukoza" : "Cukier (sacharoza)"}
          </button>
        ))}
      </div>
      {valid && (
        <Result>
          Dodaj <b>{grams.toFixed(0)} g</b> ({(grams / l).toFixed(1)} g/L)
          <br />
          <span className="text-xs font-normal">
            Piwo ma już ~{residualCO2(t).toFixed(1)} obj. CO₂ z fermentacji w {t}°C.
          </span>
        </Result>
      )}
    </Card>
  );
}

export function ToolsView() {
  return (
    <div className="space-y-4">
      <BlgSgConverter />
      <HydrometerCorrection />
      <AbvCalculator />
      <PrimingCalculator />
    </div>
  );
}
