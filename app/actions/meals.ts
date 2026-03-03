"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MealType =
  | "petit-dejeuner"
  | "dejeuner"
  | "collation"
  | "diner";

// ─── Get or create meal ───────────────────────────────────────────────────────

export async function getOrCreateMeal(
  date: string,
  typeRepas: MealType
): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

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

// ─── Ajout groupé d'aliments (nouveau — gère produits perso ET génériques) ───

export type NewMealItem = {
  nom: string;               // nom d'affichage
  quantite_g: number;
  calories: number | null;   // déjà calculés pour quantite_g
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  productId?: string;        // si produit perso (sinon null → générique)
};

export async function addMealItems(
  date: string,
  typeRepas: MealType,
  items: NewMealItem[]
): Promise<{ error?: string }> {
  if (!items.length) return {};

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const mealResult = await getOrCreateMeal(date, typeRepas);
  if ("error" in mealResult) return { error: mealResult.error };

  const rows = items.map((item) => ({
    meal_id: mealResult.id,
    product_id: item.productId ?? null,
    nom_aliment: item.productId ? null : item.nom,
    quantite_g: item.quantite_g,
    calories: item.calories,
    proteines: item.proteines,
    glucides: item.glucides,
    lipides: item.lipides,
  }));

  const { error } = await supabase.from("meal_items").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/repas");
  revalidatePath("/dashboard");
  return {};
}

// ─── Suppression d'un aliment ─────────────────────────────────────────────────

export async function removeMealItem(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase.from("meal_items").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/repas");
  revalidatePath("/dashboard");
  return {};
}
