"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile?.type === "island") {
      await supabase
        .from("profile")
        .update({ last_login_time: new Date().toISOString() })
        .eq("id", data.user.id);

      redirect("/island");
    } else {
      // Sign out since the user was technically authenticated via signInWithPassword
      await supabase.auth.signOut();
      return {
        error:
          "This account is not registered as an island account. Please register an island account or use the correct account type.",
      };
    }
  }
}
