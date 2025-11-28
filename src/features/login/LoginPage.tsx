'use client'

import { useState } from 'react';
import { login } from '@/app/api/login/route';
import WILogo from "./icons/WILogo"; 
import GoogleLogo from "./icons/GoogleLogo";
import AppleLogo from "./icons/AppleLogo";
import FBLogo from "./icons/FBLogo";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400","600","700"] });

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

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
          <h1 className={`${inter.className} text-lg sm:text-xl font-semibold text-white`}>Sign in to Wisdom Island</h1>
          <p className={`${inter.className} text-[10px] sm:text-xs font-normal text-[#5D5D5D] mt-1`}>Welcome back</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md">
            <p className={`${inter.className} text-xs text-red-500`}>{error}</p>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className={`${inter.className} text-[12px] text-white mb-1 block`}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className={`${inter.className} text-[12px] text-white mb-1 block`}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${inter.className} w-full bg-[#6D3F33] hover:bg-[#5A2E29] text-white rounded-md p-1.5 mb-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
          Continue
          </button>
          
          <div className="flex items-center">
            <hr className="flex-grow border-t border-[#3B3B3B]" />
            <span className="mx-2 sm:mx-3 text-[#5D5D5D] text-sm">or</span>
            <hr className="flex-grow border-t border-[#3B3B3B]" />
          </div>

          <div className="flex justify-between mt-3 space-x-3">
            <button
              type="button"
              className="flex-1 bg-[#282828] border border-[#3B3B3B] rounded-md p-2 flex items-center justify-center hover:bg-[#18181A]"
            >
              <GoogleLogo className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="flex-1 bg-[#282828] border border-[#3B3B3B] rounded-md p-2 flex items-center justify-center hover:bg-[#18181A]"
            >
              <AppleLogo className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="flex-1 bg-[#282828] border border-[#3B3B3B] rounded-md p-2 flex items-center justify-center hover:bg-[#18181A]"
            >
              <FBLogo className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <p className={`${inter.className} text-[12px] text-[#5D5D5D]`}>
              Don't have an account?{" "}
              <a href="/register" className="text-[#6D3F33] visited:text-[#6D3F33] hover:underline font-bold">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;