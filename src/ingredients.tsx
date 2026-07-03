import { createContext, useContext, useMemo } from "react";
import { HOPS } from "@/data/hops";
import { MALTS } from "@/data/malts";
import { YEASTS } from "@/data/yeasts";
import type { Hop, Malt, Yeast } from "@/types";
import { useLocalStorage } from "@/utils/useLocalStorage";

/**
 * Składniki = baza wbudowana + własne (localStorage).
 * Własne mają id z prefiksem "custom-" i mogą być edytowane/usuwane.
 */

export interface CustomIngredients {
  malts: Malt[];
  hops: Hop[];
  yeasts: Yeast[];
}

const EMPTY: CustomIngredients = { malts: [], hops: [], yeasts: [] };

export function newCustomId(kind: string): string {
  return `custom-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isCustomId(id: string): boolean {
  return id.startsWith("custom-");
}

type SetCustom = (next: CustomIngredients | ((prev: CustomIngredients) => CustomIngredients)) => void;

interface IngredientsContextValue {
  malts: Malt[];
  hops: Hop[];
  yeasts: Yeast[];
  maltById: Map<string, Malt>;
  hopById: Map<string, Hop>;
  yeastById: Map<string, Yeast>;
  custom: CustomIngredients;
  setCustom: SetCustom;
}

const IngredientsContext = createContext<IngredientsContextValue | null>(null);

export function IngredientsProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useLocalStorage<CustomIngredients>("warzelnik.customIngredients", EMPTY);

  const value = useMemo<IngredientsContextValue>(() => {
    const malts = [...MALTS, ...custom.malts];
    const hops = [...HOPS, ...custom.hops];
    const yeasts = [...YEASTS, ...custom.yeasts];
    return {
      malts,
      hops,
      yeasts,
      maltById: new Map(malts.map((m) => [m.id, m])),
      hopById: new Map(hops.map((h) => [h.id, h])),
      yeastById: new Map(yeasts.map((y) => [y.id, y])),
      custom,
      setCustom,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custom]);

  return <IngredientsContext.Provider value={value}>{children}</IngredientsContext.Provider>;
}

export function useIngredients(): IngredientsContextValue {
  const ctx = useContext(IngredientsContext);
  if (!ctx) throw new Error("useIngredients wymaga IngredientsProvider");
  return ctx;
}
