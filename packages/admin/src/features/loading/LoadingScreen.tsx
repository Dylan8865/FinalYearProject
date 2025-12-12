import WILogo from "@/features/auth/login/icons/WILogo";

export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E20]">
      <div className="flex flex-col items-center space-y-4">
        <WILogo className="w-12 h-12 text-white animate-pulse" />
        <p className="text-sm text-[#5D5D5D]">Loading...</p>
      </div>
    </div>
  );
}
