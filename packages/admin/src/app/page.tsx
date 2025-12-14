"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import WILogo from "@/features/login/icons/WILogo";

const AdminHome = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    const code = searchParams.get("code");
    
    if (code) {
      router.push(`/auth/callback?code=${code}`);
      return;
    }
    
    router.push("/login");
  }, [router, searchParams]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E20]">
      <div className="flex flex-col items-center space-y-4">
        <WILogo className="w-12 h-12 text-white animate-pulse" />
        <p className="text-sm text-[#5D5D5D]">Loading...</p>
      </div>
    </div>
  );
};

export default AdminHome;