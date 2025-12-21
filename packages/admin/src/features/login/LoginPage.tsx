"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { login, oAuthLogin } from "@/actions/login";
import WILogo from "@/features/login/icons/IslandIcon";
import GoogleLogo from "@/features/login/icons/GoogleIcon";

const LoginPage = ({ error: serverError }: { error?: string }) => {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(serverError || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (serverError) {
      setError(serverError);
      return;
    }

    const errorParam = searchParams.get("error");
    const typeParam = searchParams.get("type");
    
    if (errorParam === "not_admin") {
      setError(`Access denied. Admin privileges required. Your type: ${typeParam || "unknown"}`);
    } else if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    } else if (errorParam === "profile_not_found") {
      setError("Profile not found in database. Contact administrator.");
    }
  }, [searchParams, serverError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleOAuthLogin = async (provider: "google") => {
    setError(null);
    setIsSubmitting(true);
    
    const result = await oAuthLogin(provider);
    
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E1E20] sm:bg-[#18181A] p-0">
      <div className="w-full max-w-md bg-[#1E1E20] sm:rounded-lg sm:shadow-md border-none sm:border sm:border-[#3B3B3B] p-4 sm:p-6 max-h-screen overflow-auto [&::-webkit-scrollbar]:hidden -ms-overflow-style-none scrollbar-none">
        <div className="mb-6 text-left">
          <WILogo className="w-8 h-8 text-white mb-3" />
          <h1 className="text-lg sm:text-xl font-semibold text-white">
            Sign In
          </h1>
          <p className="text-[10px] sm:text-xs font-normal text-[#5D5D5D] mt-1">
            Access the admin dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="text-[12px] text-white mb-1 block"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-[12px] text-white mb-1 block"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6D3F33] hover:bg-[#5A2E29] text-white rounded-md p-1.5 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>

          <div className="flex items-center">
            <hr className="flex-grow border-t border-[#3B3B3B]" />
            <span className="mx-2 sm:mx-3 text-[#5D5D5D] text-sm">or</span>
            <hr className="flex-grow border-t border-[#3B3B3B]" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={isSubmitting}
            className="w-full bg-[#282828] border border-[#3B3B3B] rounded-md p-2 flex items-center justify-center hover:bg-[#18181A] disabled:opacity-50"
          >
            <GoogleLogo className="w-4 h-4" />
            <span className="ml-2 text-white text-xs">Continue with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;