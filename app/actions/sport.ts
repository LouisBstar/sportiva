"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActivityInput = {
  typeActivite: string;
  description?: string;
  dureeMin: number;
  intensite: "faible" | "modérée" | "élevée";
  caloriesBrulees: number;
};

export async function addActivity(
  input: ActivityInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("activities").insert({
    user_id: user.id,
    date: today,
    source: "manuel",
    type_activite: input.typeActivite,
    description: input.description || null,
    duree_min: input.dureeMin,
    intensite: input.intensite,
    calories_brulees: input.caloriesBrulees,
  });

  if (error) return { error: error.message };

  revalidatePath("/sport");
  revalidatePath("/dashboard");
  return {};
}

export async function updateActivityCalories(
  id: string,
  calories: number
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("activities")
    .update({ calories_brulees: calories, modifie_manuellement: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/sport");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteActivity(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/sport");
  revalidatePath("/dashboard");
  return {};
}
