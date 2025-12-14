"use client";

import { SearchResult } from "@/types/types";
import Link from "next/link";

interface ResultCardProps {
  result: SearchResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <Link
      href={result.url}
      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-blue-600">{result.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{result.description}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
          {result.type}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-400">{result.url}</div>
    </Link>
  );
}
