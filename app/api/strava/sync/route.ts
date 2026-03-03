import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidStravaToken, normalizeStravaType } from "@/lib/strava";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const token = await getValidStravaToken(supabase, user.id);
  if (!token) {
    return NextResponse.json({ error: "Strava non connecté" }, { status: 400 });
  }

  // Fetch activities from the last 30 days
  const after = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Erreur Strava API (${res.status})` },
      { status: 502 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stravaActivities: any[] = await res.json();

  if (!stravaActivities.length) {
    return NextResponse.json({ count: 0 });
  }

  const toUpsert = stravaActivities.map((a) => ({
    user_id: user.id,
    strava_id: String(a.id),
    source: "strava",
    date: (a.start_date_local as string).split("T")[0],
    type_activite: normalizeStravaType(a.sport_type ?? a.type),
    description: a.name ?? null,
    duree_min: Math.round((a.elapsed_time ?? 0) / 60),
    distance_km: a.distance ? Number((a.distance / 1000).toFixed(3)) : null,
    denivele: a.total_elevation_gain != null
      ? Math.round(a.total_elevation_gain)
      : null,
    calories_brulees: a.calories ?? null,
    fc_moyenne: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    fc_max: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    modifie_manuellement: false,
  }));

  // ignoreDuplicates: true preserves any manual edits (calories etc.)
  const { error: upsertError } = await supabase
    .from("activities")
    .upsert(toUpsert, { onConflict: "strava_id", ignoreDuplicates: true });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ count: toUpsert.length });
}
