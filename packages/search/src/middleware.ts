import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = ["/analytics"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Try to refresh the session
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Only handle auth errors for protected routes or if there are invalid tokens
    if (error) {
      // If error is "Auth session missing", just clear cookies silently
      if (error.message === "Auth session missing!") {
        // Clear invalid cookies without redirecting for public routes
        if (!isProtectedRoute) {
          const response = NextResponse.next({ request });
          const cookiesToClear = request.cookies.getAll();
          
          cookiesToClear.forEach((cookie) => {
            if (cookie.name.startsWith("sb-")) {
              response.cookies.delete(cookie.name);
            }
          });
          
          return response;
        }
      }
      
      // For protected routes or other auth errors, redirect to login
      if (isProtectedRoute) {
        const response = NextResponse.redirect(
          new URL("/login?error=session_expired", request.url)
        );
        const cookiesToClear = request.cookies.getAll();
        
        cookiesToClear.forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            response.cookies.delete(cookie.name);
          }
        });
        
        return response;
      }
    }

    // Redirect authenticated users away from login/register pages
    if (user && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/search", request.url));
    }

    // Require authentication for protected routes
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    console.error("Middleware auth error:", error);
    // On any error, allow public routes but redirect protected routes
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
