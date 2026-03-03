// Strava OAuth2 helpers — used by API routes and Server Actions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getValidStravaToken(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  // Token still valid (5-minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (data.expires_at > now + 300) return data.access_token;

  // Refresh
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: data.refresh_token,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();

  await supabase
    .from("strava_tokens")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
    })
    .eq("user_id", userId);

  return tokens.access_token;
}

const STRAVA_TYPE_MAP: Record<string, string> = {
  Run:               "course",
  TrailRun:          "course",
  Ride:              "vélo",
  MountainBikeRide:  "vélo",
  GravelRide:        "vélo",
  EBikeRide:         "vélo",
  Swim:              "natation",
  Walk:              "marche",
  Hike:              "marche",
  WeightTraining:    "musculation",
  Workout:           "calisthenics",
  Crossfit:          "calisthenics",
  Yoga:              "yoga",
  Rowing:            "aviron",
  Kayaking:          "kayak",
  Soccer:            "foot",
};

export function normalizeStravaType(type: string): string {
  return STRAVA_TYPE_MAP[type] ?? type.toLowerCase();
}
