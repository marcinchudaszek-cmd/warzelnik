export type MaltType = "bazowy" | "karmelowy" | "palony" | "specjalny" | "dodatek";

export interface Malt {
  id: string;
  name: string;
  type: MaltType;
  /** Barwa słodu w EBC */
  ebc: number;
  /** Ekstraktywność w % suchej masy (typowo 75–82%) */
  extract: number;
  /** Sugerowany maksymalny udział w zasypie (%) */
  maxPercent: number;
  description: string;
}

export type HopType = "goryczkowy" | "aromatyczny" | "uniwersalny";

export interface Hop {
  id: string;
  name: string;
  origin: string;
  /** Typowa zawartość alfa-kwasów (%) */
  alpha: number;
  type: HopType;
  aromas: string[];
  description: string;
}

export type YeastType = "górnej fermentacji" | "dolnej fermentacji" | "dzikie / specjalne";

export interface Yeast {
  id: string;
  name: string;
  lab: string;
  type: YeastType;
  /** Typowe odfermentowanie (%) */
  attenuation: number;
  tempMin: number;
  tempMax: number;
  styles: string[];
  description: string;
}

export interface RecipeMalt {
  maltId: string;
  kg: number;
}

export type HopUse = "boil" | "whirlpool" | "dryhop";

export interface RecipeHop {
  hopId: string;
  grams: number;
  /** Gotowanie/whirlpool: minuty; chmielenie na zimno: dni */
  time: number;
  /** Sposób użycia (brak = gotowanie, dla starszych receptur) */
  use?: HopUse;
}

export interface MashStep {
  name: string;
  temp: number;
  minutes: number;
}

export interface Recipe {
  id: string;
  name: string;
  style: string;
  /** Objętość warki do fermentora (litry) */
  batchL: number;
  /** Wydajność zacierania (%) */
  efficiency: number;
  /** Czas gotowania (min); brak = 60 lub najdłuższe chmielenie */
  boilMinutes?: number;
  /** Stosunek wody zaciernej do zasypu (L/kg); brak = 3 */
  mashRatio?: number;
  malts: RecipeMalt[];
  hops: RecipeHop[];
  yeastId: string | null;
  mashSteps: MashStep[];
  notes: string;
}

export interface FermentationEntry {
  id: string;
  date: string;
  gravity: string;
  temp: string;
  note: string;
}

export interface BrewSession {
  id: string;
  recipeId: string;
  startedAt: string;
  measuredOG: string;
  measuredFG: string;
  entries: FermentationEntry[];
}
