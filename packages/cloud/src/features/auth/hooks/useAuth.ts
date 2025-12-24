"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUserProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profile")
          .select("*")
          .eq("id", userId)
          .single();

        if (profile) {
          setUser(profile);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setLoading(false);
      }
    };

    // Get initial session and profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
