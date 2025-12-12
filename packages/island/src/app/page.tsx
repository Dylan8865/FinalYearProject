import React from "react";
import Link from "next/link";
import LoginIcon from "@/icons/LoginIcon";
import UserIcon from "@/icons/UserIcon";
import IslandIcon from "@/icons/IslandIcon";
import SeedlingIcon from "@/icons/SeedlingIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import StoreIcon from "@/icons/StoreIcon";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IslandsBg from "@/features/home/components/Background/IslandsBg";
import CloudsBg from "@/features/home/components/Background/CloudsBg";
import HeroSection from "@/features/home/components/HeroSection";
import FeatureSection from "@/features/home/components/FeatureSection";
import HowItWorksSection from "@/features/home/components/HowItWorksSection";
import CTASection from "@/features/home/components/CTASection";
import FooterSection from "@/features/home/components/FooterSection";

const Home = async () => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/island");
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      {/* bg */}
      <IslandsBg />
      <CloudsBg />

      {/* sections */}
      <HeroSection />
      <FeatureSection />
      <HowItWorksSection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Home;
