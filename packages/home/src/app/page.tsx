"use client";

import React from "react";

const HomePage = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200">
      <h1 className="text-4xl font-bold text-white mb-4">Welcome to Wisdom Island</h1>
      <p className="text-lg text-white/80 mb-8">Your gamified knowledge sharing platform</p>
      <div className="flex gap-4">
        <a
          href="http://localhost:3004"
          className="px-6 py-3 bg-white rounded-lg text-sky-600 font-semibold hover:bg-sky-50 transition-colors"
        >
          Go to Island
        </a>
        <a
          href="http://localhost:3002"
          className="px-6 py-3 bg-sky-600 rounded-lg text-white font-semibold hover:bg-sky-700 transition-colors"
        >
          Explore Cloud
        </a>
        <a
          href="http://localhost:3005"
          className="px-6 py-3 bg-gray-800 rounded-lg text-white font-semibold hover:bg-gray-700 transition-colors"
        >
          Search
        </a>
      </div>
    </div>
  );
};

export default HomePage;
