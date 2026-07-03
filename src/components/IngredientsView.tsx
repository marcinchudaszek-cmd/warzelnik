import { useMemo, useRef, useState } from "react";
import { HOP_TYPE_LABELS } from "@/data/hops";
import { MALT_TYPE_LABELS } from "@/data/malts";
import { YEAST_TYPE_LABELS } from "@/data/yeasts";
import { isCustomId, newCustomId, useIngredients } from "@/ingredients";
import type { Hop, HopType, Malt, MaltType, Yeast, YeastType } from "@/types";
import { parseIngredientsFile } from "@/utils/beerxml";
import { ebcToColor } from "@/utils/brewCalc";
import { cn } from "@/utils/cn";

type Tab = "malts" | "hops" | "yeasts";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "malts", label: "Słody", icon: "🌾" },
  { id: "hops", label: "Chmiele", icon: "🌿" },
  { id: "yeasts", label: "Drożdże", icon: "🧫" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-amber-600 text-white" : "bg-white/70 text-stone-600 hover:bg-amber-100"
      )}
    >
      {children}
    </button>
  );
}

function CustomBadge() {
  return <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">własny</span>;
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="mt-3 flex gap-3 border-t border-stone-100 pt-2 text-xs">
      <button onClick={onEdit} className="font-medium text-amber-700 hover:text-amber-900">
        ✏️ Edytuj
      </button>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600">
        Usuń
      </button>
    </div>
  );
}

// ── Formularze własnych składników ──────────────────────────────

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs text-stone-500">
      {label}
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-xs text-stone-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormShell({
  title,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in space-y-3 rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-md">
      <h3 className="text-sm font-bold uppercase tracking-wide text-purple-700">{title}</h3>
      {children}
      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white">
          Zapisz
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg bg-stone-100 py-2 text-sm font-semibold text-stone-600">
          Anuluj
        </button>
      </div>
    </div>
  );
}

const numOr = (raw: string, fallback: number) => {
  const v = parseFloat(raw.replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
};

function MaltForm({ initial, onSave, onCancel }: { initial?: Malt; onSave: (m: Malt) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<MaltType>(initial?.type ?? "bazowy");
  const [ebc, setEbc] = useState(String(initial?.ebc ?? 4));
  const [extract, setExtract] = useState(String(initial?.extract ?? 80));
  const [maxPercent, setMaxPercent] = useState(String(initial?.maxPercent ?? 100));
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <FormShell
      title={initial ? "Edytuj słód" : "Nowy słód"}
      onCancel={onCancel}
      onSave={() => {
        if (!name.trim()) return alert("Podaj nazwę słodu.");
        onSave({
          id: initial?.id ?? newCustomId("malt"),
          name: name.trim(),
          type,
          ebc: numOr(ebc, 4),
          extract: numOr(extract, 80),
          maxPercent: numOr(maxPercent, 100),
          description: description.trim() || "Własny słód.",
        });
      }}
    >
      <FormField label="Nazwa" value={name} onChange={setName} />
      <div className="grid grid-cols-2 gap-2">
        <FormSelect
          label="Typ"
          value={type}
          onChange={(v) => setType(v as MaltType)}
          options={Object.entries(MALT_TYPE_LABELS)}
        />
        <FormField label="Barwa (EBC)" value={ebc} onChange={setEbc} type="number" />
        <FormField label="Ekstrakt (%)" value={extract} onChange={setExtract} type="number" />
        <FormField label="Maks. udział (%)" value={maxPercent} onChange={setMaxPercent} type="number" />
      </div>
      <FormField label="Opis" value={description} onChange={setDescription} />
    </FormShell>
  );
}

function HopForm({ initial, onSave, onCancel }: { initial?: Hop; onSave: (h: Hop) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [origin, setOrigin] = useState(initial?.origin ?? "");
  const [alpha, setAlpha] = useState(String(initial?.alpha ?? 5));
  const [type, setType] = useState<HopType>(initial?.type ?? "uniwersalny");
  const [aromas, setAromas] = useState(initial?.aromas.join(", ") ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <FormShell
      title={initial ? "Edytuj chmiel" : "Nowy chmiel"}
      onCancel={onCancel}
      onSave={() => {
        if (!name.trim()) return alert("Podaj nazwę chmielu.");
        onSave({
          id: initial?.id ?? newCustomId("hop"),
          name: name.trim(),
          origin: origin.trim() || "—",
          alpha: numOr(alpha, 5),
          type,
          aromas: aromas.split(",").map((a) => a.trim()).filter(Boolean),
          description: description.trim() || "Własny chmiel.",
        });
      }}
    >
      <FormField label="Nazwa" value={name} onChange={setName} />
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Pochodzenie" value={origin} onChange={setOrigin} />
        <FormField label="Alfa-kwasy (%)" value={alpha} onChange={setAlpha} type="number" />
      </div>
      <FormSelect
        label="Typ"
        value={type}
        onChange={(v) => setType(v as HopType)}
        options={Object.entries(HOP_TYPE_LABELS)}
      />
      <FormField label="Aromaty (po przecinku)" value={aromas} onChange={setAromas} />
      <FormField label="Opis" value={description} onChange={setDescription} />
    </FormShell>
  );
}

function YeastForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Yeast;
  onSave: (y: Yeast) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [lab, setLab] = useState(initial?.lab ?? "");
  const [type, setType] = useState<YeastType>(initial?.type ?? "górnej fermentacji");
  const [attenuation, setAttenuation] = useState(String(initial?.attenuation ?? 75));
  const [tempMin, setTempMin] = useState(String(initial?.tempMin ?? 15));
  const [tempMax, setTempMax] = useState(String(initial?.tempMax ?? 22));
  const [styles, setStyles] = useState(initial?.styles.join(", ") ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <FormShell
      title={initial ? "Edytuj drożdże" : "Nowe drożdże"}
      onCancel={onCancel}
      onSave={() => {
        if (!name.trim()) return alert("Podaj nazwę drożdży.");
        onSave({
          id: initial?.id ?? newCustomId("yeast"),
          name: name.trim(),
          lab: lab.trim() || "—",
          type,
          attenuation: numOr(attenuation, 75),
          tempMin: numOr(tempMin, 15),
          tempMax: numOr(tempMax, 22),
          styles: styles.split(",").map((s) => s.trim()).filter(Boolean),
          description: description.trim() || "Własne drożdże.",
        });
      }}
    >
      <FormField label="Nazwa" value={name} onChange={setName} />
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Producent" value={lab} onChange={setLab} />
        <FormSelect
          label="Typ"
          value={type}
          onChange={(v) => setType(v as YeastType)}
          options={Object.entries(YEAST_TYPE_LABELS)}
        />
        <FormField label="Odfermentowanie (%)" value={attenuation} onChange={setAttenuation} type="number" />
        <FormField label="Temp. min (°C)" value={tempMin} onChange={setTempMin} type="number" />
        <FormField label="Temp. maks (°C)" value={tempMax} onChange={setTempMax} type="number" />
      </div>
      <FormField label="Style (po przecinku)" value={styles} onChange={setStyles} />
      <FormField label="Opis" value={description} onChange={setDescription} />
    </FormShell>
  );
}

// ── Widok główny ────────────────────────────────────────────────

export function IngredientsView() {
  const { malts, hops, yeasts, setCustom } = useIngredients();
  const [tab, setTab] = useState<Tab>("malts");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  const filterOptions = useMemo(() => {
    if (tab === "malts") return Object.entries(MALT_TYPE_LABELS);
    if (tab === "hops") return Object.entries(HOP_TYPE_LABELS);
    return Object.entries(YEAST_TYPE_LABELS);
  }, [tab]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setFilter("all");
    setQuery("");
    setFormOpen(false);
    setEditingId(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveMalt = (m: Malt) =>
    setCustom((prev) => ({
      ...prev,
      malts: prev.malts.some((x) => x.id === m.id)
        ? prev.malts.map((x) => (x.id === m.id ? m : x))
        : [...prev.malts, m],
    }));
  const saveHop = (h: Hop) =>
    setCustom((prev) => ({
      ...prev,
      hops: prev.hops.some((x) => x.id === h.id) ? prev.hops.map((x) => (x.id === h.id ? h : x)) : [...prev.hops, h],
    }));
  const saveYeast = (y: Yeast) =>
    setCustom((prev) => ({
      ...prev,
      yeasts: prev.yeasts.some((x) => x.id === y.id)
        ? prev.yeasts.map((x) => (x.id === y.id ? y : x))
        : [...prev.yeasts, y],
    }));

  const removeCustom = (kind: "malts" | "hops" | "yeasts", id: string, name: string) => {
    if (!confirm(`Usunąć własny składnik „${name}"? Receptury, które go używają, stracą tę pozycję.`)) return;
    setCustom((prev) => ({ ...prev, [kind]: prev[kind].filter((x: { id: string }) => x.id !== id) }));
  };

  const importIngredients = async (file: File) => {
    try {
      const result = parseIngredientsFile(await file.text(), { malts, hops, yeasts });
      const added = result.malts.length + result.hops.length + result.yeasts.length;
      setCustom((prev) => ({
        malts: [...prev.malts, ...result.malts],
        hops: [...prev.hops, ...result.hops],
        yeasts: [...prev.yeasts, ...result.yeasts],
      }));
      alert(
        `Zaimportowano ${added} składników (słody: ${result.malts.length}, chmiele: ${result.hops.length}, drożdże: ${result.yeasts.length}).` +
          (result.skipped > 0 ? `\nPominięto ${result.skipped} duplikatów.` : "")
      );
    } catch (err) {
      alert(`Nie udało się zaimportować: ${err instanceof Error ? err.message : err}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              tab === t.id ? "bg-amber-700 text-white shadow-md" : "bg-white/70 text-stone-600 hover:bg-amber-100"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj składnika…"
          className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormOpen(true);
          }}
          className="shrink-0 rounded-xl bg-amber-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-800"
        >
          + Własny
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-xl border border-amber-300 bg-white/80 px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
          title="Import bazy składników z pliku XML/JSON"
        >
          ⬆️
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.json,application/xml,text/xml,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importIngredients(file);
            e.target.value = "";
          }}
        />
      </div>

      {formOpen && tab === "malts" && (
        <MaltForm
          initial={editingId ? (malts.find((m) => m.id === editingId) as Malt) : undefined}
          onSave={(m) => {
            saveMalt(m);
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
      {formOpen && tab === "hops" && (
        <HopForm
          initial={editingId ? (hops.find((h) => h.id === editingId) as Hop) : undefined}
          onSave={(h) => {
            saveHop(h);
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
      {formOpen && tab === "yeasts" && (
        <YeastForm
          initial={editingId ? (yeasts.find((y) => y.id === editingId) as Yeast) : undefined}
          onSave={(y) => {
            saveYeast(y);
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Wszystkie
        </Chip>
        {filterOptions.map(([key, label]) => (
          <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </div>

      {tab === "malts" && (
        <div className="space-y-3">
          {malts
            .filter((m) => (filter === "all" || m.type === filter) && m.name.toLowerCase().includes(q))
            .map((m) => (
              <div key={m.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">
                      {m.name} {isCustomId(m.id) && <CustomBadge />}
                    </h3>
                    <p className="text-xs font-medium text-amber-700">{MALT_TYPE_LABELS[m.type]}</p>
                  </div>
                  <span
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-stone-200 shadow-inner"
                    style={{ backgroundColor: ebcToColor(m.ebc) }}
                    title={`~${m.ebc} EBC`}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{m.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">{m.ebc} EBC</span>
                  <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
                    ekstrakt {m.extract}%
                  </span>
                  <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
                    maks. {m.maxPercent}% zasypu
                  </span>
                </div>
                {isCustomId(m.id) && (
                  <CardActions
                    onEdit={() => {
                      setEditingId(m.id);
                      setFormOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={() => removeCustom("malts", m.id, m.name)}
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {tab === "hops" && (
        <div className="space-y-3">
          {hops
            .filter((h) => (filter === "all" || h.type === filter) && h.name.toLowerCase().includes(q))
            .map((h) => (
              <div key={h.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">
                      {h.name} {isCustomId(h.id) && <CustomBadge />}
                    </h3>
                    <p className="text-xs font-medium text-green-700">
                      {HOP_TYPE_LABELS[h.type]} · {h.origin}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                    α {h.alpha}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{h.description}</p>
                {h.aromas.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.aromas.map((a) => (
                      <span key={a} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {isCustomId(h.id) && (
                  <CardActions
                    onEdit={() => {
                      setEditingId(h.id);
                      setFormOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={() => removeCustom("hops", h.id, h.name)}
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {tab === "yeasts" && (
        <div className="space-y-3">
          {yeasts
            .filter((y) => (filter === "all" || y.type === filter) && y.name.toLowerCase().includes(q))
            .map((y) => (
              <div key={y.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">
                      {y.name} {isCustomId(y.id) && <CustomBadge />}
                    </h3>
                    <p className="text-xs font-medium text-blue-700">
                      {YEAST_TYPE_LABELS[y.type]} · {y.lab}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
                    {y.tempMin}–{y.tempMax}°C
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{y.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-800">
                    odferm. ~{y.attenuation}%
                  </span>
                  {y.styles.map((s) => (
                    <span key={s} className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">
                      {s}
                    </span>
                  ))}
                </div>
                {isCustomId(y.id) && (
                  <CardActions
                    onEdit={() => {
                      setEditingId(y.id);
                      setFormOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={() => removeCustom("yeasts", y.id, y.name)}
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
