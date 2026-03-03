import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import MacroChart from "./_components/MacroChart";
import EdPlate from "./_components/EdPlate";
import WeeklyScoreSection from "./_components/WeeklyScoreSection";
import ScoreGauge from "@/components/ScoreGauge";
import BodyCompoWidget from "./_components/BodyCompoWidget";
import {
  computeWeekScore,
  getWeekMonday,
  getPastMondays,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPS = [
  "Prépare tes repas la veille — 20 min de prep, une semaine de sérénité.",
  "Une seule assiette. Règle simple, impact fort.",
  "Anticipe ton dîner dès le matin. La décision à froid est toujours meilleure.",
  "Boire de l'eau avant les repas réduit naturellement l'appétit.",
  "Les protéines rassasient plus que les glucides. Commence par elles.",
  "La régularité bat la perfection. Un repas imparfait vaut mieux que zéro repas.",
  "Un jour difficile ne définit pas ta semaine. L'objectif est sur 7 jours.",
  "Faim du soir ? Souvent de la fatigue déguisée. Teste avant de manger.",
  "Mâche lentement — la satiété prend 20 minutes à arriver.",
  "Batch cooking le dimanche = repas sains automatiques toute la semaine.",
  "5 minutes pour logger un repas, c'est rester conscient de ses choix.",
  "Viser 80% la plupart des jours > viser 100% deux jours par semaine.",
];

const MEAL_META: Record<string, { label: string; emoji: string }> = {
  "petit-dejeuner": { label: "Petit-déjeuner", emoji: "🌅" },
  dejeuner:         { label: "Déjeuner",        emoji: "☀️" },
  collation:        { label: "Collation",        emoji: "🍎" },
  diner:            { label: "Dîner",            emoji: "🌙" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  course:      "🏃",
  vélo:        "🚴",
  velo:        "🚴",
  natation:    "🏊",
  musculation: "🏋️",
  yoga:        "🧘",
  marche:      "🚶",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm"
        >
          +
        </Link>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const dateStr = formatDateFr(new Date());
  const weekMonday = getWeekMonday();
  const pastMondays = getPastMondays(weekMonday, 4);

  // ── Parallel fetches ────────────────────────────────────────────────────────
  const [profileRes, nutritionRes, mealsRes, activitiesRes, pastScoresRes, bodyRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "calories_cible, proteines_cible_g, glucides_cible_g, lipides_cible_g"
        )
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("daily_nutrition")
        .select("total_calories, total_proteines, total_glucides, total_lipides")
        .eq("date", today)
        .maybeSingle(),

      supabase
        .from("meals")
        .select("id, type_repas, meal_items(calories)")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true }),

      supabase
        .from("activities")
        .select("type_activite, duree_min, calories_brulees")
        .eq("user_id", user.id)
        .eq("date", today),

      supabase
        .from("weekly_scores")
        .select("semaine_debut, score_pct")
        .eq("user_id", user.id)
        .in("semaine_debut", pastMondays)
        .order("semaine_debut", { ascending: false }),

      supabase
        .from("body_composition")
        .select("date, poids, masse_grasse_pct, masse_musculaire")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(2),
    ]);

  // ── Live score (semaine en cours) ────────────────────────────────────────────
  const caloriesCible = profileRes.data?.calories_cible ?? 2000;

  const liveScore = await computeWeekScore(
    supabase,
    user.id,
    weekMonday,
    caloriesCible
  );

  // Persiste dans weekly_scores pour que les semaines passées soient exactes
  await supabase.from("weekly_scores").upsert(
    {
      user_id: user.id,
      semaine_debut: weekMonday,
      points_obtenus: liveScore.total,
      points_possibles: liveScore.max,
    },
    { onConflict: "user_id,semaine_debut" }
  );

  // ── Derived values ───────────────────────────────────────────────────────────
  const profile    = profileRes.data;
  const nutrition  = nutritionRes.data;
  const meals      = (mealsRes.data ?? []) as Array<{
    id: string;
    type_repas: string;
    meal_items: Array<{ calories: number | null }>;
  }>;
  const activities = (activitiesRes.data ?? []) as Array<{
    type_activite: string;
    duree_min: number | null;
    calories_brulees: number | null;
  }>;
  const pastWeeks  = (pastScoresRes.data ?? []) as Array<{
    semaine_debut: string;
    score_pct: number | null;
  }>;

  const bodyEntries = (bodyRes.data ?? []) as Array<{
    date: string;
    poids: number | null;
    masse_grasse_pct: number | null;
    masse_musculaire: number | null;
  }>;
  const bodyLast = bodyEntries[0] ?? null;
  const bodyPrev = bodyEntries[1] ?? null;
  const daysSinceLast = bodyLast
    ? Math.floor((Date.now() - new Date(bodyLast.date + "T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const protTarget = profile?.proteines_cible_g ?? 0;
  const carbTarget = profile?.glucides_cible_g ?? 0;
  const fatTarget  = profile?.lipides_cible_g ?? 0;

  const caloriesConsumed = Math.round(Number(nutrition?.total_calories ?? 0));
  const protConsumed     = Math.round(Number(nutrition?.total_proteines ?? 0));
  const carbConsumed     = Math.round(Number(nutrition?.total_glucides ?? 0));
  const fatConsumed      = Math.round(Number(nutrition?.total_lipides ?? 0));

  const caloriesBurned   = activities.reduce(
    (sum, a) => sum + (Number(a.calories_brulees) || 0), 0
  );
  const netCalories = caloriesConsumed - caloriesBurned;

  const progressPct  = caloriesCible > 0
    ? Math.min((caloriesConsumed / caloriesCible) * 100, 100) : 0;
  const netRatio     = caloriesCible > 0 ? netCalories / caloriesCible : 0;
  const isOnTarget   =
    caloriesConsumed > 0 && netRatio >= 0.9 && netRatio <= 1.1;
  const barColor     =
    caloriesConsumed === 0 ? "bg-gray-200" : isOnTarget ? "bg-accent" : "bg-warning";
  const netTextColor =
    caloriesConsumed === 0 ? "text-gray-400" : isOnTarget ? "text-accent" : "text-warning";

  const dayNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const tip    = TIPS[dayNum % TIPS.length];

  const emailPrefix = user.email?.split("@")[0] ?? "toi";
  const name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400 capitalize">{dateStr}</p>
          <h1 className="text-base font-bold text-[#1A1A2E] leading-tight">
            Bonjour {name} !
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-medium">Semaine</p>
            <p
              className="text-xs font-bold"
              style={{
                color:
                  liveScore.pct >= 80
                    ? "#34A853"
                    : liveScore.pct >= 60
                    ? "#1A73E8"
                    : "#9CA3AF",
              }}
            >
              {liveScore.pct}%
            </p>
          </div>
          <ScoreGauge score={liveScore.pct} size={40} strokeWidth={4} />
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {/* ── Section 1 : Bilan calorique ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader title="Bilan du jour" />
          <div className="mb-2.5">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-2xl font-bold text-[#1A1A2E]">
                {caloriesConsumed}{" "}
                <span className="text-sm font-medium text-gray-400">kcal</span>
              </span>
              <span className="text-sm text-gray-400">/ {caloriesCible} kcal</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Bilan net :{" "}
            <span className="text-[#1A1A2E] font-medium">{caloriesConsumed}</span>
            {" − "}
            <span className="text-[#1A1A2E] font-medium">{caloriesBurned}</span>
            {" = "}
            <span className={`font-semibold ${netTextColor}`}>
              {netCalories} kcal
            </span>
          </p>
        </div>

        {/* ── Section 2 : Macros ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader title="Macros du jour" />
          <MacroChart
            consumed={{ prot: protConsumed, carb: carbConsumed, fat: fatConsumed }}
            target={{ prot: protTarget, carb: carbTarget, fat: fatTarget }}
          />
        </div>

        {/* ── Section 3 : Assiette éducative ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader title="Assiette du jour" />
          <EdPlate prot={protConsumed} carb={carbConsumed} fat={fatConsumed} />
          {(protConsumed > 0 || carbConsumed > 0 || fatConsumed > 0) && (
            <div className="flex justify-center gap-4 mt-3">
              {[
                { label: "Protéines", color: "#EF4444" },
                { label: "Glucides",  color: "#EAB308" },
                { label: "Lipides",   color: "#F97316" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-[11px] text-gray-500">{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 4 : Repas du jour ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader
            title="Repas du jour"
            action={{ label: "+", href: "/repas" }}
          />
          {meals.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">Aucun repas loggé</p>
              <Link
                href="/repas"
                className="inline-block mt-2 text-sm font-semibold text-primary"
              >
                Ajouter un repas →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {meals.map((meal) => {
                const meta =
                  MEAL_META[meal.type_repas] ?? {
                    label: meal.type_repas,
                    emoji: "🍽️",
                  };
                const totalCal = Math.round(
                  meal.meal_items.reduce(
                    (s, i) => s + (Number(i.calories) || 0), 0
                  )
                );
                const itemCount = meal.meal_items.length;
                return (
                  <Link
                    key={meal.id}
                    href="/repas"
                    className="flex items-center justify-between py-2.5 px-1 rounded-xl active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E]">
                          {meta.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {itemCount} aliment{itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1A1A2E]">
                        {totalCal} kcal
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 5 : Sport du jour ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader
            title="Sport du jour"
            action={{ label: "+", href: "/sport" }}
          />
          {activities.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">Aucune activité loggée</p>
              <Link
                href="/sport"
                className="inline-block mt-2 text-sm font-semibold text-primary"
              >
                Ajouter une activité →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((a, i) => {
                const icon =
                  ACTIVITY_ICONS[a.type_activite?.toLowerCase()] ?? "🏅";
                const burned = Number(a.calories_brulees) || 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-1"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E] capitalize">
                          {a.type_activite}
                        </p>
                        {a.duree_min && (
                          <p className="text-xs text-gray-400">
                            {a.duree_min} min
                          </p>
                        )}
                      </div>
                    </div>
                    {burned > 0 && (
                      <span className="text-sm font-bold text-warning">
                        −{burned} kcal
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 6 : Composition corporelle ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <SectionHeader
            title="Composition corporelle"
            action={{ label: "+", href: "/profil" }}
          />
          <BodyCompoWidget
            last={bodyLast}
            prev={bodyPrev}
            daysSinceLast={daysSinceLast}
          />
        </div>

        {/* ── Section 7 : Score antifragile ── */}
        <WeeklyScoreSection current={liveScore} pastWeeks={pastWeeks} />

        {/* ── Section 8 : Tip du jour ── */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Tip du jour
            </p>
            <p className="text-sm text-[#1A1A2E] leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
