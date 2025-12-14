"use client";

import WILogo from "@/features/login/icons/WILogo";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  username: string;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call the correct logout API endpoint
      const response = await fetch("/api/logout", { 
        method: "POST",
        credentials: "same-origin" // Ensure cookies are sent
      });
      
      if (response.ok) {
        // Redirect to login after successful logout
        router.push("/login");
        router.refresh(); // Force a refresh to clear any cached data
      }
    } catch (error) {
      // Still redirect even if there's an error
      router.push("/login");
    }
  };

  return (
    <header className="bg-[#1E1E1E] px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline cursor-pointer" onClick={() => router.push("/dashboard")}>
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