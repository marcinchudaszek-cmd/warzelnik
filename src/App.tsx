import { useState } from "react";
import { BrewDayView } from "@/components/BrewDayView";
import { IngredientsView } from "@/components/IngredientsView";
import { RecipesView } from "@/components/RecipesView";
import { ToolsView } from "@/components/ToolsView";
import { SAMPLE_RECIPES } from "@/data/sampleRecipes";
import { IngredientsProvider } from "@/ingredients";
import type { BrewSession, Recipe } from "@/types";
import { cn } from "@/utils/cn";
import { useLocalStorage } from "@/utils/useLocalStorage";

type View = "ingredients" | "recipes" | "brewday" | "tools";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "ingredients", label: "Składniki", icon: "🌾" },
  { id: "recipes", label: "Receptury", icon: "📖" },
  { id: "brewday", label: "Warzenie", icon: "🍺" },
  { id: "tools", label: "Narzędzia", icon: "🧮" },
];

export default function App() {
  const [view, setView] = useState<View>("recipes");
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>("warzelnik.recipes", SAMPLE_RECIPES);
  const [sessions, setSessions] = useLocalStorage<BrewSession[]>("warzelnik.sessions", []);

  return (
    <IngredientsProvider>
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-stone-100 font-[Inter]">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-amber-900 to-amber-700 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <span className="text-2xl">🍺</span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight">Warzelnik</h1>
            <p className="text-[11px] text-amber-200">Twój asystent piwowarski</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {view === "ingredients" && <IngredientsView />}
        {view === "recipes" && <RecipesView recipes={recipes} setRecipes={setRecipes} />}
        {view === "brewday" && <BrewDayView recipes={recipes} sessions={sessions} setSessions={setSessions} />}
        {view === "tools" && <ToolsView />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors",
                view === n.id ? "text-amber-800" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
    </IngredientsProvider>
  );
}
