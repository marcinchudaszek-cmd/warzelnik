import type { Hop, Malt, Recipe, Yeast } from "@/types";
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
