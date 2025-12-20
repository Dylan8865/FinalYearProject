"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import PlacedBlock from "./IslandBlock/PlacedBlock";
import SidebarPage from "./Page/SidebarPage";
import { CameraControlsHandle } from "./IslandCanvas/CameraControls";
import { type OffscreenIsland } from "./IslandCanvas/IslandIndicators";
import RefreshIcon from "@/icons/RefreshIcon";
import {
  calculateIslandTotalManaRate,
  MAX_ACCUMULATION_TIME,
} from "@/utils/manaCalculations";
import AddIslandContent from "./Dialog/AddIslandContent";
import EditIslandContent from "./Dialog/EditIslandContent";
import IslandIcon from "@/icons/IslandIcon";
import ChangeUsernameContent from "./Dialog/ChangeUsernameContent";
import LockIcon from "@/icons/LockIcon";
import ChangePasswordContent from "./Dialog/ChangePasswordContent";
import AchievementContent from "./Dialog/AchievementContent";
import {
  ToastProvider,
  useToast,
} from "@/features/island/contexts/ToastContext";
import LoadingScreen from "./Shared/LoadingScreen";

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

const IslandPageContent = ({ profile: initialProfile }: IslandPageProps) => {
  const [profile, setProfile] = useState(initialProfile);
  const [isDialogOpen, setIsDialogOpen] = useState("");
  const { islands, loading, error, refetch, upgradeIsland } = useIslands();
  const { showToast } = useToast();

  // Calculate total level dynamically from islands
  const totalLevel = islands
    ? islands.reduce((acc, island) => acc + (island.level || 0), 0)
    : initialProfile.level;

  // Sync profile from server updates (e.g. username change) and dynamic level
  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: initialProfile.name,
      email: initialProfile.email,
    }));
  }, [initialProfile.name, initialProfile.email]);

  // Sync no_of_islands and level with the actual islands list
  useEffect(() => {
    if (!loading && islands) {
      setProfile((prev) => ({
        ...prev,
        no_of_islands: islands.length,
        level: totalLevel, // Update level based on islands calculation
      }));
    }
  }, [islands, loading, totalLevel]);

  // Background validation processing (for development)
  useEffect(() => {
    // Poll the validation endpoint every 30 seconds
    const interval = setInterval(async () => {
      try {
        await fetch("/api/process-validations", {
          method: "POST",
        });
      } catch (error) {
        // Silently fail - this is just background processing
        console.error("Background validation processing error:", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const [selectedPlacedItem, setSelectedPlacedItem] = useState<string | null>(
    null
  ); // Currently selected placed item ID
  const [placedObjects, setPlacedObjects] = useState<
    Record<string, PlacedObject>
  >({});
  const { islandItems, placeItemOnIsland, moveToInventory } =
    useIslandItemsContext();

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

  // Editing island state
  const [editingIsland, setEditingIsland] = useState<{
    id: string;
    name: string;
    genre: string;
    theme: string;
  } | null>(null);

  const handleOptimisticProfileUpdate = (newName: string) => {
    setProfile((prev) => ({
      ...prev,
      name: newName,
    }));
  };

  const handleEditIsland = (
    id: string,
    name: string,
    genre: string,
    theme: string
  ) => {
    setEditingIsland({ id, name, genre, theme });
    setIsDialogOpen("edit-island");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement instanceof HTMLElement &&
          document.activeElement.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      if (key === "s" && !cmdOrCtrl) {
        // Only open if nothing else is open to avoid conflicts
        if (!isDialogOpen && !sidebarContentPage?.open) {
          setIsDialogOpen("store");
        }
      } else if (key === "i" && !cmdOrCtrl) {
        // Only open if nothing else is open to avoid conflicts
        if (!isDialogOpen && !sidebarContentPage?.open) {
          setIsDialogOpen("inventory");
        }
      } else if (key === "escape") {
        // Close standard dialogs
        if (isDialogOpen) {
          setIsDialogOpen("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, sidebarContentPage]);

  const handleUpgradeIsland = async (id: string) => {
    // 1. Find current island level to determine cost
    const island = islands.find((i) => i.id === id);
    if (!island) return;

    const currentLevel = island.level || 1;
    if (currentLevel >= 3) return;

    // Costs must match UI: Lv 1->2 = 10M, Lv 2->3 = 100M
    const upgrades = {
      1: 10_000_000,
      2: 100_000_000,
    };
    const cost = upgrades[currentLevel as 1 | 2];
    const newLevel = currentLevel + 1;

    console.log(
      `Attempting upgrade for island ${id} to level ${newLevel} for ${cost} mana`
    );

    // 2. Call upgrade function
    const success = await upgradeIsland(id, newLevel, cost);

    if (success) {
      console.log("Island upgrade successful!");
      // 3. Update local profile mana immediately (optimistic update could be done, but refetch handles it mostly)
      // Since refetch is called inside useIslands, islands will update.
      // We also need to update profile mana in UI.
      setProfile((prev) => ({
        ...prev,
        mana: prev.mana - cost,
      }));

      showToast(`Island upgraded to Level ${newLevel}!`, "success");
    } else {
      console.error("Island upgrade failed");
      showToast(
        "Failed to upgrade island. Please check your connection.",
        "error"
      );
    }
  };

  // Mana system state - simplified
  interface IslandManaState {
    manaRate: number;
    accumulatedMana: number;
  }
  const [islandManaStates, setIslandManaStates] = useState<
    Record<string, IslandManaState>
  >({});
  const [manaPopup, setManaPopup] = useState<{
    visible: boolean;
    amount: number;
  }>({ visible: false, amount: 0 });

  /**
   * Get the next available Y position (vertical stacking) for a given grid cell
   * Items can be stacked vertically on the same grid cell
   *
   * @param islandId - ID of the island
   * @param cellId - Grid cell identifier (format: "row-col")
   * @returns Next available Y position for stacking
   */
  const getNextYPosition = (islandId: string, cellId: string): number => {
    let y = 0;
    while (placedObjects[`${islandId}-${cellId}-${y}`]) {
      y++;
    }
    return y;
  };

  /**
   * Check if a position is valid for placing an item
   * Items must be placed on ground level (y=0) or on top of a terrain block
   *
   * @param islandId - ID of the island
   * @param cellId - Grid cell identifier
   * @param y - Y position to check
   * @returns true if position is valid
   */
  const isValidPosition = (
    islandId: string,
    cellId: string,
    y: number
  ): boolean => {
    if (y === 0) return true; // Ground level is always valid

    // Check if there's an item below
    const itemBelow = placedObjects[`${islandId}-${cellId}-${y - 1}`];
    if (!itemBelow) return false; // No support below

    // Only allow placement on top of terrain blocks
    return itemBelow.itemType === "terrain";
  };

  /**
   * Check if there's a block stacked above this position
   * Used to prevent moving/removing blocks that support other blocks
   *
   * @param islandId - ID of the island
   * @param cellId - Grid cell identifier
   * @param y - Y position to check
   * @returns true if there's a block above
   */
  const hasBlockAbove = (
    islandId: string,
    cellId: string,
    y: number
  ): boolean => {
    return !!placedObjects[`${islandId}-${cellId}-${y + 1}`];
  };

  /**
   * Extracts item metadata from an island item
   */
  const getItemMetadata = (item: any) => ({
    modelUrl: item.item?.model_url,
    itemType:
      (item.item?.type as "terrain" | "decorative" | "functional") || "terrain",
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
    console.log("Placed block clicked (Unique ID):", {
      clickedItemId,
      clickedType,
      clickedName,
    });

    // Single-click: Open dialog (if no item selected for placement)
    if (!selectedPlacedItem || selectedPlacedItem === clickedItemId) {
      // Check if there are blocks above - if so, prevent dialog
      if (islandId && hasBlockAbove(islandId, cellId, y)) {
        console.log("Cannot interact with block that has items above it");
        showToast(
          "Cannot interact with this block - remove blocks above it first!",
          "error"
        );
        return;
      }

      // Open dialog for this item
      console.log("Opening dialog for item (Unique ID):", clickedItemId);
      if (clickedType == "functional") {
        setSidebarContentPage({
          open: true,
          itemId: clickedItemId,
          itemName: clickedName,
        });
      }
    } else {
      // User has a different item selected - try to place it here
      const currentSelectedItem = islandItems.find(
        (i) => i.id === selectedPlacedItem
      );

      // Only allow placement if clicked block is a terrain type
      if (currentSelectedItem && clickedType === "terrain") {
        const isInventoryItem =
          currentSelectedItem.grid_x === null &&
          currentSelectedItem.grid_y === null &&
          currentSelectedItem.grid_z === null;

        console.log(
          isInventoryItem
            ? "Placing inventory item on terrain!"
            : "Moving placed item to terrain!"
        );

        // Place/move on top of this block
        if (islandId && worldX !== undefined && worldZ !== undefined) {
          handleCellDrop(islandId, cellId, worldX, worldZ);
        }
      } else if (clickedType !== "terrain") {
        console.log("Cannot place on non-terrain blocks");
        showToast(
          "Items can only be placed on terrain blocks, not on decorative or functional items.",
          "error"
        );
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
    y: number,
    islandId?: string
  ) => {
    console.log("Placed block double-clicked:", { itemId, type, name });

    // Double-click: Select for moving
    // Only allow selecting if this is the top block (no blocks above it)
    if (islandId && hasBlockAbove(islandId, cellId, y)) {
      console.log("Cannot select block with items above it");
      showToast(
        "Cannot move this block - remove blocks above it first!",
        "error"
      );
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
    itemManaRate: number,
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
        itemManaRate={itemManaRate}
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
          handlePlacedBlockDoubleClick(
            clickedItemId,
            clickedType,
            clickedName,
            cellId,
            y,
            islandId
          )
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
    const duplicateItems = islandItems.filter(
      (item) => item.grid_x !== null && item.pos_x !== null
    );
    if (duplicateItems.length > 0) {
      console.error(
        "FOUND ITEMS IN BOTH LOCATIONS:",
        duplicateItems.map((item) => ({
          id: item.id,
          name: item.item?.name,
          grid: { x: item.grid_x, y: item.grid_y, z: item.grid_z },
          inv: { x: item.pos_x, y: item.pos_y },
        }))
      );
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
      const positionKey = `${island.id}-${cellId}-${y}`;

      const { modelUrl, itemType, itemName } = getItemMetadata(islandItem);

      // Create 3D model node using PlacedBlock wrapper
      const node = createPlacedBlockNode(
        islandItem.id, // Use UNIQUE island_item.id
        itemName,
        itemType,
        islandItem.item?.mana_rate ?? 0,
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

    console.log(
      "Loaded placed objects (Unique IDs verified):",
      Object.keys(newPlacedObjects).length,
      "items"
    );
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

    const selectedItem = islandItems.find(
      (item) => item.id === selectedPlacedItem
    );
    console.log("Selected item:", selectedItem);

    if (!selectedItem) {
      console.log("Selected item not found in islandItems");
      return;
    }

    // Check if item is currently on the island (has grid coordinates)
    if (
      selectedItem.grid_x !== null &&
      selectedItem.grid_y !== null &&
      selectedItem.grid_z !== null
    ) {
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
    const selectedItem = islandItems.find(
      (item) => item.id === selectedPlacedItem
    );

    console.log("Found selected item:", selectedItem);

    if (!selectedItem) {
      console.log("NO SELECTED ITEM - Exiting");
      return;
    }

    // Determine if this is an inventory item or a placed item being moved
    const isInventoryItem =
      selectedItem.grid_x === null &&
      selectedItem.grid_y === null &&
      selectedItem.grid_z === null;

    if (isInventoryItem) {
      console.log("Placing inventory item:", {
        id: selectedItem.id,
        name: selectedItem.item?.name,
        currentPos: {
          pos_x: selectedItem.pos_x,
          pos_y: selectedItem.pos_y,
        },
      });
    } else {
      console.log("Moving placed item:", {
        id: selectedItem.id,
        name: selectedItem.item?.name,
        currentPos: {
          grid_x: selectedItem.grid_x,
          grid_y: selectedItem.grid_y,
          grid_z: selectedItem.grid_z,
        },
      });
    }

    const y = getNextYPosition(islandId, cellId);

    if (!isValidPosition(islandId, cellId, y)) {
      console.log(
        "Invalid position - blocks can only be placed on ground or on terrain blocks!"
      );
      showToast(
        "Invalid placement: Blocks can only be placed on the ground or on top of terrain blocks.",
        "error"
      );
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

    const positionKey = `${islandId}-${cellId}-${y}`;

    // Check if this item is already placed somewhere (moving it)
    const oldPositionKey =
      selectedItem.grid_x !== null &&
      selectedItem.grid_y !== null &&
      selectedItem.grid_z !== null &&
      selectedItem.island_id
        ? `${selectedItem.island_id}-${selectedItem.grid_z}-${selectedItem.grid_x}-${selectedItem.grid_y}`
        : null;

    console.log("Old position key:", oldPositionKey);
    console.log("New position key:", positionKey);

    // Create PlacedBlock node for the newly placed item
    const node = createPlacedBlockNode(
      selectedItem.id,
      itemName,
      itemType,
      selectedItem.item?.mana_rate ?? 0,
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
      if (
        oldPositionKey &&
        newObjects[oldPositionKey]?.itemId === selectedItem.id
      ) {
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

  // reset camera button initialisation
  const controlsRef = useRef<CameraControlsHandle>(null);
  const [isCameraAtDefault, setIsCameraAtDefault] = useState(true);
  const [offscreenIslands, setOffscreenIslands] = useState<OffscreenIsland[]>(
    []
  );

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

  // Sync accumulated mana to database
  const syncManaToDb = useCallback(
    async (islandId: string, accumulatedMana: number) => {
      try {
        await fetch("/api/islands", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: islandId,
            accumulated_mana: Math.floor(accumulatedMana),
            last_updated_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("Failed to sync mana to DB:", err);
      }
    },
    []
  );

  // Initialize mana states for islands
  useEffect(() => {
    if (!islands || islands.length === 0) return;

    setIslandManaStates((prev) => {
      const newStates = { ...prev };
      const now = new Date();

      islands.forEach((island) => {
        if (!newStates[island.id]) {
          // Get placed items for this island
          const islandPlacedItems = islandItems.filter(
            (item) => item.island_id === island.id && item.grid_x !== null
          );
          const manaRate = calculateIslandTotalManaRate(
            { id: island.id, level: island.level || 1 },
            islandPlacedItems
          );

          // Get stored accumulated mana from DB
          const storedMana = Number(island.accumulated_mana || 0);

          // Calculate offline bonus since last update
          let offlineBonus = 0;
          if (island.last_updated_at) {
            const lastUpdate = new Date(island.last_updated_at);
            const elapsedSeconds = Math.max(
              0,
              (now.getTime() - lastUpdate.getTime()) / 1000
            );
            const cappedSeconds = Math.min(
              elapsedSeconds,
              MAX_ACCUMULATION_TIME
            );
            offlineBonus = Math.floor(manaRate * cappedSeconds);
          }

          const totalMana = storedMana + offlineBonus;

          console.log(`Island ${island.id} mana init:`, {
            storedMana,
            offlineBonus,
            totalMana,
            manaRate,
          });

          newStates[island.id] = {
            manaRate,
            accumulatedMana: totalMana,
          };
        }
      });
      return newStates;
    });
  }, [islands, islandItems]);

  // Update mana rates when placed items change
  useEffect(() => {
    if (!islands || islands.length === 0) return;

    setIslandManaStates((prev) => {
      const newStates = { ...prev };
      islands.forEach((island) => {
        const islandPlacedItems = islandItems.filter(
          (item) => item.island_id === island.id && item.grid_x !== null
        );
        const manaRate = calculateIslandTotalManaRate(
          { id: island.id, level: island.level || 1 },
          islandPlacedItems
        );
        if (newStates[island.id]) {
          newStates[island.id] = {
            ...newStates[island.id],
            manaRate,
          };
        }
      });
      return newStates;
    });
  }, [islandItems, islands]);

  // Increment mana every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIslandManaStates((prev) => {
        if (Object.keys(prev).length === 0) return prev;

        const updated: Record<string, IslandManaState> = {};
        Object.entries(prev).forEach(([islandId, state]) => {
          updated[islandId] = {
            ...state,
            accumulatedMana: state.accumulatedMana + state.manaRate,
          };
        });
        return updated;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Sync to database every minute (more frequent to prevent data loss)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      Object.entries(islandManaStates).forEach(([islandId, state]) => {
        // Only sync if value has changed significantly or enough time passed
        // For now, just sync if > 0 to be safe
        if (state.accumulatedMana > 1000) {
          syncManaToDb(islandId, state.accumulatedMana);
        }
      });
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [islandManaStates, syncManaToDb]);

  // Sync on window unload/refresh
  useEffect(() => {
    const handleUnload = () => {
      Object.entries(islandManaStates).forEach(([islandId, state]) => {
        if (state.accumulatedMana > 0) {
          // Use fetch with keepalive for reliable send on unload
          fetch("/api/islands", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: islandId,
              accumulated_mana: Math.floor(state.accumulatedMana),
              last_updated_at: new Date().toISOString(),
            }),
            keepalive: true,
          });
        }
      });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [islandManaStates]);

  // Handle mana collection from island click
  const handleIslandClick = useCallback(
    async (islandId: string) => {
      const state = islandManaStates[islandId];
      if (!state || state.accumulatedMana < 1) {
        console.log("No mana to collect");
        return true;
      }

      const manaToCollect = Math.floor(state.accumulatedMana);

      try {
        const response = await fetch("/api/islands/collect-mana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            island_id: islandId,
            mana_to_collect: manaToCollect,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to collect mana");
        }

        const data = await response.json();

        // Show collection popup
        setManaPopup({ visible: true, amount: data.collected }); // TODO: change to tooltip

        // Update profile mana
        setProfile((prev) => ({ ...prev, mana: data.new_mana }));

        // Reset island mana state after collection
        setIslandManaStates((prev) => ({
          ...prev,
          [islandId]: {
            ...prev[islandId],
            accumulatedMana: 0,
          },
        }));

        // Also sync the reset to DB
        syncManaToDb(islandId, 0);

        console.log(`Collected ${data.collected} mana from island ${islandId}`);
        return true;
      } catch (err) {
        console.error("Failed to collect mana:", err);
        return true;
      }
    },
    [islandManaStates, syncManaToDb]
  );

  const [isSigningOut, setIsSigningOut] = useState(false);

  if (loading || isSigningOut) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
        <div className="text-2xl text-white">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen max-w-[100dvw] overflow-hidden bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
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
          islandManaStates={islandManaStates}
          onIslandClick={handleIslandClick}
          onEditIsland={handleEditIsland}
          onUpgradeIsland={handleUpgradeIsland}
          userMana={profile.mana}
        />
      </div>

      {/* 2D UI Overlays */}
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
          className="animate-fade-in pointer-events-auto absolute right-6 top-6 z-10 flex items-center justify-center bg-transparent text-2xl transition-all duration-300 hover:rotate-180 md:bottom-6 md:left-6 md:right-auto md:top-auto"
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
          <ProfileContent
            userName={profile.name}
            userEmail={profile.email}
            setIsDialogOpen={setIsDialogOpen}
            setIsSigningOut={setIsSigningOut}
          />
        </Dialog>
      )}

      {isDialogOpen === "level" && (
        <Dialog
          iconStyle="bg-[#68a5ad] text-white"
          icon={<TrophyIcon />}
          title="Achievements"
          className="flex items-center justify-center"
          setIsDialogOpen={setIsDialogOpen}
        >
          <AchievementContent islands={islands} islandItems={islandItems} />
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
          <StoreContent
            profile={profile}
            onUpdateMana={(newMana) =>
              setProfile((prev) => ({ ...prev, mana: newMana }))
            }
          />
        </Dialog>
      )}

      {isDialogOpen === "island" && (
        <Dialog
          iconStyle="bg-[#5a706b] text-white text-2xl"
          icon={<IslandIcon />}
          title="Add Island"
          className="flex items-center justify-center"
          size="medium"
          setIsDialogOpen={setIsDialogOpen}
        >
          <AddIslandContent
            setIsDialogOpen={setIsDialogOpen}
            onIslandAdded={refetch}
            mana={profile.mana}
            onUpdateMana={(newMana) =>
              setProfile((prev) => ({ ...prev, mana: newMana }))
            }
          />
        </Dialog>
      )}

      {isDialogOpen === "edit-island" && editingIsland && (
        <Dialog
          title="Edit Island"
          icon={<IslandIcon />}
          iconStyle="bg-[#5a706b] text-white text-2xl"
          size="medium"
          setIsDialogOpen={setIsDialogOpen}
        >
          <EditIslandContent
            setIsDialogOpen={setIsDialogOpen}
            island={editingIsland}
            onIslandUpdated={refetch}
            noOfIslands={profile.no_of_islands}
          />
        </Dialog>
      )}

      {isDialogOpen === "change-username" && (
        <Dialog
          title="Change Username"
          icon={<UserIcon />}
          iconStyle="bg-[#6d3f33] text-white text-2xl"
          size="medium"
          setIsDialogOpen={setIsDialogOpen}
        >
          <ChangeUsernameContent
            setIsDialogOpen={setIsDialogOpen}
            onOptimisticUpdate={handleOptimisticProfileUpdate}
          />
        </Dialog>
      )}

      {isDialogOpen === "change-password" && (
        <Dialog
          title="Change Password"
          icon={<LockIcon />}
          iconStyle="bg-[#6d3f33] text-white text-2xl"
          size="medium"
          setIsDialogOpen={setIsDialogOpen}
        >
          <ChangePasswordContent setIsDialogOpen={setIsDialogOpen} />
        </Dialog>
      )}

      {/* Sidebar Content */}
      <SidebarPage
        isOpen={sidebarContentPage?.open}
        itemId={sidebarContentPage?.itemId}
        itemName={sidebarContentPage?.itemName}
        onClick={() =>
          setSidebarContentPage({ open: false, itemId: "", itemName: "" })
        }
      />
    </div>
  );
};

const IslandPage = ({ profile }: IslandPageProps) => {
  // Fetch all items for the profile (both inventory and placed items)
  // Don't pass islandId here - we need ALL items, not just placed ones
  return (
    <IslandItemsProvider profileId={profile.id}>
      <ToastProvider>
        <IslandPageContent profile={profile} />
      </ToastProvider>
    </IslandItemsProvider>
  );
};

export default IslandPage;
