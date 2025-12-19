"use client";

import Link from "next/link";

type Props = {
  id: string;
  title: string;
  description: string;
  lastUpdatedBy?: string;
};

const ExploreCard = ({
  id,
  title,
  description,
  lastUpdatedBy = "No data",
}: Props) => {
  return (
    <Link href={`/world/${id}`}>
      <div
        className="
          group cursor-pointer
          transition-transform duration-200 ease-out
          hover:scale-[1.02]
        "
      >
        {/* Image placeholder */}
        <div className="relative h-40 w-full rounded-2xl bg-gradient-to-b from-sky-400 to-white/90 mb-3 overflow-hidden">
          {/* Hover info (ONLY inside image area, no layout change) */}
          <div
            className="
              absolute inset-0
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              flex flex-col justify-between
              p-3
            "
          >
            <div>
              <p className="text-[11px] font-semibold text-black mb-1">
                Content
              </p>
              <p className="text-xs text-black leading-snug line-clamp-4">
                {description || "No genre available"}
              </p>
            </div>

            <div className="pt-2 border-t border-black/10">
              <p className="text-[11px] text-black/60">
                Last updated by
              </p>
              <p className="text-xs text-black font-medium">
                {lastUpdatedBy}
              </p>
            </div>
          </div>
        </div>

        {/* Title (位置完全不变) */}
        <h3 className="text-sm text-gray-200 group-hover:text-white transition">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default ExploreCard;
