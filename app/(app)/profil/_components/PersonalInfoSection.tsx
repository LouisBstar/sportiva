"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profil";
import {
  ACTIVITY_OPTIONS,
  calcTDEE,
  calcMacros,
} from "@/lib/calc";

type Profile = {
  sexe: string | null;
  age: number | null;
  poids: number | null;
  taille: number | null;
  niveau_activite: string | null;
  tdee: number | null;
  calories_cible: number | null;
  objectif_calorique: "perte" | "maintien" | "prise" | null;
  proteines_cible_g: number | null;
  glucides_cible_g: number | null;
  lipides_cible_g: number | null;
};

type Props = { profile: Profile };

export default function PersonalInfoSection({ profile }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [sexe, setSexe] = useState<"homme" | "femme">(
    (profile.sexe as "homme" | "femme") ?? "homme"
  );
  const [age, setAge] = useState(String(profile.age ?? ""));
  const [poids, setPoids] = useState(String(profile.poids ?? ""));
  const [taille, setTaille] = useState(String(profile.taille ?? ""));
  const [niveauActivite, setNiveauActivite] = useState(
    profile.niveau_activite ?? "moderement_actif"
  );

  // Preview new TDEE while editing
  const previewTDEE =
    age && poids && taille
      ? calcTDEE(
          sexe,
          Number(poids),
          Number(taille),
          Number(age),
          niveauActivite
        )
      : null;

  function handleCancel() {
    setSexe((profile.sexe as "homme" | "femme") ?? "homme");
    setAge(String(profile.age ?? ""));
    setPoids(String(profile.poids ?? ""));
    setTaille(String(profile.taille ?? ""));
    setNiveauActivite(profile.niveau_activite ?? "moderement_actif");
    setEditing(false);
  }

  function handleSave() {
    const p = Number(poids);
    const t = Number(taille);
    const a = Number(age);
    if (!p || !t || !a) return;

    const newTDEE = calcTDEE(sexe, p, t, a, niveauActivite);

    // Preserve the calorie adjustment from the current profile
    const currentAdjustment =
      (profile.calories_cible ?? newTDEE) - (profile.tdee ?? newTDEE);
    const minCal = sexe === "femme" ? 1200 : 1500;
    const newCal = Math.max(newTDEE + currentAdjustment, minCal);

    // Resolve the objectif type for macro recalc
    const objType: "perte" | "maintien" | "prise" =
      profile.objectif_calorique ?? "maintien";

    const { prot, carb, fat } = calcMacros(newCal, p, objType);

    startTransition(async () => {
      const res = await updateProfile({
        sexe,
        age: a,
        poids: p,
        taille: t,
        niveauActivite,
        tdee: newTDEE,
        caloriesCible: newCal,
        proteinesCibleG: prot,
        glucidesCibleG: carb,
        lipidesCibleG: fat,
      });
      if (!res.error) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  const activityLabel =
    ACTIVITY_OPTIONS.find((a) => a.value === profile.niveau_activite)?.label ??
    profile.niveau_activite;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Informations personnelles
        </h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-primary"
          >
            Modifier
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="text-xs font-semibold text-gray-400"
          >
            Annuler
          </button>
        )}
      </div>

      {!editing ? (
        /* ── Read mode ── */
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {profile.sexe && (
              <span className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium capitalize">
                {profile.sexe === "homme" ? "Homme" : "Femme"}
              </span>
            )}
            {profile.age && (
              <span className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                {profile.age} ans
              </span>
            )}
            {profile.poids && (
              <span className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                {profile.poids} kg
              </span>
            )}
            {profile.taille && (
              <span className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                {profile.taille} cm
              </span>
            )}
          </div>
          {activityLabel && (
            <p className="text-xs text-gray-400">{activityLabel}</p>
          )}
          {profile.tdee && (
            <p className="text-xs text-gray-400">
              TDEE :{" "}
              <span className="font-semibold text-[#1A1A2E]">
                {profile.tdee} kcal
              </span>
            </p>
          )}
        </div>
      ) : (
        /* ── Edit mode ── */
        <div className="space-y-4">
          {/* Sexe */}
          <div className="flex gap-2">
            {(["homme", "femme"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSexe(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  sexe === s
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-50 text-gray-600 border-gray-100"
                }`}
              >
                {s === "homme" ? "Homme" : "Femme"}
              </button>
            ))}
          </div>

          {/* Age / Poids / Taille */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Âge", value: age, setter: setAge, unit: "ans" },
              { label: "Poids", value: poids, setter: setPoids, unit: "kg" },
              { label: "Taille", value: taille, setter: setTaille, unit: "cm" },
            ].map(({ label, value, setter, unit }) => (
              <div key={label} className="flex flex-col">
                <label className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wide">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#1A1A2E] pr-7 focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Niveau d'activité */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              Niveau d&apos;activité
            </p>
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNiveauActivite(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  niveauActivite === opt.value
                    ? "bg-primary/5 border-primary/30 text-primary"
                    : "bg-gray-50 border-gray-100 text-gray-600"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[10px] text-gray-400 max-w-[55%] text-right leading-tight">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>

          {/* TDEE preview */}
          {previewTDEE && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-xs text-gray-400">Nouveau TDEE</span>
              <span className="text-sm font-bold text-[#1A1A2E]">
                {previewTDEE} kcal
              </span>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isPending || !poids || !taille || !age}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
