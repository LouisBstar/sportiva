"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MealType } from "./meals";

export type TemplateItemInput = {
  nom: string;
  quantite_g: number;
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  productId?: string;
  genericKey?: string;
};

// ─── Sauvegarder un template ──────────────────────────────────────────────────

export async function saveMealTemplate(
  nom: string,
  typeRepas: MealType,
  items: TemplateItemInput[]
): Promise<{ id?: string; error?: string }> {
  if (!nom.trim() || !items.length) return { error: "Données manquantes" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: template, error: tErr } = await supabase
    .from("meal_templates")
    .insert({ user_id: user.id, nom: nom.trim(), type_repas: typeRepas })
    .select("id")
    .single();

  if (tErr) return { error: tErr.message };

  const rows = items.map((item) => ({
    template_id: template.id,
    nom_aliment: item.nom,
    quantite_g: item.quantite_g,
    calories: item.calories,
    proteines: item.proteines,
    glucides: item.glucides,
    lipides: item.lipides,
    product_id: item.productId ?? null,
    generic_food_key: item.genericKey ?? null,
  }));

  const { error: iErr } = await supabase.from("meal_template_items").insert(rows);
  if (iErr) return { error: iErr.message };

  revalidatePath("/repas");
  return { id: template.id };
}

// ─── Supprimer un template ────────────────────────────────────────────────────

export async function deleteMealTemplate(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase.from("meal_templates").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/repas");
  return {};
}
