import type { Hop, Malt, Recipe } from "@/types";

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
}

/** IBU wg formuły Tinsetha. */
export function calcIBU(additions: HopAddition[], og: number, batchL: number): number {
  if (batchL <= 0) return 0;
  const bignessFactor = 1.65 * Math.pow(0.000125, og - 1);
  return additions.reduce((sum, { hop, grams, time }) => {
    const boilTimeFactor = (1 - Math.exp(-0.04 * time)) / 4.15;
    const utilization = bignessFactor * boilTimeFactor;
    const mgAlphaPerL = (hop.alpha / 100) * grams * 1000 / batchL;
    return sum + utilization * mgAlphaPerL;
  }, 0);
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
    .map((h) => ({ hop: hopById.get(h.hopId), grams: h.grams, time: h.time }))
    .filter((a): a is HopAddition => !!a.hop && a.grams > 0);

  const og = calcOG(grist, recipe.batchL, recipe.efficiency);
  const fg = calcFG(og, attenuationPct);
  const abv = calcABV(og, fg);
  const ibu = calcIBU(additions, og, recipe.batchL);
  const ebc = calcEBC(grist, recipe.batchL);
  const totalKg = grist.reduce((s, g) => s + g.kg, 0);

  return { og, fg, abv, ibu, ebc, totalKg };
}
