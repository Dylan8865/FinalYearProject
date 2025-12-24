import React, { useState, useTransition } from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandButton from "./AddIslandButton";
import { changePassword } from "@/features/auth/actions/changePassword";
import { useTheme } from "../../contexts/ThemeContext";

interface ChangePasswordContentProps {
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<string>>;
}

const ChangePasswordContent = ({
  setIsDialogOpen,
}: ChangePasswordContentProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleChangeConfirmPassword = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      const result = await changePassword(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Password changed successfully");
        setTimeout(() => {
          setIsDialogOpen?.("");
        }, 1500);
      }
    });
  };

  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <form className="flex w-[300px] flex-col gap-6" onSubmit={handleSubmit}>
        <div className="text-center">
          <h2
            className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}
          >
            Enter Your New Password Below
          </h2>
        </div>

        <div className="space-y-4">
          <AddIslandInput
            id="password"
            name="password"
            type="password"
            placeholder="New Password"
            color="#6d3f33"
            width="100%"
            value={password}
            handleChange={handleChangePassword}
            error={""}
          />

          <AddIslandInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            color="#6d3f33"
            width="100%"
            value={confirmPassword}
            handleChange={handleChangeConfirmPassword}
            error={""}
          />

          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-center text-xs text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-500/50 bg-green-500/10 p-2 text-center text-xs text-green-500">
              {success}
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
              {isPending ? "Changing..." : "Change"}
            </AddIslandButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordContent;
