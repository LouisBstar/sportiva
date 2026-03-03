"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type BodyCompositionInput = {
  masseGrassePct?: number;
  masseMusculaire?: number;
  graisseViscerale?: number;
  tauxHydrique?: number;
  masseOsseuse?: number;
};

type OnboardingInput = {
  sexe: string;
  age: number;
  poids: number;
  taille: number;
  niveauActivite: string;
  objectifIdentitaire: string;
  objectifCalorique: "perte" | "maintien" | "prise";
  tdee: number;
  caloriesCible: number;
  proteinesCibleG: number;
  glucidesCibleG: number;
  lipidesCibleG: number;
  bodyComposition?: BodyCompositionInput;
};

export async function saveOnboarding(
  data: OnboardingInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      sexe: data.sexe,
      age: data.age,
      poids: data.poids,
      taille: data.taille,
      niveau_activite: data.niveauActivite,
      objectif_identitaire: data.objectifIdentitaire,
      objectif_calorique: data.objectifCalorique,
      tdee: data.tdee,
      calories_cible: data.caloriesCible,
      proteines_cible_g: data.proteinesCibleG,
      glucides_cible_g: data.glucidesCibleG,
      lipides_cible_g: data.lipidesCibleG,
    })
    .eq("user_id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (data.bodyComposition) {
    const bc = data.bodyComposition;
    const hasValue =
      bc.masseGrassePct != null ||
      bc.masseMusculaire != null ||
      bc.graisseViscerale != null ||
      bc.tauxHydrique != null ||
      bc.masseOsseuse != null;

    if (hasValue) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("body_composition").upsert(
        {
          user_id: user.id,
          date: today,
          poids: data.poids,
          masse_grasse_pct: bc.masseGrassePct ?? null,
          masse_musculaire: bc.masseMusculaire ?? null,
          graisse_viscerale: bc.graisseViscerale ?? null,
          taux_hydrique: bc.tauxHydrique ?? null,
          masse_osseuse: bc.masseOsseuse ?? null,
        },
        { onConflict: "user_id,date" }
      );
    }
  }

  redirect("/dashboard");
}
