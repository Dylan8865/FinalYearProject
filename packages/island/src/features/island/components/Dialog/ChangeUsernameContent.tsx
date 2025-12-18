import React, { useState } from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandButton from "./AddIslandButton";
import { useProfile } from "../../hooks/useProfile";

interface ChangeUsernameContentProps {
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<string>>;
  onOptimisticUpdate?: (newName: string) => void;
}

const ChangeUsernameContent = ({
  setIsDialogOpen,
  onOptimisticUpdate,
}: ChangeUsernameContentProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const { updateProfile, isPending, error: apiError } = useProfile();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    // Optimistic Update
    onOptimisticUpdate?.(username);
    setIsDialogOpen?.("");

    // Background Update
    updateProfile({ name: username }).catch((err) => {
      console.error("Background update failed:", err);
      // Ideally we would revert here, but for now we prioritized speed
    });
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <form
        className="flex w-[300px] flex-col gap-6 pb-20"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold text-white">
          Enter Your New Username
        </h2>
        <div className="space-y-4">
          <AddIslandInput
            id="username"
            name="username"
            type="text"
            placeholder="New Username"
            color="#6d3f33"
            width="100%"
            value={username}
            handleChange={handleChange}
            error={error}
          />

          {apiError && (
            <div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-center text-xs text-red-500">
              {apiError}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsDialogOpen?.("")}
            className="flex-1 rounded-md border border-[#5a5a5a] bg-transparent py-2 text-sm font-semibold text-gray-300 hover:bg-[#3a3a3a] hover:text-white"
            disabled={isPending}
          >
            Cancel
          </button>
          <div className="flex-1">
            <AddIslandButton color="#6d3f33" width="100%" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </AddIslandButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangeUsernameContent;
