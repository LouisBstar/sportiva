"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSportEvent, deleteSportEvent } from "@/app/actions/profil";

type SportEvent = {
  id: string;
  nom_event: string;
  type_event: string | null;
  date: string;
  distance_km: number | null;
  denivele: number | null;
  temps_secondes: number | null;
  classement: string | null;
};

type Props = { events: SportEvent[] };

const TYPE_OPTIONS = [
  "course",
  "trail",
  "triathlon",
  "cyclisme",
  "natation",
  "marche",
  "autre",
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
  return `${m}min`;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: SportEvent }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteSportEvent(event.id);
      router.refresh();
    });
  }

  const details: string[] = [];
  if (event.distance_km) details.push(`${event.distance_km} km`);
  if (event.denivele) details.push(`D+ ${event.denivele} m`);
  if (event.temps_secondes) details.push(formatTime(event.temps_secondes));
  if (event.classement) details.push(event.classement);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-sm">🏁</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A2E] leading-tight">
          {event.nom_event}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {event.type_event && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md capitalize">
              {event.type_event}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            {formatEventDate(event.date)}
          </span>
        </div>
        {details.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">{details.join(" · ")}</p>
        )}
      </div>
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="text-gray-300 p-1 flex-shrink-0"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      ) : (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setConfirm(false)}
            className="text-[10px] text-gray-400 px-2 py-1 bg-gray-100 rounded-lg"
          >
            Non
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-[10px] text-white px-2 py-1 bg-red-400 rounded-lg disabled:opacity-50"
          >
            Oui
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SportEventsSection({ events }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    nomEvent:  "",
    typeEvent: "course",
    date:      today,
    distanceKm: "",
    denivele:   "",
    heures:     "",
    minutes:    "",
    classement: "",
  });

  function handleSubmit() {
    if (!form.nomEvent || !form.date) return;

    const h = Number(form.heures) || 0;
    const m = Number(form.minutes) || 0;
    const tempsSecondes = h * 3600 + m * 60 || undefined;

    startTransition(async () => {
      const res = await addSportEvent({
        nomEvent:    form.nomEvent,
        typeEvent:   form.typeEvent,
        date:        form.date,
        distanceKm:  form.distanceKm  ? Number(form.distanceKm)  : undefined,
        denivele:    form.denivele     ? Number(form.denivele)     : undefined,
        tempsSecondes,
        classement:  form.classement  || undefined,
      });
      if (!res.error) {
        setShowForm(false);
        setForm({
          nomEvent: "", typeEvent: "course", date: today,
          distanceKm: "", denivele: "", heures: "", minutes: "", classement: "",
        });
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Events sportifs
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold text-primary"
        >
          {showForm ? "Annuler" : "+ Ajouter"}
        </button>
      </div>

      {/* Event list */}
      {events.length > 0 ? (
        <div>
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun event planifié
          </p>
        )
      )}

      {/* Add form */}
      {showForm && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {/* Nom */}
          <div>
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
              Nom de l&apos;event
            </label>
            <input
              type="text"
              value={form.nomEvent}
              onChange={(e) => setForm({ ...form, nomEvent: e.target.value })}
              placeholder="Ex : Marathon de Paris"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
            />
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Type
              </label>
              <select
                value={form.typeEvent}
                onChange={(e) => setForm({ ...form, typeEvent: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary appearance-none"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Distance + Dénivelé */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                placeholder="42.2"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Dénivelé (m)
              </label>
              <input
                type="number"
                value={form.denivele}
                onChange={(e) => setForm({ ...form, denivele: e.target.value })}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Temps */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Heures
              </label>
              <input
                type="number"
                min="0"
                value={form.heures}
                onChange={(e) => setForm({ ...form, heures: e.target.value })}
                placeholder="3"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={form.minutes}
                onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                placeholder="45"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Classement */}
          <div>
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
              Classement (optionnel)
            </label>
            <input
              type="text"
              value={form.classement}
              onChange={(e) => setForm({ ...form, classement: e.target.value })}
              placeholder="Ex : 12/450, finisher…"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || !form.nomEvent || !form.date}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Enregistrement…" : "Ajouter l'event"}
          </button>
        </div>
      )}
    </div>
  );
}
