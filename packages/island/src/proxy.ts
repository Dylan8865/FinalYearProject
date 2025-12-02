import { updateSession } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  if (request.nextUrl.searchParams.get("error") === "no_profile") {
    const cookiesToDelete = request.cookies.getAll();
    const newResponse = NextResponse.redirect(new URL("/login", request.url));

    cookiesToDelete.forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        newResponse.cookies.delete(cookie.name);
      }
    });

    return newResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|^/$|^/login$|^/register$|^/auth/callback$).*)",
  ],
};
