import React from "react";

const CloudsBg = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      <div className="animate-cloud-slow absolute left-[10%] top-[15%] h-16 w-32 bg-white shadow-[8px_0_0_0_white,16px_0_0_0_white,24px_0_0_0_white,0_8px_0_0_white,8px_8px_0_0_white,16px_8px_0_0_white,24px_8px_0_0_white,32px_8px_0_0_white]"></div>
      <div className="animate-cloud-medium absolute right-[15%] top-[25%] h-16 w-40 bg-white shadow-[8px_0_0_0_white,16px_0_0_0_white,24px_0_0_0_white,32px_0_0_0_white,0_8px_0_0_white,8px_8px_0_0_white,16px_8px_0_0_white,24px_8px_0_0_white,32px_8px_0_0_white,40px_8px_0_0_white]"></div>
      <div className="animate-cloud-fast absolute left-[20%] top-[45%] h-16 w-36 bg-white shadow-[8px_0_0_0_white,16px_0_0_0_white,24px_0_0_0_white,32px_0_0_0_white,0_8px_0_0_white,8px_8px_0_0_white,16px_8px_0_0_white,24px_8px_0_0_white,32px_8px_0_0_white]"></div>
      <div className="animate-cloud-slow absolute bottom-[20%] right-[25%] h-16 w-32 bg-white shadow-[8px_0_0_0_white,16px_0_0_0_white,24px_0_0_0_white,0_8px_0_0_white,8px_8px_0_0_white,16px_8px_0_0_white,24px_8px_0_0_white]"></div>
    </div>
  );
};

export default CloudsBg;
