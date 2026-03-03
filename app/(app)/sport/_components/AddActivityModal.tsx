"use client";

import { useState, useTransition } from "react";
import { addActivity } from "@/app/actions/sport";

// ─── MET table [faible, modérée, élevée] ─────────────────────────────────────

const MET: Record<string, [number, number, number]> = {
  course:       [7.0,  9.0,  11.5],
  calisthenics: [3.5,  5.0,   8.0],
  vélo:         [4.0,  6.8,  10.0],
  marche:       [2.5,  3.5,   4.5],
  natation:     [4.5,  7.0,   9.5],
  autre:        [3.0,  5.0,   7.0],
};

const INTENSITE_LABELS = [
  { value: "faible",   label: "Légère",   emoji: "🟢" },
  { value: "modérée",  label: "Modérée",  emoji: "🟡" },
  { value: "élevée",   label: "Intense",  emoji: "🔴" },
] as const;

type IntensiteValue = "faible" | "modérée" | "élevée";

const ACTIVITY_TYPES = [
  { value: "course",       label: "Course",       emoji: "🏃" },
  { value: "calisthenics", label: "Calisthenics", emoji: "💪" },
  { value: "vélo",         label: "Vélo",         emoji: "🚴" },
  { value: "marche",       label: "Marche",       emoji: "🚶" },
  { value: "natation",     label: "Natation",     emoji: "🏊" },
  { value: "autre",        label: "Autre",        emoji: "⚡" },
];

function calcCalories(type: string, intensite: IntensiteValue, dureeMin: number, poidsKg: number): number {
  const metValues = MET[type] ?? MET["autre"];
  const idx = intensite === "faible" ? 0 : intensite === "modérée" ? 1 : 2;
  return Math.round(metValues[idx] * poidsKg * (dureeMin / 60));
}

type Props = {
  poidsKg: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddActivityModal({ poidsKg, onClose, onSuccess }: Props) {
  const [typeActivite, setTypeActivite] = useState("course");
  const [description, setDescription] = useState("");
  const [dureeMin, setDureeMin] = useState(30);
  const [intensite, setIntensiteState] = useState<IntensiteValue>("modérée");
  const [calories, setCalories] = useState(() =>
    calcCalories("course", "modérée", 30, poidsKg)
  );
  const [caloriesEdited, setCaloriesEdited] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const recompute = (
    t: string,
    i: IntensiteValue,
    d: number
  ) => {
    if (!caloriesEdited) {
      setCalories(calcCalories(t, i, d, poidsKg));
    }
  };

  const handleTypeChange = (t: string) => {
    setTypeActivite(t);
    recompute(t, intensite, dureeMin);
  };

  const handleIntensiteChange = (i: IntensiteValue) => {
    setIntensiteState(i);
    recompute(typeActivite, i, dureeMin);
  };

  const handleDureeChange = (d: number) => {
    setDureeMin(d);
    recompute(typeActivite, intensite, d);
  };

  const handleCaloriesChange = (v: string) => {
    setCaloriesEdited(true);
    setCalories(Math.max(0, Number(v) || 0));
  };

  const handleSubmit = () => {
    if (dureeMin < 1) return;
    setError(null);
    startTransition(async () => {
      const res = await addActivity({
        typeActivite,
        description: description.trim() || undefined,
        dureeMin,
        intensite,
        caloriesBrulees: calories,
      });
      if (res.error) { setError(res.error); return; }
      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-base font-bold text-[#1A1A2E]">Ajouter une activité</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Activity type */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Type d'activité
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={`flex flex-col items-center py-3 rounded-2xl border text-sm font-semibold transition-colors ${
                  typeActivite === t.value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white border-gray-100 text-gray-600"
                }`}
              >
                <span className="text-xl mb-1">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Description <span className="font-normal normal-case">(optionnel)</span>
          </p>
          <input
            type="text"
            placeholder="Ex: Sortie trail du matin"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1A1A2E] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Durée
            </p>
            <span className="text-sm font-bold text-[#1A1A2E]">{dureeMin} min</span>
          </div>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={dureeMin}
            onChange={(e) => handleDureeChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-gray-300 mt-1">
            <span>5 min</span>
            <span>3 h</span>
          </div>
          {/* Quick buttons */}
          <div className="flex gap-2 mt-2">
            {[20, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => handleDureeChange(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  dureeMin === m
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Intensité
          </p>
          <div className="flex gap-2">
            {INTENSITE_LABELS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleIntensiteChange(opt.value)}
                className={`flex-1 py-3 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${
                  intensite === opt.value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white border-gray-100 text-gray-600"
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calories */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Calories estimées
            </p>
            {caloriesEdited && (
              <button
                onClick={() => {
                  setCaloriesEdited(false);
                  setCalories(calcCalories(typeActivite, intensite, dureeMin, poidsKg));
                }}
                className="text-[10px] text-primary underline"
              >
                Recalculer
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={5000}
              value={calories}
              onChange={(e) => handleCaloriesChange(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl border border-gray-200 text-lg font-bold text-[#1A1A2E] text-center focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            <span className="text-sm text-gray-400">kcal brûlées</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-1.5">
            Calculé via MET × poids ({poidsKg} kg) × durée. Modifiable.
          </p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={isPending || dureeMin < 1}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {isPending ? "Enregistrement…" : "Enregistrer l'activité"}
        </button>
      </div>
    </div>
  );
}
