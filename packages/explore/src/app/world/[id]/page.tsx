import { createClient } from "@/supabase/server";
import React from "react";

type Params = {
  params: { id: string };
};

const WorldPage = async ({ params }: Params) => {
  const supabase = await createClient();
  const { id } = params;

  const { data: world } = await supabase
    .from("worlds")
    .select("*")
    .eq("id", id)
    .single();

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
        <p>World not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-8 py-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold">{world.title}</h1>
        <p className="text-gray-300 mt-2">{world.description}</p>
      </header>

      {/* Content placeholder */}
      <div className="bg-neutral-900 rounded-xl p-6 h-96 flex items-center justify-center">
        <p className="text-gray-400">World content goes here...</p>
      </div>
    </div>
  );
};

export default WorldPage;
