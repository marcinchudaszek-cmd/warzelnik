import type { Hop, HopUse, Malt, Recipe, Yeast } from "@/types";
import { getBoilMinutes, calcWater, getMashRatio } from "@/utils/brewCalc";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HOP_USE_XML: Record<string, string> = {
  boil: "Boil",
  whirlpool: "Aroma",
  dryhop: "Dry Hop",
};

/** Generuje dokument BeerXML 1.0 dla receptury. */
export function recipeToBeerXML(
  recipe: Recipe,
  maltById: Map<string, Malt>,
  hopById: Map<string, Hop>,
  yeastById: Map<string, Yeast>
): string {
  const boilMin = getBoilMinutes(recipe);
  const grainKg = recipe.malts.reduce((s, m) => {
    const malt = maltById.get(m.maltId);
    return malt && malt.type !== "dodatek" ? s + m.kg : s;
  }, 0);
  const water = calcWater(grainKg, recipe.batchL, getMashRatio(recipe), boilMin);
  const yeast = recipe.yeastId ? yeastById.get(recipe.yeastId) : undefined;

  const fermentables = recipe.malts
    .map((m) => {
      const malt = maltById.get(m.maltId);
      if (!malt || m.kg <= 0) return "";
      const isSugar = malt.type === "dodatek";
      return `      <FERMENTABLE>
        <NAME>${esc(malt.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>${isSugar ? "Sugar" : "Grain"}</TYPE>
        <AMOUNT>${m.kg.toFixed(3)}</AMOUNT>
        <YIELD>${malt.extract.toFixed(1)}</YIELD>
        <COLOR>${(malt.ebc / 1.97).toFixed(1)}</COLOR>
      </FERMENTABLE>`;
    })
    .filter(Boolean)
    .join("\n");

  const hops = recipe.hops
    .map((h) => {
      const hop = hopById.get(h.hopId);
      if (!hop || h.grams <= 0) return "";
      const use = h.use ?? "boil";
      // BeerXML: TIME zawsze w minutach (dry hop w dniach -> minuty)
      const timeMin = use === "dryhop" ? h.time * 24 * 60 : h.time;
      return `      <HOP>
        <NAME>${esc(hop.name)}</NAME>
        <VERSION>1</VERSION>
        <ALPHA>${hop.alpha.toFixed(1)}</ALPHA>
        <AMOUNT>${(h.grams / 1000).toFixed(4)}</AMOUNT>
        <USE>${HOP_USE_XML[use]}</USE>
        <TIME>${timeMin.toFixed(0)}</TIME>
        <ORIGIN>${esc(hop.origin)}</ORIGIN>
      </HOP>`;
    })
    .filter(Boolean)
    .join("\n");

  const yeasts = yeast
    ? `      <YEAST>
        <NAME>${esc(yeast.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>${yeast.type === "dolnej fermentacji" ? "Lager" : "Ale"}</TYPE>
        <FORM>Dry</FORM>
        <AMOUNT>0.0115</AMOUNT>
        <LABORATORY>${esc(yeast.lab)}</LABORATORY>
        <ATTENUATION>${yeast.attenuation.toFixed(0)}</ATTENUATION>
        <MIN_TEMPERATURE>${yeast.tempMin.toFixed(1)}</MIN_TEMPERATURE>
        <MAX_TEMPERATURE>${yeast.tempMax.toFixed(1)}</MAX_TEMPERATURE>
      </YEAST>`
    : "";

  const mashSteps = recipe.mashSteps
    .map(
      (ms) => `        <MASH_STEP>
          <NAME>${esc(ms.name)}</NAME>
          <VERSION>1</VERSION>
          <TYPE>Temperature</TYPE>
          <STEP_TEMP>${ms.temp.toFixed(1)}</STEP_TEMP>
          <STEP_TIME>${ms.minutes.toFixed(0)}</STEP_TIME>
        </MASH_STEP>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${esc(recipe.name)}</NAME>
    <VERSION>1</VERSION>
    <TYPE>All Grain</TYPE>
    <STYLE>
      <NAME>${esc(recipe.style || "Nieokreślony")}</NAME>
      <VERSION>1</VERSION>
      <CATEGORY></CATEGORY>
      <CATEGORY_NUMBER>0</CATEGORY_NUMBER>
      <STYLE_LETTER></STYLE_LETTER>
      <STYLE_GUIDE></STYLE_GUIDE>
      <TYPE>Ale</TYPE>
      <OG_MIN>1.020</OG_MIN>
      <OG_MAX>1.120</OG_MAX>
      <FG_MIN>1.000</FG_MIN>
      <FG_MAX>1.040</FG_MAX>
      <IBU_MIN>0</IBU_MIN>
      <IBU_MAX>120</IBU_MAX>
      <COLOR_MIN>1</COLOR_MIN>
      <COLOR_MAX>80</COLOR_MAX>
    </STYLE>
    <BREWER></BREWER>
    <BATCH_SIZE>${recipe.batchL.toFixed(1)}</BATCH_SIZE>
    <BOIL_SIZE>${water.preBoilL.toFixed(1)}</BOIL_SIZE>
    <BOIL_TIME>${boilMin.toFixed(0)}</BOIL_TIME>
    <EFFICIENCY>${recipe.efficiency.toFixed(0)}</EFFICIENCY>
    <HOPS>
${hops}
    </HOPS>
    <FERMENTABLES>
${fermentables}
    </FERMENTABLES>
    <MISCS></MISCS>
    <WATERS></WATERS>
    <YEASTS>
${yeasts}
    </YEASTS>
    <MASH>
      <NAME>Zacieranie</NAME>
      <VERSION>1</VERSION>
      <GRAIN_TEMP>20.0</GRAIN_TEMP>
      <MASH_STEPS>
${mashSteps}
      </MASH_STEPS>
    </MASH>
    <NOTES>${esc(recipe.notes)}</NOTES>
  </RECIPE>
</RECIPES>
`;
}

// ── Import ────────────────────────────────────────────────────────

function text(el: Element, tag: string): string {
  return el.querySelector(`:scope > ${tag}`)?.textContent?.trim() ?? "";
}

function num(el: Element, tag: string): number {
  const v = parseFloat(text(el, tag));
  return Number.isFinite(v) ? v : 0;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aliasowe tokeny ułatwiające dopasowanie angielskich nazw do polskiej bazy. */
const MALT_ALIASES: Record<string, string> = {
  pilsner: "pilznenski",
  pilsen: "pilznenski",
  lager: "pilznenski",
  vienna: "wiedenski",
  munich: "monachijski-jasny",
  wheat: "pszeniczny-jasny",
  rye: "zytni",
  chocolate: "czekoladowy",
  black: "barwiacy",
  roasted: "palony-jeczmien",
  oats: "platki-owsiane",
  oat: "platki-owsiane",
  honey: "miod",
  lactose: "laktoza",
  sugar: "cukier-bialy",
  candi: "cukier-kandyzowany-ciemny",
  acidulated: "kwaskowy",
  smoked: "wedzony",
  melanoidin: "melanoidynowy",
};

function matchByName<T extends { id: string; name: string }>(name: string, items: T[]): T | undefined {
  const n = normalize(name);
  if (!n) return undefined;
  const exact = items.find((i) => normalize(i.name) === n);
  if (exact) return exact;
  return items.find((i) => {
    const ni = normalize(i.name);
    return ni.includes(n) || n.includes(ni);
  });
}

function matchMalt(name: string, colorSrm: number, isSugar: boolean, malts: Malt[]): Malt | undefined {
  const byName = matchByName(name, malts);
  if (byName) return byName;
  for (const token of normalize(name).split(" ")) {
    const alias = MALT_ALIASES[token];
    if (alias) {
      const m = malts.find((x) => x.id === alias);
      if (m) return m;
    }
  }
  // ostatnia deska ratunku: najbliższa barwa w odpowiedniej grupie
  const ebc = colorSrm * 1.97;
  const pool = malts.filter((m) => (isSugar ? m.type === "dodatek" : m.type !== "dodatek"));
  return pool.reduce<Malt | undefined>(
    (best, m) => (!best || Math.abs(m.ebc - ebc) < Math.abs(best.ebc - ebc) ? m : best),
    undefined
  );
}

function matchHop(name: string, alpha: number, hops: Hop[]): Hop | undefined {
  const byName = matchByName(name, hops);
  if (byName) return byName;
  return hops.reduce<Hop | undefined>(
    (best, h) => (!best || Math.abs(h.alpha - alpha) < Math.abs(best.alpha - alpha) ? h : best),
    undefined
  );
}

const XML_HOP_USE: Record<string, HopUse> = {
  boil: "boil",
  aroma: "whirlpool",
  whirlpool: "whirlpool",
  "dry hop": "dryhop",
  "first wort": "boil",
  mash: "boil",
};

export interface BeerXMLImportResult {
  recipe: Recipe;
  warnings: string[];
}

/** Parsuje pierwszą recepturę z dokumentu BeerXML, dopasowując składniki do lokalnej bazy. */
export function parseBeerXML(
  xmlText: string,
  malts: Malt[],
  hops: Hop[],
  yeasts: Yeast[]
): BeerXMLImportResult {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Nieprawidłowy plik XML.");
  const recipeEl = doc.querySelector("RECIPES > RECIPE, RECIPE");
  if (!recipeEl) throw new Error("Nie znaleziono receptury w pliku BeerXML.");

  const warnings: string[] = [];

  const recipeMalts = [...recipeEl.querySelectorAll("FERMENTABLES > FERMENTABLE")].flatMap((f) => {
    const name = text(f, "NAME");
    const kg = num(f, "AMOUNT");
    const isSugar = /sugar|extract|honey|syrup/i.test(text(f, "TYPE"));
    const malt = matchMalt(name, num(f, "COLOR"), isSugar, malts);
    if (!malt) {
      warnings.push(`Pominięto składnik: ${name}`);
      return [];
    }
    if (normalize(malt.name) !== normalize(name)) warnings.push(`„${name}” → ${malt.name}`);
    return [{ maltId: malt.id, kg: Math.round(kg * 1000) / 1000 }];
  });

  const recipeHops = [...recipeEl.querySelectorAll("HOPS > HOP")].flatMap((h) => {
    const name = text(h, "NAME");
    const hop = matchHop(name, num(h, "ALPHA"), hops);
    if (!hop) {
      warnings.push(`Pominięto chmiel: ${name}`);
      return [];
    }
    if (normalize(hop.name) !== normalize(name)) warnings.push(`„${name}” → ${hop.name}`);
    const use = XML_HOP_USE[text(h, "USE").toLowerCase()] ?? "boil";
    const timeMin = num(h, "TIME");
    return [
      {
        hopId: hop.id,
        grams: Math.round(num(h, "AMOUNT") * 1000),
        time: use === "dryhop" ? Math.max(1, Math.round(timeMin / 1440)) : Math.round(timeMin),
        use,
      },
    ];
  });

  const yeastEl = recipeEl.querySelector("YEASTS > YEAST");
  let yeastId: string | null = null;
  if (yeastEl) {
    const name = text(yeastEl, "NAME");
    const yeast = matchByName(name, yeasts);
    if (yeast) {
      yeastId = yeast.id;
      if (normalize(yeast.name) !== normalize(name)) warnings.push(`„${name}” → ${yeast.name}`);
    } else {
      warnings.push(`Nie dopasowano drożdży: ${name}`);
    }
  }

  const mashSteps = [...recipeEl.querySelectorAll("MASH_STEPS > MASH_STEP")].map((ms) => ({
    name: text(ms, "NAME") || "Przerwa",
    temp: Math.round(num(ms, "STEP_TEMP")),
    minutes: Math.round(num(ms, "STEP_TIME")),
  }));

  const batchL = num(recipeEl, "BATCH_SIZE") || 20;
  const recipe: Recipe = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: text(recipeEl, "NAME") || "Importowana receptura",
    style: recipeEl.querySelector("STYLE > NAME")?.textContent?.trim() ?? "",
    batchL: Math.round(batchL * 10) / 10,
    efficiency: num(recipeEl, "EFFICIENCY") || 70,
    boilMinutes: num(recipeEl, "BOIL_TIME") || undefined,
    malts: recipeMalts,
    hops: recipeHops,
    yeastId,
    mashSteps: mashSteps.length > 0 ? mashSteps : [{ name: "Zacieranie właściwe", temp: 66, minutes: 60 }],
    notes: text(recipeEl, "NOTES"),
  };

  return { recipe, warnings };
}

export function downloadBeerXML(xml: string, recipeName: string) {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${recipeName.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "receptura"}.xml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
