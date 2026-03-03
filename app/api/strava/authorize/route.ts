import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${appUrl}/api/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  return NextResponse.redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`
  );
}
