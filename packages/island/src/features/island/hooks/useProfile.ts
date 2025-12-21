import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileType } from "@/types/types";

export const useProfile = () => {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<ProfileType>) => {
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Refresh the page data without blocking the UI
      router.refresh();

      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsFetching(false);
    }
  };

  return {
    updateProfile,
    isPending: isFetching,
    error,
  };
};
