import { createClient } from "@/supabase/server";
import React from "react";
import ExploreClient from "./components/ExploreClient";

const Home = async () => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isSignedIn = !!session;

  const { data: worlds } = await supabase
    .from("worlds")
    .select("id, title, description")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#141414] text-white px-8 py-8">
      {/* Header / Navigation */}
      <header className="flex items-center justify-between mb-10">
        <nav className="flex gap-8 items-center text-lg">
          <a className="hover:text-neutral-300 cursor-pointer">Search</a>
          <a className="hover:text-neutral-300 cursor-pointer">Cloud</a>
          <a className="font-semibold underline underline-offset-4 cursor-pointer">
            Explorer
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <button className="px-5 py-2 bg-white/8 border border-white/10 rounded-full">
              Account
            </button>
          ) : (
            <button className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full">
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* 👇 下面整块交给 Client（UI 完全一样） */}
      <ExploreClient worlds={worlds ?? []} />

      <div className="h-20" />
    </div>
  );
};

export default Home;
