import React from "react";

const Island1 = () => {
  return (
    <div className="animate-float-slow absolute left-[5%] top-[20%]">
      <div className="relative">
        <div className="h-12 w-24 bg-[#8B7355] shadow-[0_4px_0_0_#6B5345,0_8px_0_0_#4B3325]"></div>
        <div className="absolute -top-2 h-2 w-24 bg-[#7CB342]"></div>
        <div className="absolute -top-8 left-8 h-6 w-2 bg-[#6D4C41]"></div>
        <div className="absolute -top-12 left-6 h-6 w-6 bg-[#4CAF50] shadow-[8px_0_0_0_#4CAF50,0_8px_0_0_#4CAF50,8px_8px_0_0_#4CAF50]"></div>
      </div>
    </div>
  );
};

const Island2 = () => {
  return (
    <div className="animate-float-medium absolute right-[8%] top-[35%]">
      <div className="relative">
        <div className="h-16 w-32 bg-[#8B7355] shadow-[0_4px_0_0_#6B5345,0_8px_0_0_#4B3325,0_12px_0_0_#2B1305]"></div>
        <div className="absolute -top-2 h-2 w-32 bg-[#7CB342]"></div>
        <div className="absolute -top-4 left-20 h-4 w-4 bg-[#757575]"></div>
      </div>
    </div>
  );
};

const Island3 = () => {
  return (
    <div className="animate-float-fast absolute left-[60%] top-[50%]">
      <div className="relative">
        <div className="h-10 w-20 bg-[#8B7355] shadow-[0_4px_0_0_#6B5345,0_8px_0_0_#4B3325]"></div>
        <div className="absolute -top-2 h-2 w-20 bg-[#7CB342]"></div>
      </div>
    </div>
  );
};

const Island4 = () => {
  return (
    <div className="animate-float-slow absolute bottom-[25%] left-[15%] delay-1000">
      <div className="relative">
        <div className="h-8 w-16 bg-[#8B7355] shadow-[0_4px_0_0_#6B5345]"></div>
        <div className="absolute -top-2 h-2 w-16 bg-[#7CB342]"></div>
      </div>
    </div>
  );
};

const IslandsBg = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
      <Island1 />
      <Island2 />
      <Island3 />
      <Island4 />
    </div>
  );
};

export default IslandsBg;
