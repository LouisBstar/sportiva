import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductList from "./_components/ProductList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes produits" };

export default async function ProduitsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("id, nom, marque, calories_100g, nutri_score, alertes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ProductList products={products ?? []} />;
}
