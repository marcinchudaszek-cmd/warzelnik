import { useMemo, useState } from "react";
import { HOPS } from "@/data/hops";
import { MALTS } from "@/data/malts";
import { YEASTS } from "@/data/yeasts";
import type { Recipe } from "@/types";
import { ebcToColor, formatGravity, recipeStats } from "@/utils/brewCalc";
import { cn } from "@/utils/cn";

const maltById = new Map(MALTS.map((m) => [m.id, m]));
const hopById = new Map(HOPS.map((h) => [h.id, h]));
const yeastById = new Map(YEASTS.map((y) => [y.id, y]));

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
  return useMemo(() => {
    const attenuation = recipe.yeastId ? yeastById.get(recipe.yeastId)?.attenuation ?? 75 : 75;
    return recipeStats(recipe, maltById, hopById, attenuation);
  }, [recipe]);
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
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            Warka
            <NumInput value={recipe.batchL} onChange={(v) => set({ batchL: v })} step={0.5} />L
          </label>
          <label className="flex items-center gap-2">
            Wydajność
            <NumInput value={recipe.efficiency} onChange={(v) => set({ efficiency: v })} step={1} />%
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
        {recipe.hops.map((rh, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={rh.hopId}
              onChange={(e) => {
                const hops = [...recipe.hops];
                hops[i] = { ...rh, hopId: e.target.value };
                set({ hops });
              }}
              className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
            >
              {HOPS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} (α {h.alpha}%)
                </option>
              ))}
            </select>
            <NumInput
              value={rh.grams}
              onChange={(v) => {
                const hops = [...recipe.hops];
                hops[i] = { ...rh, grams: v };
                set({ hops });
              }}
              step={1}
              className="w-16"
            />
            <span className="text-xs text-stone-500">g</span>
            <NumInput
              value={rh.time}
              onChange={(v) => {
                const hops = [...recipe.hops];
                hops[i] = { ...rh, time: v };
                set({ hops });
              }}
              step={5}
              className="w-16"
            />
            <span className="text-xs text-stone-500">min</span>
            <button
              onClick={() => set({ hops: recipe.hops.filter((_, j) => j !== i) })}
              className="text-stone-400 hover:text-red-500"
              aria-label="Usuń chmiel"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => set({ hops: [...recipe.hops, { hopId: HOPS[0].id, grams: 20, time: 60 }] })}
          className="w-full rounded-lg border border-dashed border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          + Dodaj chmiel
        </button>
        <p className="text-xs text-stone-400">Czas 0 min = dodatek na wyłączeniu / whirlpool (nie wnosi IBU).</p>
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
  const editing = recipes.find((r) => r.id === editingId);

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
      <button
        onClick={() => {
          const r = emptyRecipe();
          setRecipes((prev) => [r, ...prev]);
          setEditingId(r.id);
        }}
        className="w-full rounded-2xl bg-amber-700 py-3 font-semibold text-white shadow-md transition-colors hover:bg-amber-800"
      >
        + Nowa receptura
      </button>

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
