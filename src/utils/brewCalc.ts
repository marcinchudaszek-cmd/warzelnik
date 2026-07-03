import type { Hop, HopUse, Malt, Recipe } from "@/types";

/**
 * Kalkulatory piwowarskie (jednostki metryczne).
 * OG z ekstraktywności słodu, IBU wg Tinsetha, barwa wg Moreya.
 */

/** Maksymalny uzysk ekstraktu: 1 kg czystej sacharozy w 1 L daje 384 punkty grawitacji. */
const MAX_POINTS_PER_KG_L = 384;

export interface GristItem {
  malt: Malt;
  kg: number;
}

export function calcOG(grist: GristItem[], batchL: number, efficiencyPct: number): number {
  if (batchL <= 0) return 1;
  const points = grist.reduce((sum, { malt, kg }) => {
    const isMashed = malt.type !== "dodatek";
    const eff = isMashed ? efficiencyPct / 100 : 1; // cukry/ekstrakty rozpuszczają się w 100%
    return sum + kg * MAX_POINTS_PER_KG_L * (malt.extract / 100) * eff;
  }, 0);
  return 1 + points / batchL / 1000;
}

export function calcFG(og: number, attenuationPct: number): number {
  return og - (og - 1) * (attenuationPct / 100);
}

export function calcABV(og: number, fg: number): number {
  return Math.max(0, (og - fg) * 131.25);
}

export interface HopAddition {
  hop: Hop;
  grams: number;
  time: number;
  use: HopUse;
}

/** Whirlpool (~80°C) daje ok. połowę wykorzystania alfa-kwasów z gotowania. */
const WHIRLPOOL_UTILIZATION_FACTOR = 0.5;

/** IBU wg formuły Tinsetha; whirlpool z obniżonym wykorzystaniem, chmielenie na zimno = 0 IBU. */
export function calcIBU(additions: HopAddition[], og: number, batchL: number): number {
  if (batchL <= 0) return 0;
  const bignessFactor = 1.65 * Math.pow(0.000125, og - 1);
  return additions.reduce((sum, { hop, grams, time, use }) => {
    if (use === "dryhop") return sum;
    const boilTimeFactor = (1 - Math.exp(-0.04 * time)) / 4.15;
    const useFactor = use === "whirlpool" ? WHIRLPOOL_UTILIZATION_FACTOR : 1;
    const utilization = bignessFactor * boilTimeFactor * useFactor;
    const mgAlphaPerL = (hop.alpha / 100) * grams * 1000 / batchL;
    return sum + utilization * mgAlphaPerL;
  }, 0);
}

export function getBoilMinutes(recipe: Recipe): number {
  if (recipe.boilMinutes && recipe.boilMinutes > 0) return recipe.boilMinutes;
  return Math.max(60, ...recipe.hops.filter((h) => (h.use ?? "boil") === "boil").map((h) => h.time));
}

export function getMashRatio(recipe: Recipe): number {
  return recipe.mashRatio && recipe.mashRatio > 0 ? recipe.mashRatio : 3;
}

/** Absorpcja wody przez młóto (L/kg). */
const GRAIN_ABSORPTION_L_PER_KG = 0.9;
/** Tempo odparowania podczas gotowania (L/h). */
const EVAPORATION_L_PER_H = 2.5;
/** Strata na osadzie i przelewach (L). */
const TRUB_LOSS_L = 1;

export interface WaterPlan {
  /** Woda zacierna (L) */
  mashL: number;
  /** Woda na wysładzanie (L) */
  spargeL: number;
  /** Objętość przed gotowaniem (L) */
  preBoilL: number;
  /** Łączna woda (L) */
  totalL: number;
  absorptionL: number;
  evapL: number;
}

export function calcWater(grainKg: number, batchL: number, mashRatio: number, boilMinutes: number): WaterPlan {
  const mashL = grainKg * mashRatio;
  const absorptionL = grainKg * GRAIN_ABSORPTION_L_PER_KG;
  const evapL = EVAPORATION_L_PER_H * (boilMinutes / 60);
  const preBoilL = batchL + evapL + TRUB_LOSS_L;
  const spargeL = Math.max(0, preBoilL - (mashL - absorptionL));
  return { mashL, spargeL, preBoilL, totalL: mashL + spargeL, absorptionL, evapL };
}

/** Barwa piwa w EBC wg formuły Moreya. */
export function calcEBC(grist: GristItem[], batchL: number): number {
  if (batchL <= 0) return 0;
  const mcu = grist.reduce((sum, { malt, kg }) => {
    const lovibond = malt.ebc / 1.97 / 1.35 + 0.6; // EBC -> SRM -> ~°L
    return sum + (kg * lovibond * 8.3454) / batchL;
  }, 0);
  const srm = 1.4922 * Math.pow(mcu, 0.6859);
  return srm * 1.97;
}

/** Przybliżony kolor CSS dla barwy w EBC (do podglądu piwa). */
export function ebcToColor(ebc: number): string {
  const srm = ebc / 1.97;
  const stops: [number, string][] = [
    [2, "#F8F4B4"],
    [4, "#F6E96C"],
    [6, "#F0C529"],
    [8, "#EAA224"],
    [10, "#E58F24"],
    [13, "#D77A28"],
    [17, "#BF5B23"],
    [20, "#A94E1C"],
    [24, "#8F3D18"],
    [29, "#6F2D12"],
    [35, "#57200E"],
    [40, "#3F160A"],
    [999, "#2A0E06"],
  ];
  for (const [max, color] of stops) {
    if (srm <= max) return color;
  }
  return "#2A0E06";
}

export function formatGravity(g: number): string {
  return g.toFixed(3);
}

/** SG -> stopnie Plato (Blg). */
export function sgToPlato(sg: number): number {
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg;
}

/** Stopnie Plato (Blg) -> SG. */
export function platoToSg(p: number): number {
  return 1 + p / (258.6 - (p / 258.2) * 227.1);
}

/**
 * Korekta wskazania hydrometru względem temperatury próbki.
 * Formuła w °F, kalibracja domyślnie 20°C.
 */
export function correctHydrometer(measuredSg: number, sampleC: number, calibrationC = 20): number {
  const f = (c: number) => c * 1.8 + 32;
  const density = (tF: number) =>
    1.00130346 - 0.000134722124 * tF + 0.00000204052596 * tF * tF - 0.00000000232820948 * tF * tF * tF;
  return measuredSg * (density(f(sampleC)) / density(f(calibrationC)));
}

/** Resztkowe CO2 (obj.) po fermentacji w danej temperaturze (°C). */
export function residualCO2(tempC: number): number {
  const tF = tempC * 1.8 + 32;
  return 3.0378 - 0.050062 * tF + 0.00026555 * tF * tF;
}

/** 1 objętość CO2 = 1,96 g/L; uzysk CO2 z grama cukru. */
const CO2_G_PER_L_PER_VOL = 1.96;
const SUGAR_CO2_YIELD: Record<"sacharoza" | "glukoza", number> = {
  sacharoza: 0.514, // g CO2 / g cukru
  glukoza: 0.444, // glukoza jednowodna
};

/** Gramy cukru na refermentację całej warki. */
export function primingSugar(
  batchL: number,
  targetVols: number,
  fermTempC: number,
  sugar: "sacharoza" | "glukoza"
): number {
  const needed = Math.max(0, targetVols - residualCO2(fermTempC));
  return (needed * CO2_G_PER_L_PER_VOL * batchL) / SUGAR_CO2_YIELD[sugar];
}

export function recipeStats(
  recipe: Recipe,
  maltById: Map<string, Malt>,
  hopById: Map<string, Hop>,
  attenuationPct: number
) {
  const grist: GristItem[] = recipe.malts
    .map((m) => ({ malt: maltById.get(m.maltId), kg: m.kg }))
    .filter((g): g is GristItem => !!g.malt && g.kg > 0);
  const additions: HopAddition[] = recipe.hops
    .map((h) => ({ hop: hopById.get(h.hopId), grams: h.grams, time: h.time, use: h.use ?? ("boil" as const) }))
    .filter((a): a is HopAddition => !!a.hop && a.grams > 0);

  const og = calcOG(grist, recipe.batchL, recipe.efficiency);
  const fg = calcFG(og, attenuationPct);
  const abv = calcABV(og, fg);
  const ibu = calcIBU(additions, og, recipe.batchL);
  const ebc = calcEBC(grist, recipe.batchL);
  const totalKg = grist.reduce((s, g) => s + g.kg, 0);

  return { og, fg, abv, ibu, ebc, totalKg };
}
