import IslandPage from "@/features/island/components/IslandPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

const Island = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    redirect("/login?error=no_profile");
  }

  const { count: islandCount } = await supabase
    .from("island")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  await supabase
    .from("profile")
    .update({ last_login_time: new Date().toISOString() })
    .eq("id", user.id);

  const profileData = {
    id: profile.id,
    created_at: profile.created_at,
    name: profile.name,
    email: profile.email,
    last_login_time: profile.last_login_time,
    mana: profile.mana,
    level: profile.level,
    type: profile.type,
    no_of_islands: islandCount || 0,
  };

  return <IslandPage profile={profileData} />;
};

export default Island;
