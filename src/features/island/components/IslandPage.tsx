"use client";

import React, { useState, useEffect } from "react";
import StatusBar from "./StatusBar";
import InventoryBar from "./InventoryBar";
import IslandCanvas, { IslandData } from "./IslandCanvas";
import Dialog from "./Dialog";
import EditButton from "./EditButton";
import { mapIslandsToCanvas, DBIsland } from "../utils/mapIslandsToCanvas";
import UserIcon from "../icons/UserIcon";
import SettingButton from "./SettingButton";
import TrophyIcon from "../icons/TrophyIcon";

const IslandPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState("");
  const [islands, setIslands] = useState<IslandData[]>([]);

  useEffect(() => {
    // Fetch islands from database
    async function fetchIslands() {
      try {
        // Replace with your actual API endpoint
        const response = await fetch("/api/islands");
        const dbIslands: DBIsland[] = await response.json();

        // Map DB islands to canvas positions
        const mappedIslands = mapIslandsToCanvas(dbIslands, 8);

        setIslands(mappedIslands);
      } catch (error) {
        console.error("Failed to fetch islands:", error);

        // Fallback: Mock data for development
        const mockDBIslands: DBIsland[] = [
          {
            id: "island-1",
            created_at: new Date().toISOString(),
            name: "Starter Island",
            level: 1,
            theme: "grass",
            user_id: "user-1",
          },
          {
            id: "island-2",
            created_at: new Date().toISOString(),
            name: "Mountain Peak",
            level: 3,
            theme: "rock",
            user_id: "user-1",
          },
          {
            id: "island-3",
            created_at: new Date().toISOString(),
            name: "Ocean View",
            level: 2,
            theme: "water",
            user_id: "user-1",
          },
          {
            id: "island-4",
            created_at: new Date().toISOString(),
            name: "Ocean View",
            level: 2,
            theme: "water",
            user_id: "user-1",
          },
          {
            id: "island-5",
            created_at: new Date().toISOString(),
            name: "Ocean View",
            level: 2,
            theme: "water",
            user_id: "user-1",
          },
          {
            id: "island-6",
            created_at: new Date().toISOString(),
            name: "Ocean View",
            level: 2,
            theme: "water",
            user_id: "user-1",
          },
          {
            id: "island-7",
            created_at: new Date().toISOString(),
            name: "Ocean View",
            level: 2,
            theme: "water",
            user_id: "user-1",
          },
        ];

        const mappedIslands = mapIslandsToCanvas(mockDBIslands, 8);
        setIslands(mappedIslands);
      }
    }

    fetchIslands();
  }, []);

  return (
    <div className="w-screen h-screen relative bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute inset-0 z-0">
        <IslandCanvas islands={islands} />
      </div>
      <div className="absolute top-0 left-0 right-0 z-10">
        <StatusBar setIsDialogOpen={setIsDialogOpen} />
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
