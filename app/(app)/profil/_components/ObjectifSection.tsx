"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateObjectif } from "@/app/actions/profil";
import {
  WEIGHT_GOALS,
  MOTIVATIONS,
  calcAdjustment,
  calcMacros,
} from "@/lib/calc";

type Profile = {
  sexe: string | null;
  poids: number | null;
  taille: number | null;
  tdee: number | null;
  objectif_poids: string | null;
  motivations: string[] | null;
  objectif_calorique: "perte" | "maintien" | "prise" | null;
  calories_cible: number | null;
  proteines_cible_g: number | null;
  glucides_cible_g: number | null;
  lipides_cible_g: number | null;
};

type Props = { profile: Profile };

// ─── Macro donut SVG ──────────────────────────────────────────────────────────

function MacroDonut({ prot, carb, fat }: { prot: number; carb: number; fat: number }) {
  const protKcal = prot * 4;
  const carbKcal = carb * 4;
  const fatKcal  = fat  * 9;
  const total    = protKcal + carbKcal + fatKcal || 1;

  const r    = 34;
  const cx   = 50;
  const cy   = 50;
  const circ = 2 * Math.PI * r;

  const protLen = (protKcal / total) * circ;
  const carbLen = (carbKcal / total) * circ;
  const fatLen  = (fatKcal  / total) * circ;

  const segments = [
    { len: protLen, offset: 0,                color: "#1A73E8", label: "Prot", g: prot },
    { len: carbLen, offset: protLen,           color: "#F59E0B", label: "Gluc", g: carb },
    { len: fatLen,  offset: protLen + carbLen, color: "#34A853", label: "Lip",  g: fat  },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
        <svg viewBox="0 0 100 100" width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
          {segments.map((s) => (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={10}
              strokeDasharray={`${s.len} ${circ - s.len}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        {segments.map((s) => {
          const pctKcal = s.label === "Prot" ? s.g * 4 : s.label === "Gluc" ? s.g * 4 : s.g * 9;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-500 w-8">{s.label}</span>
              <span className="text-xs font-semibold text-[#1A1A2E]">{s.g}g</span>
              <span className="text-[10px] text-gray-300 ml-auto">
                ({Math.round((pctKcal / total) * 100)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObjectifSection({ profile }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [modalStep, setModalStep] = useState<"goal" | "motivations">("goal");
  const [isPending, startTransition] = useTransition();

  const currentGoal = WEIGHT_GOALS.find((g) => g.value === profile.objectif_poids);
  const currentMotivations = MOTIVATIONS.filter((m) =>
    (profile.motivations ?? []).includes(m.value)
  );

  function openModal() {
    setSelectedGoal(profile.objectif_poids ?? null);
    setSelectedMotivations(profile.motivations ?? []);
    setModalStep("goal");
    setShowModal(true);
  }

  function toggleMotivation(value: string) {
    setSelectedMotivations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleSave() {
    const goal = WEIGHT_GOALS.find((g) => g.value === selectedGoal);
    if (!goal || !profile.tdee || !profile.poids) return;

    const poids  = Number(profile.poids);
    const taille = Number(profile.taille ?? 170);
    const bmi    = poids / Math.pow(taille / 100, 2);
    const adj    = calcAdjustment(goal.value, bmi);
    const minCal = profile.sexe === "femme" ? 1200 : 1500;
    const newCal = Math.max(profile.tdee + adj, minCal);
    const { prot, carb, fat } = calcMacros(newCal, poids, goal.type);

    startTransition(async () => {
      const res = await updateObjectif({
        objectifPoids: goal.value,
        motivations: selectedMotivations,
        objectifCalorique: goal.type,
        tdee: profile.tdee!,
        caloriesCible: newCal,
        proteinesCibleG: prot,
        glucidesCibleG: carb,
        lipidesCibleG: fat,
      });
      if (!res.error) {
        setShowModal(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Mon objectif
          </h2>
          <button onClick={openModal} className="text-xs font-semibold text-primary">
            Changer
          </button>
        </div>

        {/* Current goal */}
        <div className="mb-3">
          <p className="text-base font-bold text-[#1A1A2E] flex items-center gap-2">
            <span>{currentGoal?.emoji ?? "🎯"}</span>
            <span>{currentGoal?.label ?? "Non défini"}</span>
          </p>
          {profile.calories_cible && (
            <p className="text-xs text-gray-400 mt-1">{profile.calories_cible} kcal/jour</p>
          )}
        </div>

        {/* Motivations */}
        {currentMotivations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {currentMotivations.map((m) => (
              <span
                key={m.value}
                className="flex items-center gap-1 text-[11px] bg-gray-50 border border-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium"
              >
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        )}

        {/* Macro donut */}
        {profile.proteines_cible_g != null &&
          profile.glucides_cible_g != null &&
          profile.lipides_cible_g != null && (
            <MacroDonut
              prot={profile.proteines_cible_g}
              carb={profile.glucides_cible_g}
              fat={profile.lipides_cible_g}
            />
          )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto pb-8">
            <div className="sticky top-0 bg-white pt-4 pb-3 px-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                {modalStep === "goal" ? "Objectif poids" : "Tes motivations"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-sm">✕</button>
            </div>

            {modalStep === "goal" ? (
              <div className="p-4 space-y-2.5">
                {WEIGHT_GOALS.map((goal) => {
                  const isCurrent = goal.value === profile.objectif_poids;
                  const isSelected = selectedGoal === goal.value;
                  return (
                    <button
                      key={goal.value}
                      onClick={() => setSelectedGoal(goal.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-primary/40"
                          : isCurrent
                          ? "bg-gray-50 border-gray-200"
                          : "bg-gray-50 border-transparent"
                      }`}
                    >
                      <span className="text-xl">{goal.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-[#1A1A2E]">
                        {goal.label}
                      </span>
                      {isCurrent && !isSelected && (
                        <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                          Actuel
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => { if (selectedGoal) setModalStep("motivations"); }}
                  disabled={!selectedGoal}
                  className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 mt-2"
                >
                  Suivant →
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-400">Sélectionne ce qui te motive (plusieurs choix)</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {MOTIVATIONS.map((m) => {
                    const isSelected = selectedMotivations.includes(m.value);
                    return (
                      <button
                        key={m.value}
                        onClick={() => toggleMotivation(m.value)}
                        className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border text-center transition-colors ${
                          isSelected ? "bg-primary/5 border-primary/40" : "bg-gray-50 border-transparent"
                        }`}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : "text-[#1A1A2E]"}`}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setModalStep("goal")}
                    className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl text-sm font-semibold"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-[2] bg-primary text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    {isPending ? "Enregistrement…" : "Confirmer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
