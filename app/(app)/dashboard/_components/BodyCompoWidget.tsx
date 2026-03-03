"use client";

// Widget composition corporelle pour le dashboard

type BodyEntry = {
  date: string;
  poids: number | null;
  masse_grasse_pct: number | null;
  masse_musculaire: number | null;
};

type Props = {
  last: BodyEntry | null;
  prev: BodyEntry | null;
  daysSinceLast: number | null;
};

// ─── Trend arrow ─────────────────────────────────────────────────────────────

function TrendArrow({
  delta,
  positiveIsGood,
}: {
  delta: number | null;
  positiveIsGood: boolean;
}) {
  if (delta === null || Math.abs(delta) < 0.1) {
    return <span className="text-gray-300 text-xs">→</span>;
  }
  const isUp = delta > 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const color = isGood ? "text-accent" : "text-warning";
  return (
    <span className={`text-xs font-bold ${color}`}>
      {isUp ? "↑" : "↓"}
    </span>
  );
}

// ─── Smart message ────────────────────────────────────────────────────────────

function getSmartMessage(
  deltaMuscle: number | null,
  deltaFat: number | null
): { text: string; color: string } {
  if (deltaMuscle === null && deltaFat === null) {
    return { text: "Continue à logger pour voir ton évolution.", color: "text-gray-400" };
  }
  const muscleUp = deltaMuscle !== null && deltaMuscle > 0.2;
  const muscleDown = deltaMuscle !== null && deltaMuscle < -0.2;
  const fatUp = deltaFat !== null && deltaFat > 0.3;
  const fatDown = deltaFat !== null && deltaFat < -0.3;

  if (muscleUp && fatDown) {
    return { text: "Progression parfaite : plus de muscle, moins de graisse.", color: "text-accent" };
  }
  if (fatDown && !muscleDown) {
    return { text: "Tu perds de la masse grasse, excellent !", color: "text-accent" };
  }
  if (muscleUp && fatUp) {
    return { text: "Bonne prise de masse. Surveille ta masse grasse sur la durée.", color: "text-primary" };
  }
  if (fatDown && muscleDown) {
    return { text: "Tu perds du poids mais aussi du muscle. Augmente tes protéines.", color: "text-warning" };
  }
  if (fatUp) {
    return { text: "Ton taux de graisse augmente. Revois ton alimentation.", color: "text-warning" };
  }
  return { text: "Ta composition est stable. Continue comme ça !", color: "text-gray-500" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BodyCompoWidget({ last, prev, daysSinceLast }: Props) {
  const deltaPoids = last?.poids != null && prev?.poids != null
    ? Number(last.poids) - Number(prev.poids)
    : null;
  const deltaFat = last?.masse_grasse_pct != null && prev?.masse_grasse_pct != null
    ? Number(last.masse_grasse_pct) - Number(prev.masse_grasse_pct)
    : null;
  const deltaMuscle = last?.masse_musculaire != null && prev?.masse_musculaire != null
    ? Number(last.masse_musculaire) - Number(prev.masse_musculaire)
    : null;

  const smartMsg = getSmartMessage(deltaMuscle, deltaFat);
  const needsReminder = daysSinceLast === null || daysSinceLast >= 7;

  if (!last) {
    return (
      <div className="py-4 text-center space-y-1">
        <p className="text-sm text-gray-400">Aucune mesure enregistrée</p>
        <p className="text-xs text-gray-300">
          Ajoute tes données de composition corporelle dans ton profil
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Valeurs + flèches */}
      <div className="grid grid-cols-3 gap-2">
        {last.poids != null && (
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2 px-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                {Number(last.poids).toFixed(1)}
                <span className="text-[10px] font-medium text-gray-400 ml-0.5">kg</span>
              </p>
              <TrendArrow delta={deltaPoids} positiveIsGood={false} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Poids</p>
          </div>
        )}
        {last.masse_grasse_pct != null && (
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2 px-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                {Number(last.masse_grasse_pct).toFixed(1)}
                <span className="text-[10px] font-medium text-gray-400 ml-0.5">%</span>
              </p>
              <TrendArrow delta={deltaFat} positiveIsGood={false} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Graisse</p>
          </div>
        )}
        {last.masse_musculaire != null && (
          <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2 px-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                {Number(last.masse_musculaire).toFixed(1)}
                <span className="text-[10px] font-medium text-gray-400 ml-0.5">kg</span>
              </p>
              <TrendArrow delta={deltaMuscle} positiveIsGood={true} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Muscle</p>
          </div>
        )}
      </div>

      {/* Smart message */}
      {(deltaMuscle !== null || deltaFat !== null) && (
        <p className={`text-xs ${smartMsg.color} leading-relaxed`}>{smartMsg.text}</p>
      )}

      {/* 7-day reminder */}
      {needsReminder && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base flex-shrink-0">⏰</span>
          <p className="text-xs text-amber-700">
            {daysSinceLast === null
              ? "Commence dès aujourd'hui à logger ta composition corporelle !"
              : `Dernière mesure il y a ${daysSinceLast}j — pèse-toi !`}
          </p>
        </div>
      )}
    </div>
  );
}
