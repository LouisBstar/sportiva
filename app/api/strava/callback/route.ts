import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/profil?strava_error=access_denied`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/profil?strava_error=token_exchange`);
  }

  const tokens = await tokenRes.json();

  // Upsert tokens for this user
  const { error: dbError } = await supabase.from("strava_tokens").upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
    },
    { onConflict: "user_id" }
  );

  if (dbError) {
    return NextResponse.redirect(`${appUrl}/profil?strava_error=db`);
  }

  return NextResponse.redirect(`${appUrl}/sport?strava_connected=1`);
}
