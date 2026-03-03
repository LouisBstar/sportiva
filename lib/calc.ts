// Sportiva — Shared calculation helpers (TDEE, macros, objectives)

export const ACTIVITY_OPTIONS = [
  {
    value: "sedentaire",
    label: "Sédentaire",
    description: "Peu ou pas d'exercice, travail de bureau",
    factor: 1.2,
  },
  {
    value: "legerement_actif",
    label: "Légèrement actif",
    description: "Exercice léger 1–3 fois par semaine",
    factor: 1.375,
  },
  {
    value: "moderement_actif",
    label: "Actif",
    description: "Exercice régulier 3–5 fois par semaine",
    factor: 1.55,
  },
  {
    value: "tres_actif",
    label: "Très actif",
    description: "Entraînements intenses ou travail physique",
    factor: 1.725,
  },
] as const;

export const OBJECTIVES = [
  { value: "tonifier",  emoji: "💪", label: "Me tonifier",              adjustment: -250, type: "perte"    as const },
  { value: "force",     emoji: "🏋️", label: "Gagner en force",          adjustment:  200, type: "prise"    as const },
  { value: "explosif",  emoji: "⚡",  label: "Être plus explosif",       adjustment:   50, type: "maintien" as const },
  { value: "endurance", emoji: "🏃", label: "Courir plus vite / plus loin", adjustment: -75, type: "maintien" as const },
  { value: "leger",     emoji: "🪶", label: "Me sentir plus léger",      adjustment: -400, type: "perte"    as const },
  { value: "volume",    emoji: "📐", label: "Prendre du volume",         adjustment:  350, type: "prise"    as const },
  { value: "maintien",  emoji: "⚖️", label: "Maintenir ma forme",        adjustment:    0, type: "maintien" as const },
];

const MACRO_RATIOS = {
  prise:    { prot: 0.3,  carb: 0.45, fat: 0.25 },
  maintien: { prot: 0.3,  carb: 0.4,  fat: 0.3  },
  perte:    { prot: 0.35, carb: 0.35, fat: 0.3  },
};

export function calcTDEE(
  sexe: string,
  poids: number,
  taille: number,
  age: number,
  niveauActivite: string
): number {
  const bmr =
    sexe === "homme"
      ? 10 * poids + 6.25 * taille - 5 * age + 5
      : 10 * poids + 6.25 * taille - 5 * age - 161;
  const factor =
    (ACTIVITY_OPTIONS as readonly { value: string; factor: number }[]).find(
      (a) => a.value === niveauActivite
    )?.factor ?? 1.2;
  return Math.round(bmr * factor);
}

export function calcAdjustment(objectifValue: string, bmi: number): number {
  const obj = OBJECTIVES.find((o) => o.value === objectifValue);
  if (!obj) return 0;
  let adj = obj.adjustment;
  if (bmi < 18.5) {
    adj = Math.max(adj, -150);
  } else if (bmi >= 30) {
    if (adj < 0) adj = Math.min(adj - 100, -300);
  }
  return adj;
}

export function calcMacros(
  caloriesCible: number,
  poids: number,
  objectifType: "perte" | "maintien" | "prise"
) {
  const ratios = MACRO_RATIOS[objectifType];
  let prot = Math.round((caloriesCible * ratios.prot) / 4);
  let carb = Math.round((caloriesCible * ratios.carb) / 4);
  let fat  = Math.round((caloriesCible * ratios.fat)  / 9);

  const minProt = Math.ceil(1.6 * poids);
  const minFat  = Math.ceil(0.8 * poids);

  if (prot < minProt) {
    const extra = (minProt - prot) * 4;
    prot = minProt;
    carb = Math.max(0, carb - Math.round(extra / 4));
  }
  if (fat < minFat) {
    const extra = (minFat - fat) * 9;
    fat = minFat;
    carb = Math.max(0, carb - Math.round(extra / 4));
  }

  return { prot, carb, fat };
}
