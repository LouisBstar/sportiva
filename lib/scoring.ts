// Sportiva — Score Antifragile
// Points comptés du lundi au dimanche

export type ScoreBreakdown = {
  repasPoints: number;    // 1 pt par repas (max 21 = 3×7j)
  caloriePoints: number;  // 2 pts par jour dans la cible ±10% (max 14)
  sportPoints: number;    // 2 pts par session (max 8)
  poidsPoints: number;    // 2 pts si au moins 1 pesée cette semaine (max 2)
  total: number;
  max: 45;
  pct: number;            // 0-100 arrondi
};

// ─── Helpers de date ──────────────────────────────────────────────────────────

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export function getWeekMonday(date?: Date): string {
  const d = date ?? new Date();
  const day = d.getDay(); // 0=Dim, 1=Lun…
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + offset);
  return monday.toISOString().split("T")[0];
}

export function getPastMondays(currentMonday: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(currentMonday + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - (i + 1) * 7);
    return d.toISOString().split("T")[0];
  });
}

// ─── Calcul du score ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function computeWeekScore(
  supabase: any,
  userId: string,
  weekStart: string,
  caloriesCible: number
): Promise<ScoreBreakdown> {
  const weekEnd = addDays(weekStart, 7);

  const [mealsRes, nutritionRes, activitiesRes, bodyRes] = await Promise.all([
    // 1 pt par repas, max 21
    supabase
      .from("meals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lt("date", weekEnd),

    // Bilan calorique par jour (vue daily_nutrition)
    supabase
      .from("daily_nutrition")
      .select("date, total_calories")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lt("date", weekEnd),

    // 2 pts par activité, max 8
    supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lt("date", weekEnd),

    // 2 pts si au moins 1 pesée cette semaine
    supabase
      .from("body_composition")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lt("date", weekEnd),
  ]);

  // Repas : 1 pt chacun, max 21
  const repasPoints = Math.min(mealsRes.count ?? 0, 21);

  // Calories : 2 pts par jour dans la cible ±10% (exclure les jours à 0)
  const nutritionDays = (nutritionRes.data ?? []) as Array<{
    date: string;
    total_calories: number;
  }>;
  const daysOnTarget = caloriesCible > 0
    ? nutritionDays.filter((d) => {
        const cal = Number(d.total_calories);
        if (cal <= 0) return false;
        const ratio = cal / caloriesCible;
        return ratio >= 0.9 && ratio <= 1.1;
      }).length
    : 0;
  const caloriePoints = Math.min(daysOnTarget * 2, 14);

  // Sport : 2 pts par session, max 8
  const sportPoints = Math.min((activitiesRes.count ?? 0) * 2, 8);

  // Poids : 2 pts si au moins 1 pesée
  const poidsPoints = (bodyRes.count ?? 0) > 0 ? 2 : 0;

  const total = repasPoints + caloriePoints + sportPoints + poidsPoints;
  const max = 45 as const;
  const pct = Math.round((total / max) * 100);

  return { repasPoints, caloriePoints, sportPoints, poidsPoints, total, max, pct };
}
