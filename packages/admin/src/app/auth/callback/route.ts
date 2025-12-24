import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not_admin`);
    }

    if (!profile.type || profile.type.trim().toLowerCase() !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not_admin`);
    }

    // Update last login time
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const { error: updateError } = await supabase
      .from("profile")
      .update({ last_login_time: now })
      .eq("id", user.id);

    if (updateError) {
      // Don't fail the login for this error
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}