import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Upsert profile to ensure type is set to "non-island"
      // (in case a trigger already created the profile)
      const { error: profileError } = await supabase
        .from("profile")
        .upsert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
          email: data.user.email,
          last_login_time: new Date().toISOString(),
          type: "non-island",
        }, {
          onConflict: "id",
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
