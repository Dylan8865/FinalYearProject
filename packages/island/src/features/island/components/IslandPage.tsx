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

/**
 * PlacedObject represents an item placed on the island grid
 * @property x - X position on the island grid
 * @property y - Y position (vertical stacking)
 * @property z - Z position on the island grid
 * @property itemId - Unique identifier of the island-item
 * @property modelUrl - URL to the 3D model GLB file from Supabase storage
 * @property node - React node containing the 3D model component
 */
interface PlacedObject {
  x: number;
  y: number;
  z: number;
  itemId: string;
  modelUrl?: string;
  node: React.ReactNode;
}

/**
 * Model3D Component
 * 
 * Loads and renders a 3D GLB model from Supabase storage using React Three Fiber.
 * The model file is loaded from the "items" bucket with filename format: {item_id}.glb
 * 
 * Features:
 * - Clones the scene to allow multiple instances of the same model
 * - Sets up shadow casting and receiving for proper lighting
 * - Scales the model to fit the island grid (0.5x scale)
 * 
 * Note: This component should be wrapped in a Suspense boundary
 * 
 * @param url - Full URL to the GLB model file from Supabase storage
 */
function Model3D({ url }: { url: string }) {
  console.log("Loading model from URL:", url);

  // Load the GLB model using React Three Fiber's useGLTF hook
  // Hooks must be called unconditionally (React rules)
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
}

/**
 * ModelPlaceholder Component
 * 
 * Displays a wireframe cube while the 3D model is loading.
 * Used as a fallback in Suspense boundaries.
 */
function ModelPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#CCCCCC" wireframe />
    </mesh>
  );
}

/**
 * IslandPageContent Component
 * 
 * Main component that manages the island view and item placement functionality.
 * 
 * Features:
 * - Displays the 3D island with placed items
 * - Handles drag-and-drop from inventory to island
 * - Manages dialogs for profile, store, and inventory
 * - Tracks placed objects and their positions
 * 
 * State Management:
 * - draggedItem: Currently dragged item from inventory
 * - placedObjects: Map of placed items by position key (cellId-y)
 * - isDialogOpen: Currently open dialog name
 */
const IslandPageContent = ({ profile }: IslandPageProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState("");
  const { islands, loading, error } = useIslands();
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [placedObjects, setPlacedObjects] = useState<
    Record<string, PlacedObject>
  >({});
  const { islandItems } = useIslandItemsContext();

  /**
   * Handles the start of dragging an item from inventory
   * Stores the dragged item in state for use during drop
   */
  const handleItemDragStart = (item: any, _index: number) => {
    console.log("Dragging item:", {
      id: item.id,
      item: item.item,
      modelUrl: item.item?.model_url,
    });
    setDraggedItem(item);
  };

  /**
   * Handles the end of dragging an item
   * Clears the dragged item from state
   */
  const handleItemDragEnd = () => {
    setDraggedItem(null);
  };

  /**
   * Get the next available Y position (vertical stacking) for a given grid cell
   * Items can be stacked vertically on the same grid cell
   * 
   * @param cellId - Grid cell identifier (format: "row-col")
   * @returns Next available Y position for stacking
   */
  const getNextYPosition = (cellId: string): number => {
    let y = 0;
    while (placedObjects[`${cellId}-${y}`]) {
      y++;
    }
    return y;
  };

  /**
   * Check if a position is valid for placing an item
   * Items must be placed on ground level (y=0) or have support below
   * 
   * @param cellId - Grid cell identifier
   * @param y - Y position to check
   * @returns true if position is valid
   */
  const isValidPosition = (cellId: string, y: number): boolean => {
    if (y === 0) return true; // Ground level is always valid
    return !!placedObjects[`${cellId}-${y - 1}`]; // Must have item below
  };

  /**
   * Handles dropping an item from inventory onto an island grid cell
   * 
   * This function:
   * 1. Determines the next available Y position for stacking
   * 2. Validates the position (must have support or be ground level)
   * 3. Creates a 3D model node from the item's model_url
   * 4. Adds the placed object to state for rendering
   * 
   * Note: Database persistence should be added here to update island-item table
   * with grid_x, grid_y, grid_z, and island_id
   * 
   * @param cellId - Grid cell identifier (format: "row-col")
   * @param x - World X position on the island
   * @param z - World Z position on the island
   */
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

        // Create the 3D model node based on whether we have a model URL
        let node: React.ReactNode;

        if (modelUrl) {
          // Load 3D model from Supabase storage
          // Model files are stored in "items" bucket with format: {item_id}.glb
          console.log("Creating Model3D component with URL:", modelUrl);
          node = (
            <Suspense fallback={<ModelPlaceholder />}>
              <Model3D url={modelUrl} />
            </Suspense>
          );
        } else {
          // Fallback: Show a golden cube if model URL is not available
          console.warn("No model URL found, using fallback cube");
          node = (
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#FFD700" />
            </mesh>
          );
        }

        // Add to placed objects state for immediate rendering
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
