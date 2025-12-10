import { createClient } from "@/supabase/server";
import React from "react";

type Props = {};

const Home = async (props: Props) => {

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isSignedIn = !!session;

  return (
    <div className="min-h-screen bg-[#141414] text-white px-8 py-8">
      {/* Header / Navigation */}
      <header className="flex items-center justify-between mb-10">
        <nav className="flex gap-8 items-center text-lg">
          <a className="hover:text-neutral-300 cursor-pointer">Search</a>
          <a className="hover:text-neutral-300 cursor-pointer">Cloud</a>
          {/*Explorer */}
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

      {/* Search bar (UI only — server component can't do client interactivity) */}
      <div className="max-w-3xl mb-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-60"
            >
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <input
            aria-label="Search for knowledge"
            placeholder="Search for knowledge"
            className="w-full bg-white/6 border border-white/8 rounded-full py-3 pl-12 pr-4 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/8 rounded-full hover:bg-white/10">
          {/* filter icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Category Filter
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/8 rounded-full hover:bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Sort By
        </button>
      </div>

      {/* Section Title */}
      <h2 className="text-lg font-semibold mb-4">Recently added</h2>

      {/* Card Grid（UI-first） */}
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, idx) => (
          <article
            key={idx}
            className="rounded-xl h-40 bg-gradient-to-b from-[#8EC8FF] to-[#D8ECFF] shadow-md overflow-hidden transform-gpu transition-transform duration-200 hover:scale-105 cursor-pointer"
            // next/link
          >
            <div className="flex flex-col h-full">
              {/*  <img />） */}
              <div className="flex-1" />

              {/* meta */}
              <div className="p-3 bg-white/10">
                <p className="text-black text-sm">Lorem ipsum</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="h-20" />
    </div>
  );
};

export default Home;
