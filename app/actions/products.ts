"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ProductInput = {
  nom: string;
  marque?: string;
  codeBarre?: string;
  calories100g: number;
  proteines100g: number;
  glucides100g: number;
  lipides100g: number;
  fibres100g?: number;
  nutriScore?: string;
  alertes?: Array<{ type: string; label: string }>;
  source: "manual" | "openfoodfacts" | "ocr";
};

export async function saveProduct(
  data: ProductInput
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase.from("products").insert({
    user_id: user.id,
    nom: data.nom,
    marque: data.marque ?? null,
    code_barres: data.codeBarre ?? null,
    calories_100g: data.calories100g,
    proteines_100g: data.proteines100g,
    glucides_100g: data.glucides100g,
    lipides_100g: data.lipides100g,
    fibres_100g: data.fibres100g ?? null,
    nutri_score: data.nutriScore ? data.nutriScore.toUpperCase() : null,
    alertes: data.alertes ?? [],
    source: data.source,
  });

  if (error) return { error: error.message };
  return {};
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  redirect("/produits");
}
