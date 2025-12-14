"use client";

import WILogo from "@/features/login/icons/WILogo";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  username: string;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="bg-[#1E1E1E] px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline">
          <WILogo className="w-8 h-8 text-white" />
          <span className="text-white text-sm font-semibold leading-none">Admin</span>
        </div>

        <button
          onClick={handleSignOut}
          className="bg-[#282828] hover:bg-[#1E1E1E] text-white px-8 py-1.5 rounded-full border border-[#3B3B3B] border-2 text-sm font-small transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}