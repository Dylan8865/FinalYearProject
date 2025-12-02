import React from "react";
import RegisterPage from "@/features/auth/components/RegisterPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Register = async () => {
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

  return <RegisterPage />;
};

export default Register;
