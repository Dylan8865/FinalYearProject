"use client";

import React, { useState } from "react";
import StatusBar from "./StatusBar";
import InventoryBar from "./InventoryBar";
import IslandCanvas from "./IslandCanvas";
import Dialog from "./Dialog";
import EditButton from "./EditButton";
import UserIcon from "../icons/UserIcon";
import SettingButton from "./SettingButton";
import TrophyIcon from "../icons/TrophyIcon";
import { useIslands } from "../hooks/useIsland";
import LockIcon from "../icons/LockIcon";
import LoginIcon from "../icons/LoginIcon";
import WarningIcon from "../icons/WarningIcon";
import MenuIcon from "../icons/MenuIcon";
import StoreIcon from "../icons/StoreIcon";

const IslandPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState("");
  const { islands, loading, error } = useIslands();

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
        <div className="text-2xl text-white">Loading islands...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
        <div className="text-2xl text-white">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute inset-0 z-0">
        <IslandCanvas islands={islands} />
      </div>
      <div className="absolute top-0 left-0 right-0 z-10">
        <StatusBar setIsDialogOpen={setIsDialogOpen} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <InventoryBar setIsDialogOpen={setIsDialogOpen} />
      </div>

      {isDialogOpen === "profile" && (
        <Dialog
          iconStyle="bg-[#6d3f33] text-white"
          icon={<UserIcon />}
          title="Profile"
          className="flex justify-center items-center"
          setIsDialogOpen={setIsDialogOpen}
        >
          <div className="space-y-4">
            <EditButton fieldName="Username:" fieldValue="rikashi_shifu" />
            <EditButton
              fieldName="Email:"
              fieldValue="harryliow229@gmail.com"
            />
            <SettingButton
              fieldName="Settings"
              icon={<LockIcon />}
              title="Change Password"
              color="gray"
            />
            <SettingButton icon={<LoginIcon />} title="Log Out" color="gray" />
            <SettingButton
              icon={<WarningIcon />}
              title="Delete Account"
              color="red"
            />
          </div>
        </Dialog>
      )}

      {isDialogOpen === "level" && (
        <Dialog
          iconStyle="bg-[#68a5ad] text-white"
          icon={<TrophyIcon />}
          title="Level"
          className="flex justify-center items-center"
          setIsDialogOpen={setIsDialogOpen}
        >
          <div>Level information here</div>
        </Dialog>
      )}

      {isDialogOpen === "inventory" && (
        <Dialog
          iconStyle="bg-[#dcd1c1] text-black"
          icon={<MenuIcon />}
          title="Inventory"
          className="flex justify-center items-center"
          size="large"
          setIsDialogOpen={setIsDialogOpen}
        >
          <div>Inventory details here</div>
        </Dialog>
      )}

      {isDialogOpen === "store" && (
        <Dialog
          iconStyle="bg-[#dcd1c1] text-black"
          icon={<StoreIcon />}
          title="Store"
          className="flex justify-center items-center"
          size="large"
          setIsDialogOpen={setIsDialogOpen}
        >
          <div>Store details here</div>
        </Dialog>
      )}
    </div>
  );
};

export default IslandPage;
