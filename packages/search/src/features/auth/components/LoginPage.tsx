"use client";

import { useState, useTransition } from "react";
import { login } from "../actions/login";
import WILogo from "@/icons/WILogo";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E20] p-0 sm:bg-[#18181A]">
      <div className="-ms-overflow-style-none scrollbar-none max-h-screen w-full max-w-md overflow-auto border-none bg-[#1E1E20] p-4 sm:rounded-lg sm:border sm:border-[#3B3B3B] sm:p-6 sm:shadow-md [&::-webkit-scrollbar]:hidden">
        <div className="mb-6 text-left">
          <WILogo className="mb-3 h-8 w-8 text-teal-400" />
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            Sign in to Wisdom Search
          </h1>
          <p className="mt-1 text-[10px] font-normal text-[#5D5D5D] sm:text-xs">
            Save your search history
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
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-teal-500 focus:outline-none disabled:opacity-50"
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
              className="w-full rounded-md border border-[#3B3B3B] bg-[#18181A] p-1.5 text-[12px] font-normal text-white placeholder-[#5D5D5D] placeholder:text-[12px] focus:border-teal-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-teal-600 p-1.5 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Continue"}
          </button>

          <div className="mt-4 flex justify-center">
            <p className="text-[12px] text-[#5D5D5D]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-teal-500 visited:text-teal-500 hover:underline"
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
