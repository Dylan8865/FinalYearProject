import { updateSession } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (user) {
    const { data: profile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.type !== "island") {
      const url = new URL("/login", request.url);

      const newResponse = NextResponse.redirect(url);

      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
          newResponse.cookies.set({
            name: cookie.name,
            value: "",
            maxAge: -1,
          });
        }
      });

      return newResponse;
    }
  }

  if (request.nextUrl.searchParams.get("error") === "no_profile") {
    const cookiesToDelete = request.cookies.getAll();
    const newResponse = NextResponse.redirect(new URL("/login", request.url));

    cookiesToDelete.forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        newResponse.cookies.set({
          name: cookie.name,
          value: "",
          maxAge: -1,
        });
      }
    });

    return newResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|^/$|^/login$|^/register$|^/auth/callback$).*)",
  ],
};
