import React from "react";
import LoginPage from "@/features/auth/components/LoginPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Login = async () => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase
      .from("profile")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      redirect("/island");
    }
  }

  return <LoginPage />;
};

export default Login;
