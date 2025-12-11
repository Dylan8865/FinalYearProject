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
import TerrainBlock from "./Block/TerrainBlocks";
import PlacedBlock from "./Block/PlacedBlock";

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
 * Model3D Component
 *
 * Loads and renders a 3D GLB model from Supabase storage using React Three Fiber.
 * The model file is loaded from the "items" bucket with pre-resolved public URLs.
 *
 * Features:
 * - Loads GLB model from provided URL using useGLTF hook
 * - Clones the scene to allow multiple instances of the same model
 * - Sets up shadow casting and receiving for proper lighting
 * - Scales the model to fit the island grid (0.5x scale)
 * - Automatically handles errors and falls back to TerrainBlock
 *
 * Note: This component should be wrapped in a Suspense boundary
 * Falls back to TerrainBlock if model doesn't exist or fails to load
 *
 * @param url - Full public URL to the GLB model file from Supabase storage
 */
function Model3D({ url }: { url: string }) {
  try {
    // Load the GLB model from the provided URL
    const { scene } = useGLTF(url);

    // Clone the scene to allow multiple instances
    const clonedScene = scene.clone();

    // Enable shadows on all meshes in the model
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return (
      <primitive
        object={clonedScene}
        scale={0.5}
      />
    );
  } catch (error) {
    console.error("Error loading 3D model:", error);
    // Fallback to brick block if model fails to load
    return <TerrainBlock name="Bricks" />;
  }
}

/**
 * ModelPlaceholder Component
 *
 * Displays a grass block while the 3D model is loading.
 * Used as a fallback in Suspense boundaries.
 */
function ModelPlaceholder() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.2, 1.6, 1.2]} />
      <meshStandardMaterial
        color="#8c8d52"
        roughness={0.5}
        metalness={0.2}
        opacity={0.5}
        transparent
      />
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
  const [removalDialog, setRemovalDialog] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
  } | null>(null);

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
      (item) =>
        item.island_id &&
        item.grid_x !== null &&
        item.grid_y !== null &&
        item.grid_z !== null
    );

    console.log("Loading placed items from database:", placedItems);

    // Convert placed items to placedObjects format
    const newPlacedObjects: Record<string, PlacedObject> = {};

    placedItems.forEach((item) => {
      // Find the island this item belongs to
      const island = islands.find((isl) => isl.id === item.island_id);
      if (!island) {
        console.warn("Island not found for item:", item.id);
        return;
      }

      // Grid configuration for this specific island
      const cellSize = 1.2;
      const gridSize = island.gridSize;
      const offset = (gridSize * cellSize) / 2 - cellSize / 2;

      // Convert grid coordinates to world coordinates
      const x = item.grid_x! * cellSize - offset;
      const z = item.grid_z! * cellSize - offset;
      const y = item.grid_y!;

      // Create cell ID (format: "row-col" where row=gridZ, col=gridX)
      const cellId = `${item.grid_z}-${item.grid_x}`;
      const positionKey = `${cellId}-${y}`;

      const modelUrl = item.item?.model_url;
      const itemType = (item.item?.type as "terrain" | "decorative" | "functional") || "terrain";
      const itemName = item.item?.name || "Unknown";

      // Create 3D model node using PlacedBlock wrapper
      const node = (
        <PlacedBlock
          itemId={item.id}
          itemName={itemName}
          itemType={itemType}
          modelUrl={modelUrl}
          isSelected={selectedPlacedItem === item.id}
          onClick={(clickedItemId, clickedType, clickedName) => {
            console.log("Placed block clicked:", { clickedItemId, clickedType, clickedName });

            // Check if user has an inventory item selected
            if (selectedPlacedItem && selectedPlacedItem !== clickedItemId) {
              const selectedItem = islandItems.find(i => i.id === selectedPlacedItem);

              // Only allow placement if:
              // 1. Selected item is from inventory (not already placed)
              // 2. Clicked block is a terrain type
              if (selectedItem &&
                selectedItem.grid_x === null &&
                selectedItem.grid_y === null &&
                selectedItem.grid_z === null &&
                itemType === "terrain") {

                console.log("Placing inventory item on top of terrain block!");

                // Get the island this terrain block belongs to
                if (item.island_id) {
                  handleCellDrop(item.island_id, cellId, x, z);
                }
              } else if (selectedItem &&
                (selectedItem.grid_x !== null ||
                  selectedItem.grid_y !== null ||
                  selectedItem.grid_z !== null) &&
                itemType === "terrain") {

                console.log("Moving placed item on top of terrain block!");

                // Get the island this terrain block belongs to
                if (item.island_id) {
                  handleCellDrop(item.island_id, cellId, x, z);
                }
              } else if (itemType !== "terrain") {
                console.log("Cannot place on non-terrain blocks");
                alert("Items can only be placed on terrain blocks, not on decorative or functional items.");
              }
            } else {
              // No item selected, or clicking the same item - try to select this item for moving
              // Only allow selecting if this is the top block (no blocks above it)
              if (hasBlockAbove(cellId, y)) {
                console.log("Cannot select block with items above it");
                alert("Cannot move this block - remove blocks above it first!");
                return;
              }

              console.log("Selecting placed item for moving:", clickedItemId);
              setSelectedPlacedItem(clickedItemId);
            }
          }}
          onDoubleClick={(itemId, type, name) => {
            console.log("Placed block double-clicked:", { itemId, type, name });

            // Check if there are blocks above - if so, prevent removal
            if (hasBlockAbove(cellId, y)) {
              console.log("Cannot remove block with items above it");
              alert("Cannot remove this block - remove blocks above it first!");
              return;
            }

            if (type === "functional") {
              // Open functional item editor
              setFunctionalItemDialog({ open: true, itemId, itemName: name });
            } else {
              // Show removal confirmation for terrain/decorative
              setRemovalDialog({ open: true, itemId, itemName: name });
            }
          }}
        />
      );

      newPlacedObjects[positionKey] = {
        x,
        y,
        z,
        itemId: item.id,
        itemName: item.item?.name || "Unknown",
        itemType: (item.item?.type as "terrain" | "decorative" | "functional") || "terrain",
        modelUrl,
        node,
        islandId: item.island_id || undefined, // Track which island this belongs to
      };
    });

    console.log("Loaded placed objects:", newPlacedObjects);
    setPlacedObjects(newPlacedObjects);
  }, [islandItems, islands, selectedPlacedItem]);

  /**
   * Handles selecting an item from inventory
   * Click an item to select it, then click a grid cell to place it
   */
  const handleInventoryItemClick = (item: any, _index: number) => {
    console.log("=== INVENTORY ITEM CLICKED ===");
    console.log("Item object:", item);
    console.log("Item ID:", item.id);
    console.log("Item name:", item.item?.name);
    console.log("Item model URL:", item.item?.model_url);
    console.log("Setting selectedPlacedItem to:", item.id);

    setSelectedPlacedItem(item.id);

    console.log("Selected item ID is now:", item.id);
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

    const modelUrl = selectedItem.item?.model_url;
    const itemType = (selectedItem.item?.type as "terrain" | "decorative" | "functional") || "terrain";
    const itemName = selectedItem.item?.name || "Unknown";

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
    const node = (
      <PlacedBlock
        itemId={selectedItem.id}
        itemName={itemName}
        itemType={itemType}
        modelUrl={modelUrl}
        isSelected={selectedPlacedItem === selectedItem.id}
        onClick={(clickedItemId, clickedType, clickedName) => {
          console.log("Placed block clicked:", { clickedItemId, clickedType, clickedName });

          // Check if user has an item selected (could be inventory or placed item)
          if (selectedPlacedItem && selectedPlacedItem !== clickedItemId) {
            const currentSelectedItem = islandItems.find(i => i.id === selectedPlacedItem);

            // Check if selected item is from inventory or already placed
            const isInventoryItem = currentSelectedItem &&
              currentSelectedItem.grid_x === null &&
              currentSelectedItem.grid_y === null &&
              currentSelectedItem.grid_z === null;

            const isPlacedItem = currentSelectedItem &&
              (currentSelectedItem.grid_x !== null ||
                currentSelectedItem.grid_y !== null ||
                currentSelectedItem.grid_z !== null);

            // Allow placement/movement if clicked block is terrain
            if ((isInventoryItem || isPlacedItem) && itemType === "terrain") {

              console.log(isInventoryItem ? "Placing inventory item on terrain!" : "Moving placed item to terrain!");

              // Place/move on top of this block
              handleCellDrop(islandId, cellId, x, z);
            } else if (itemType !== "terrain") {
              console.log("Cannot place on non-terrain blocks");
              alert("Items can only be placed on terrain blocks, not on decorative or functional items.");
            }
          } else {
            // No item selected, or clicking the same item - try to select this item for moving
            // Only allow selecting if this is the top block (no blocks above it)
            if (hasBlockAbove(cellId, y)) {
              console.log("Cannot select block with items above it");
              alert("Cannot move this block - remove blocks above it first!");
              return;
            }

            console.log("Selecting placed item for moving:", clickedItemId);
            setSelectedPlacedItem(clickedItemId);
          }
        }}
        onDoubleClick={(itemId, type, name) => {
          console.log("Placed block double-clicked:", { itemId, type, name });

          // Check if there are blocks above - if so, prevent removal
          if (hasBlockAbove(cellId, y)) {
            console.log("Cannot remove block with items above it");
            alert("Cannot remove this block - remove blocks above it first!");
            return;
          }

          if (type === "functional") {
            setFunctionalItemDialog({ open: true, itemId, itemName: name });
          } else {
            setRemovalDialog({ open: true, itemId, itemName: name });
          }
        }}
      />
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
        itemName: selectedItem.item?.name || "Unknown",
        itemType: (selectedItem.item?.type as "terrain" | "decorative" | "functional") || "terrain",
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
          isDraggingItem={!!selectedPlacedItem}
          isDraggingPlacedItem={false}
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
            onItemDragStart={handleInventoryItemClick}
            onItemDragEnd={() => { }}
            onSlotClick={handleInventorySlotClick}
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

      {/* Removal Confirmation Dialog */}
      {removalDialog && removalDialog.open && (
        <Dialog
          iconStyle="bg-red-600 text-white"
          icon={<span>⚠️</span>}
          title="Remove Block?"
          className="flex items-center justify-center"
          setIsDialogOpen={() => setRemovalDialog(null)}
        >
          <div className="p-4 space-y-4">
            <p className="text-center">
              Remove <strong>{removalDialog.itemName}</strong> from the island?
            </p>
            <p className="text-sm text-gray-600 text-center">
              It will be moved back to your inventory.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setRemovalDialog(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Find an empty inventory slot or stack with same item
                  const removedItem = islandItems.find(i => i.id === removalDialog.itemId);
                  if (!removedItem) {
                    console.error("Item not found");
                    setRemovalDialog(null);
                    return;
                  }

                  // Find next empty slot - no more stacking!
                  const occupiedSlots = new Set(
                    islandItems
                      .filter(i => i.pos_x !== null && i.pos_y !== null)
                      .map(i => `${i.pos_x}-${i.pos_y}`)
                  );

                  let targetSlotX, targetSlotY;

                  // Try hotbar first (pos_y = 0, pos_x = 0-9)
                  let found = false;
                  for (let x = 0; x < 10; x++) {
                    if (!occupiedSlots.has(`${x}-0`)) {
                      targetSlotX = x;
                      targetSlotY = 0;
                      found = true;
                      break;
                    }
                  }

                  if (!found) {
                    // Search rest of inventory (y = 1+)
                    for (let y = 1; y < 100; y++) {
                      for (let x = 0; x < 10; x++) {
                        if (!occupiedSlots.has(`${x}-${y}`)) {
                          targetSlotX = x;
                          targetSlotY = y;
                          found = true;
                          break;
                        }
                      }
                      if (found) break;
                    }
                  }

                  console.log("Moving to empty slot:", { targetSlotX, targetSlotY });

                  // Ensure values are defined
                  if (targetSlotX === undefined || targetSlotY === undefined) {
                    console.error("Could not find valid inventory slot");
                    setRemovalDialog(null);
                    return;
                  }

                  await moveToInventory(removalDialog.itemId, targetSlotX, targetSlotY);
                  setRemovalDialog(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Remove
              </button>
            </div>
          </div>
        </Dialog>
      )}
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
