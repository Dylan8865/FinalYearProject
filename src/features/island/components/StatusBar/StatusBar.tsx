import React from "react";
import StatusButton from "./StatusButton";
import UserIcon from "../../icons/UserIcon";
import TrophyIcon from "../../icons/TrophyIcon";
import MenuIcon from "../../icons/MenuIcon";
import OxygenIcon from "../../icons/OxygenIcon";
import IslandIcon from "../../icons/IslandIcon";
import PlusIcon from "../../icons/PlusIcon";

interface StatusBarProps {
  setIsDialogOpen: (value: string) => void;
}

const StatusBar = ({ setIsDialogOpen }: StatusBarProps) => {
  return (
    <div className="flex justify-between p-4 pointer-events-none">
      <div className="space-y-2">
        <StatusButton
          icon={<UserIcon />}
          data={"rikashi_shifu"}
          bgColor="bg-[#6d3f33]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("profile")}
        />
        <StatusButton
          icon={<TrophyIcon />}
          data="Level 2"
          bgColor="bg-[#68a5ad]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("level")}
        />
      </div>
      <div className="space-y-2">
        <StatusButton
          icon={<OxygenIcon />}
          data={"1,299,301"}
          bgColor="bg-[#cfa272]"
          orientation="right"
        />
        <StatusButton
          icon={<IslandIcon />}
          data={4}
          bgColor="bg-[#5a706b]"
          orientation="right"
          btnIcon={<PlusIcon />}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

/*
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z"
      fill="currentColor"
    />
  </svg>
*/

export default StatusBar;
