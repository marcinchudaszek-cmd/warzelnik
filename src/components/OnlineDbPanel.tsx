import { useEffect, useState } from "react";
import { useIngredients } from "@/ingredients";
import { parseIngredientsFile } from "@/utils/beerxml";
import { cn } from "@/utils/cn";

/**
 * Pobieranie baz składników z internetu:
 * - katalog paczek hostowany na GitHub Pages (aktualizowalny bez wydania aplikacji),
 *   z awaryjnym użyciem kopii wbudowanej w aplikację (public/db),
 * - import z dowolnego URL (JSON lub BeerXML); na Androidzie natywny HTTP omija CORS.
 */

const REMOTE_BASE = "https://marcinchudaszek-cmd.github.io/warzelnik/db/";
/** Kopie wbudowane: build serwuje public/ pod base, dev pod rootem, Capacitor relatywnie. */
const LOCAL_BASES = [`${import.meta.env.BASE_URL}db/`, "/db/", "db/"];

interface CatalogPack {
  id: string;
  name: string;
  description: string;
  file: string;
}

async function fetchTextWithFallback(file: string): Promise<string> {
  for (const base of [REMOTE_BASE, ...LOCAL_BASES]) {
    try {
      const res = await fetch(base + file, { cache: "no-cache" });
      if (!res.ok) continue;
      const text = await res.text();
      // SPA fallback potrafi zwrócić index.html z kodem 200 — to nie są dane
      if (text.trimStart().toLowerCase().startsWith("<!doctype html")) continue;
      return text;
    } catch {
      // spróbuj następnego źródła
    }
  }
  throw new Error("Brak połączenia z katalogiem baz.");
}

export function OnlineDbPanel() {
  const { malts, hops, yeasts, setCustom } = useIngredients();
  const [open, setOpen] = useState(false);
  const [packs, setPacks] = useState<CatalogPack[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [url, setUrl] = useState("");
  const [urlMessage, setUrlMessage] = useState("");

  useEffect(() => {
    if (!open || packs !== null) return;
    fetchTextWithFallback("catalog.json")
      .then((text) => {
        const parsed = JSON.parse(text) as { packs: CatalogPack[] };
        setPacks(parsed.packs ?? []);
      })
      .catch((err) => {
        setPacks([]);
        setUrlMessage(`Nie udało się pobrać katalogu: ${err instanceof Error ? err.message : err}`);
      });
  }, [open, packs]);

  const applyContent = (content: string) => {
    const result = parseIngredientsFile(content, { malts, hops, yeasts });
    const added = result.malts.length + result.hops.length + result.yeasts.length;
    setCustom((prev) => ({
      malts: [...prev.malts, ...result.malts],
      hops: [...prev.hops, ...result.hops],
      yeasts: [...prev.yeasts, ...result.yeasts],
    }));
    return added > 0
      ? `✓ Dodano ${added} składników` + (result.skipped > 0 ? ` (${result.skipped} już było)` : "")
      : `✓ Wszystkie ${result.skipped} pozycje już masz w bazie`;
  };

  const installPack = async (pack: CatalogPack) => {
    setBusy(pack.id);
    try {
      const message = applyContent(await fetchTextWithFallback(pack.file));
      setMessages((m) => ({ ...m, [pack.id]: message }));
    } catch (err) {
      setMessages((m) => ({ ...m, [pack.id]: `Błąd: ${err instanceof Error ? err.message : err}` }));
    } finally {
      setBusy(null);
    }
  };

  const importFromUrl = async () => {
    const target = url.trim();
    if (!target) return;
    setBusy("url");
    setUrlMessage("Pobieranie…");
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error(`serwer odpowiedział ${res.status}`);
      setUrlMessage(applyContent(await res.text()));
      setUrl("");
    } catch (err) {
      setUrlMessage(
        `Nie udało się pobrać (${err instanceof Error ? err.message : err}). ` +
          "W przeglądarce część serwerów blokuje pobieranie (CORS) — pobierz wtedy plik ręcznie i użyj przycisku ⬆️. W aplikacji na Androidzie ograniczenie nie występuje."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white/80 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-stone-700">🌐 Pobierz bazy z internetu</span>
        <span className={cn("text-stone-400 transition-transform", open && "rotate-180")}>▾</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-amber-100 p-4">
          {packs === null && <p className="text-sm text-stone-500">Ładowanie katalogu…</p>}
          {packs?.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">{pack.name}</h4>
                  <p className="mt-0.5 text-xs text-stone-600">{pack.description}</p>
                </div>
                <button
                  onClick={() => installPack(pack)}
                  disabled={busy !== null}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
                    busy === pack.id ? "bg-stone-200 text-stone-500" : "bg-amber-600 text-white hover:bg-amber-700"
                  )}
                >
                  {busy === pack.id ? "Pobieranie…" : "Pobierz"}
                </button>
              </div>
              {messages[pack.id] && (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    messages[pack.id].startsWith("Błąd") ? "text-red-600" : "text-green-700"
                  )}
                >
                  {messages[pack.id]}
                </p>
              )}
            </div>
          ))}

          <div className="rounded-xl border border-amber-100 p-3">
            <h4 className="text-sm font-bold text-stone-800">Import z adresu URL</h4>
            <p className="mt-0.5 text-xs text-stone-500">
              Wklej link do pliku JSON lub BeerXML ze składnikami (np. baza słodowni, eksport z Brewfathera).
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/skladniki.json"
                className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500"
              />
              <button
                onClick={importFromUrl}
                disabled={busy !== null || !url.trim()}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500"
              >
                {busy === "url" ? "…" : "Pobierz"}
              </button>
            </div>
            {urlMessage && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  urlMessage.startsWith("✓") ? "font-medium text-green-700" : "text-stone-600"
                )}
              >
                {urlMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
