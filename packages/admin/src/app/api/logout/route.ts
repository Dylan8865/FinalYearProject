import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  
  // Sign out from Supabase (this will clear auth cookies)
  await supabase.auth.signOut();
  
  // Manually clear any remaining Supabase cookies to ensure clean logout
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Clear all Supabase-related cookies and session tracking
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith('sb-') || cookie.name === 'admin_last_activity') {
      cookieStore.delete(cookie.name);
    }
  });
  
  return NextResponse.json({ success: true });
}