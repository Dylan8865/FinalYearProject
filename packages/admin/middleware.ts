import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only protect dashboard and admin routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/user") ||
    request.nextUrl.pathname.startsWith("/knowledge") ||
    request.nextUrl.pathname.startsWith("/shop");

  if (!isProtectedRoute) {
    return response;
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Force session-only cookies
              maxAge: undefined,
              expires: undefined,
            });
          });
        },
      },
    }
  );

  // Quick auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  // Check inactivity timeout
  const lastActivity = request.cookies.get("admin_last_activity")?.value;
  const now = Date.now();

  if (lastActivity) {
    const timeSinceLastActivity = now - parseInt(lastActivity);
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      // Create redirect response and clear cookies
      const redirectResponse = NextResponse.redirect(new URL("/login?error=timeout", request.url));
      redirectResponse.cookies.delete("admin_last_activity");
      // Clear Supabase cookies
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          redirectResponse.cookies.delete(cookie.name);
        }
      });
      return redirectResponse;
    }
  }

  // Update last activity timestamp (middleware CAN set cookies)
  response.cookies.set("admin_last_activity", now.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: undefined, // Session cookie
  });

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/user/:path*", "/knowledge/:path*", "/shop/:path*"],
};
