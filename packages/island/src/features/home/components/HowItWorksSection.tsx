import React from "react";

const HowItWorksSection = () => {
  return (
    <div className="relative z-10 bg-gradient-to-b from-[#72b9e3] to-[#5aa8d4] py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-16 text-center text-4xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
          How It Works
        </h2>

        <div className="space-y-12">
          {/* step 1 */}
          <div className="flex items-center gap-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-bold text-[#72b9e3] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              1
            </div>
            <div className="flex-1 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                Create Your Account
              </h3>
              <p className="text-gray-600">
                Sign up and start your journey. Your personal island awaits!
              </p>
            </div>
          </div>

          {/* step 2 */}
          <div className="flex items-center gap-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-bold text-[#72b9e3] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              2
            </div>
            <div className="flex-1 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                Get Your First Island
              </h3>
              <p className="text-gray-600">
                Receive your starter island and begin your adventure.
              </p>
            </div>
          </div>

          {/* step 3 */}
          <div className="flex items-center gap-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-bold text-[#72b9e3] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              3
            </div>
            <div className="flex-1 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                Collect and Place Items
              </h3>
              <p className="text-gray-600">
                Visit the store, purchase items, and place them on your island
                to customize it.
              </p>
            </div>
          </div>

          {/* step 4 */}
          <div className="flex items-center gap-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-bold text-[#72b9e3] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              4
            </div>
            <div className="flex-1 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                Watch Your Island Grow
              </h3>
              <p className="text-gray-600">
                See your knowledge island flourish as you add more content and
                achievements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
