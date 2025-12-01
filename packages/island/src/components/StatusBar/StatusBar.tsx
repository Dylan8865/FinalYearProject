import React from "react";
import StatusButton from "./StatusButton";
import UserIcon from "@/src/icons/UserIcon";
import TrophyIcon from "@/src/icons/TrophyIcon";
import MenuIcon from "@/src/icons/MenuIcon";
import OxygenIcon from "@/src/icons/OxygenIcon";
import IslandIcon from "@/src/icons/IslandIcon";
import PlusIcon from "@/src/icons/PlusIcon";
import { UserType } from "@/types/types";

interface StatusBarProps {
  setIsDialogOpen: (value: string) => void;
  user: UserType & { no_of_islands: number };
}

const StatusBar = ({ setIsDialogOpen, user }: StatusBarProps) => {
  return (
    <div className="flex justify-between p-4 pointer-events-none">
      <div className="space-y-2">
        <StatusButton
          icon={<UserIcon />}
          data={user.name}
          bgColor="bg-[#6d3f33]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("profile")}
        />
        <StatusButton
          icon={<TrophyIcon />}
          data={`Level ${user.level}`}
          bgColor="bg-[#68a5ad]"
          orientation="left"
          btnIcon={<MenuIcon />}
          onClick={() => setIsDialogOpen("level")}
        />
      </div>
      <div className="space-y-2">
        <StatusButton
          icon={<OxygenIcon />}
          data={new Intl.NumberFormat("en").format(user.oxygen)}
          bgColor="bg-[#cfa272]"
          orientation="right"
        />
        <StatusButton
          icon={<IslandIcon />}
          data={user.no_of_islands}
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
