import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DayView from "./_components/DayView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Repas" };

export default async function RepasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [profileRes, mealsRes, nutritionRes, productsRes, templatesRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("calories_cible, proteines_cible_g, glucides_cible_g, lipides_cible_g")
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("meals")
        .select(
          "id, type_repas, meal_items(id, quantite_g, calories, proteines, glucides, lipides, nom_aliment, product:products(nom))"
        )
        .eq("user_id", user.id)
        .eq("date", today),

      supabase
        .from("daily_nutrition")
        .select("total_calories, total_proteines, total_glucides, total_lipides")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),

      supabase
        .from("products")
        .select("id, nom, marque, calories_100g, proteines_100g, glucides_100g, lipides_100g")
        .eq("user_id", user.id)
        .order("nom", { ascending: true }),

      supabase
        .from("meal_templates")
        .select(
          "id, nom, type_repas, meal_template_items(id, nom_aliment, quantite_g, calories, proteines, glucides, lipides, product_id, generic_food_key)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meals = (mealsRes.data ?? []).map((m: any) => ({
    id: m.id,
    type_repas: m.type_repas,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (m.meal_items ?? []).map((item: any) => ({
      id: item.id,
      quantite_g: Number(item.quantite_g),
      calories:  item.calories  != null ? Number(item.calories)  : null,
      proteines: item.proteines != null ? Number(item.proteines) : null,
      glucides:  item.glucides  != null ? Number(item.glucides)  : null,
      lipides:   item.lipides   != null ? Number(item.lipides)   : null,
      product:      item.product ?? null,
      nom_aliment:  item.nom_aliment ?? null,
    })),
  }));

  const nutrition = nutritionRes.data ?? {
    total_calories: 0,
    total_proteines: 0,
    total_glucides: 0,
    total_lipides: 0,
  };

  return (
    <DayView
      date={today}
      meals={meals}
      products={productsRes.data ?? []}
      nutrition={nutrition}
      profile={profileRes.data ?? null}
      templates={templatesRes.data ?? []}
    />
  );
}
