import { newCustomId } from "@/ingredients";
import type { Hop, HopUse, Malt, MaltType, Recipe, Yeast } from "@/types";
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

function matchMalt(name: string, malts: Malt[]): Malt | undefined {
  const byName = matchByName(name, malts);
  if (byName) return byName;
  for (const token of normalize(name).split(" ")) {
    const alias = MALT_ALIASES[token];
    if (alias) {
      const m = malts.find((x) => x.id === alias);
      if (m) return m;
    }
  }
  return undefined;
}

/** Zgadnij typ słodu po nazwie i barwie. */
function guessMaltType(name: string, ebc: number, isSugar: boolean): MaltType {
  if (isSugar) return "dodatek";
  const n = normalize(name);
  if (/\b(cara|crystal|caramel)\b/.test(n) || /cara|crystal|caramel/.test(n)) return "karmelowy";
  if (/roast|chocolate|black|palon|czekolad/.test(n) || ebc > 400) return "palony";
  if (ebc <= 30) return "bazowy";
  return "specjalny";
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
  /** Składniki, których nie było w bazie – utworzone jako własne. */
  newMalts: Malt[];
  newHops: Hop[];
  newYeasts: Yeast[];
}

function maltFromXml(f: Element): Malt {
  const name = text(f, "NAME") || "Importowany słód";
  const ebc = Math.round(num(f, "COLOR") * 1.97 * 10) / 10;
  const isSugar = /sugar|extract|honey|syrup/i.test(text(f, "TYPE"));
  return {
    id: newCustomId("malt"),
    name,
    type: guessMaltType(name, ebc, isSugar),
    ebc,
    extract: Math.round(num(f, "YIELD")) || 78,
    maxPercent: 100,
    description: "Zaimportowany z pliku.",
  };
}

function hopFromXml(h: Element): Hop {
  return {
    id: newCustomId("hop"),
    name: text(h, "NAME") || "Importowany chmiel",
    origin: text(h, "ORIGIN") || "—",
    alpha: Math.round(num(h, "ALPHA") * 10) / 10 || 5,
    type: "uniwersalny",
    aromas: [],
    description: "Zaimportowany z pliku.",
  };
}

function yeastFromXml(y: Element): Yeast {
  const isLager = /lager/i.test(text(y, "TYPE"));
  return {
    id: newCustomId("yeast"),
    name: text(y, "NAME") || "Importowane drożdże",
    lab: text(y, "LABORATORY") || "—",
    type: isLager ? "dolnej fermentacji" : "górnej fermentacji",
    attenuation: Math.round(num(y, "ATTENUATION")) || 75,
    tempMin: Math.round(num(y, "MIN_TEMPERATURE")) || 15,
    tempMax: Math.round(num(y, "MAX_TEMPERATURE")) || 22,
    styles: [],
    description: "Zaimportowane z pliku.",
  };
}

/**
 * Parsuje pierwszą recepturę z dokumentu BeerXML. Składniki dopasowuje do bazy
 * po nazwie/aliasach; brakujące tworzy jako własne (do zapisania przez wywołującego).
 */
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
  const newMalts: Malt[] = [];
  const newHops: Hop[] = [];
  const newYeasts: Yeast[] = [];

  const recipeMalts = [...recipeEl.querySelectorAll("FERMENTABLES > FERMENTABLE")].map((f) => {
    const name = text(f, "NAME");
    const kg = num(f, "AMOUNT");
    let malt = matchMalt(name, [...malts, ...newMalts]);
    if (!malt) {
      malt = maltFromXml(f);
      newMalts.push(malt);
      warnings.push(`Dodano własny słód: ${malt.name}`);
    } else if (normalize(malt.name) !== normalize(name)) {
      warnings.push(`„${name}” → ${malt.name}`);
    }
    return { maltId: malt.id, kg: Math.round(kg * 1000) / 1000 };
  });

  const recipeHops = [...recipeEl.querySelectorAll("HOPS > HOP")].map((h) => {
    const name = text(h, "NAME");
    let hop = matchByName(name, [...hops, ...newHops]);
    if (!hop) {
      hop = hopFromXml(h);
      newHops.push(hop);
      warnings.push(`Dodano własny chmiel: ${hop.name}`);
    } else if (normalize(hop.name) !== normalize(name)) {
      warnings.push(`„${name}” → ${hop.name}`);
    }
    const use = XML_HOP_USE[text(h, "USE").toLowerCase()] ?? "boil";
    const timeMin = num(h, "TIME");
    return {
      hopId: hop.id,
      grams: Math.round(num(h, "AMOUNT") * 1000),
      time: use === "dryhop" ? Math.max(1, Math.round(timeMin / 1440)) : Math.round(timeMin),
      use,
    };
  });

  const yeastEl = recipeEl.querySelector("YEASTS > YEAST");
  let yeastId: string | null = null;
  if (yeastEl) {
    const name = text(yeastEl, "NAME");
    let yeast = matchByName(name, yeasts);
    if (!yeast) {
      yeast = yeastFromXml(yeastEl);
      newYeasts.push(yeast);
      warnings.push(`Dodano własne drożdże: ${yeast.name}`);
    } else if (normalize(yeast.name) !== normalize(name)) {
      warnings.push(`„${name}” → ${yeast.name}`);
    }
    yeastId = yeast.id;
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

  return { recipe, warnings, newMalts, newHops, newYeasts };
}

// ── Import baz składników (XML lub JSON) ─────────────────────────

export interface IngredientsImportResult {
  malts: Malt[];
  hops: Hop[];
  yeasts: Yeast[];
  skipped: number;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  const lower = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    if (lower[k] !== undefined && lower[k] !== null && lower[k] !== "") return lower[k];
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, keys: string[]): number | undefined {
  const v = pick(obj, keys);
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  const v = pick(obj, keys);
  return v === undefined ? "" : String(v);
}

/** Barwa z JSON-a: pole ebc wprost, color/lovibond traktowane jako SRM/°L. */
function colorToEbc(obj: Record<string, unknown>): number {
  const ebc = pickNum(obj, ["ebc"]);
  if (ebc !== undefined) return ebc;
  const srm = pickNum(obj, ["color", "srm"]);
  if (srm !== undefined) return Math.round(srm * 1.97 * 10) / 10;
  const lov = pickNum(obj, ["lovibond"]);
  if (lov !== undefined) return Math.round(lov * 2.65 * 10) / 10;
  return 4;
}

function extractPct(obj: Record<string, unknown>): number {
  const y = pickNum(obj, ["extract", "yield"]);
  if (y !== undefined) return Math.round(y);
  // potencjał jako SG (np. 1.036 na lb/gal) -> % ekstraktu
  const pot = pickNum(obj, ["potential", "potentialpercentage"]);
  if (pot !== undefined) {
    if (pot > 1.2) return Math.round(pot); // już w %
    return Math.round(((pot - 1) * 1000 / 46.21) * 100) / 1 || 78;
  }
  return 78;
}

function attenuationPct(obj: Record<string, unknown>): number {
  const a = pickNum(obj, ["attenuation", "avgattenuation"]);
  if (a === undefined) return 75;
  return a <= 1.5 ? Math.round(a * 100) : Math.round(a);
}

function jsonToMalt(obj: Record<string, unknown>): Malt {
  const name = pickStr(obj, ["name"]) || "Importowany słód";
  const ebc = colorToEbc(obj);
  const isSugar = /sugar|extract|honey|syrup/i.test(pickStr(obj, ["type"]));
  return {
    id: newCustomId("malt"),
    name,
    type: guessMaltType(name, ebc, isSugar),
    ebc,
    extract: extractPct(obj),
    maxPercent: pickNum(obj, ["maxpercent", "maxinbatch"]) ?? 100,
    description: pickStr(obj, ["description", "notes"]) || "Zaimportowany z pliku.",
  };
}

function jsonToHop(obj: Record<string, unknown>): Hop {
  const alphaRaw = pickNum(obj, ["alpha", "alphaacid", "alpha_acid"]) ?? 5;
  return {
    id: newCustomId("hop"),
    name: pickStr(obj, ["name"]) || "Importowany chmiel",
    origin: pickStr(obj, ["origin", "country"]) || "—",
    alpha: Math.round(alphaRaw * 10) / 10,
    type: "uniwersalny",
    aromas: [],
    description: pickStr(obj, ["description", "notes"]) || "Zaimportowany z pliku.",
  };
}

function jsonToYeast(obj: Record<string, unknown>): Yeast {
  const isLager = /lager|dolna|dolnej/i.test(pickStr(obj, ["type"]));
  return {
    id: newCustomId("yeast"),
    name: pickStr(obj, ["name"]) || "Importowane drożdże",
    lab: pickStr(obj, ["lab", "laboratory", "producer"]) || "—",
    type: isLager ? "dolnej fermentacji" : "górnej fermentacji",
    attenuation: attenuationPct(obj),
    tempMin: pickNum(obj, ["tempmin", "mintemp", "min_temperature", "mintemperature"]) ?? 15,
    tempMax: pickNum(obj, ["tempmax", "maxtemp", "max_temperature", "maxtemperature"]) ?? 22,
    styles: [],
    description: pickStr(obj, ["description", "notes"]) || "Zaimportowane z pliku.",
  };
}

/** Zgadnij rodzaj składnika po polach obiektu JSON. */
function guessKind(obj: Record<string, unknown>): "malt" | "hop" | "yeast" {
  if (pick(obj, ["alpha", "alphaacid", "alpha_acid"]) !== undefined) return "hop";
  if (pick(obj, ["attenuation", "avgattenuation", "lab", "laboratory"]) !== undefined) return "yeast";
  return "malt";
}

/**
 * Import bazy składników z pliku: BeerXML (elementy FERMENTABLE/HOP/YEAST)
 * lub JSON (obiekt {malts,hops,yeasts} / {fermentables,...} albo tablica obiektów).
 * Duplikaty nazw (względem istniejącej bazy i w obrębie pliku) są pomijane.
 */
export function parseIngredientsFile(
  content: string,
  existing: { malts: Malt[]; hops: Hop[]; yeasts: Yeast[] }
): IngredientsImportResult {
  const result: IngredientsImportResult = { malts: [], hops: [], yeasts: [], skipped: 0 };
  const seen = new Set(
    [...existing.malts, ...existing.hops, ...existing.yeasts].map((i) => normalize(i.name))
  );

  const add = (kind: "malt" | "hop" | "yeast", item: Malt | Hop | Yeast) => {
    const n = normalize(item.name);
    if (!n || seen.has(n)) {
      result.skipped++;
      return;
    }
    seen.add(n);
    if (kind === "malt") result.malts.push(item as Malt);
    else if (kind === "hop") result.hops.push(item as Hop);
    else result.yeasts.push(item as Yeast);
  };

  const trimmed = content.trim();
  if (trimmed.startsWith("<")) {
    const doc = new DOMParser().parseFromString(trimmed, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Nieprawidłowy plik XML.");
    doc.querySelectorAll("FERMENTABLE").forEach((f) => add("malt", maltFromXml(f)));
    doc.querySelectorAll("HOP").forEach((h) => add("hop", hopFromXml(h)));
    doc.querySelectorAll("YEAST").forEach((y) => add("yeast", yeastFromXml(y)));
  } else {
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw new Error("Plik nie jest poprawnym XML ani JSON.");
    }
    const obj = data as Record<string, unknown>;
    const asArray = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
    if (Array.isArray(data)) {
      for (const item of data as Record<string, unknown>[]) {
        const kind = guessKind(item);
        add(kind, kind === "malt" ? jsonToMalt(item) : kind === "hop" ? jsonToHop(item) : jsonToYeast(item));
      }
    } else if (data && typeof data === "object") {
      for (const m of [...asArray(obj.malts), ...asArray(obj.fermentables)]) add("malt", jsonToMalt(m));
      for (const h of asArray(obj.hops)) add("hop", jsonToHop(h));
      for (const y of asArray(obj.yeasts)) add("yeast", jsonToYeast(y));
    }
  }

  if (result.malts.length + result.hops.length + result.yeasts.length === 0 && result.skipped === 0) {
    throw new Error("Nie znaleziono składników w pliku.");
  }
  return result;
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
