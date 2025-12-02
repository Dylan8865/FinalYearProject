"use client";

import { useState, useTransition } from "react";
import { login } from "../actions/login";
import { signInWithOAuth } from "../actions/oauth";
import WILogo from "@/icons/WILogo";
import GoogleLogo from "@/icons/GoogleLogo";
import AppleLogo from "@/icons/AppleLogo";
import FBLogo from "@/icons/FBLogo";
import Link from "next/link";

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await login(new FormData(e.currentTarget));
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
          <WILogo className="mb-3 h-8 w-8 text-white" />
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            Sign in to Wisdom Island
          </h1>
          <p className="mt-1 text-[10px] font-normal text-[#5D5D5D] sm:text-xs">
            Welcome back
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 p-3">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
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
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mb-3 w-full rounded-md bg-[#6D3F33] p-1.5 text-white hover:bg-[#5A2E29] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Continue"}
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
              <GoogleLogo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center rounded-md border border-[#3B3B3B] bg-[#282828] p-2 hover:bg-[#18181A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppleLogo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center rounded-md border border-[#3B3B3B] bg-[#282828] p-2 hover:bg-[#18181A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FBLogo className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex justify-center">
            <p className="text-[12px] text-[#5D5D5D]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-[#6D3F33] visited:text-[#6D3F33] hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
