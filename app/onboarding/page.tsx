"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import { saveOnboarding } from "@/app/actions/onboarding";
import {
  ACTIVITY_OPTIONS,
  WEIGHT_GOALS,
  MOTIVATIONS,
  calcTDEE,
  calcAdjustment,
  calcMacros,
  getWeightGoalAdvice,
} from "@/lib/calc";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step1Data = {
  sexe: "homme" | "femme" | "";
  age: string;
  poids: string;
  taille: string;
  niveauActivite: string;
};

type Step2Data = {
  objectifPoids: string;
  motivations: string[];
};

type Step3Data = {
  masseGrasse: string;
  masseMusculaire: string;
  graisseViscerale: string;
  tauxHydrique: string;
  masseOsseuse: string;
};

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  const steps = ["Profil", "Objectif", "Compo", "Résumé"];
  // Map internal state (1-5) to visual step (1-4)
  const visualStep = step <= 2 ? 1 : step <= 3 ? 2 : step <= 4 ? 3 : 4;
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = num < visualStep;
        const isActive = num === visualStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive || isDone ? "text-primary" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 h-0.5 mb-4 mx-1 transition-all ${
                  num < visualStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Profil de base ──────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: Step1Data;
  onChange: (d: Partial<Step1Data>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.sexe) e.sexe = "Choisis un sexe";
    const age = Number(data.age);
    if (!data.age || age < 10 || age > 100) e.age = "10–100 ans";
    const poids = Number(data.poids);
    if (!data.poids || poids < 30 || poids > 300) e.poids = "30–300 kg";
    const taille = Number(data.taille);
    if (!data.taille || taille < 100 || taille > 250) e.taille = "100–250 cm";
    if (!data.niveauActivite) e.niveauActivite = "Choisis un niveau";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-6 animate-step-in">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Ton profil</h2>
        <p className="text-sm text-gray-400">Quelques données pour calculer tes besoins</p>
      </div>

      {/* Sexe */}
      <div>
        <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">Sexe</label>
        <div className="grid grid-cols-2 gap-3">
          {(["homme", "femme"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ sexe: s })}
              className={`py-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
                data.sexe === s
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              {s === "homme" ? "👨 Homme" : "👩 Femme"}
            </button>
          ))}
        </div>
        {errors.sexe && <p className="text-xs text-red-500 mt-1">{errors.sexe}</p>}
      </div>

      {/* Âge / Poids / Taille */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "age", label: "Âge", unit: "ans", placeholder: "25" },
          { key: "poids", label: "Poids", unit: "kg", placeholder: "70" },
          { key: "taille", label: "Taille", unit: "cm", placeholder: "175" },
        ].map(({ key, label, unit, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
            <div className="relative">
              <input
                type="number"
                inputMode={key === "poids" ? "decimal" : "numeric"}
                placeholder={placeholder}
                value={data[key as keyof Step1Data]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className={`w-full py-3 px-2 rounded-xl border text-sm text-center font-semibold text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors[key] ? "border-red-300" : "border-gray-200"
                }`}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                {unit}
              </span>
            </div>
            {errors[key] && <p className="text-[10px] text-red-500 mt-0.5">{errors[key]}</p>}
          </div>
        ))}
      </div>

      {/* Niveau d'activité */}
      <div>
        <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
          Niveau d&apos;activité
        </label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ niveauActivite: opt.value })}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                data.niveauActivite === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  data.niveauActivite === opt.value ? "bg-primary" : "bg-gray-300"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-semibold ${
                    data.niveauActivite === opt.value ? "text-primary" : "text-[#1A1A2E]"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.niveauActivite && (
          <p className="text-xs text-red-500 mt-1">{errors.niveauActivite}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => { if (validate()) onNext(); }}
        className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/30"
      >
        Continuer →
      </button>
    </div>
  );
}

// ─── Step 2A — Objectif poids ─────────────────────────────────────────────────

function Step2A({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 animate-step-in">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Ton objectif poids</h2>
        <p className="text-sm text-gray-400">Qu&apos;est-ce que tu veux faire de ton poids ?</p>
      </div>

      <div className="space-y-2.5">
        {WEIGHT_GOALS.map((goal) => (
          <button
            key={goal.value}
            type="button"
            onClick={() => onSelect(goal.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              selected === goal.value
                ? "border-primary bg-primary/5"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="text-2xl flex-shrink-0">{goal.emoji}</span>
            <span
              className={`text-sm font-semibold flex-1 ${
                selected === goal.value ? "text-primary" : "text-[#1A1A2E]"
              }`}
            >
              {goal.label}
            </span>
            {selected === goal.value && (
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className="flex-[2] bg-primary text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/30 disabled:opacity-40 disabled:shadow-none"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2B — Motivations ────────────────────────────────────────────────────

function Step2B({
  selected,
  onToggle,
  onNext,
  onBack,
  bmi,
  objectifPoids,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  bmi?: number;
  objectifPoids: string;
}) {
  const advice = bmi ? getWeightGoalAdvice(objectifPoids, selected, bmi) : null;

  return (
    <div className="space-y-5 animate-step-in">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Tes motivations</h2>
        <p className="text-sm text-gray-400">
          Ce qui te pousse à te dépasser (plusieurs choix possibles)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {MOTIVATIONS.map((m) => {
          const isSelected = selected.includes(m.value);
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onToggle(m.value)}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span
                className={`text-xs font-semibold leading-tight ${
                  isSelected ? "text-primary" : "text-[#1A1A2E]"
                }`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Smart BMI advice */}
      {advice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2.5">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs text-amber-800 leading-relaxed">{advice}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] bg-primary text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/30"
        >
          Continuer →
        </button>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-sm text-gray-400 py-1 active:text-gray-600"
      >
        Passer cette étape
      </button>
    </div>
  );
}

// ─── Step 3 — Composition corporelle ─────────────────────────────────────────

function Step3({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: Step3Data;
  onChange: (d: Partial<Step3Data>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const fields: {
    key: keyof Step3Data;
    label: string;
    unit: string;
    placeholder: string;
  }[] = [
    { key: "masseGrasse", label: "Masse grasse", unit: "%", placeholder: "15.0" },
    { key: "masseMusculaire", label: "Masse musculaire", unit: "kg", placeholder: "45.0" },
    { key: "graisseViscerale", label: "Graisse viscérale", unit: "", placeholder: "8" },
    { key: "tauxHydrique", label: "Taux hydrique", unit: "%", placeholder: "55.0" },
    { key: "masseOsseuse", label: "Masse osseuse", unit: "kg", placeholder: "3.2" },
  ];

  return (
    <div className="space-y-5 animate-step-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-[#1A1A2E]">Balance connectée ?</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            optionnel
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Le poids seul n&apos;est pas un indicateur fiable. La composition corporelle est ce qui compte.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center px-4 py-3 gap-3">
            <label className="flex-1 text-sm font-medium text-[#1A1A2E]">{field.label}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                placeholder={field.placeholder}
                value={data[field.key]}
                onChange={(e) => onChange({ [field.key]: e.target.value })}
                className="w-20 text-right py-1.5 px-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E] font-semibold"
              />
              {field.unit && (
                <span className="text-xs text-gray-400 w-5">{field.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] bg-primary text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/30"
        >
          Suivant →
        </button>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-sm text-gray-400 py-1 active:text-gray-600"
      >
        Passer cette étape
      </button>
    </div>
  );
}

// ─── Step 4 — Récapitulatif ───────────────────────────────────────────────────

function calcKgPerMonth(adjustment: number): number {
  return Math.round(((adjustment * 30) / 7700) * 10) / 10;
}

function Step4({
  step1,
  step2,
  isPending,
  onSave,
  onBack,
  saveError,
}: {
  step1: Step1Data;
  step2: Step2Data;
  isPending: boolean;
  onSave: () => void;
  onBack: () => void;
  saveError: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const poids = Number(step1.poids);
  const taille = Number(step1.taille);
  const age = Number(step1.age);
  const bmi = poids / (taille / 100) ** 2;

  const tdee = calcTDEE(step1.sexe, poids, taille, age, step1.niveauActivite);
  const adjustment = calcAdjustment(step2.objectifPoids, bmi);
  const rawCal = tdee + adjustment;
  const minCal = step1.sexe === "femme" ? 1200 : 1500;
  const caloriesCible = Math.max(rawCal, minCal);

  const goal = WEIGHT_GOALS.find((g) => g.value === step2.objectifPoids)!;
  const macros = calcMacros(caloriesCible, poids, goal.type);
  const kgPerMonth = calcKgPerMonth(adjustment);

  const totalCal = macros.prot * 4 + macros.carb * 4 + macros.fat * 9;
  const macroData = [
    {
      name: "Protéines",
      value: macros.prot * 4,
      grams: macros.prot,
      pct: Math.round((macros.prot * 4 * 100) / totalCal),
      color: "#1A73E8",
    },
    {
      name: "Glucides",
      value: macros.carb * 4,
      grams: macros.carb,
      pct: Math.round((macros.carb * 4 * 100) / totalCal),
      color: "#34A853",
    },
    {
      name: "Lipides",
      value: macros.fat * 9,
      grams: macros.fat,
      pct: Math.round((macros.fat * 9 * 100) / totalCal),
      color: "#E65100",
    },
  ];

  const kgLabel =
    kgPerMonth === 0
      ? "⚖️ Maintien"
      : kgPerMonth > 0
      ? `📈 +${kgPerMonth} kg/mois estimé`
      : `📉 ${kgPerMonth} kg/mois estimé`;

  const selectedMotivations = MOTIVATIONS.filter((m) =>
    step2.motivations.includes(m.value)
  );

  return (
    <div className="space-y-4 animate-step-in">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Ton plan personnalisé</h2>
        <p className="text-sm text-gray-400">Basé sur ton profil et tes objectifs</p>
      </div>

      {/* TDEE + Calories cible */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-primary/70 font-medium uppercase tracking-wide">
            Métabolisme total
          </p>
          <p className="text-2xl font-bold text-primary">
            {tdee} <span className="text-sm font-medium text-primary/70">kcal</span>
          </p>
          <p className="text-[11px] text-gray-400">TDEE Mifflin-St Jeor</p>
        </div>
        <div className="w-px h-12 bg-primary/20" />
        <div className="text-right">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
            Objectif / jour
          </p>
          <p className="text-2xl font-bold text-[#1A1A2E]">
            {caloriesCible} <span className="text-sm font-medium text-gray-400">kcal</span>
          </p>
          <p
            className={`text-[11px] font-semibold ${
              kgPerMonth === 0
                ? "text-gray-400"
                : kgPerMonth > 0
                ? "text-accent"
                : "text-warning"
            }`}
          >
            {kgLabel}
          </p>
        </div>
      </div>

      {/* Macro donut */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3">Répartition des macros</h3>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {mounted ? (
              <PieChart width={110} height={110}>
                <Pie
                  data={macroData}
                  cx={55}
                  cy={55}
                  innerRadius={34}
                  outerRadius={52}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  strokeWidth={0}
                >
                  {macroData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <div className="w-[110px] h-[110px] rounded-full bg-gray-100" />
            )}
          </div>
          <div className="flex-1 space-y-2.5">
            {macroData.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-gray-500">{m.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#1A1A2E]">{m.grams}g</span>
                  <span className="text-xs text-gray-400 ml-1">({m.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Objectif + motivations */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal?.emoji}</span>
          <div>
            <p className="text-xs text-gray-400 font-medium">Objectif poids</p>
            <p className="text-sm font-semibold text-[#1A1A2E]">{goal?.label}</p>
          </div>
        </div>
        {selectedMotivations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedMotivations.map((m) => (
              <span
                key={m.value}
                className="flex items-center gap-1 text-[11px] bg-white border border-gray-200 text-[#1A1A2E] px-2 py-1 rounded-full font-medium"
              >
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {saveError && (
        <p className="text-sm text-red-500 text-center">{saveError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="flex-[2] bg-primary text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/30 disabled:opacity-70"
        >
          {isPending ? "Enregistrement..." : "C'est parti ! 🚀"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
// Steps: 1=Profil, 2=Step2A(poids), 3=Step2B(motivations), 4=Step3(compo), 5=Step4(résumé)

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [step1, setStep1] = useState<Step1Data>({
    sexe: "",
    age: "",
    poids: "",
    taille: "",
    niveauActivite: "",
  });
  const [step2, setStep2] = useState<Step2Data>({ objectifPoids: "", motivations: [] });
  const [step3, setStep3] = useState<Step3Data>({
    masseGrasse: "",
    masseMusculaire: "",
    graisseViscerale: "",
    tauxHydrique: "",
    masseOsseuse: "",
  });

  const bmi =
    step1.poids && step1.taille
      ? Number(step1.poids) / (Number(step1.taille) / 100) ** 2
      : undefined;

  const toggleMotivation = (value: string) => {
    setStep2((prev) => ({
      ...prev,
      motivations: prev.motivations.includes(value)
        ? prev.motivations.filter((v) => v !== value)
        : [...prev.motivations, value],
    }));
  };

  const handleSave = () => {
    setSaveError(null);
    const poids = Number(step1.poids);
    const taille = Number(step1.taille);
    const age = Number(step1.age);
    const bmiVal = poids / (taille / 100) ** 2;

    const tdee = calcTDEE(step1.sexe, poids, taille, age, step1.niveauActivite);
    const adjustment = calcAdjustment(step2.objectifPoids, bmiVal);
    const rawCal = tdee + adjustment;
    const minCal = step1.sexe === "femme" ? 1200 : 1500;
    const caloriesCible = Math.max(rawCal, minCal);

    const goal = WEIGHT_GOALS.find((g) => g.value === step2.objectifPoids)!;
    const macros = calcMacros(caloriesCible, poids, goal.type);

    const hasBodyComp =
      step3.masseGrasse ||
      step3.masseMusculaire ||
      step3.graisseViscerale ||
      step3.tauxHydrique ||
      step3.masseOsseuse;

    startTransition(async () => {
      const result = await saveOnboarding({
        sexe: step1.sexe,
        age,
        poids,
        taille,
        niveauActivite: step1.niveauActivite,
        objectifPoids: step2.objectifPoids,
        motivations: step2.motivations,
        objectifCalorique: goal.type,
        tdee,
        caloriesCible,
        proteinesCibleG: macros.prot,
        glucidesCibleG: macros.carb,
        lipidesCibleG: macros.fat,
        bodyComposition: hasBodyComp
          ? {
              masseGrassePct: step3.masseGrasse ? Number(step3.masseGrasse) : undefined,
              masseMusculaire: step3.masseMusculaire ? Number(step3.masseMusculaire) : undefined,
              graisseViscerale: step3.graisseViscerale ? Number(step3.graisseViscerale) : undefined,
              tauxHydrique: step3.tauxHydrique ? Number(step3.tauxHydrique) : undefined,
              masseOsseuse: step3.masseOsseuse ? Number(step3.masseOsseuse) : undefined,
            }
          : undefined,
      });

      if (result?.error) {
        setSaveError(result.error);
      } else {
        router.push("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto px-4 pt-10 pb-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <span className="font-bold text-[#1A1A2E] text-sm">Sportiva</span>
        </div>

        <Stepper step={step} />

        {step === 1 && (
          <Step1
            data={step1}
            onChange={(d) => setStep1((prev) => ({ ...prev, ...d }))}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2A
            selected={step2.objectifPoids}
            onSelect={(v) => setStep2((prev) => ({ ...prev, objectifPoids: v }))}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step2B
            selected={step2.motivations}
            onToggle={toggleMotivation}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            bmi={bmi}
            objectifPoids={step2.objectifPoids}
          />
        )}

        {step === 4 && (
          <Step3
            data={step3}
            onChange={(d) => setStep3((prev) => ({ ...prev, ...d }))}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && (
          <Step4
            step1={step1}
            step2={step2}
            isPending={isPending}
            onSave={handleSave}
            onBack={() => setStep(4)}
            saveError={saveError}
          />
        )}
      </div>
    </div>
  );
}
