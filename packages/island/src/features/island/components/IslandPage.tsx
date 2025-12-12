"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import StatusBar from "@/features/island/components/StatusBar/StatusBar";
import InventoryBar from "@/features/island/components/InventoryBar/InventoryBar";
import IslandCanvas from "@/features/island/components/IslandCanvas/IslandCanvas";
import Dialog from "@/features/island/components/Dialog/Dialog";
import UserIcon from "@/features/shared/icons/UserIcon";
import TrophyIcon from "@/features/shared/icons/TrophyIcon";
import { useIslands } from "@/features/island/hooks/useIslands";
import MenuIcon from "@/features/shared/icons/MenuIcon";
import StoreIcon from "@/features/shared/icons/StoreIcon";
import StoreContent from "@/features/island/components/Dialog/StoreContent";
import InventoryContent from "@/features/island/components/Dialog/InventoryContent";
import { ProfileType } from "@/types/types";
import ProfileContent from "./Dialog/ProfileContent";
import { IslandItemsProvider } from "@/features/island/contexts/IslandItemsContext";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import TerrainBlock from "./Block/TerrainBlocks";
import PlacedBlock from "./Block/PlacedBlock";
import SidebarPage from "./Page/SidebarPage";
import { CameraControlsHandle } from "./IslandCanvas/CameraControls";
import { type OffscreenIsland } from "./IslandCanvas/IslandIndicators";
import RefreshIcon from "@/features/shared/icons/RefreshIcon";

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
 * @property islandId - ID of the island this object is placed on
 */
interface PlacedObject {
  x: number;
  y: number;
  z: number;
  itemId: string;
  itemName: string;
  itemType: "terrain" | "decorative" | "functional";
  modelUrl?: string;
  node: React.ReactNode;
  islandId?: string;
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
  const [selectedPlacedItem, setSelectedPlacedItem] = useState<string | null>(null); // Currently selected placed item ID
  const [placedObjects, setPlacedObjects] = useState<
    Record<string, PlacedObject>
  >({});
  const { islandItems, placeItemOnIsland, removeItemFromIsland, moveToInventory } = useIslandItemsContext();

  // Functional item dialog
  const [functionalItemDialog, setFunctionalItemDialog] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
  } | null>(null);

  // Removal confirmation dialog
  const [sidebarContentPage, setSidebarContentPage] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
  } | null>(null);

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
   * Items must be placed on ground level (y=0) or on top of a terrain block
   *
   * @param cellId - Grid cell identifier
   * @param y - Y position to check
   * @returns true if position is valid
   */
  const isValidPosition = (cellId: string, y: number): boolean => {
    if (y === 0) return true; // Ground level is always valid

    // Check if there's an item below
    const itemBelow = placedObjects[`${cellId}-${y - 1}`];
    if (!itemBelow) return false; // No support below

    // Only allow placement on top of terrain blocks
    return itemBelow.itemType === "terrain";
  };

  /**
   * Check if there's a block stacked above this position
   * Used to prevent moving/removing blocks that support other blocks
   *
   * @param cellId - Grid cell identifier
   * @param y - Y position to check
   * @returns true if there's a block above
   */
  const hasBlockAbove = (cellId: string, y: number): boolean => {
    return !!placedObjects[`${cellId}-${y + 1}`];
  };

  /**
   * Extracts item metadata from an island item
   */
  const getItemMetadata = (item: any) => ({
    modelUrl: item.item?.model_url,
    itemType: (item.item?.type as "terrain" | "decorative" | "functional") || "terrain",
    itemName: item.item?.name || "Unknown",
  });

  /**
   * Handles clicks on placed blocks - opens dialog or attempts placement
   */
  const handlePlacedBlockClick = (
    clickedItemId: string,
    clickedType: string,
    clickedName: string,
    cellId: string,
    y: number,
    islandId?: string,
    worldX?: number,
    worldZ?: number
  ) => {
    console.log("Placed block clicked (Unique ID):", { clickedItemId, clickedType, clickedName });

    // Single-click: Open dialog (if no item selected for placement)
    if (!selectedPlacedItem || selectedPlacedItem === clickedItemId) {
      // Check if there are blocks above - if so, prevent dialog
      if (hasBlockAbove(cellId, y)) {
        console.log("Cannot interact with block that has items above it");
        alert("Cannot interact with this block - remove blocks above it first!");
        return;
      }

      // Open dialog for this item
      console.log("Opening dialog for item (Unique ID):", clickedItemId);
      if (clickedType == "functional") {
        setSidebarContentPage({ open: true, itemId: clickedItemId, itemName: clickedName });
      }
    } else {
      // User has a different item selected - try to place it here
      const currentSelectedItem = islandItems.find(i => i.id === selectedPlacedItem);

      // Only allow placement if clicked block is a terrain type
      if (currentSelectedItem && clickedType === "terrain") {
        const isInventoryItem = currentSelectedItem.grid_x === null &&
          currentSelectedItem.grid_y === null &&
          currentSelectedItem.grid_z === null;

        console.log(isInventoryItem ? "Placing inventory item on terrain!" : "Moving placed item to terrain!");

        // Place/move on top of this block
        if (islandId && worldX !== undefined && worldZ !== undefined) {
          handleCellDrop(islandId, cellId, worldX, worldZ);
        }
      } else if (clickedType !== "terrain") {
        console.log("Cannot place on non-terrain blocks");
        alert("Items can only be placed on terrain blocks, not on decorative or functional items.");
      }
    }
  };

  /**
   * Handles double-clicks on placed blocks - selects for moving
   */
  const handlePlacedBlockDoubleClick = (
    itemId: string,
    type: string,
    name: string,
    cellId: string,
    y: number
  ) => {
    console.log("Placed block double-clicked:", { itemId, type, name });

    // Double-click: Select for moving
    // Only allow selecting if this is the top block (no blocks above it)
    if (hasBlockAbove(cellId, y)) {
      console.log("Cannot select block with items above it");
      alert("Cannot move this block - remove blocks above it first!");
      return;
    }

    // Select this item for moving
    console.log("Selecting placed item for moving:", itemId);
    setSelectedPlacedItem(itemId);
  };

  /**
   * Creates a PlacedBlock React node with standardized handlers
   */
  const createPlacedBlockNode = (
    itemId: string,
    itemName: string,
    itemType: "terrain" | "decorative" | "functional",
    modelUrl: string | undefined,
    cellId: string,
    y: number,
    islandId?: string,
    worldX?: number,
    worldZ?: number
  ) => {
    return (
      <PlacedBlock
        itemId={itemId}
        itemName={itemName}
        itemType={itemType}
        modelUrl={modelUrl}
        isSelected={selectedPlacedItem === itemId}
        onClick={(clickedItemId, clickedType, clickedName) =>
          handlePlacedBlockClick(
            clickedItemId,
            clickedType,
            clickedName,
            cellId,
            y,
            islandId,
            worldX,
            worldZ
          )
        }
        onDoubleClick={(clickedItemId, clickedType, clickedName) =>
          handlePlacedBlockDoubleClick(clickedItemId, clickedType, clickedName, cellId, y)
        }
      />
    );
  };

  /**
   * Load previously placed items from database on mount
   * Converts island-item records to placedObjects state format
   */
  useEffect(() => {
    // Wait for islands to load first
    if (!islands || islands.length === 0) {
      console.log("Waiting for islands to load...");
      return;
    }

    // Filter for items that have been placed on an island (have island_id and grid coordinates)
    const placedItems = islandItems.filter(
      (islandItem) =>
        islandItem.island_id &&
        islandItem.grid_x !== null &&
        islandItem.grid_y !== null &&
        islandItem.grid_z !== null
    );

    console.log("=== UPDATING PLACED OBJECTS ===");
    console.log("Total island items:", islandItems.length);
    console.log("Items with grid coords:", placedItems.length);
    
    // Debug: Show items that have BOTH grid and inventory coords (shouldn't exist)
    const duplicateItems = islandItems.filter(item => 
      item.grid_x !== null && item.pos_x !== null
    );
    if (duplicateItems.length > 0) {
      console.error("⚠️ FOUND ITEMS IN BOTH LOCATIONS:", duplicateItems.map(item => ({
        id: item.id,
        name: item.item?.name,
        grid: { x: item.grid_x, y: item.grid_y, z: item.grid_z },
        inv: { x: item.pos_x, y: item.pos_y }
      })));
    }

    // Convert placed items to placedObjects format
    const newPlacedObjects: Record<string, PlacedObject> = {};

    placedItems.forEach((islandItem) => {
      // Find the island this item belongs to
      const island = islands.find((isl) => isl.id === islandItem.island_id);
      if (!island) {
        console.warn("Island not found for item:", islandItem.id);
        return;
      }

      // Grid configuration for this specific island
      const cellSize = 1.2;
      const gridSize = island.gridSize;
      const offset = (gridSize * cellSize) / 2 - cellSize / 2;

      // Convert grid coordinates to world coordinates
      const x = islandItem.grid_x! * cellSize - offset;
      const z = islandItem.grid_z! * cellSize - offset;
      const y = islandItem.grid_y!;

      // Create cell ID (format: "row-col" where row=gridZ, col=gridX)
      const cellId = `${islandItem.grid_z}-${islandItem.grid_x}`;
      const positionKey = `${cellId}-${y}`;

      const { modelUrl, itemType, itemName } = getItemMetadata(islandItem);

      // Create 3D model node using PlacedBlock wrapper
      const node = createPlacedBlockNode(
        islandItem.id, // Use UNIQUE island_item.id
        itemName,
        itemType,
        modelUrl,
        cellId,
        y,
        islandItem.island_id || undefined,
        x,
        z
      );

      newPlacedObjects[positionKey] = {
        x,
        y,
        z,
        itemId: islandItem.id, // Use UNIQUE island_item.id
        itemName,
        itemType,
        modelUrl,
        node,
        islandId: islandItem.island_id || undefined, // Track which island this belongs to
      };
    });

    console.log("Loaded placed objects (Unique IDs verified):", Object.keys(newPlacedObjects).length, "items");
    setPlacedObjects(newPlacedObjects);
  }, [islandItems, islands, selectedPlacedItem]);

  /**
   * Handles selecting an item from inventory
   * Click an item to select it, then click a grid cell to place it
   */
  const handleInventoryItemClick = (islandItem: any | null, _index: number) => {
    // Handle explicit deselection (passed from InventoryBar)
    if (!islandItem) {
        console.log("Deselecting item via inventory click");
        setSelectedPlacedItem(null);
        return;
    }

    console.log("=== INVENTORY ITEM CLICKED ===");
    console.log("Unique ID:", islandItem.id);
    console.log("Item name:", islandItem.item?.name);
    console.log("Item model URL:", islandItem.item?.model_url);
    console.log("Setting selectedPlacedItem to:", islandItem.id);

    // Toggle selection if clicking the same item (backup check)
    if (selectedPlacedItem === islandItem.id) {
        setSelectedPlacedItem(null);
        return;
    }

    setSelectedPlacedItem(islandItem.id);
    
    console.log("Selected item ID is now:", islandItem.id);
  };

  /**
   * Handles clicking an empty inventory slot
   * Moves a selected placed item to the inventory
   */
  const handleInventorySlotClick = async (slotX: number, slotY: number) => {
    console.log("=== INVENTORY SLOT CLICKED ===");
    console.log("Slot position:", { slotX, slotY });
    console.log("Current selectedPlacedItem:", selectedPlacedItem);

    if (!selectedPlacedItem) {
      console.log("No item selected");
      return;
    }

    const selectedItem = islandItems.find(item => item.id === selectedPlacedItem);
    console.log("Selected item:", selectedItem);

    if (!selectedItem) {
      console.log("Selected item not found in islandItems");
      return;
    }

    // Check if item is currently on the island (has grid coordinates)
    if (selectedItem.grid_x !== null && selectedItem.grid_y !== null && selectedItem.grid_z !== null) {
      console.log("Moving item from island to inventory slot");
      await moveToInventory(selectedPlacedItem, slotX, slotY);
      setSelectedPlacedItem(null);
    } else {
      console.log("Item is not on island, ignoring");
    }
  };

  /**
   * Handles dropping an item from inventory onto an island grid cell
   *
   * This function:
   * 1. Determines the next available Y position for stacking
   * 2. Validates the position (must have support or be ground level)
   * 3. Persists the placement to the database with the correct island_id
   * 4. Creates a 3D model node from the item's model_url
   * 5. Adds the placed object to state for rendering
   *
   * @param islandId - ID of the island where the item is being placed
   * @param cellId - Grid cell identifier (format: "row-col")
   * @param x - World X position on the island
   * @param z - World Z position on the island
   */
  const handleCellDrop = async (
    islandId: string,
    cellId: string,
    x: number,
    z: number
  ) => {
    console.log("=== GRID CELL CLICKED ===");
    console.log("Island ID:", islandId);
    console.log("Cell ID:", cellId);
    console.log("Position:", { x, z });
    console.log("Current selectedPlacedItem:", selectedPlacedItem);
    console.log("All islandItems:", islandItems);

    // Get the selected item from islandItems
    const selectedItem = islandItems.find(item => item.id === selectedPlacedItem);

    console.log("Found selected item:", selectedItem);

    if (!selectedItem) {
      console.log("NO SELECTED ITEM - Exiting");
      return;
    }

    // Determine if this is an inventory item or a placed item being moved
    const isInventoryItem = selectedItem.grid_x === null &&
      selectedItem.grid_y === null &&
      selectedItem.grid_z === null;

    if (isInventoryItem) {
      console.log("Placing inventory item:", {
        id: selectedItem.id,
        name: selectedItem.item?.name,
        currentPos: {
          pos_x: selectedItem.pos_x,
          pos_y: selectedItem.pos_y,
        }
      });
    } else {
      console.log("Moving placed item:", {
        id: selectedItem.id,
        name: selectedItem.item?.name,
        currentPos: {
          grid_x: selectedItem.grid_x,
          grid_y: selectedItem.grid_y,
          grid_z: selectedItem.grid_z,
        }
      });
    }

    const y = getNextYPosition(cellId);

    if (!isValidPosition(cellId, y)) {
      console.log("Invalid position - blocks can only be placed on ground or on terrain blocks!");
      alert("Invalid placement: Blocks can only be placed on the ground or on top of terrain blocks.");
      setSelectedPlacedItem(null);
      return;
    }

    // Extract grid coordinates from cell ID (format: "row-col")
    const [gridZ, gridX] = cellId.split("-").map(Number);
    const gridY = y;

    const { modelUrl, itemType, itemName } = getItemMetadata(selectedItem);

    console.log("Placing item on island:", {
      islandId,
      cellId,
      position: { x, y, z },
      gridPosition: { gridX, gridY, gridZ },
      itemId: selectedItem.id,
      itemName,
      itemType,
      modelUrl,
      hasModelUrl: !!modelUrl,
    });

    const positionKey = `${cellId}-${y}`;

    // Check if this item is already placed somewhere (moving it)
    const oldPositionKey = selectedItem.grid_x !== null && selectedItem.grid_y !== null && selectedItem.grid_z !== null
      ? `${selectedItem.grid_z}-${selectedItem.grid_x}-${selectedItem.grid_y}`
      : null;

    console.log("Old position key:", oldPositionKey);
    console.log("New position key:", positionKey);

    // Create PlacedBlock node for the newly placed item
    const node = createPlacedBlockNode(
      selectedItem.id,
      itemName,
      itemType,
      modelUrl,
      cellId,
      y,
      islandId,
      x,
      z
    );

    // Add to placed objects state for immediate rendering (optimistic update)
    setPlacedObjects((prev) => {
      const newObjects = { ...prev };

      // Remove from old position if moving
      if (oldPositionKey && newObjects[oldPositionKey]?.itemId === selectedItem.id) {
        console.log("Removing item from old position:", oldPositionKey);
        delete newObjects[oldPositionKey];
      }

      // Add to new position
      newObjects[positionKey] = {
        x,
        y,
        z,
        itemId: selectedItem.id,
        itemName,
        itemType,
        modelUrl,
        node,
        islandId, // Track which island this object belongs to
      };
      console.log("Updated placed objects:", newObjects);
      return newObjects;
    });

    // Persist to database with the correct island_id
    try {
      const success = await placeItemOnIsland(
        selectedItem.id,
        islandId, // Use the island that was clicked
        gridX,
        gridY,
        gridZ
      );

      if (success) {
        console.log("Successfully persisted item placement to database");
      } else {
        console.error("Failed to persist item placement");
        // Remove from local state on failure
        setPlacedObjects((prev) => {
          const newObjects = { ...prev };
          delete newObjects[positionKey];
          return newObjects;
        });
      }
    } catch (error) {
      console.error("Error persisting item placement:", error);
      // Remove from local state on error
      setPlacedObjects((prev) => {
        const newObjects = { ...prev };
        delete newObjects[positionKey];
        return newObjects;
      });
    }

    setSelectedPlacedItem(null);
  };

  // reset camera button
  const controlsRef = useRef<CameraControlsHandle>(null);
  const [isCameraAtDefault, setIsCameraAtDefault] = useState(true);
  const [offscreenIslands, setOffscreenIslands] = useState<OffscreenIsland[]>([]);
  
  const resetCamera = () => {
    controlsRef.current?.reset();
  };
  
  const handleCameraChanged = (isAtDefault: boolean) => {
    setIsCameraAtDefault(isAtDefault);
  };
  
  const handleOffscreenIslandsChange = (islands: OffscreenIsland[]) => {
    setOffscreenIslands(islands);
  };

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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute inset-0 z-0">
        <IslandCanvas
          islands={islands}
          isDraggingItem={!!selectedPlacedItem}
          isDraggingPlacedItem={false}
          onCellDrop={handleCellDrop}
          placedObjects={placedObjects}
          controlsRef={controlsRef}
          onCameraChanged={handleCameraChanged}
          offscreenIslands={offscreenIslands}
          onOffscreenIslandsChange={handleOffscreenIslandsChange}
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
            selectedPlacedItem={selectedPlacedItem}
            setSelectedPlacedItem={setSelectedPlacedItem}
            setIsDialogOpen={setIsDialogOpen}
            onItemClick={(item, index) => {
                if (item === null) {
                    setSelectedPlacedItem(null);
                } else {
                    handleInventoryItemClick(item, index);
                }
            }}
            onSlotClick={handleInventorySlotClick}
          />
        </div>
      </div>


      {/* reset camera button - only show when camera has moved */}
      {!isCameraAtDefault && (
        <button
          onClick={resetCamera}
          className="absolute flex justify-center items-center text-2xl bottom-6 right-6 z-10 pointer-events-auto bg-transparent hover:rotate-180 transition-all duration-300 animate-fade-in"
        >
          <RefreshIcon />
        </button>
      )}

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
          <InventoryContent 
            selectedPlacedItem={selectedPlacedItem}
            onSelect={setSelectedPlacedItem}
          />
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

      {/* Sidebar Content */}
      <SidebarPage
        isOpen={sidebarContentPage?.open}
        itemId={sidebarContentPage?.itemId}
        itemName={sidebarContentPage?.itemName}
        onClick={() => setSidebarContentPage({ open: false, itemId: '', itemName: '' })}
      />

    </div>
  );
};

const IslandPage = ({ profile }: IslandPageProps) => {
  // Fetch all items for the profile (both inventory and placed items)
  // Don't pass islandId here - we need ALL items, not just placed ones
  return (
    <IslandItemsProvider profileId={profile.id}>
      <IslandPageContent profile={profile} />
    </IslandItemsProvider>
  );
};

export default IslandPage;
