"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a default username or login
    // You can customize this based on your auth logic
    router.push("/login");
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Profile</h1>
      <p>Redirecting...</p>
    </div>
  );
}
