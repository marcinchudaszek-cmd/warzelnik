import { useEffect, useMemo, useState } from "react";
import { newRecipeId } from "@/components/RecipesView";
import { useIngredients } from "@/ingredients";
import type { HopUse, Recipe, RecipeHop, RecipeMalt } from "@/types";
import { ebcToColor } from "@/utils/brewCalc";
import { cn } from "@/utils/cn";

/**
 * BrewDog DIY Dog — receptury, które browar udostępnił za darmo piwowarom domowym
 * (dane z dawnego PunkAPI, przeniesione z BeerRatera). Teksty BrewDoga są po angielsku.
 */
export interface DiyDogBeer {
  n: number;
  name: string;
  tagline: string;
  first: string | null;
  desc: string;
  abv: number;
  ibu: number | null;
  og: number | null;
  fg: number | null;
  ebc: number | null;
  ph: number | null;
  att: number | null;
  batchL: number;
  boilL: number;
  /** [°C, minuty] */
  mash: [number, number | null][];
  ferm: number | null;
  twist: string | null;
  /** [nazwa, kg] */
  malts: [string, number][];
  /** [nazwa, ilość, jednostka, kiedy, rola] */
  hops: [string, number, string, string, string][];
  yeast: string | null;
  food: string[];
  tips: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// Nazwy słodów z DIY Dog → najbliższy słód z bazy Warzelnika
const MALT_ALIASES: [RegExp, string][] = [
  [/carafa.*(3|iii)/, "carafa-special-2"],
  [/carafa/, "carafa-special-2"],
  [/chocolate wheat/, "pszeniczny-ciemny"],
  [/chocolate/, "czekoladowy"],
  [/roast(ed)? barley|black patent|black malt|roasted malt/, "palony-jeczmien"],
  [/smoked|beech|peat/, "wedzony"],
  [/acidulated/, "kwaskowy"],
  [/special b|special w|dark crystal|extra dark crystal|double roasted crystal|drc/, "special-b"],
  [/caraaroma/, "caraaroma"],
  [/caramunich|carared/, "caramunich"],
  [/carahell|caramalt|pale crystal|light crystal/, "carahell"],
  [/carapils|dextrin/, "carapils"],
  [/crystal/, "crystal-60"],
  [/flaked oats|oats|oat/, "platki-owsiane"],
  [/torrified wheat|flaked wheat/, "platki-pszenne"],
  [/wheat/, "pszeniczny-jasny"],
  [/rye/, "zytni"],
  [/munich|amber|brown/, "monachijski-jasny"],
  [/vienna/, "wiedenski"],
  [/pilsner|lager malt/, "pilznenski"],
  [/extra pale|pale ale|maris otter|propino|golden promise|pale malt/, "pale-ale"],
  [/dextrose|sugar|muscavado/, "cukier-bialy"],
  [/honey/, "miod"],
  [/lactose/, "laktoza"],
];

const YEAST_ALIASES: [RegExp, string][] = [
  [/1056|1272|us 05|american ale|vermont|super high gravity|1010/, "us-05"],
  [/2007|2124|2126|w 34 70|s189|pilsen|bohemian lager/, "w-34-70"],
  [/3711|3724|saison/, "belle-saison"],
  [/3638|351|3333|wheat|weizen|witbier|3944/, "wb-06"],
  [/3522|1388|3787|500|monastery|trappist|belgian|westvleteren/, "be-256"],
  [/london|013/, "s-04"],
];

// Nazwy chmieli z DIY Dog, które w bazie Warzelnika brzmią inaczej
const HOP_ALIASES: [RegExp, string][] = [
  [/^fuggles?$/, "fuggle"],
  [/^(east kent )?goldings$/, "east-kent-goldings"],
  [/^styrian goldings$/, "styrian-goldings"],
  [/^hallertau(er)? mittelfr(u|ue)h$/, "hallertau-mittelfrueh"],
  [/^columbus$|^ctz$/, "columbus"],
  [/^saaz$/, "saaz"],
];

function hopUse(add: string): { use: HopUse; time: number } | null {
  const a = norm(add);
  if (/dry|fv|secondary|maturation/.test(a)) return { use: "dryhop", time: 4 };
  if (/whirlpool|flame|end/.test(a)) return { use: "whirlpool", time: 0 };
  if (/start|first wort|kettle|mash/.test(a)) return { use: "boil", time: 60 };
  if (/middle/.test(a)) return { use: "boil", time: 30 };
  const min = Number(a);
  if (Number.isFinite(min)) return { use: "boil", time: min };
  return null;
}

function hopStage(add: string): string {
  const u = hopUse(add);
  if (!u) return add;
  if (u.use === "dryhop") return "na zimno";
  if (u.use === "whirlpool") return "koniec gotowania";
  return `${u.time} min`;
}

export function DiyDogView({ setRecipes }: { setRecipes: (fn: (prev: Recipe[]) => Recipe[]) => void }) {
  const { malts, hops } = useIngredients();
  const [beers, setBeers] = useState<DiyDogBeer[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    // 360 KB — ładowane dopiero po wejściu w zakładkę
    import("@/data/diyDog.json").then((m) => setBeers(m.default as DiyDogBeer[]));
  }, []);

  const list = useMemo(() => {
    if (!beers) return [];
    const s = norm(q);
    return s ? beers.filter((b) => norm(`${b.name} ${b.tagline}`).includes(s)) : beers;
  }, [beers, q]);

  function toRecipe(b: DiyDogBeer): Recipe {
    const hopByName = new Map(hops.map((h) => [norm(h.name), h.id]));
    const findHop = (name: string) => {
      const n = norm(name);
      return hopByName.get(n) ?? HOP_ALIASES.find(([re]) => re.test(n))?.[1];
    };
    const missing: string[] = [];
    const rMalts: RecipeMalt[] = [];
    for (const [name, kg] of b.malts) {
      const n = norm(name);
      const exact = malts.find((m) => norm(m.name) === n);
      const id = exact?.id ?? MALT_ALIASES.find(([re]) => re.test(n))?.[1];
      if (id) rMalts.push({ maltId: id, kg: Math.round(kg * 1000) / 1000 });
      else missing.push(`${name} ${kg} kg`);
    }
    const rHops: RecipeHop[] = [];
    for (const [name, amount, unit, add] of b.hops) {
      const id = findHop(name);
      const u = hopUse(add);
      if (id && u && unit === "grams") rHops.push({ hopId: id, grams: amount, time: u.time, use: u.use });
      else missing.push(`${name} ${amount} ${unit === "grams" ? "g" : unit} (${hopStage(add)})`);
    }
    const yeastId = b.yeast ? YEAST_ALIASES.find(([re]) => re.test(norm(b.yeast!)))?.[1] ?? null : null;
    const notes = [
      `BrewDog DIY Dog #${b.n}: ${b.tagline}`,
      `Wartości docelowe BrewDoga: OG ${b.og ?? "?"}, FG ${b.fg ?? "?"}, ${b.abv}% ABV, IBU ${b.ibu ?? "?"}, EBC ${b.ebc ?? "?"}.`,
      b.yeast ? `Drożdże w oryginale: ${b.yeast}${yeastId ? " (zastąpione najbliższym odpowiednikiem)" : ""}.` : "",
      missing.length ? `Składniki spoza bazy Warzelnika (dodaj ręcznie): ${missing.join("; ")}.` : "",
      b.twist ? `Dodatki: ${b.twist}` : "",
      b.tips ? `Wskazówka BrewDoga: ${b.tips}` : "",
    ].filter(Boolean).join("\n");
    return {
      id: newRecipeId(),
      name: b.name,
      style: b.tagline.replace(/\.$/, ""),
      batchL: b.batchL,
      efficiency: 75,
      malts: rMalts,
      hops: rHops,
      yeastId,
      mashSteps: b.mash.length
        ? b.mash.map(([t, min], i) => ({ name: i === 0 ? "Zacieranie" : `Przerwa ${i + 1}`, temp: t, minutes: min ?? 60 }))
        : [{ name: "Zacieranie", temp: 66, minutes: 60 }],
      notes,
    };
  }

  function copy(b: DiyDogBeer) {
    setRecipes((prev) => [toRecipe(b), ...prev]);
    setAdded(b.n);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
        <h2 className="text-base font-bold text-amber-900">BrewDog DIY Dog</h2>
        <p className="mt-0.5 text-xs text-stone-500">
          {beers ? beers.length : "…"} receptur, które BrewDog udostępnił piwowarom domowym (warka 20 l). Opisy i wskazówki
          browaru są w oryginale po angielsku.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj receptury lub stylu…"
          className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {!beers && <p className="text-center text-sm text-stone-400">Wczytywanie receptur…</p>}

      {list.map((b) => {
        const isOpen = open === b.n;
        return (
          <div key={b.n} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : b.n)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <span
                className="h-9 w-9 shrink-0 rounded-full border-2 border-white shadow-inner ring-1 ring-stone-200"
                style={{ backgroundColor: ebcToColor(b.ebc ?? 20) }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-stone-800">{b.name}</div>
                <div className="truncate text-xs text-stone-500">{b.tagline}</div>
              </div>
              <div className="text-right text-xs text-stone-500">
                <div className="font-bold text-amber-800">{b.abv}%</div>
                {b.ibu != null && <div>{b.ibu} IBU</div>}
              </div>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-amber-100 p-3 text-sm text-stone-700">
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-stone-800 p-2 text-center text-white">
                  {[
                    ["OG", b.og ? (b.og / 1000).toFixed(3) : "—"],
                    ["FG", b.fg ? (b.fg / 1000).toFixed(3) : "—"],
                    ["EBC", b.ebc ?? "—"],
                    ["pH", b.ph ?? "—"],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-[10px] uppercase text-stone-400">{l}</div>
                      <div className="font-bold">{v}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs italic text-stone-600" lang="en">{b.desc}</p>
                <p className="text-xs text-stone-500">
                  Warka {b.batchL} l (gotowanie {b.boilL} l)
                  {b.first ? ` · pierwsze warzenie ${b.first}` : ""}
                  {b.att ? ` · odfermentowanie ${b.att}%` : ""}
                </p>

                <section>
                  <h3 className="mb-1 text-xs font-bold uppercase text-amber-800">Słody</h3>
                  <ul className="space-y-0.5">
                    {b.malts.map(([n, kg], i) => (
                      <li key={i} className="flex justify-between"><span>{n}</span><span className="text-stone-500">{kg} kg</span></li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="mb-1 text-xs font-bold uppercase text-amber-800">Chmiele i dodatki</h3>
                  <ul className="space-y-0.5">
                    {b.hops.map(([n, amount, unit, add], i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{n}</span>
                        <span className="shrink-0 text-stone-500">
                          {amount} {unit === "grams" ? "g" : unit} · {hopStage(add)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-amber-50 p-2">
                    <div className="font-bold text-amber-800">Zacieranie</div>
                    {b.mash.length ? b.mash.map(([t, m], i) => <div key={i}>{t}°C{m ? `, ${m} min` : ""}</div>) : "—"}
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2">
                    <div className="font-bold text-amber-800">Fermentacja</div>
                    <div>{b.ferm != null ? `${b.ferm}°C` : "—"}</div>
                    <div className="mt-1 text-stone-500">{b.yeast ?? "drożdże nie podane"}</div>
                  </div>
                </section>

                {b.twist && <p className="text-xs"><b>Dodatki:</b> <span lang="en">{b.twist}</span></p>}
                {b.tips && <p className="rounded-xl bg-amber-50 p-2 text-xs italic" lang="en">💡 {b.tips}</p>}
                {b.food.length > 0 && (
                  <p className="text-xs text-stone-500"><b>Do jedzenia:</b> <span lang="en">{b.food.join(", ")}</span></p>
                )}

                <button
                  type="button"
                  onClick={() => copy(b)}
                  className={cn(
                    "w-full rounded-xl py-2.5 text-sm font-bold text-white transition-colors",
                    added === b.n ? "bg-green-600" : "bg-amber-700 hover:bg-amber-800"
                  )}
                >
                  {added === b.n ? "✓ Dodano do Moich receptur" : "Skopiuj do Moich receptur"}
                </button>
                <p className="text-[11px] text-stone-400">
                  Słody, chmiele i drożdże dopasowujemy do bazy Warzelnika; czego w niej nie ma, trafia do notatek receptury.
                </p>
              </div>
            )}
          </div>
        );
      })}
      {beers && list.length === 0 && <p className="text-center text-sm text-stone-400">Brak receptur dla „{q}”.</p>}
    </div>
  );
}
