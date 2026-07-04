import type { CustomIngredients } from "@/ingredients";
import type { BrewSession, Recipe } from "@/types";

/**
 * Pełna kopia danych aplikacji — do przenoszenia między urządzeniami
 * (web <-> Android) i jako backup.
 */

export interface WarzelnikBackup {
  app: "warzelnik";
  version: 1;
  exportedAt: string;
  recipes: Recipe[];
  sessions: BrewSession[];
  customIngredients: CustomIngredients;
}

export function buildBackup(
  recipes: Recipe[],
  sessions: BrewSession[],
  customIngredients: CustomIngredients
): WarzelnikBackup {
  return {
    app: "warzelnik",
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes,
    sessions,
    customIngredients,
  };
}

export function downloadBackup(backup: WarzelnikBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `warzelnik-kopia-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseBackup(content: string): WarzelnikBackup {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Plik nie jest poprawnym JSON-em.");
  }
  const b = data as Partial<WarzelnikBackup>;
  if (b.app !== "warzelnik" || !Array.isArray(b.recipes)) {
    throw new Error("To nie jest plik kopii danych Warzelnika.");
  }
  return {
    app: "warzelnik",
    version: 1,
    exportedAt: typeof b.exportedAt === "string" ? b.exportedAt : "",
    recipes: b.recipes as Recipe[],
    sessions: Array.isArray(b.sessions) ? (b.sessions as BrewSession[]) : [],
    customIngredients: {
      malts: b.customIngredients?.malts ?? [],
      hops: b.customIngredients?.hops ?? [],
      yeasts: b.customIngredients?.yeasts ?? [],
    },
  };
}

/** Scala listy po id — element importowany nadpisuje istniejący o tym samym id. */
export function mergeById<T extends { id: string }>(existing: T[], imported: T[]): T[] {
  const map = new Map(existing.map((x) => [x.id, x]));
  for (const item of imported) map.set(item.id, item);
  return [...map.values()];
}
