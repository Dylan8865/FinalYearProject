"use client";

import React, { useState, useEffect, Suspense } from "react";
import StatusBar from "@/features/island/components/StatusBar/StatusBar";
import InventoryBar from "@/features/island/components/InventoryBar/InventoryBar";
import IslandCanvas from "@/features/island/components/IslandCanvas/IslandCanvas";
import Dialog from "@/features/island/components/Dialog/Dialog";
import UserIcon from "@/icons/UserIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import { useIslands } from "@/features/island/hooks/useIslands";
import MenuIcon from "@/icons/MenuIcon";
import StoreIcon from "@/icons/StoreIcon";
import StoreContent from "@/features/island/components/Dialog/StoreContent";
import InventoryContent from "@/features/island/components/Dialog/InventoryContent";
import { ProfileType } from "@/types/types";
import ProfileContent from "./Dialog/ProfileContent";
import { IslandItemsProvider } from "@/features/island/contexts/IslandItemsContext";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface IslandPageProps {
  profile: ProfileType & { no_of_islands: number };
}

interface PlacedObject {
  x: number;
  y: number;
  z: number;
  itemId: string;
  modelUrl?: string;
  node: React.ReactNode;
}

// 3D Model Component with error handling
function Model3D({ url }: { url: string }) {
  console.log("Loading model from URL:", url);

  try {
    const { scene } = useGLTF(url);
    console.log("Model loaded successfully:", scene);

    // Clone the scene to allow multiple instances
    const clonedScene = scene.clone();

    // Traverse and set up materials
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Log mesh info
        console.log("Mesh found:", {
          name: mesh.name,
          geometry: mesh.geometry,
          material: mesh.material,
        });
      }
    });

    return <primitive object={clonedScene} scale={0.5} />;
  } catch (error) {
    console.error("Error loading model:", url, error);
    // Fallback to a colored cube if model fails to load
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
    );
  }
}

// Loading placeholder
function ModelPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#CCCCCC" wireframe />
    </mesh>
  );
}

const IslandPageContent = ({ profile }: IslandPageProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState("");
  const { islands, loading, error } = useIslands();
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [placedObjects, setPlacedObjects] = useState<
    Record<string, PlacedObject>
  >({});
  const { islandItems } = useIslandItemsContext();

  const handleItemDragStart = (item: any, index: number) => {
    console.log("Dragging item:", {
      id: item.id,
      item: item.item,
      modelUrl: item.item?.model_url,
    });
    setDraggedItem(item);
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
  };

  // Get the next available Y position for a given cell
  const getNextYPosition = (cellId: string): number => {
    let y = 0;
    while (placedObjects[`${cellId}-${y}`]) {
      y++;
    }
    return y;
  };

  // Check if position is valid (has support below or is at ground level)
  const isValidPosition = (cellId: string, y: number): boolean => {
    if (y === 0) return true; // Ground level is always valid
    return !!placedObjects[`${cellId}-${y - 1}`]; // Must have item below
  };

  const handleCellDrop = (cellId: string, x: number, z: number) => {
    if (draggedItem) {
      const y = getNextYPosition(cellId);

      if (isValidPosition(cellId, y)) {
        const modelUrl = draggedItem.item?.model_url;

        console.log("Placing item on island:", {
          cellId,
          position: { x, y, z },
          itemId: draggedItem.id,
          itemName: draggedItem.item?.name,
          modelUrl,
          hasModelUrl: !!modelUrl,
        });

        const positionKey = `${cellId}-${y}`;

        // Create the node based on whether we have a model URL
        let node: React.ReactNode;

        if (modelUrl) {
          console.log("Creating Model3D component with URL:", modelUrl);
          node = (
            <Suspense fallback={<ModelPlaceholder />}>
              <Model3D url={modelUrl} />
            </Suspense>
          );
        } else {
          console.warn("No model URL found, using fallback cube");
          node = (
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#FFD700" />
            </mesh>
          );
        }

        // Add to placed objects
        setPlacedObjects((prev) => {
          const newObjects = {
            ...prev,
            [positionKey]: {
              x,
              y,
              z,
              itemId: draggedItem.id,
              modelUrl,
              node,
            },
          };
          console.log("Updated placed objects:", newObjects);
          return newObjects;
        });

        setDraggedItem(null);
      } else {
        console.log("Invalid position - no support below!");
        setDraggedItem(null);
      }
    }
  };

  // Prevent default drag behavior on the canvas container
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "move";
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Debug: Log islandItems when they change
  useEffect(() => {
    console.log("Island items updated:", islandItems);
  }, [islandItems]);

  // Debug: Log placedObjects when they change
  useEffect(() => {
    console.log("Placed objects updated:", placedObjects);
  }, [placedObjects]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
        <div className="text-2xl text-white">Loading islands...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
        <div className="text-2xl text-white">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute inset-0 z-0">
        <IslandCanvas
          islands={islands}
          isDraggingItem={!!draggedItem}
          onCellDrop={handleCellDrop}
          placedObjects={placedObjects}
        />
      </div>
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10">
        <div className="pointer-events-auto">
          <StatusBar setIsDialogOpen={setIsDialogOpen} profile={profile} />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10">
        <div className="pointer-events-auto">
          <InventoryBar
            setIsDialogOpen={setIsDialogOpen}
            onItemDragStart={handleItemDragStart}
            onItemDragEnd={handleItemDragEnd}
          />
        </div>
      </div>

      {isDialogOpen === "profile" && (
        <Dialog
          iconStyle="bg-[#6d3f33] text-white"
          icon={<UserIcon />}
          title="Profile"
          className="flex items-center justify-center"
          setIsDialogOpen={setIsDialogOpen}
        >
          <ProfileContent userName={profile.name} userEmail={profile.email} />
        </Dialog>
      )}

      {isDialogOpen === "level" && (
        <Dialog
          iconStyle="bg-[#68a5ad] text-white"
          icon={<TrophyIcon />}
          title="Level"
          className="flex items-center justify-center"
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
          className="flex items-center justify-center"
          size="large"
          setIsDialogOpen={setIsDialogOpen}
        >
          <InventoryContent />
        </Dialog>
      )}

      {isDialogOpen === "store" && (
        <Dialog
          iconStyle="bg-[#dcd1c1] text-black text-2xl"
          icon={<StoreIcon />}
          title="Store"
          className="flex items-center justify-center"
          size="large"
          setIsDialogOpen={setIsDialogOpen}
        >
          <StoreContent userId={profile.id} />
        </Dialog>
      )}
    </div>
  );
};

const IslandPage = ({ profile }: IslandPageProps) => {
  return (
    <IslandItemsProvider profileId={profile.id}>
      <IslandPageContent profile={profile} />
    </IslandItemsProvider>
  );
};

export default IslandPage;
