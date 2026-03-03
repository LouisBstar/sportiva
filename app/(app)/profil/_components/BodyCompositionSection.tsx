"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBodyComposition } from "@/app/actions/profil";

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
  history: BodyEntry[]; // last 4 entries, ordered asc for sparkline
};

// ─── Weight sparkline ─────────────────────────────────────────────────────────

function WeightSparkline({ history }: { history: BodyEntry[] }) {
  const dataPoints = history.filter((e) => e.poids != null);
  if (dataPoints.length < 2) return null;

  const poids = dataPoints.map((e) => Number(e.poids));
  const minP = Math.min(...poids);
  const maxP = Math.max(...poids);
  const range = maxP - minP || 1;

  const W = 100;
  const H = 40;
  const pad = 5;
  const step = (W - pad * 2) / (dataPoints.length - 1);

  const points = dataPoints.map((e, i) => {
    const x = pad + i * step;
    const y = H - pad - ((Number(e.poids) - minP) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  function formatShort(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={40}
        preserveAspectRatio="none"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#1A73E8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dataPoints.map((e, i) => {
          const x = pad + i * step;
          const y = H - pad - ((Number(e.poids) - minP) / range) * (H - pad * 2);
          return (
            <circle key={e.id} cx={x} cy={y} r="2.5" fill="#1A73E8" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {dataPoints.map((e) => (
          <span key={e.id} className="text-[9px] text-gray-300">
            {formatShort(e.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const FIELDS = [
  { key: "poids" as const,            label: "Poids",          unit: "kg",  step: "0.1" },
  { key: "masse_grasse_pct" as const,  label: "Masse grasse",   unit: "%",   step: "0.1" },
  { key: "masse_musculaire" as const,  label: "Masse musc.",    unit: "kg",  step: "0.1" },
  { key: "graisse_viscerale" as const, label: "Gr. viscérale",  unit: "niv", step: "1"   },
  { key: "taux_hydrique" as const,     label: "Taux hydrique",  unit: "%",   step: "0.1" },
  { key: "masse_osseuse" as const,     label: "Masse osseuse",  unit: "kg",  step: "0.01"},
];

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

      {/* Sparkline */}
      <WeightSparkline history={history} />

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
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
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
