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

// ─── Objectif poids (5 choix) ─────────────────────────────────────────────────

export const WEIGHT_GOALS = [
  { value: "perte_forte", label: "Perdre du poids",      emoji: "📉", adjustment: -550, type: "perte"    as const },
  { value: "perte_douce", label: "Perdre légèrement",    emoji: "🪶", adjustment: -350, type: "perte"    as const },
  { value: "maintien",    label: "Maintenir mon poids",  emoji: "⚖️", adjustment:    0, type: "maintien" as const },
  { value: "prise_douce", label: "Prendre de la masse",  emoji: "💪", adjustment:  250, type: "prise"    as const },
  { value: "prise_forte", label: "Prise de masse",       emoji: "🏋️", adjustment:  450, type: "prise"    as const },
] as const;

// ─── Motivations (6 choix, multi-select) ──────────────────────────────────────

export const MOTIVATIONS = [
  { value: "tonifier",  emoji: "💪", label: "Me tonifier"           },
  { value: "force",     emoji: "🏋️", label: "Gagner en force"       },
  { value: "explosif",  emoji: "⚡",  label: "Être plus explosif"    },
  { value: "endurance", emoji: "🏃", label: "Courir plus loin"      },
  { value: "leger",     emoji: "🪶", label: "Me sentir plus léger"  },
  { value: "volume",    emoji: "📐", label: "Prendre du volume"     },
] as const;

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

export function calcAdjustment(weightGoalValue: string, bmi: number): number {
  const goal = WEIGHT_GOALS.find((g) => g.value === weightGoalValue);
  if (!goal) return 0;
  let adj: number = goal.adjustment;
  if (bmi < 18.5) {
    adj = Math.max(adj, -150);
  } else if (bmi >= 30 && adj < 0) {
    adj = Math.min(adj - 100, -300);
  }
  return adj;
}

// ─── Calcul des macros (méthode g/kg) ────────────────────────────────────────
// Protéines : 2.0g/kg si perte, 1.8g/kg sinon (plancher 1.6, plafond 2.2)
// Lipides   : 1.0g/kg (plancher 0.8, plafond 1.3)
// Glucides  : calories restantes / 4 (plancher 2.0g/kg)

export function calcMacros(
  caloriesCible: number,
  poids: number,
  objectifType: "perte" | "maintien" | "prise"
) {
  const isPerte = objectifType === "perte";

  // Protéines
  const protTarget = isPerte ? 2.0 : 1.8;
  const prot = Math.min(
    Math.max(Math.round(protTarget * poids), Math.ceil(1.6 * poids)),
    Math.floor(2.2 * poids)
  );

  // Lipides
  const fat = Math.min(
    Math.max(Math.round(1.0 * poids), Math.ceil(0.8 * poids)),
    Math.floor(1.3 * poids)
  );

  // Glucides (calories restantes)
  const remainingKcal = caloriesCible - prot * 4 - fat * 9;
  const minCarb = Math.ceil(2.0 * poids);
  const carb = Math.max(Math.round(remainingKcal / 4), minCarb);

  return { prot, carb, fat };
}

// ─── Smart BMI advice ─────────────────────────────────────────────────────────

export function getWeightGoalAdvice(
  objectifPoids: string,
  motivations: string[],
  bmi: number
): string | null {
  if (
    objectifPoids === "maintien" &&
    (motivations.includes("tonifier") || motivations.includes("leger")) &&
    bmi > 25
  ) {
    return "Basé sur ton IMC, une légère perte de poids pourrait amplifier tes résultats plus vite.";
  }
  if (
    (objectifPoids === "perte_forte" || objectifPoids === "perte_douce") &&
    bmi < 20
  ) {
    return "Ton IMC est bas. On adapte ton plan pour préserver ta santé et ta masse musculaire.";
  }
  if (objectifPoids === "prise_forte" && bmi > 28) {
    return "Une prise de masse sèche est recommandée pour ton profil. Tes protéines seront ajustées en conséquence.";
  }
  return null;
}
