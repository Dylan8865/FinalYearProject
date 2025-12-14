import React from "react";
import StatusButton from "./StatusButton";
import UserIcon from "@/icons/UserIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import MenuIcon from "@/icons/MenuIcon";
import ManaIcon from "@/icons/ManaIcon";
import IslandIcon from "@/icons/IslandIcon";
import PlusIcon from "@/icons/PlusIcon";
import { ProfileType } from "@/types/types";

interface StatusBarProps {
  setIsDialogOpen: (value: string) => void;
  profile: ProfileType & { no_of_islands: number };
}

const StatusBar = ({ setIsDialogOpen, profile }: StatusBarProps) => {
  return (
    <div className="pointer-events-none flex justify-between p-4">
      <div className="space-y-2">
        <StatusButton
          icon={<UserIcon />}
          data={profile.name}
          bgColor="bg-[#6d3f33]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("profile")}
        />
        <StatusButton
          icon={<TrophyIcon />}
          data={`Level ${profile.level}`}
          bgColor="bg-[#68a5ad]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("level")}
        />
      </div>
      <div className="space-y-2">
        <StatusButton
          icon={<ManaIcon />}
          data={new Intl.NumberFormat("en").format(profile.mana)}
          bgColor="bg-[#cfa272]"
          orientation="right"
        />
        <StatusButton
          icon={<IslandIcon />}
          data={profile.no_of_islands}
          bgColor="bg-[#5a706b]"
          orientation="right"
          btnIcon={<PlusIcon />}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default StatusBar;
