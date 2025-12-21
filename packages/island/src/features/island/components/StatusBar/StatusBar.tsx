import React, { useState } from "react";
import StatusButton from "./StatusButton";
import UserIcon from "@/icons/UserIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import MenuIcon from "@/icons/MenuIcon";
import ManaIcon from "@/icons/ManaIcon";
import IslandIcon from "@/icons/IslandIcon";
import PlusIcon from "@/icons/PlusIcon";
import { ProfileType } from "@/types/types";
import { useToast } from "../../contexts/ToastContext";
import SlotTooltip from "../Dialog/SlotTooltip";

interface StatusBarProps {
  setIsDialogOpen: (value: string) => void;
  profile: ProfileType & { no_of_islands: number };
}

const StatusBar = ({ setIsDialogOpen, profile }: StatusBarProps) => {
  const { showToast } = useToast();
  const [showMenuTooltip, setShowMenuTooltip] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      <div className="pointer-events-none flex flex-col items-start gap-2 p-4 md:flex-row md:justify-between md:gap-0">
        <div className="space-y-2">
          <StatusButton
            icon={<UserIcon />}
            data={profile.name}
            bgColor="bg-[#6d3f33]"
            orientation="left"
            btnIcon={<MenuIcon />}
            onClick={() => setIsDialogOpen("profile")}
            onMouseEnter={() => setShowMenuTooltip("P / p")}
            onMouseLeave={() => setShowMenuTooltip(null)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          />
          <StatusButton
            icon={<TrophyIcon />}
            data={`Level ${profile.level}`}
            bgColor="bg-[#68a5ad]"
            orientation="left"
            btnIcon={<MenuIcon />}
            onClick={() => setIsDialogOpen("level")}
            onMouseEnter={() => setShowMenuTooltip("L / l")}
            onMouseLeave={() => setShowMenuTooltip(null)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
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
            onMouseEnter={() => setShowMenuTooltip("A / a")}
            onMouseLeave={() => setShowMenuTooltip(null)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          />
        </div>
      </div>
      {showMenuTooltip && (
        <SlotTooltip
          title={showMenuTooltip}
          description={["Shortcut Key"]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </>
  );
};

export default React.memo(StatusBar);
