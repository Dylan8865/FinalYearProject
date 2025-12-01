"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AdminHome = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/login");
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div>Redirecting to login...</div>
    </div>
  );
};

export default AdminHome;
