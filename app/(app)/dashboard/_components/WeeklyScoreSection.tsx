import ScoreGauge from "@/components/ScoreGauge";
import type { ScoreBreakdown } from "@/lib/scoring";

type PastWeek = {
  semaine_debut: string;
  score_pct: number | null;
};

type Props = {
  current: ScoreBreakdown;
  pastWeeks: PastWeek[];
};

// ─── Message contextuel ───────────────────────────────────────────────────────

function getMessage(pct: number, successCount: number) {
  let main: string;
  if (pct >= 90)      main = "Excellente semaine, tu es régulier et ça paie.";
  else if (pct >= 80) main = "Objectif atteint ! Continue comme ça.";
  else if (pct >= 65) main = "Presque dans la cible. Continue demain !";
  else                main = "Semaine chargée ? Pas de souci, nouveau départ lundi.";

  const trend =
    successCount > 0
      ? `Tu as atteint l'objectif ${successCount} semaine${successCount !== 1 ? "s" : ""} sur 4 ce mois-ci.`
      : null;

  return { main, trend };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// ─── Breakdown chips ──────────────────────────────────────────────────────────

const BREAKDOWN = [
  { key: "repasPoints"   as const, label: "Repas",    max: 21 },
  { key: "caloriePoints" as const, label: "Calories", max: 14 },
  { key: "sportPoints"   as const, label: "Sport",    max: 8  },
  { key: "poidsPoints"   as const, label: "Poids",    max: 2  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyScoreSection({ current, pastWeeks }: Props) {
  const successCount = pastWeeks.filter(
    (w) => Math.round(Number(w.score_pct ?? 0)) >= 80
  ).length;
  const { main, trend } = getMessage(current.pct, successCount);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Score antifragile
        </h2>
        <span className="text-xs text-gray-300 font-medium">
          {current.total}&thinsp;/&thinsp;{current.max} pts
        </span>
      </div>

      {/* Jauge principale */}
      <div className="flex items-center gap-5 mb-4">
        <ScoreGauge score={current.pct} size={88} strokeWidth={9} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A2E] leading-snug">
            {main}
          </p>
          {trend && (
            <p className="text-xs text-gray-400 mt-1">{trend}</p>
          )}
        </div>
      </div>

      {/* Breakdown détaillé */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {BREAKDOWN.map(({ key, label, max }) => {
          const val = current[key];
          const pct = max > 0 ? Math.round((val / max) * 100) : 0;
          return (
            <div
              key={key}
              className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-1"
            >
              <p className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                {val}
                <span className="text-[10px] font-medium text-gray-400">
                  /{max}
                </span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
              <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4 dernières semaines */}
      {pastWeeks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide mb-2.5">
            4 dernières semaines
          </p>
          <div className="flex justify-around">
            {pastWeeks.map((w) => {
              const s = Math.round(Number(w.score_pct ?? 0));
              return (
                <div key={w.semaine_debut} className="flex flex-col items-center gap-1">
                  <ScoreGauge score={s} size={50} strokeWidth={5} />
                  <p className="text-[9px] text-gray-400 text-center leading-tight">
                    {formatShortDate(w.semaine_debut)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
