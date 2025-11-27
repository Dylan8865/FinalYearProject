import React from "react";
import InventoryBox from "./InventoryBox";

const InventoryBar = () => {
  return (
    <div className="z-0 flex justify-center items-center w-screen pointer-events-none">
      <div className="z-20 w-fit bg-black h-10 px-4 pointer-events-auto">
        <div className="mt-[-24px] flex gap-2 justify-center items-center">
          {Array.from({ length: 10 }).map((_, index) => (
            <InventoryBox key={index} bgColor="bg-[#d9d9d9]" />
          ))}
          <div className="flex gap-2 ml-4">
            <InventoryBox bgColor="bg-[#dcd1c1]" />
            <InventoryBox bgColor="bg-[#dcd1c1]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryBar;
