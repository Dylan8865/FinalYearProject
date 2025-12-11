# Click-to-Select Interaction Model - Implementation Guide

## Overview
Changed from drag-and-drop to click-to-select model to avoid conflicts with camera controls.

## New Interaction Flow

### 1. Selecting Items
**From Inventory Bar:**
- User clicks an item in inventory → Item becomes selected
- Visual feedback: Yellow border/highlight

**From Placed Blocks:**
- User clicks a placed block → Block becomes selected  
- Visual feedback: Yellow wireframe around block

### 2. Placing Selected Items
**To Island Grid:**
- User click a grid cell while holding selected item → Item places there
- Grid coordinates (`grid_x`, `grid_y`, `grid_z`) set
- Inventory coordinates (`pos_x`, `pos_y`) cleared

**To Inventory Slot:**
- User clicks empty inventory slot while holding selected block → Block moves to inventory
- Inventory coordinates (`pos_x`, `pos_y`) set
- Grid coordinates (`grid_x`, `grid_y`, `grid_z`) cleared

### 3. Opening Functional Items
- User **double-clicks** a functional block → Notion-like sidebar opens
- Only works on functional type items
- Single click still selects the item

## Required Code Changes

### State Management in IslandPage

**REPLACE:**
```typescript
const [draggedItem, setDraggedItem] = useState<any>(null);
const [isDraggingPlacedItem, setIsDraggingPlacedItem] = useState<string | null>(null);
```

**WITH:**
```typescript
const [selectedItem, setSelectedItem] = useState<{
  id: string;
  type: 'inventory' | 'placed';
  item: any;
} | null>(null);
```

### Handler Functions

**handleItemSelect** (when clicking inventory item):
```typescript
const handleItemSelect = (item: any) => {
  console.log("Item selected from inventory:", item);
  setSelectedItem({
    id: item.id,
    type: 'inventory',
    item: item
  });
};
```

**handlePlacedBlockClick** (when clicking placed block):
```typescript
const handlePlacedBlockClick = (itemId: string, itemType: string, itemName: string) => {
  const placedItem = islandItems.find(i => i.id === itemId);
  if (placedItem) {
    setSelectedItem({
      id: itemId,
      type: 'placed',
      item: placedItem
    });
  }
};
```

**handlePlacedBlockDoubleClick** (when double-clicking functional block):
```typescript
const handlePlacedBlockDoubleClick = (itemId: string, itemType: string, itemName: string) => {
  if (itemType === 'functional') {
    setFunctionalItemDialog({
      open: true,
      itemId,
      itemName
    });
  }
};
```

**handleCellClick** (when clicking island grid cell):
```typescript
const handleCellClick = async (
  islandId: string,
  cellId: string,
  x: number,
  z: number
) => {
  if (!selectedItem) return;
  
  const y = getNextYPosition(cellId);
  if (!isValidPosition(cellId, y)) {
    console.log("Invalid position!");
    return;
  }
  
  const [gridZ, gridX] = cellId.split("-").map(Number);
  const gridY = y;
  
  // Place the item
  await placeItemOnIsland(
    selectedItem.id,
    islandId,
    gridX,
    gridY,
    gridZ
  );
  
  // Clear selection
  setSelectedItem(null);
};
```

**handleInventorySlotClick** (when clicking inventory slot):
```typescript
const handleInventorySlotClick = async (slotX: number, slotY: number) => {
  if (!selectedItem || selectedItem.type !== 'placed') return;
  
  // Move placed item to inventory
  await moveToInventory(selectedItem.id, slotX, slotY);
  
  // Clear selection
  setSelectedItem(null);
};
```

### PlacedBlock Creation

**UPDATE PlacedBlock creation to:**
```typescript
const node = (
  <PlacedBlock
    itemId={item.id}
    itemName={itemName}
    itemType={itemType}
    modelUrl={modelUrl}
    isSelected={selectedItem?.id === item.id}
    onClick={handlePlacedBlockClick}
    onDoubleClick={handlePlacedBlockDoubleClick}
  />
);
```

### InventoryBar Updates

**ADD to InventoryButton:**
- `isSelected` prop to show highlight
- `onClick` handler to select item
- Visual feedback (border/glow) when selected

### IslandCanvas Updates

**REMOVE:**
- `isDraggingPlacedItem` prop (no longer needed)

**KEEP:**
- Grid cell click handlers  
- Placement logic

## Visual Feedback

### Selected Inventory Item
```css
.inventory-button.selected {
  border: 2px solid #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
```

### Selected Placed Block
- Yellow wireframe box around the block
- Slightly larger than the block itself
- Semi-transparent

### Hover States
- Grid cells highlight gold when hovering with selected item
- Inventory slots highlight when hovering with selected placed block

## Implementation Checklist

- [ ] Update state from draggedItem to selectedItem
- [ ] Update all handler functions
- [ ] Remove drag-related code
- [ ] Update PlacedBlock to use isSelected prop
- [ ] Update InventoryBar to support selection
- [ ] Add visual feedback for selection
- [ ] Test inventory → grid placement
- [ ] Test grid → inventory movement  
- [ ] Test grid → grid movement
- [ ] Test double-click on functional items
- [ ] Remove isDraggingPlacedItem references
- [ ] Update IslandCanvas props

## Benefits of This Approach

1. **No Camera Conflicts**: Click interactions don't interfere with OrbitControls
2. **Simpler Code**: Less state management, fewer edge cases
3. **Mobile Friendly**: Works better on touch devices
4. **Clearer UX**: Visual selection state is obvious
5. **Less Buggy**: No timing issues with press-and-hold detection

---

**Status**: Implementation in progress
**Next Steps**: Update IslandPage.tsx systematically
