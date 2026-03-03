"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type UpdateProfileInput = {
  sexe: string;
  age: number;
  poids: number;
  taille: number;
  niveauActivite: string;
  tdee: number;
  caloriesCible: number;
  proteinesCibleG: number;
  glucidesCibleG: number;
  lipidesCibleG: number;
};

export type UpdateObjectifInput = {
  objectifIdentitaire: string;
  objectifCalorique: "perte" | "maintien" | "prise";
  tdee: number;
  caloriesCible: number;
  proteinesCibleG: number;
  glucidesCibleG: number;
  lipidesCibleG: number;
};

export type AddBodyCompInput = {
  date: string;
  poids?: number;
  masseGrassePct?: number;
  masseMusculaire?: number;
  graisseViscerale?: number;
  tauxHydrique?: number;
  masseOsseuse?: number;
};

export type SportEventInput = {
  nomEvent: string;
  typeEvent: string;
  date: string;
  distanceKm?: number;
  denivele?: number;
  tempsSecondes?: number;
  classement?: string;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      sexe: input.sexe,
      age: input.age,
      poids: input.poids,
      taille: input.taille,
      niveau_activite: input.niveauActivite,
      tdee: input.tdee,
      calories_cible: input.caloriesCible,
      proteines_cible_g: input.proteinesCibleG,
      glucides_cible_g: input.glucidesCibleG,
      lipides_cible_g: input.lipidesCibleG,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return {};
}

// ─── Objectif ─────────────────────────────────────────────────────────────────

export async function updateObjectif(
  input: UpdateObjectifInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      objectif_identitaire: input.objectifIdentitaire,
      objectif_calorique: input.objectifCalorique,
      tdee: input.tdee,
      calories_cible: input.caloriesCible,
      proteines_cible_g: input.proteinesCibleG,
      glucides_cible_g: input.glucidesCibleG,
      lipides_cible_g: input.lipidesCibleG,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return {};
}

// ─── Body composition ─────────────────────────────────────────────────────────

export async function addBodyComposition(
  input: AddBodyCompInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("body_composition").upsert(
    {
      user_id: user.id,
      date: input.date,
      poids: input.poids ?? null,
      masse_grasse_pct: input.masseGrassePct ?? null,
      masse_musculaire: input.masseMusculaire ?? null,
      graisse_viscerale: input.graisseViscerale ?? null,
      taux_hydrique: input.tauxHydrique ?? null,
      masse_osseuse: input.masseOsseuse ?? null,
    },
    { onConflict: "user_id,date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/profil");
  return {};
}

// ─── Sport events ─────────────────────────────────────────────────────────────

export async function addSportEvent(
  input: SportEventInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("sport_events").insert({
    user_id: user.id,
    nom_event: input.nomEvent,
    type_event: input.typeEvent || null,
    date: input.date,
    distance_km: input.distanceKm ?? null,
    denivele: input.denivele ?? null,
    temps_secondes: input.tempsSecondes ?? null,
    classement: input.classement ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/profil");
  return {};
}

export async function deleteSportEvent(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("sport_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profil");
  return {};
}

// ─── Compte ───────────────────────────────────────────────────────────────────

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login");
}
