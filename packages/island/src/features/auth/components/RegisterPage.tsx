"use client";

import { useState, useTransition } from "react";
import { register } from "../actions/register";
import { signInWithOAuth } from "../actions/oauth";
import GoogleIcon from "@/features/shared/icons/GoogleIcon";
import AppleIcon from "@/features/shared/icons/AppleIcon";
import FacebookIcon from "@/features/shared/icons/FacebookIcon";
import Link from "next/link";
import IslandIcon from "@/features/shared/icons/IslandIcon";

const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await register(formData);

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleOAuthSignIn = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    setError(null);
    startTransition(async () => {
      const result = await signInWithOAuth(provider);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E20] p-0 sm:bg-[#18181A]">
      <div className="-ms-overflow-style-none scrollbar-none max-h-screen w-full max-w-md overflow-auto border-none bg-[#1E1E20] p-4 sm:rounded-lg sm:border sm:border-[#3B3B3B] sm:p-6 sm:shadow-md [&::-webkit-scrollbar]:hidden">
        <div className="mb-6 text-left">
          <IslandIcon className="mb-3 h-8 w-8 text-white" />
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            Sign up to Wisdom Island
          </h1>
          <p className="mt-1 text-[10px] font-normal text-[#5D5D5D] sm:text-xs">
            Start sharing your knowledge
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 p-3">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-1 block text-[12px] text-white">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              disabled={isPending}
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-[12px] text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={isPending}
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-[12px] text-white"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-[12px] text-white"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              disabled={isPending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Confirm your password"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mb-3 w-full rounded-md bg-[#6D3F33] p-1.5 text-white hover:bg-[#5A2E29] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Creating account..." : "Continue"}
          </button>

          <div className="flex items-center">
            <hr className="flex-grow border-t border-[#3B3B3B]" />
            <span className="mx-2 text-sm text-[#5D5D5D] sm:mx-3">or</span>
            <hr className="flex-grow border-t border-[#3B3B3B]" />
          </div>

          <div className="mt-3 flex justify-between space-x-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center rounded-md border border-[#3B3B3B] bg-[#282828] p-2 hover:bg-[#18181A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center rounded-md border border-[#3B3B3B] bg-[#282828] p-2 hover:bg-[#18181A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppleIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center rounded-md border border-[#3B3B3B] bg-[#282828] p-2 hover:bg-[#18181A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FacebookIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex justify-center">
            <p className="text-[12px] text-[#5D5D5D]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#6D3F33] visited:text-[#6D3F33] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
