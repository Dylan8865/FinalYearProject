import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Session-only cookies: no maxAge or expires means they expire on browser close
              cookieStore.set(name, value, {
                ...options,
                maxAge: undefined,
                expires: undefined,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: false, // Supabase needs client-side access
              });
            });
          } catch {
            // Cookie setting can fail in middleware/edge runtime
          }
        },
      },
    }
  );
}