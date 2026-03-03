"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateActivityCalories, deleteActivity } from "@/app/actions/sport";
import AddActivityModal from "./AddActivityModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Activity = {
  id: string;
  date: string;
  source: string;
  type_activite: string;
  description: string | null;
  duree_min: number | null;
  distance_km: number | null;
  denivele: number | null;
  intensite: string | null;
  fc_moyenne: number | null;
  fc_max: number | null;
  calories_brulees: number | null;
  modifie_manuellement: boolean;
};

type Props = {
  today: string;
  activities: Activity[];
  poidsKg: number;
  stravaConnected: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVITY_EMOJI: Record<string, string> = {
  course:       "🏃",
  vélo:         "🚴",
  natation:     "🏊",
  marche:       "🚶",
  musculation:  "🏋️",
  calisthenics: "💪",
  yoga:         "🧘",
  aviron:       "🚣",
  kayak:        "🛶",
  foot:         "⚽",
};
const activityEmoji = (type: string) => ACTIVITY_EMOJI[type] ?? "⚡";

function formatDuree(min: number | null): string {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// ─── Inline calories editor ───────────────────────────────────────────────────

function CaloriesEditor({
  activityId,
  initial,
  modified,
  onDone,
}: {
  activityId: string;
  initial: number | null;
  modified: boolean;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initial ?? ""));
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const cal = Number(value);
    if (isNaN(cal) || cal < 0) return;
    startTransition(async () => {
      await updateActivityCalories(activityId, cal);
      setEditing(false);
      onDone();
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          type="number"
          min={0}
          max={9999}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          autoFocus
          className="w-20 px-2 py-1 text-sm border border-primary/40 rounded-lg text-center font-bold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-gray-400">kcal</span>
        <button
          onClick={save}
          disabled={isPending}
          className="text-xs font-semibold text-primary disabled:opacity-40"
        >
          Valider
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-gray-400"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-sm font-bold text-[#1A1A2E]">
        {initial != null ? `${Math.round(initial)} kcal` : "— kcal"}
      </span>
      {modified && (
        <span className="text-[10px] bg-orange-50 text-orange-400 px-1.5 py-0.5 rounded-full">
          modifié
        </span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-gray-400 underline"
      >
        Modifier
      </button>
    </div>
  );
}

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({ activity, onRefresh }: { activity: Activity; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Supprimer cette activité ?")) return;
    startTransition(async () => {
      await deleteActivity(activity.id);
      onRefresh();
    });
  };

  const details: string[] = [];
  if (activity.duree_min) details.push(formatDuree(activity.duree_min));
  if (activity.distance_km) details.push(`${activity.distance_km} km`);
  if (activity.denivele) details.push(`+${activity.denivele} m`);
  if (activity.fc_moyenne) details.push(`${activity.fc_moyenne} bpm`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          {activityEmoji(activity.type_activite)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1A1A2E] capitalize">
              {activity.description ?? activity.type_activite}
            </p>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-400 disabled:opacity-40 flex-shrink-0"
              aria-label="Supprimer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {details.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{details.join(" · ")}</p>
          )}

          {activity.intensite && (
            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
              {activity.intensite}
            </span>
          )}

          <CaloriesEditor
            activityId={activity.id}
            initial={activity.calories_brulees}
            modified={activity.modifie_manuellement}
            onDone={onRefresh}
          />

          {activity.source === "strava" && (
            <p className="text-[10px] text-gray-300 mt-1">via Strava</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, totalCal }: { label: string; totalCal: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {totalCal > 0 && (
        <p className="text-xs font-semibold text-gray-400">{Math.round(totalCal)} kcal</p>
      )}
    </div>
  );
}

// ─── SportView ────────────────────────────────────────────────────────────────

export default function SportView({ today, activities, poidsKg, stravaConnected }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Show post-OAuth feedback
  useEffect(() => {
    if (searchParams.get("strava_connected") === "1") {
      setSyncMsg("Strava connecté avec succès !");
      router.replace("/sport");
    }
    if (searchParams.get("strava_error")) {
      setSyncMsg("Erreur lors de la connexion Strava.");
      router.replace("/sport");
    }
  }, [searchParams, router]);

  const refresh = () => router.refresh();

  const todayActivities = activities.filter((a) => a.date === today);
  const weekActivities = activities.filter((a) => a.date !== today);

  const todayCal = todayActivities.reduce((s, a) => s + (a.calories_brulees ?? 0), 0);
  const weekCal = weekActivities.reduce((s, a) => s + (a.calories_brulees ?? 0), 0);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error ?? "Erreur lors de la synchronisation.");
      } else {
        setSyncMsg(
          data.count > 0
            ? `${data.count} activité${data.count > 1 ? "s" : ""} importée${data.count > 1 ? "s" : ""}.`
            : "Aucune nouvelle activité."
        );
        router.refresh();
      }
    } catch {
      setSyncMsg("Erreur réseau.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A2E]">Sport</h1>
          {stravaConnected && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#FC4C02] bg-orange-50 px-3 py-1.5 rounded-xl disabled:opacity-50 active:bg-orange-100 transition-colors"
            >
              <svg className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSyncing ? "Sync…" : "Strava"}
            </button>
          )}
        </div>
        {syncMsg && (
          <p className="text-xs text-gray-500 mt-1.5">{syncMsg}</p>
        )}
      </div>

      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Today */}
        <div className="space-y-2">
          <SectionHeader label="Aujourd'hui" totalCal={todayCal} />
          {todayActivities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-6 text-center">
              <p className="text-sm text-gray-400">Aucune activité aujourd'hui</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-md shadow-primary/30"
              >
                + Ajouter
              </button>
            </div>
          ) : (
            todayActivities.map((a) => (
              <ActivityCard key={a.id} activity={a} onRefresh={refresh} />
            ))
          )}
        </div>

        {/* Earlier this week */}
        {weekActivities.length > 0 && (
          <div className="space-y-2">
            <SectionHeader label="Cette semaine" totalCal={weekCal} />
            {weekActivities.map((a) => (
              <ActivityCard key={a.id} activity={a} onRefresh={refresh} />
            ))}
          </div>
        )}

        {/* Empty state: no activities at all + not synced */}
        {activities.length === 0 && !stravaConnected && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🏅</div>
            <p className="text-sm font-semibold text-[#1A1A2E]">Aucune activité cette semaine</p>
            <p className="text-xs text-gray-400 mt-1">
              Connecte Strava ou ajoute une activité manuellement
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      {(todayActivities.length > 0 || weekActivities.length > 0) && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-2xl font-light active:scale-95 transition-transform"
          aria-label="Ajouter une activité"
        >
          +
        </button>
      )}

      {showModal && (
        <AddActivityModal
          poidsKg={poidsKg}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
