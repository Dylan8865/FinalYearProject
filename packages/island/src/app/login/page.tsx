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
    redirect("/island");
  }

  return <LoginPage />;
};

export default Login;
