import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/island";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existingProfile } = await supabase
        .from("profile")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profile").insert({
          id: data.user.id,
          name:
            data.user.user_metadata.name ||
            data.user.user_metadata.full_name ||
            "User",
          email: data.user.email || "",
          last_login_time: new Date().toISOString(),
          oxygen: 100,
          level: 1,
          type: "user",
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      } else {
        await supabase
          .from("profile")
          .update({ last_login_time: new Date().toISOString() })
          .eq("id", data.user.id);
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
