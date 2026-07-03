import { useEffect, useRef, useState } from "react";
import { HOPS } from "@/data/hops";
import { MALTS } from "@/data/malts";
import { YEASTS } from "@/data/yeasts";
import type { BrewSession, Recipe } from "@/types";
import { calcWater, getBoilMinutes, getMashRatio } from "@/utils/brewCalc";
import { cn } from "@/utils/cn";

const hopById = new Map(HOPS.map((h) => [h.id, h]));
const maltById = new Map(MALTS.map((m) => [m.id, m]));
const yeastById = new Map(YEASTS.map((y) => [y.id, y]));

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
  if ("vibrate" in navigator) navigator.vibrate?.([300, 100, 300]);
}

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Timer({ minutes, label }: { minutes: number; label: string }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(minutes * 60);
    setRunning(false);
    doneRef.current = false;
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!doneRef.current) {
            doneRef.current = true;
            beep();
          }
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const finished = secondsLeft === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2",
        finished ? "border-green-300 bg-green-50" : "border-amber-200 bg-white"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-stone-700">{label}</div>
        <div className={cn("font-mono text-lg font-bold", finished ? "text-green-600" : "text-stone-800")}>
          {finished ? "Gotowe! ✓" : fmtTime(secondsLeft)}
        </div>
      </div>
      <button
        onClick={() => setRunning((r) => !r)}
        disabled={finished}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-semibold",
          finished
            ? "bg-stone-100 text-stone-400"
            : running
              ? "bg-orange-100 text-orange-700"
              : "bg-amber-600 text-white"
        )}
      >
        {running ? "Pauza" : "Start"}
      </button>
      <button
        onClick={() => {
          setSecondsLeft(minutes * 60);
          setRunning(false);
          doneRef.current = false;
        }}
        className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
      >
        Reset
      </button>
    </div>
  );
}

function BoilAssistant({ recipe }: { recipe: Recipe }) {
  const boilMinutes = getBoilMinutes(recipe);
  const boilHops = recipe.hops.filter((h) => (h.use ?? "boil") === "boil");
  const whirlpoolHops = recipe.hops.filter((h) => h.use === "whirlpool");
  const [secondsLeft, setSecondsLeft] = useState(boilMinutes * 60);
  const [running, setRunning] = useState(false);
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setSecondsLeft(boilMinutes * 60);
    setRunning(false);
    firedRef.current = new Set();
  }, [boilMinutes, recipe.id]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        const minutesLeft = Math.ceil(next / 60);
        for (const h of boilHops) {
          if (h.time > 0 && minutesLeft === h.time && next % 60 === 0 && !firedRef.current.has(h.time)) {
            firedRef.current.add(h.time);
            beep();
          }
        }
        if (next === 0) {
          setRunning(false);
          if (!firedRef.current.has(0)) {
            firedRef.current.add(0);
            beep();
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, recipe.hops]);

  const minutesLeft = secondsLeft / 60;
  const sorted = [...boilHops].sort((a, b) => b.time - a.time);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-stone-800 px-4 py-3 text-white">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-stone-400">Gotowanie ({boilMinutes} min)</div>
          <div className="font-mono text-2xl font-bold">{fmtTime(secondsLeft)}</div>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={secondsLeft === 0}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold",
            secondsLeft === 0 ? "bg-stone-600 text-stone-400" : running ? "bg-orange-500" : "bg-amber-600"
          )}
        >
          {running ? "Pauza" : "Start"}
        </button>
        <button
          onClick={() => {
            setSecondsLeft(boilMinutes * 60);
            setRunning(false);
            firedRef.current = new Set();
          }}
          className="rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold"
        >
          Reset
        </button>
      </div>

      {sorted.length === 0 && <p className="text-sm text-stone-500">Ta receptura nie ma dodatków chmielu.</p>}

      {sorted.map((h, i) => {
        const hop = hopById.get(h.hopId);
        const added = minutesLeft <= h.time;
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
              added ? "border-green-300 bg-green-50" : "border-amber-200 bg-white"
            )}
          >
            <span className={cn("font-mono font-bold", added ? "text-green-600" : "text-stone-700")}>
              {h.time === 0 ? "0'" : `${h.time}'`}
            </span>
            <span className="min-w-0 flex-1 truncate">
              <b>{hop?.name ?? "?"}</b> · {h.grams} g
            </span>
            <span className={cn("text-xs font-semibold", added ? "text-green-600" : "text-stone-400")}>
              {added ? "✓ dodany" : h.time === 0 ? "na wyłączeniu" : `${h.time} min przed końcem`}
            </span>
          </div>
        );
      })}

      {whirlpoolHops.length > 0 && (
        <>
          <div className="pt-1 text-xs font-bold uppercase tracking-wide text-stone-500">
            🌀 Whirlpool (po wyłączeniu palnika)
          </div>
          {whirlpoolHops.map((h, i) => {
            const hop = hopById.get(h.hopId);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  <b>{hop?.name ?? "?"}</b> · {h.grams} g
                </span>
                <span className="text-xs font-semibold text-cyan-700">{h.time} min w ~80°C</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function FermentationLog({
  session,
  onChange,
  onDelete,
}: {
  session: BrewSession;
  onChange: (s: BrewSession) => void;
  onDelete: () => void;
}) {
  const [gravity, setGravity] = useState("");
  const [temp, setTemp] = useState("");
  const [note, setNote] = useState("");

  const addEntry = () => {
    if (!gravity && !temp && !note) return;
    onChange({
      ...session,
      entries: [
        {
          id: `e-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          gravity,
          temp,
          note,
        },
        ...session.entries,
      ],
    });
    setGravity("");
    setTemp("");
    setNote("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-stone-500">
          Zmierzone OG
          <input
            value={session.measuredOG}
            onChange={(e) => onChange({ ...session, measuredOG: e.target.value })}
            placeholder="np. 1.052"
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500"
          />
        </label>
        <label className="text-xs text-stone-500">
          Zmierzone FG
          <input
            value={session.measuredFG}
            onChange={(e) => onChange({ ...session, measuredFG: e.target.value })}
            placeholder="np. 1.012"
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500"
          />
        </label>
      </div>

      <div className="rounded-xl border border-amber-200 bg-white p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Nowy wpis</div>
        <div className="flex gap-2">
          <input
            value={gravity}
            onChange={(e) => setGravity(e.target.value)}
            placeholder="Blg/SG"
            className="w-20 rounded-lg border border-amber-200 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
          />
          <input
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            placeholder="°C"
            className="w-16 rounded-lg border border-amber-200 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notatka…"
            className="min-w-0 flex-1 rounded-lg border border-amber-200 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <button
          onClick={addEntry}
          className="mt-2 w-full rounded-lg bg-amber-600 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Dodaj wpis
        </button>
      </div>

      {session.entries.map((e) => (
        <div key={e.id} className="flex items-baseline gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
          <span className="shrink-0 font-mono text-xs text-stone-400">{e.date}</span>
          {e.gravity && <span className="shrink-0 font-semibold text-stone-700">{e.gravity}</span>}
          {e.temp && <span className="shrink-0 text-stone-500">{e.temp}°C</span>}
          <span className="min-w-0 flex-1 text-stone-600">{e.note}</span>
          <button
            onClick={() => onChange({ ...session, entries: session.entries.filter((x) => x.id !== e.id) })}
            className="text-stone-300 hover:text-red-500"
            aria-label="Usuń wpis"
          >
            ✕
          </button>
        </div>
      ))}

      <button onClick={onDelete} className="w-full py-1 text-center text-xs text-red-400 hover:text-red-600">
        Usuń tę warkę z dziennika
      </button>
    </div>
  );
}

function WaterPlanBox({ recipe }: { recipe: Recipe }) {
  const grainKg = recipe.malts.reduce((s, m) => {
    const malt = maltById.get(m.maltId);
    return malt && malt.type !== "dodatek" ? s + m.kg : s;
  }, 0);
  if (grainKg <= 0) return null;
  const water = calcWater(grainKg, recipe.batchL, getMashRatio(recipe), getBoilMinutes(recipe));
  return (
    <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
      💧 Woda zacierna: <b>{water.mashL.toFixed(1)} L</b> ({getMashRatio(recipe)} L/kg · zasyp{" "}
      {grainKg.toFixed(2)} kg) · wysładzanie: <b>{water.spargeL.toFixed(1)} L</b> · przed gotowaniem:{" "}
      <b>{water.preBoilL.toFixed(1)} L</b>
    </div>
  );
}

function DryHopBox({ recipe }: { recipe: Recipe }) {
  const dryHops = recipe.hops.filter((h) => h.use === "dryhop");
  if (dryHops.length === 0) return null;
  return (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <div className="font-semibold">❄️ Chmielenie na zimno</div>
      {dryHops.map((h, i) => {
        const hop = hopById.get(h.hopId);
        return (
          <div key={i}>
            {hop?.name ?? "?"} · {h.grams} g przez {h.time} {h.time === 1 ? "dzień" : "dni"}
          </div>
        );
      })}
    </div>
  );
}

type Phase = "mash" | "boil" | "ferment";

export function BrewDayView({
  recipes,
  sessions,
  setSessions,
}: {
  recipes: Recipe[];
  sessions: BrewSession[];
  setSessions: (next: BrewSession[] | ((prev: BrewSession[]) => BrewSession[])) => void;
}) {
  const [recipeId, setRecipeId] = useState<string>(recipes[0]?.id ?? "");
  const [phase, setPhase] = useState<Phase>("mash");
  const recipe = recipes.find((r) => r.id === recipeId) ?? recipes[0];

  if (!recipe) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        Najpierw stwórz recepturę w zakładce „Receptury", aby rozpocząć warzenie. 🍺
      </p>
    );
  }

  const session = sessions.find((s) => s.recipeId === recipe.id);
  const yeast = recipe.yeastId ? yeastById.get(recipe.yeastId) : undefined;

  const ensureSession = () => {
    if (session) return;
    setSessions((prev) => [
      {
        id: `s-${Date.now()}`,
        recipeId: recipe.id,
        startedAt: new Date().toISOString().slice(0, 10),
        measuredOG: "",
        measuredFG: "",
        entries: [],
      },
      ...prev,
    ]);
  };

  const phases: { id: Phase; label: string }[] = [
    { id: "mash", label: "🌡️ Zacieranie" },
    { id: "boil", label: "🔥 Gotowanie" },
    { id: "ferment", label: "🧫 Fermentacja" },
  ];

  return (
    <div className="space-y-4">
      <select
        value={recipe.id}
        onChange={(e) => setRecipeId(e.target.value)}
        className="w-full rounded-xl border border-amber-200 bg-white/80 px-3 py-2.5 font-semibold text-stone-800 outline-none focus:border-amber-500"
      >
        {recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.batchL} L)
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={cn(
              "flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition-all",
              phase === p.id ? "bg-amber-700 text-white shadow-md" : "bg-white/70 text-stone-600 hover:bg-amber-100"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {phase === "mash" && (
        <div className="animate-fade-in space-y-3">
          <WaterPlanBox recipe={recipe} />
          {recipe.mashSteps.length === 0 && (
            <p className="text-sm text-stone-500">Ta receptura nie ma zdefiniowanych przerw zacierania.</p>
          )}
          {recipe.mashSteps.map((ms, i) => (
            <Timer key={`${recipe.id}-${i}`} minutes={ms.minutes} label={`${ms.name} · ${ms.temp}°C`} />
          ))}
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            💡 Po zacieraniu wykonaj próbę jodową i podnieś temperaturę do 76–78°C (mash-out) przed filtracją.
          </div>
        </div>
      )}

      {phase === "boil" && (
        <div className="animate-fade-in">
          <BoilAssistant recipe={recipe} />
        </div>
      )}

      {phase === "ferment" && (
        <div className="animate-fade-in space-y-3">
          <DryHopBox recipe={recipe} />
          {yeast && (
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
              🧫 {yeast.name}: fermentuj w {yeast.tempMin}–{yeast.tempMax}°C, oczekiwane odfermentowanie ~
              {yeast.attenuation}%.
            </div>
          )}
          {session ? (
            <FermentationLog
              session={session}
              onChange={(next) => setSessions((prev) => prev.map((s) => (s.id === next.id ? next : s)))}
              onDelete={() => {
                if (confirm("Usunąć dziennik tej warki?"))
                  setSessions((prev) => prev.filter((s) => s.id !== session.id));
              }}
            />
          ) : (
            <button
              onClick={ensureSession}
              className="w-full rounded-2xl bg-amber-700 py-3 font-semibold text-white shadow-md hover:bg-amber-800"
            >
              🍺 Rozpocznij dziennik fermentacji
            </button>
          )}
        </div>
      )}
    </div>
  );
}
