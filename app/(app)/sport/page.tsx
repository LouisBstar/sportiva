import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SportView from "./_components/SportView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sport" };

export default async function SportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Start of current ISO week (Monday)
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekStart = monday.toISOString().split("T")[0];

  const [activitiesRes, profileRes, stravaRes] = await Promise.all([
    supabase
      .from("activities")
      .select(
        "id, date, source, type_activite, description, duree_min, distance_km, denivele, intensite, fc_moyenne, fc_max, calories_brulees, modifie_manuellement"
      )
      .eq("user_id", user.id)
      .gte("date", weekStart)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("poids")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("strava_tokens")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <SportView
      today={todayStr}
      activities={activitiesRes.data ?? []}
      poidsKg={Number(profileRes.data?.poids ?? 70)}
      stravaConnected={!!stravaRes.data}
    />
  );
}
