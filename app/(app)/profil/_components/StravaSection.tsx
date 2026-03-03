"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  stravaConnected: boolean;
  lastSyncDate: string | null; // ISO date of last synced Strava activity
};

const StravaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
);

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export default function StravaSection({ stravaConnected, lastSyncDate }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/strava/sync", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setSyncMsg(`${data.count ?? 0} activité(s) importée(s)`);
        } else {
          setSyncMsg(data.error ?? "Erreur de synchronisation");
        }
      } catch {
        setSyncMsg("Erreur de connexion");
      } finally {
        setSyncing(false);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Connexions
      </h2>

      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            stravaConnected ? "bg-orange-100" : "bg-gray-100"
          }`}
        >
          <StravaIcon
            className={`w-5 h-5 ${
              stravaConnected ? "text-[#FC4C02]" : "text-gray-400"
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A2E]">Strava</p>
          {stravaConnected ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {lastSyncDate
                ? `Dernière synchro : ${formatDate(lastSyncDate)}`
                : "Connecté"}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Non connecté</p>
          )}
        </div>

        {stravaConnected ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold text-[#FC4C02] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 disabled:opacity-50 transition-opacity flex-shrink-0"
          >
            {syncing ? "Synchro…" : "Synchroniser"}
          </button>
        ) : (
          <Link
            href="/api/strava/authorize"
            className="text-xs font-semibold text-white bg-[#FC4C02] px-3 py-1.5 rounded-xl flex-shrink-0"
          >
            Connecter
          </Link>
        )}
      </div>

      {syncMsg && (
        <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-xl px-3 py-2">
          {syncMsg}
        </p>
      )}
    </div>
  );
}
