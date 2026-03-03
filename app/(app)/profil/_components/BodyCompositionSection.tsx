"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBodyComposition } from "@/app/actions/profil";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type BodyEntry = {
  id: string;
  date: string;
  poids: number | null;
  masse_grasse_pct: number | null;
  masse_musculaire: number | null;
  graisse_viscerale: number | null;
  taux_hydrique: number | null;
  masse_osseuse: number | null;
};

type Props = {
  lastMeasure: BodyEntry | null;
  history: BodyEntry[]; // asc order
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELDS = [
  { key: "poids" as const,            label: "Poids",          unit: "kg",  step: "0.1" },
  { key: "masse_grasse_pct" as const,  label: "Masse grasse",   unit: "%",   step: "0.1" },
  { key: "masse_musculaire" as const,  label: "Masse musc.",    unit: "kg",  step: "0.1" },
  { key: "graisse_viscerale" as const, label: "Gr. viscérale",  unit: "niv", step: "1"   },
  { key: "taux_hydrique" as const,     label: "Taux hydrique",  unit: "%",   step: "0.1" },
  { key: "masse_osseuse" as const,     label: "Masse osseuse",  unit: "kg",  step: "0.01"},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
}

function getDelta(
  history: BodyEntry[],
  key: keyof BodyEntry,
  daysBack: number
): { delta: number | null; isGood: boolean | null } {
  const now = Date.now();
  const cutoff = now - daysBack * 24 * 60 * 60 * 1000;
  const recent = history[history.length - 1];
  if (!recent) return { delta: null, isGood: null };
  const older = [...history]
    .reverse()
    .find((e) => new Date(e.date + "T00:00:00Z").getTime() <= cutoff);
  if (!older || older.date === recent.date) return { delta: null, isGood: null };

  const v1 = older[key];
  const v2 = recent[key];
  if (v1 == null || v2 == null) return { delta: null, isGood: null };
  const delta = Number(v2) - Number(v1);
  // For graisse: down = good. For muscle: up = good. For weight: neutral here.
  const isGood =
    key === "masse_musculaire"
      ? delta > 0
      : key === "masse_grasse_pct"
      ? delta < 0
      : null;
  return { delta, isGood };
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatDelta({
  label,
  delta,
  unit,
  isGood,
}: {
  label: string;
  delta: number | null;
  unit: string;
  isGood: boolean | null;
}) {
  if (delta === null) return null;
  const color =
    isGood === null
      ? "text-gray-500"
      : isGood
      ? "text-accent"
      : "text-warning";
  const sign = delta > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>
        {sign}{delta.toFixed(1)} {unit}
      </span>
    </div>
  );
}

// ─── Chart tabs ───────────────────────────────────────────────────────────────

type ChartKey = "poids" | "masse_grasse_pct" | "masse_musculaire";

const CHART_OPTIONS: { key: ChartKey; label: string; unit: string; color: string }[] = [
  { key: "poids",            label: "Poids",   unit: "kg", color: "#1A73E8" },
  { key: "masse_grasse_pct", label: "Graisse", unit: "%",  color: "#F97316" },
  { key: "masse_musculaire", label: "Muscle",  unit: "kg", color: "#34A853" },
];

function EvolutionChart({ history }: { history: BodyEntry[] }) {
  const [activeKey, setActiveKey] = useState<ChartKey>("poids");
  const opt = CHART_OPTIONS.find((o) => o.key === activeKey)!;

  const data = history
    .filter((e) => e[activeKey] != null)
    .map((e) => ({
      date: formatShort(e.date),
      value: Number(e[activeKey]),
    }));

  if (data.length < 2) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Tab selector */}
      <div className="flex gap-1.5 mb-3">
        {CHART_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setActiveKey(o.key)}
            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-colors ${
              activeKey === o.key
                ? "bg-primary/10 text-primary"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            width={38}
            tickFormatter={(v) => `${v}${opt.unit}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            formatter={(v: number) => [`${v.toFixed(1)} ${opt.unit}`, opt.label]}
            labelStyle={{ color: "#6B7280" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={opt.color}
            strokeWidth={2}
            dot={{ r: 3, fill: opt.color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BodyCompositionSection({ lastMeasure, history }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date:              today,
    poids:             String(lastMeasure?.poids ?? ""),
    masse_grasse_pct:  String(lastMeasure?.masse_grasse_pct ?? ""),
    masse_musculaire:  String(lastMeasure?.masse_musculaire ?? ""),
    graisse_viscerale: String(lastMeasure?.graisse_viscerale ?? ""),
    taux_hydrique:     String(lastMeasure?.taux_hydrique ?? ""),
    masse_osseuse:     String(lastMeasure?.masse_osseuse ?? ""),
  });

  function handleSubmit() {
    startTransition(async () => {
      const res = await addBodyComposition({
        date:              form.date,
        poids:             form.poids             ? Number(form.poids)             : undefined,
        masseGrassePct:    form.masse_grasse_pct   ? Number(form.masse_grasse_pct)  : undefined,
        masseMusculaire:   form.masse_musculaire    ? Number(form.masse_musculaire)   : undefined,
        graisseViscerale:  form.graisse_viscerale   ? Number(form.graisse_viscerale)  : undefined,
        tauxHydrique:      form.taux_hydrique        ? Number(form.taux_hydrique)       : undefined,
        masseOsseuse:      form.masse_osseuse        ? Number(form.masse_osseuse)       : undefined,
      });
      if (!res.error) {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  // Deltas
  const delta1mPoids   = getDelta(history, "poids",           30);
  const delta3mPoids   = getDelta(history, "poids",           90);
  const delta1mFat     = getDelta(history, "masse_grasse_pct", 30);
  const delta3mFat     = getDelta(history, "masse_grasse_pct", 90);
  const delta1mMuscle  = getDelta(history, "masse_musculaire", 30);
  const delta3mMuscle  = getDelta(history, "masse_musculaire", 90);

  const hasStats =
    delta1mPoids.delta !== null ||
    delta1mFat.delta !== null ||
    delta1mMuscle.delta !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Composition corporelle
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold text-primary"
        >
          {showForm ? "Annuler" : "+ Mesure"}
        </button>
      </div>

      {/* Last measurements */}
      {lastMeasure ? (
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {FIELDS.filter((f) => lastMeasure[f.key] != null).map((f) => (
            <div
              key={f.key}
              className="flex flex-col items-center bg-gray-50 rounded-xl py-2 px-1"
            >
              <p className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                {Number(lastMeasure[f.key]).toLocaleString("fr-FR")}
                <span className="text-[10px] font-medium text-gray-400 ml-0.5">
                  {f.unit}
                </span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">
                {f.label}
              </p>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune mesure enregistrée
          </p>
        )
      )}

      {/* Evolution chart */}
      <EvolutionChart history={history} />

      {/* Stats 1 mois / 3 mois */}
      {hasStats && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wide mb-1">
                1 mois
              </p>
              <StatDelta label="Poids"   delta={delta1mPoids.delta}  unit="kg" isGood={delta1mPoids.isGood} />
              <StatDelta label="Graisse" delta={delta1mFat.delta}    unit="%"  isGood={delta1mFat.isGood} />
              <StatDelta label="Muscle"  delta={delta1mMuscle.delta} unit="kg" isGood={delta1mMuscle.isGood} />
            </div>
            <div>
              <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wide mb-1">
                3 mois
              </p>
              <StatDelta label="Poids"   delta={delta3mPoids.delta}  unit="kg" isGood={delta3mPoids.isGood} />
              <StatDelta label="Graisse" delta={delta3mFat.delta}    unit="%"  isGood={delta3mFat.isGood} />
              <StatDelta label="Muscle"  delta={delta3mMuscle.delta} unit="kg" isGood={delta3mMuscle.isGood} />
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {/* Date */}
          <div>
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                  {f.label}{" "}
                  <span className="text-gray-300 normal-case">({f.unit})</span>
                </label>
                <input
                  type="number"
                  step={f.step}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder="—"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Enregistrement…" : "Sauvegarder la mesure"}
          </button>
        </div>
      )}
    </div>
  );
}
