import { useMemo, useRef, useState } from "react";
import { useIngredients } from "@/ingredients";
import type { HopUse, Recipe } from "@/types";
import { downloadBeerXML, parseBeerXML, recipeToBeerXML } from "@/utils/beerxml";
import {
  calcWater,
  ebcToColor,
  formatGravity,
  getBoilMinutes,
  getMashRatio,
  recipeStats,
} from "@/utils/brewCalc";
import { cn } from "@/utils/cn";

export function newRecipeId() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRecipe(): Recipe {
  return {
    id: newRecipeId(),
    name: "Nowa receptura",
    style: "",
    batchL: 20,
    efficiency: 70,
    malts: [],
    hops: [],
    yeastId: null,
    mashSteps: [{ name: "Zacieranie właściwe", temp: 66, minutes: 60 }],
    notes: "",
  };
}

function useStats(recipe: Recipe) {
  const { maltById, hopById, yeastById } = useIngredients();
  return useMemo(() => {
    const attenuation = recipe.yeastId ? yeastById.get(recipe.yeastId)?.attenuation ?? 75 : 75;
    return recipeStats(recipe, maltById, hopById, attenuation);
  }, [recipe, maltById, hopById, yeastById]);
}

function StatsBar({ recipe }: { recipe: Recipe }) {
  const s = useStats(recipe);
  const stats = [
    { label: "OG", value: formatGravity(s.og) },
    { label: "FG", value: formatGravity(s.fg) },
    { label: "ABV", value: `${s.abv.toFixed(1)}%` },
    { label: "IBU", value: s.ibu.toFixed(0) },
    { label: "EBC", value: s.ebc.toFixed(0) },
  ];
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-stone-800 p-3 text-white shadow-md">
      <span
        className="h-10 w-10 shrink-0 rounded-full border-2 border-white/30 shadow-inner"
        style={{ backgroundColor: ebcToColor(s.ebc) }}
        title={`Barwa ~${s.ebc.toFixed(0)} EBC`}
      />
      <div className="grid flex-1 grid-cols-5 gap-1 text-center">
        {stats.map((st) => (
          <div key={st.label}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{st.label}</div>
            <div className="text-sm font-bold">{st.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  step = 0.1,
  min = 0,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={cn(
        "w-20 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-amber-500",
        className
      )}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">{children}</h3>;
}

function RecipeEditor({
  recipe,
  onChange,
  onClose,
  onDelete,
}: {
  recipe: Recipe;
  onChange: (r: Recipe) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { malts: MALTS, hops: HOPS, yeasts: YEASTS, maltById, hopById, yeastById } = useIngredients();
  const set = (patch: Partial<Recipe>) => onChange({ ...recipe, ...patch });
  const stats = useStats(recipe);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm font-semibold text-amber-700 hover:text-amber-900">
          ← Wróć do listy
        </button>
        <button
          onClick={() => {
            if (confirm(`Usunąć recepturę „${recipe.name}"?`)) onDelete();
          }}
          className="text-sm font-medium text-red-500 hover:text-red-700"
        >
          Usuń
        </button>
      </div>

      <StatsBar recipe={recipe} />

      <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
        <input
          value={recipe.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Nazwa piwa"
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-bold text-stone-800 outline-none focus:border-amber-500"
        />
        <input
          value={recipe.style}
          onChange={(e) => set({ style: e.target.value })}
          placeholder="Styl (np. American IPA)"
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            Warka
            <NumInput value={recipe.batchL} onChange={(v) => set({ batchL: v })} step={0.5} />L
          </label>
          <label className="flex items-center gap-2">
            Wydajność
            <NumInput value={recipe.efficiency} onChange={(v) => set({ efficiency: v })} step={1} />%
          </label>
          <label className="flex items-center gap-2">
            Gotowanie
            <NumInput value={getBoilMinutes(recipe)} onChange={(v) => set({ boilMinutes: v })} step={5} />
            min
          </label>
          <label className="flex items-center gap-2">
            Zacier
            <NumInput value={getMashRatio(recipe)} onChange={(v) => set({ mashRatio: v })} step={0.5} className="w-16" />
            L/kg
          </label>
        </div>
      </div>

      {/* Zasyp */}
      <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <SectionTitle>🌾 Zasyp {stats.totalKg > 0 && `· ${stats.totalKg.toFixed(2)} kg`}</SectionTitle>
        </div>
        {recipe.malts.map((rm, i) => {
          const malt = maltById.get(rm.maltId);
          const pct = stats.totalKg > 0 ? (rm.kg / stats.totalKg) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <select
                value={rm.maltId}
                onChange={(e) => {
                  const malts = [...recipe.malts];
                  malts[i] = { ...rm, maltId: e.target.value };
                  set({ malts });
                }}
                className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
              >
                {MALTS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <NumInput
                value={rm.kg}
                onChange={(v) => {
                  const malts = [...recipe.malts];
                  malts[i] = { ...rm, kg: v };
                  set({ malts });
                }}
              />
              <span className="w-14 text-right text-xs text-stone-500">
                kg · {pct.toFixed(0)}%
              </span>
              <button
                onClick={() => set({ malts: recipe.malts.filter((_, j) => j !== i) })}
                className="text-stone-400 hover:text-red-500"
                aria-label={`Usuń ${malt?.name ?? "słód"}`}
              >
                ✕
              </button>
            </div>
          );
        })}
        <button
          onClick={() => set({ malts: [...recipe.malts, { maltId: MALTS[0].id, kg: 1 }] })}
          className="w-full rounded-lg border border-dashed border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          + Dodaj słód
        </button>
      </div>

      {/* Chmielenie */}
      <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
        <SectionTitle>🌿 Chmielenie</SectionTitle>
        {recipe.hops.map((rh, i) => {
          const use = rh.use ?? "boil";
          const patchHop = (patch: Partial<typeof rh>) => {
            const hops = [...recipe.hops];
            hops[i] = { ...rh, ...patch };
            set({ hops });
          };
          return (
            <div key={i} className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/40 p-2">
              <div className="flex items-center gap-2">
                <select
                  value={rh.hopId}
                  onChange={(e) => patchHop({ hopId: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
                >
                  {HOPS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} (α {h.alpha}%)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => set({ hops: recipe.hops.filter((_, j) => j !== i) })}
                  className="text-stone-400 hover:text-red-500"
                  aria-label="Usuń chmiel"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={use}
                  onChange={(e) => patchHop({ use: e.target.value as HopUse, time: e.target.value === "dryhop" ? 4 : rh.time })}
                  className="rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
                >
                  <option value="boil">🔥 Gotowanie</option>
                  <option value="whirlpool">🌀 Whirlpool</option>
                  <option value="dryhop">❄️ Na zimno</option>
                </select>
                <NumInput value={rh.grams} onChange={(v) => patchHop({ grams: v })} step={1} className="w-16" />
                <span className="text-xs text-stone-500">g</span>
                <NumInput value={rh.time} onChange={(v) => patchHop({ time: v })} step={use === "dryhop" ? 1 : 5} className="w-16" />
                <span className="text-xs text-stone-500">{use === "dryhop" ? "dni" : "min"}</span>
              </div>
            </div>
          );
        })}
        <button
          onClick={() => set({ hops: [...recipe.hops, { hopId: HOPS[0].id, grams: 20, time: 60, use: "boil" }] })}
          className="w-full rounded-lg border border-dashed border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          + Dodaj chmiel
        </button>
        <p className="text-xs text-stone-400">
          Whirlpool liczy ok. 50% wykorzystania alfa-kwasów; chmielenie na zimno nie wnosi IBU.
        </p>
      </div>

      {/* Drożdże */}
      <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
        <SectionTitle>🧫 Drożdże</SectionTitle>
        <select
          value={recipe.yeastId ?? ""}
          onChange={(e) => set({ yeastId: e.target.value || null })}
          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm outline-none focus:border-amber-500"
        >
          <option value="">— wybierz drożdże —</option>
          {YEASTS.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} (odferm. ~{y.attenuation}%)
            </option>
          ))}
        </select>
      </div>

      {/* Zacieranie */}
      <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm">
        <SectionTitle>🌡️ Zacieranie</SectionTitle>
        {recipe.mashSteps.map((ms, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={ms.name}
              onChange={(e) => {
                const mashSteps = [...recipe.mashSteps];
                mashSteps[i] = { ...ms, name: e.target.value };
                set({ mashSteps });
              }}
              placeholder="Nazwa przerwy"
              className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
            />
            <NumInput
              value={ms.temp}
              onChange={(v) => {
                const mashSteps = [...recipe.mashSteps];
                mashSteps[i] = { ...ms, temp: v };
                set({ mashSteps });
              }}
              step={1}
              className="w-14"
            />
            <span className="text-xs text-stone-500">°C</span>
            <NumInput
              value={ms.minutes}
              onChange={(v) => {
                const mashSteps = [...recipe.mashSteps];
                mashSteps[i] = { ...ms, minutes: v };
                set({ mashSteps });
              }}
              step={5}
              className="w-14"
            />
            <span className="text-xs text-stone-500">min</span>
            <button
              onClick={() => set({ mashSteps: recipe.mashSteps.filter((_, j) => j !== i) })}
              className="text-stone-400 hover:text-red-500"
              aria-label="Usuń przerwę"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => set({ mashSteps: [...recipe.mashSteps, { name: "Przerwa", temp: 66, minutes: 30 }] })}
          className="w-full rounded-lg border border-dashed border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          + Dodaj przerwę
        </button>
      </div>

      {/* Woda */}
      <WaterSection recipe={recipe} />

      {/* Notatki */}
      <div className="space-y-2 rounded-2xl bg-white/80 p-4 shadow-sm">
        <SectionTitle>📝 Notatki</SectionTitle>
        <textarea
          value={recipe.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={4}
          placeholder="Woda, chmielenie na zimno, refermentacja…"
          className="w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const raw = prompt(`Docelowa objętość warki (obecnie ${recipe.batchL} L):`, String(recipe.batchL));
            if (raw === null) return;
            const target = parseFloat(raw.replace(",", "."));
            if (!Number.isFinite(target) || target <= 0) {
              alert("Podaj poprawną objętość w litrach.");
              return;
            }
            const factor = target / recipe.batchL;
            set({
              batchL: Math.round(target * 10) / 10,
              malts: recipe.malts.map((m) => ({ ...m, kg: Math.round(m.kg * factor * 200) / 200 })),
              hops: recipe.hops.map((h) => ({ ...h, grams: Math.round(h.grams * factor) })),
            });
          }}
          className="flex-1 rounded-2xl border border-amber-300 bg-white/80 py-3 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
        >
          ⚖️ Skaluj recepturę
        </button>
        <button
          onClick={() => downloadBeerXML(recipeToBeerXML(recipe, maltById, hopById, yeastById), recipe.name)}
          className="flex-1 rounded-2xl border border-amber-300 bg-white/80 py-3 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
        >
          ⬇️ Eksport BeerXML
        </button>
      </div>
    </div>
  );
}

function WaterSection({ recipe }: { recipe: Recipe }) {
  const { maltById } = useIngredients();
  const grainKg = recipe.malts.reduce((s, m) => {
    const malt = maltById.get(m.maltId);
    return malt && malt.type !== "dodatek" ? s + m.kg : s;
  }, 0);
  const water = calcWater(grainKg, recipe.batchL, getMashRatio(recipe), getBoilMinutes(recipe));
  const rows = [
    { label: "Woda zacierna", value: water.mashL, hint: `${getMashRatio(recipe)} L/kg zasypu` },
    { label: "Wysładzanie", value: water.spargeL, hint: `młóto chłonie ~${water.absorptionL.toFixed(1)} L` },
    { label: "Przed gotowaniem", value: water.preBoilL, hint: `odparowanie ~${water.evapL.toFixed(1)} L + 1 L strat` },
    { label: "Łącznie wody", value: water.totalL, hint: "" },
  ];
  return (
    <div className="space-y-2 rounded-2xl bg-white/80 p-4 shadow-sm">
      <SectionTitle>💧 Woda</SectionTitle>
      {grainKg <= 0 ? (
        <p className="text-sm text-stone-500">Dodaj słody do zasypu, aby wyliczyć wodę.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between text-sm">
              <span className="text-stone-600">{r.label}</span>
              <span className="text-right">
                <b className="text-stone-800">{r.value.toFixed(1)} L</b>
                {r.hint && <span className="ml-2 text-xs text-stone-400">{r.hint}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecipesView({
  recipes,
  setRecipes,
}: {
  recipes: Recipe[];
  setRecipes: (next: Recipe[] | ((prev: Recipe[]) => Recipe[])) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { malts, hops, yeasts, maltById, hopById, yeastById, setCustom } = useIngredients();
  const editing = recipes.find((r) => r.id === editingId);

  const importFile = async (file: File) => {
    try {
      const { recipe, warnings, newMalts, newHops, newYeasts } = parseBeerXML(
        await file.text(),
        malts,
        hops,
        yeasts
      );
      if (newMalts.length + newHops.length + newYeasts.length > 0) {
        setCustom((prev) => ({
          malts: [...prev.malts, ...newMalts],
          hops: [...prev.hops, ...newHops],
          yeasts: [...prev.yeasts, ...newYeasts],
        }));
      }
      if (warnings.length > 0) {
        recipe.notes = [recipe.notes, `Import BeerXML — dopasowania:\n${warnings.join("\n")}`]
          .filter(Boolean)
          .join("\n\n");
      }
      setRecipes((prev) => [recipe, ...prev]);
      setEditingId(recipe.id);
    } catch (err) {
      alert(`Nie udało się zaimportować pliku: ${err instanceof Error ? err.message : err}`);
    }
  };

  if (editing) {
    return (
      <RecipeEditor
        recipe={editing}
        onChange={(next) => setRecipes((prev) => prev.map((r) => (r.id === next.id ? next : r)))}
        onClose={() => setEditingId(null)}
        onDelete={() => {
          setRecipes((prev) => prev.filter((r) => r.id !== editing.id));
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => {
            const r = emptyRecipe();
            setRecipes((prev) => [r, ...prev]);
            setEditingId(r.id);
          }}
          className="flex-1 rounded-2xl bg-amber-700 py-3 font-semibold text-white shadow-md transition-colors hover:bg-amber-800"
        >
          + Nowa receptura
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border border-amber-300 bg-white/80 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
        >
          ⬆️ Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {recipes.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-500">
          Brak receptur. Stwórz pierwszą i zacznij warzyć! 🍺
        </p>
      )}

      {recipes.map((r) => {
        const attenuation = r.yeastId ? yeastById.get(r.yeastId)?.attenuation ?? 75 : 75;
        const s = recipeStats(r, maltById, hopById, attenuation);
        return (
          <button
            key={r.id}
            onClick={() => setEditingId(r.id)}
            className="animate-fade-in block w-full rounded-2xl bg-white/80 p-4 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 rounded-full border border-stone-200 shadow-inner"
                style={{ backgroundColor: ebcToColor(s.ebc) }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-stone-800">{r.name}</h3>
                <p className="truncate text-xs text-stone-500">
                  {r.style || "bez stylu"} · {r.batchL} L
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-stone-600">
                <div className="font-bold">{s.abv.toFixed(1)}% ABV</div>
                <div>
                  {s.ibu.toFixed(0)} IBU · {s.ebc.toFixed(0)} EBC
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
