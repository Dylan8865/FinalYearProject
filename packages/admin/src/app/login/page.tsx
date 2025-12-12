import React from "react";
import LoginPage from "@/features/auth/login/LoginPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Login = async () => {
  const supabase = await createClient();

  // Use getUser() instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user is admin before redirecting
    const { data: profile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", user.id)
      .single();

    if (profile && profile.type === "admin") {
      redirect("/dashboard");
    }
    // If user exists but is not admin, just show login page (they're already signed out from dashboard)
  }

  return <LoginPage />;
};

export default Login;