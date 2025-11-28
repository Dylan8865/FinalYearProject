    import WILogo from "./icons/WILogo"; 
    import GoogleLogo from "./icons/GoogleLogo";
    import AppleLogo from "./icons/AppleLogo";
    import FBLogo from "./icons/FBLogo";
    import { Inter } from "next/font/google";
    const inter = Inter({ subsets: ["latin"], weight: ["400","600","700"] });

    const RegisterPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1E1E20] sm:bg-[#18181A] p-0">
            <div className="w-full max-w-md bg-[#1E1E20] sm:rounded-lg sm:shadow-md border-none sm:border sm:border-[#3B3B3B] p-4 sm:p-6 max-h-screen overflow-auto [&::-webkit-scrollbar]:hidden -ms-overflow-style-none scrollbar-none">
                <div className="mb-6 text-left">
                    <WILogo className="w-8 h-8 text-white mb-3" />
                    <h1 className={`${inter.className} text-lg sm:text-xl font-semibold text-white`}>Sign up to Wisdom Island</h1>
                    <p className={`${inter.className} text-[10px] sm:text-xs font-normal text-[#5D5D5D] mt-1`}>Start sharing your knowledge</p>
                </div>
                <form className="space-y-3">
                    <div>
                        <label htmlFor="username" className={`${inter.className} text-[12px] text-white mb-1 block`}>Username</label>
                        <input
                            type="text"
                            id="username"
                            className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className={`${inter.className} text-[12px] text-white mb-1 block`}>Email</label>
                        <input
                            type="email"
                            id="email"
                            className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={`${inter.className} text-[12px] text-white mb-1 block`}>Password</label>
                        <input
                            type="password"
                            id="password"
                            className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
                            placeholder="Enter your password"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className={`${inter.className} text-[12px] text-white mb-1 block`}>Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className={`${inter.className} w-full bg-[#18181A] border border-[#3B3B3B] rounded-md p-1.5 text-white text-[12px] placeholder-[#5D5D5D] placeholder:text-[12px] font-normal focus:outline-none focus:border-blue-500`}
                            placeholder="Confirm your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className={`${inter.className} w-full bg-[#6D3F33] hover:bg-[#5A2E29] text-white rounded-md p-1.5 mb-3`}
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
                            Already have an account?{" "}
                            <a href="/login" className="text-[#6D3F33] hover:underline">
                                Sign in
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
    };

    export default RegisterPage;