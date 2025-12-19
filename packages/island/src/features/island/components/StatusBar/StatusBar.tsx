import React from "react";
import StatusButton from "./StatusButton";
import UserIcon from "@/icons/UserIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import MenuIcon from "@/icons/MenuIcon";
import ManaIcon from "@/icons/ManaIcon";
import IslandIcon from "@/icons/IslandIcon";
import PlusIcon from "@/icons/PlusIcon";
import { ProfileType } from "@/types/types";
import { useToast } from "../../contexts/ToastContext";

interface StatusBarProps {
  setIsDialogOpen: (value: string) => void;
  profile: ProfileType & { no_of_islands: number };
}

const StatusBar = ({ setIsDialogOpen, profile }: StatusBarProps) => {
  const { showToast } = useToast();

  return (
    <div className="pointer-events-none flex flex-col items-start gap-2 p-4 md:flex-row md:justify-between md:gap-0">
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
          data={profile.mana.toLocaleString()}
          bgColor="bg-[#cfa272]"
          orientation="right"
        />
        <StatusButton
          icon={<IslandIcon />}
          data={profile.no_of_islands.toLocaleString()}
          bgColor="bg-[#5a706b]"
          orientation="right"
          btnIcon={<PlusIcon />}
          onClick={() => {
            if (profile.mana < 1_000_000) {
              showToast("Insufficient mana (1,000,000 required)", "error");
            } else setIsDialogOpen("island");
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(StatusBar);
