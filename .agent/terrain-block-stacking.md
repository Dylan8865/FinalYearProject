# Terrain Block Stacking Feature

## Overview
Implemented functionality to allow blocks to be placed on top of "terrain" type items, enabling vertical building on terrain foundations.

## Changes Made

### 1. Modified `IslandPage.tsx` - Placement Validation Logic

#### Updated `isValidPosition` Function (Lines 320-330)
**Previous Behavior:**
- Allowed placement at ground level (y=0)
- Allowed placement if ANY item existed below (y-1)

**New Behavior:**
- Allows placement at ground level (y=0) ✅
- Allows placement ONLY on top of "terrain" type items ✅
- Blocks placement on "decorative" or "functional" type items ❌

```typescript
const isValidPosition = (cellId: string, y: number): boolean => {
  if (y === 0) return true; // Ground level is always valid
  
  // Check if there's an item below
  const itemBelow = placedObjects[`${cellId}-${y - 1}`];
  if (!itemBelow) return false; // No support below
  
  // Only allow placement on top of terrain blocks
  return itemBelow.itemType === "terrain";
};
```

#### Updated Error Message (Line 386)
Added user-friendly alert explaining why placement failed:
```typescript
alert("⚠️ Invalid placement: Blocks can only be placed on the ground or on top of terrain blocks.");
```

## How It Works

### Database Schema
The `island-item` table tracks vertical stacking using `grid_y`:
```sql
grid_x smallint,  -- Horizontal X position
grid_y smallint,  -- Vertical Y position (stacking)
grid_z smallint,  -- Horizontal Z position
```

### Placement Rules
1. **Ground Level (`grid_y = 0`)**: Always allowed on any valid grid cell
2. **Higher Levels (`grid_y > 0`)**: 
   - Must have a terrain block at `grid_y - 1`
   - Cannot stack on decorative blocks (e.g., furniture, decorations)
   - Cannot stack on functional blocks (e.g., treasure chests, interactive items)

### Example Stacking Scenarios

✅ **Valid Placements:**
```
Y=2: [Grass Block]           ← Can place on terrain below
Y=1: [Stone Block] (terrain) ← Can place on terrain below
Y=0: [Dirt Block]  (terrain) ← Ground level
```

❌ **Invalid Placements:**
```
Y=2: [Block]                 ← INVALID: Decorative block below
Y=1: [Tree] (decorative)     ← Decorative blocks don't support stacking
Y=0: [Grass Block]           ← Ground level
```

```
Y=2: [Block]                 ← INVALID: Functional block below
Y=1: [Chest] (functional)    ← Functional blocks don't support stacking
Y=0: [Stone Block]           ← Ground level
```

✅ **Valid Multi-Level:**
```
Y=3: [Clay Block]    ← On terrain
Y=2: [Stone Block]   ← On terrain
Y=1: [Grass Block]   ← On terrain
Y=0: [Dirt Block]    ← Ground
```

## Item Types

Based on the database schema and `PlacedBlock.tsx`:

- **Terrain**: Foundation blocks (Grass, Stone, Sand, Wood, etc.)
  - Support vertical stacking ✅
  - Can be stacked infinitely
  
- **Decorative**: Visual elements (Trees, Furniture, etc.)
  - Do not support stacking ❌
  - Can only be placed on ground or terrain
  
- **Functional**: Interactive items (Chests, Buildings, etc.)
  - Do not support stacking ❌
  - Can only be placed on ground or terrain

## User Experience

### Placing Items
1. **Click an item in your inventory** to select it (e.g., click "Dirt" in the hotbar)
2. **Click a grid cell** to place on ground level (Y=0), OR
3. **Click a terrain block** to place on top of it (Y+1)
4. System automatically calculates the next Y position
5. Validates placement according to rules (terrain blocks support stacking)
6. Shows alert if placement is invalid

### Stacking on Terrain
- **Click a terrain block** with an inventory item selected → Places item on top ✅
- **Click a decorative block** → Shows error (cannot stack on decorative) ❌
- **Click a functional block** → Shows error (cannot stack on functional) ❌

### Removing Items
- **Double-click any placed block** → Opens removal dialog
- Confirm to move back to inventory

### Visual Feedback
- Golden highlight on grid cells when dragging
- Console logs for debugging placement
- Alert messages explaining why placement failed

## Testing Scenarios

To test the feature, try:

1. ✅ Place a terrain block (Grass) on the ground
2. ✅ Place another terrain block on top of it
3. ✅ Build a tower of terrain blocks
4. ❌ Try placing a terrain block on a tree (should fail)
5. ❌ Try placing a terrain block on a chest (should fail)
6. ✅ Place decorative/functional items on terrain blocks at Y=0

## Future Enhancements

Potential improvements:
1. Visual indication of valid placement positions when holding an item
2. Highlight terrain blocks differently to show they support stacking
3. Max stack height limit (e.g., 10 blocks)
4. Different stack rules for different terrain types
5. Structural integrity system (blocks need support on multiple sides)
6. Tooltip showing placement rules when hovering over items
