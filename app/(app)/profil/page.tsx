import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PersonalInfoSection  from "./_components/PersonalInfoSection";
import ObjectifSection      from "./_components/ObjectifSection";
import BodyCompositionSection from "./_components/BodyCompositionSection";
import StravaSection        from "./_components/StravaSection";
import SportEventsSection   from "./_components/SportEventsSection";
import CompteSection        from "./_components/CompteSection";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, stravaRes, bodyRes, eventsRes, lastStravaRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "sexe, age, poids, taille, niveau_activite, tdee, objectif_poids, motivations, objectif_calorique, calories_cible, proteines_cible_g, glucides_cible_g, lipides_cible_g"
        )
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("strava_tokens")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),

      // Last 4 body composition entries (desc) for display + sparkline
      supabase
        .from("body_composition")
        .select(
          "id, date, poids, masse_grasse_pct, masse_musculaire, graisse_viscerale, taux_hydrique, masse_osseuse"
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(12),

      supabase
        .from("sport_events")
        .select(
          "id, nom_event, type_event, date, distance_km, denivele, temps_secondes, classement"
        )
        .eq("user_id", user.id)
        .order("date", { ascending: true }),

      // Date of the most recent Strava-sourced activity
      supabase
        .from("activities")
        .select("date")
        .eq("user_id", user.id)
        .eq("source", "strava")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const profile       = profileRes.data;
  const stravaConnected = !!stravaRes.data;
  const bodyHistory   = (bodyRes.data ?? []).slice().reverse(); // asc for sparkline
  const lastMeasure   = bodyRes.data?.[0] ?? null;
  const sportEvents   = eventsRes.data ?? [];
  const lastSyncDate  = lastStravaRes.data?.date ?? null;
  const email         = user.email ?? "";
  const initials      = email.slice(0, 2).toUpperCase();

  return (
    <div className="bg-gray-50 min-h-screen px-4 pt-6 pb-28">
      {/* Avatar header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
          <span className="text-white text-lg font-bold">{initials}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Mon profil
          </p>
          <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">
            {email}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Informations personnelles */}
        <PersonalInfoSection profile={profile ?? {
          sexe: null, age: null, poids: null, taille: null,
          niveau_activite: null, tdee: null, calories_cible: null,
          objectif_calorique: null,
          proteines_cible_g: null, glucides_cible_g: null, lipides_cible_g: null,
        }} />

        {/* 2. Objectif */}
        <ObjectifSection profile={profile ?? {
          sexe: null, poids: null, taille: null, tdee: null,
          objectif_poids: null, motivations: null, objectif_calorique: null,
          calories_cible: null, proteines_cible_g: null,
          glucides_cible_g: null, lipides_cible_g: null,
        }} />

        {/* 3. Composition corporelle */}
        <BodyCompositionSection
          lastMeasure={lastMeasure}
          history={bodyHistory}
        />

        {/* 4. Connexions */}
        <StravaSection
          stravaConnected={stravaConnected}
          lastSyncDate={lastSyncDate}
        />

        {/* 5. Events sportifs */}
        <SportEventsSection events={sportEvents} />

        {/* 6. Compte */}
        <CompteSection email={email} />
      </div>
    </div>
  );
}
