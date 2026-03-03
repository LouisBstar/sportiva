"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MealType =
  | "petit-dejeuner"
  | "dejeuner"
  | "collation"
  | "diner";

/**
 * Get or create a meal for today with the given type.
 * Returns the meal id.
 */
export async function getOrCreateMeal(
  date: string,
  typeRepas: MealType
): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // Look for existing meal today
  const { data: existing } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("type_repas", typeRepas)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("meals")
    .insert({ user_id: user.id, date, type_repas: typeRepas })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: created.id };
}

export type AddItemInput = {
  mealId: string;
  productId: string;
  quantiteG: number;
  // denormalized macros (per 100g, we calc here)
  calories100g: number | null;
  proteines100g: number | null;
  glucides100g: number | null;
  lipides100g: number | null;
};

export async function addMealItem(
  input: AddItemInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const ratio = input.quantiteG / 100;
  const calories = input.calories100g != null ? input.calories100g * ratio : null;
  const proteines = input.proteines100g != null ? input.proteines100g * ratio : null;
  const glucides = input.glucides100g != null ? input.glucides100g * ratio : null;
  const lipides = input.lipides100g != null ? input.lipides100g * ratio : null;

  const { error } = await supabase.from("meal_items").insert({
    meal_id: input.mealId,
    product_id: input.productId,
    quantite_g: input.quantiteG,
    calories,
    proteines,
    glucides,
    lipides,
  });

  if (error) return { error: error.message };

  revalidatePath("/repas");
  revalidatePath("/dashboard");
  return {};
}

export async function removeMealItem(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("meal_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/repas");
  revalidatePath("/dashboard");
  return {};
}
