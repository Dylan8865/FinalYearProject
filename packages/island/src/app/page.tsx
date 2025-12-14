import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IslandsBg from "@/features/home/components/Background/IslandsBg";
import CloudsBg from "@/features/home/components/Background/CloudsBg";
import HeroSection from "@/features/home/components/HeroSection";
import FeatureSection from "@/features/home/components/FeatureSection";
import HowItWorksSection from "@/features/home/components/HowItWorksSection";
import CtaSection from "@/features/home/components/CTASection";
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
      <CtaSection />
      <FooterSection />
    </div>
  );
};

export default Home;
