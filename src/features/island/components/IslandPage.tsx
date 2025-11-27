"use client";

import React, { useState } from "react";
import StatusBar from "./StatusBar";
import InventoryBar from "./InventoryBar";
import IslandCanvas from "./IslandCanvas";
import Dialog from "./Dialog";
import EditButton from "./EditButton";
import SettingButton from "./SettingButton";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";
import UserIcon from "../icons/UserIcon";
import TrophyIcon from "../icons/TrophyIcon";

const IslandPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState("");

  return (
    <div className="w-screen h-screen relative bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute top-0 left-0 right-0 z-10">
        <StatusBar setIsDialogOpen={setIsDialogOpen} />
      </div>
      <div className="absolute inset-0 z-0">
        <IslandCanvas />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <InventoryBar />
      </div>

      {isDialogOpen == "profile" && (
        <Dialog
          bgColor="bg-[#6d3f33]"
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
              icon={<i className="hn hn-lock-alt"></i>}
              title="Change Password"
              color="gray"
            />
            <SettingButton
              icon={<i className="hn hn-login"></i>}
              title="Log Out"
              color="gray"
            />
            <SettingButton
              icon={<i className="hn hn-octagon-times"></i>}
              title="Log Out"
              color="red"
            />
          </div>
        </Dialog>
      )}

      {isDialogOpen == "level" && (
        <Dialog
          bgColor="bg-[#68a5ad]"
          icon={<TrophyIcon />}
          title="Level"
          className="flex justify-center items-center"
          setIsDialogOpen={setIsDialogOpen}
        >
          <div></div>
        </Dialog>
      )}
    </div>
  );
};

export default IslandPage;
