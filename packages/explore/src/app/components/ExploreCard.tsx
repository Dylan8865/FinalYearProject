"use client";
import { useRouter } from "next/navigation";
import React from "react";

type ExploreCardProps = {
  id: string;
  title: string;
  description: string;
};

const ExploreCard = ({ id, title, description }: ExploreCardProps) => {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(`/world/${id}`)}
      className="group relative rounded-xl h-44 bg-gradient-to-b from-[#8EC8FF] to-[#D8ECFF] shadow-md overflow-hidden cursor-pointer transform-gpu transition duration-200 hover:scale-105"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1" />

        <div className="p-3 bg-white/20 backdrop-blur-sm">
          <p className="text-black font-medium text-sm">{title}</p>
          <p className="text-black/70 text-xs">{description}</p>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
    </article>
  );
};

export default ExploreCard;
