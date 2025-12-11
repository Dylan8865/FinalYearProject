# Wisdom Island - Drag & Drop System Implementation Guide

## Overview

This document describes the complete implementation of the drag-and-drop inventory system for Wisdom Island. The system allows users to move items between the inventory bar and island grid, with proper database persistence and visual feedback.

## Architecture

### 1. Database Schema

#### `island` Table
```sql
create table public.island (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text,
  level smallint,
  theme text,
  profile_id uuid references profile(id),
  genre text
);
```

#### `island-item` Table
```sql
create table public.island-item (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  title text,
  image_cover_path text,
  level smallint,
  
  -- Grid coordinates (when placed on island)
  grid_x smallint,  -- X position on island grid
  grid_y smallint,  -- Y position (vertical stacking)
  grid_z smallint,  -- Z position on island grid
  
  -- Inventory coordinates (when in inventory bar)
  pos_x smallint,   -- Slot number (0-9 for hotbar, 0-49 for full inventory)
  pos_y smallint,   -- Row number (0 for hotbar, 1-4 for inventory rows)
  
  island_id uuid references island(id),
  item_id uuid references item(id),
  profile_id uuid references profile(id),
  status text default 'unverified'
);
```

**Key Rules:**
- When item is **in inventory**: `grid_x`, `grid_y`, `grid_z` are **NULL**, `pos_x` and `pos_y` are set
- When item is **on island**: `pos_x` and `pos_y` are **NULL**, `grid_x`, `grid_y`, `grid_z` are set
- Items are NEVER deleted, only moved between inventory and island

#### `item` Table
```sql
create table public.item (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text,
  oxygen_rate number,
  type text,  -- 'terrain', 'decorative', or 'functional'
  oxygen_required number,
  image_cover_path text,
  model_path text  -- Path to 3D model GLB file
);
```

### 2. Block Types

There are **3 types of blocks** in the system:

#### Terrain Blocks
- **Allow stacking**: Other blocks can be placed on top
- **Examples**: Grass, Stone, Sand, Wood, Dirt, etc. (20 total types)
- **Behavior**: Click to select, can be moved
- **Location**: `src/features/island/components/Block/TerrainBlocks.tsx`

#### Decorative Blocks
- **No stacking**: Cannot place blocks on top
- **Examples**: Trees, Rocks, Flowers, Decorations
- **Behavior**: Click to select, can be moved
- **Location**: `src/features/island/components/Block/DecorativeBlock.tsx`

#### Functional Blocks
- **No stacking**: Cannot place blocks on top
- **Examples**: Houses, Workbenches, Storage, Machines
- **Behavior**: Single click opens sidebar (Notion-style), press-and-hold to drag
- **Location**: `src/features/island/components/Block/FunctionalBlock.tsx`

### 3. Component Architecture

```
IslandPage (Main Container)
├── StatusBar (Top UI)
├── InventoryBar (Bottom UI)
│   ├── InventoryButton (10 slots)
│   │   └── Shows item with quantity badge
│   └── Store/Inventory Dialog Buttons
├── IslandCanvas (3D Scene)
│   └── Island Components
│       ├── IslandBase (Terrain mesh)
│       ├── GrassBase (Ground overlay)
│       └── GridPlatform
│           ├── Grid cells (clickable)
│           └── PlacedBlocks
│               ├── TerrainBlock
│               ├── DecorativeBlock
│               └── FunctionalBlock
└── Dialogs (Profile, Store, Inventory, Functional Item)
```

### 4. Data Flow

#### Placing Item on Island
```
User Clicks Inventory Item
    ↓
handleItemDragStart() - Sets draggedItem state
    ↓
User Clicks Island Grid Cell
    ↓
handleCellDrop(islandId, cellId, x, z)
    ↓
placeItemOnIsland() API Call
    ↓
Database: SET grid_x, grid_y, grid_z, island_id
         CLEAR pos_x, pos_y
    ↓
Refetch island items
    ↓
UI Updates - Item removed from inventory, appears on island
```

#### Moving Item to Inventory
```
User Press-and-Holds Placed Block
    ↓
onPressStart() triggered after 500ms
    ↓
User Drags to Inventory Slot
    ↓
onInventorySlotDrop(itemId, slotX, slotY)
    ↓
moveToInventory() API Call
    ↓
Database: CLEAR grid_x, grid_y, grid_z, island_id
         SET pos_x, pos_y
    ↓
Refetch island items
    ↓
UI Updates - Item removed from island, appears in inventory
```

## Key Functions

### `useIslandItems` Hook
Located: `src/features/island/hooks/useIslandItems.ts`

**Provides:**
- `islandItems` - All items for the user (inventory + placed)
- `placeItemOnIsland(id, islandId, gridX, gridY, gridZ)` - Place item on island
- `moveToInventory(id, posX, posY)` - Move item to inventory
- `updateItemPosition(id, posX, posY)` - Update inventory position
- `removeItemFromIsland(id, profileId)` - Remove from island
- `deleteItem(id)` - Delete item permanently

### `PlacedBlock` Component
Located: `src/features/island/components/Block/PlacedBlock.tsx`

**Props:**
```typescript
interface PlacedBlockProps {
    itemId: string;
    itemName: string;
    itemType: "terrain" | "decorative" | "functional";
    modelUrl?: string;
    onClick?: (itemId: string, itemType: string, itemName: string) => void;
    onDragStart?: (itemId: string) => void;
}
```

**Behavior:**
- Renders appropriate block type (Terrain/Decorative/Functional)
- Handles click detection (quick click vs press-and-hold)
- Quick click → Opens functional item dialog (if functional)
- Press-and-hold (500ms) → Triggers drag start

### API Routes

#### `GET /api/island-items`
Fetch all island items for a user
```typescript
Query Params:
  profile_id: string  // Filter by user
  island_id: string   // Filter by island (null = inventory only)

Returns: IslandItemType[]
```

#### `PUT /api/island-items`
Place item on island
```typescript
Body: {
  id: string,           // island-item ID
  island_id: string,    // Island to place on
  grid_x: number,       // Grid coordinates
  grid_y: number,
  grid_z: number
}

Effect: Sets grid coords, clears pos coords
```

#### `POST /api/island-items/move-to-inventory`
Move item to inventory
```typescript
Body: {
  id: string,     // island-item ID
  pos_x: number,  // Inventory slot
  pos_y: number   // Inventory row
}

Effect: Clears grid coords, sets pos coords
```

## Inventory Management

### Quantity Tracking
Items with the same `item_id` at the same inventory position are **stacked**:
- `useIslandItems` groups items by `${item_id}-${pos_x}-${pos_y}`
- `quantity` field is computed as the group size
- Placing the last item removes it from inventory display
- Placing one of multiple items decrements the count

### Hotbar Display
**InventoryBar** displays items where:
- `pos_y === 0`
- `pos_x` between 0-9
- Items in these slots appear in the bottom bar

### Full Inventory
**InventoryContent Dialog** shows all items where:
- `island_id === null`
- `grid_x === null`
- Organized in a grid layout

## Loose Coupling & High Cohesion

### Component Responsibilities

**PlacedBlock** (Wrapper):
- User interaction handling
- Block type delegation
- Drag detection

**TerrainBlock** (Presentation):
- 3D rendering
- Texture generation
- No business logic

**DecorativeBlock** (Presentation):
- 3D rendering or placeholder
- No stacking allowed

**FunctionalBlock** (Presentation):
- 3D rendering or placeholder
- Sidebar opening capability

**IslandPage** (Controller):
- State management
- API calls
- Business logic

**useIslandItems** (Service):
- Data fetching
- Database operations
- State synchronization

### Interfaces

Components communicate via **props** and **callbacks**:
- No direct database access in UI components
- All data flows through context providers
- API layer handles all database mutations

## Functional Items

### Opening Functional Items
When a functional block is clicked:
1. `PlacedBlock` detects the click
2. Calls `onClick` callback with `itemType === "functional"`
3. `IslandPage` opens a dialog/sidebar
4. Dialog displays item-specific interface (Notion-style editor)

### Functional Item Dialog Structure
- **Sidebar**: Slides in from right
- **Content**: Rich text editor for item data
- **Actions**: Save, close, delete
- **Persistence**: Saves to `island-item.title` field

## Testing Checklist

### Inventory to Island
- [ ] Click item in inventory bar
- [ ] Click island grid cell
- [ ] Item appears on island
- [ ] Item removed from inventory (or count decremented)
- [ ] Database updated correctly
- [ ] Grid coordinates set, pos coordinates cleared

### Island to Inventory
- [ ] Press-and-hold placed block
- [ ] Drag to inventory slot
- [ ] Item appears in inventory
- [ ] Item removed from island
- [ ] Database updated correctly
- [ ] Pos coordinates set, grid coordinates cleared

### Stacking
- [ ] Place terrain block on ground
- [ ] Place another block on top
- [ ] Verify vertical stacking works
- [ ] Try to stack on decorative (should fail)
- [ ] Try to stack on functional (should fail)

### Functional Items
- [ ] Click functional block
- [ ] Sidebar/dialog opens
- [ ] Edit content
- [ ] Save changes
- [ ] Changes persist to database

## Future Enhancements

1. **Item Rotation**: Add rotation control when placing items
2. **Batch Operations**: Select multiple items to move at once
3. **Item Preview**: Show ghost model when dragging
4. **Undo/Redo**: Track placement history
5. **Grid Size**: Make grid size configurable per island level
6. **Custom Models**: Allow users to upload custom 3D models
7. **Item Attributes**: Add durability, energy cost, etc.
8. **Block Interactions**: Chain reactions between functional blocks

## Troubleshooting

### Items not appearing in inventory
- Check `island_id` is NULL
- Check `grid_x` is NULL
- Check `pos_x` and `pos_y` are set

### Items not appearing on island
- Check `island_id` matches current island
- Check `grid_x`, `grid_y`, `grid_z` are set
- Check `pos_x` and `pos_y` are NULL

### Drag not working
- Verify `onDragStart` callback is wired up
- Check press-and-hold timer (500ms)
- Ensure `isDraggingItem` state is managed

### Quantity not updating
- Check grouping logic in `useIslandItems`
- Verify items have same `item_id`
- Confirm they're at same `pos_x`, `pos_y`

## Code Examples

### Adding a New Item Type
```typescript
// 1. Insert into item table
INSERT INTO item (name, type, oxygen_rate)
VALUES ('Workbench', 'functional', 5);

// 2. Upload 3D model to Supabase storage
// Bucket: items
// Path: {item_id}.glb

// 3. Purchase item for user
await purchaseItem(itemId, userId);

// 4. Item appears in inventory automatically
```

### Custom Functional Block Behavior
```typescript
// In FunctionalBlock.tsx
const handleOpen = () => {
  if (itemName === "Workbench") {
    // Open crafting interface
    onOpen?.(itemId, "crafting");
  } else if (itemName === "Storage") {
    // Open storage interface
    onOpen?.(itemId, "storage");
  }
};
```

## Performance Considerations

- 3D models use `Suspense` for progressive loading
- Textures generated with `useMemo` to avoid recreation
- Island items fetched once, updated optimistically
- Database queries filtered by `profile_id` and `island_id`
- Grid rendering skips cells outside island radius

## Accessibility

- Keyboard navigation support (Tab, Enter, Space)
- ARIA labels on interactive elements
- Screen reader announcements for state changes
- Color-blind friendly grid highlighting
- High contrast mode support

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
**Author**: Antigravity AI
