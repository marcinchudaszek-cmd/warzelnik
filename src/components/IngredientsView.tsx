import { useMemo, useState } from "react";
import { HOPS, HOP_TYPE_LABELS } from "@/data/hops";
import { MALTS, MALT_TYPE_LABELS } from "@/data/malts";
import { YEASTS, YEAST_TYPE_LABELS } from "@/data/yeasts";
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

export function IngredientsView() {
  const [tab, setTab] = useState<Tab>("malts");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

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

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj składnika…"
        className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
      />

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
          {MALTS.filter((m) => (filter === "all" || m.type === filter) && m.name.toLowerCase().includes(q)).map(
            (m) => (
              <div key={m.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">{m.name}</h3>
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
              </div>
            )
          )}
        </div>
      )}

      {tab === "hops" && (
        <div className="space-y-3">
          {HOPS.filter((h) => (filter === "all" || h.type === filter) && h.name.toLowerCase().includes(q)).map(
            (h) => (
              <div key={h.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">{h.name}</h3>
                    <p className="text-xs font-medium text-green-700">
                      {HOP_TYPE_LABELS[h.type]} · {h.origin}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                    α {h.alpha}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{h.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {h.aromas.map((a) => (
                    <span key={a} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {tab === "yeasts" && (
        <div className="space-y-3">
          {YEASTS.filter((y) => (filter === "all" || y.type === filter) && y.name.toLowerCase().includes(q)).map(
            (y) => (
              <div key={y.id} className="animate-fade-in rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">{y.name}</h3>
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
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
