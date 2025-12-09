# Inventory and Island Item Placement System

This document describes the implementation of the inventory bar, island grid system, 3D model rendering, and database persistence for the Wisdom Island application.

## Overview

The system allows users to:
1. View owned items in an inventory bar at the bottom of the screen
2. Drag items from inventory onto the island grid
3. See 3D models rendered at the placed positions
4. Have placements persisted to the database

## Architecture

### Components

#### 1. InventoryBar (`src/features/island/components/InventoryBar/InventoryBar.tsx`)

The inventory bar displays up to 10 items in a horizontal layout at the bottom of the screen.

**Features:**
- Shows item thumbnails from `image_cover_path` or a placeholder icon
- Supports drag-and-drop to place items on the island
- Items in positions (pos_x: 0-9, pos_y: 0) are displayed in the hotbar
- Provides buttons to open full inventory and store dialogs

**Usage:**
```tsx
<InventoryBar
  setIsDialogOpen={setIsDialogOpen}
  onItemDragStart={handleItemDragStart}
  onItemDragEnd={handleItemDragEnd}
/>
```

**Key Props:**
- `setIsDialogOpen` - Controls which dialog is currently open
- `onItemDragStart` - Callback when user starts dragging an item
- `onItemDragEnd` - Callback when user stops dragging an item

#### 2. Island Grid System (`src/features/island/components/IslandCanvas/Island.tsx`)

The grid system is rendered on top of the island surface and handles item placement.

**Features:**
- Visual grid overlay with connecting lines
- Highlights valid placement positions on hover
- Snaps items to grid positions when dropped
- Supports vertical stacking (multiple items per cell)
- Circular island shape with organic edges

**Configuration:**
```typescript
const cellSize = 1.2; // Size of each grid cell in world units
const gridSize = 5;   // Number of cells in each dimension
```

**Grid Positioning:**
- Uses `pos_x` and `pos_y` from `island-item` for 2D grid positioning
- `grid_x`, `grid_y`, `grid_z` are used for 3D placement on the island
- Items can be stacked vertically using the `y` coordinate

#### 3. 3D Model Rendering (`src/features/island/components/IslandPage.tsx`)

3D models are loaded from Supabase storage and rendered using React Three Fiber.

**Model Loading:**
- Models are stored in Supabase storage bucket: `items`
- Filename format: `{item_id}.glb` (e.g., `f612693e-b042-4a72-95f8-0736d7980a26.glb`)
- Uses `@react-three/drei`'s `useGLTF` hook for loading
- Wrapped in Suspense for progressive loading

**Example:**
```tsx
<Suspense fallback={<ModelPlaceholder />}>
  <Model3D url={modelUrl} />
</Suspense>
```

**Model Features:**
- Automatic cloning for multiple instances
- Shadow casting and receiving
- 0.5x scale to fit grid cells
- Fallback golden cube if model fails to load

### Database Schema

The system uses the following tables:

#### `island` Table
- `id` - UUID primary key
- `name` - Island name
- `level` - Island level
- `theme` - Island theme
- `profile_id` - Foreign key to profile

#### `island-item` Table
- `id` - UUID primary key
- `island_id` - Foreign key to island (NULL for inventory items)
- `item_id` - Foreign key to item
- `profile_id` - Foreign key to profile
- `grid_x`, `grid_y`, `grid_z` - 3D grid position on island
- `pos_x`, `pos_y` - 2D inventory position (for hotbar)
- `status` - Item status

#### `item` Table
- `id` - UUID primary key
- `name` - Item name
- `oxygen_rate` - Oxygen production rate
- `type` - Item type
- `image_cover_path` - Path to thumbnail image
- `model_path` - Path to 3D model (deprecated, use storage)

#### `profile` Table
- `id` - UUID primary key
- `name` - User name
- `email` - User email
- `oxygen` - Current oxygen amount
- `level` - User level

### Hooks and Services

#### `useIslandItems` Hook (`src/features/island/hooks/useIslandItems.ts`)

Custom hook for managing island items with CRUD operations.

**Features:**
- Fetches items from API with filtering by profile or island
- Generates model URLs from Supabase storage
- Optimistic updates for better UX
- Error handling with automatic rollback

**Functions:**
- `fetchIslandItems()` - Fetch all items
- `purchaseItem(itemId, profileId)` - Purchase item from store
- `placeItemOnIsland(itemId, islandId, gridX, gridY, gridZ)` - Place item on island
- `updateItemPosition(itemId, posX, posY)` - Update inventory position
- `deleteItem(itemId)` - Delete item

**Usage:**
```tsx
const {
  islandItems,
  loading,
  error,
  refetch,
  purchaseItem,
  placeItemOnIsland,
  updateItemPosition,
  deleteItem,
} = useIslandItems(profileId, islandId);
```

#### API Routes (`src/app/api/island-items/route.ts`)

RESTful API endpoints for island items:

- `GET /api/island-items?profile_id={id}&island_id={id}` - Fetch items
- `POST /api/island-items` - Create new item
- `PUT /api/island-items` - Update item placement
- `PATCH /api/island-items` - Update inventory position
- `DELETE /api/island-items?id={id}` - Delete item

### Supabase Storage

#### Items Bucket

Models are stored in the `items` bucket with the following structure:

```
items/
  └── {item_id}.glb
```

**Getting Model URL:**
```typescript
const supabase = createClient();
const { data: urlData } = supabase.storage
  .from("items")
  .getPublicUrl(`${item.id}.glb`);

const modelUrl = urlData.publicUrl;
```

## User Flow

### Purchasing Items

1. User clicks "Store" button in inventory bar
2. Store dialog opens showing available items
3. User clicks purchase button
4. Item is added to inventory via `purchaseItem()` function
5. Item appears in first available hotbar slot (pos_x: 0-9, pos_y: 0)

### Placing Items on Island

1. User drags item from inventory bar
2. Island grid highlights on hover
3. User drops item on desired cell
4. System calculates next available Y position (stacking)
5. 3D model is loaded and rendered at position
6. Database is updated with placement (via `placeItemOnIsland()`)
7. Item remains in hotbar but shows as placed

### Loading Placed Items

1. On page load, `useIslandItems()` fetches all items for user
2. Items with `island_id` are considered placed
3. Model URLs are generated from Supabase storage
4. 3D models are rendered at their grid positions
5. Grid system displays all placed objects

## Configuration

### Grid Size

The grid size can be configured in the Island component:

```typescript
const Island = ({
  gridSize = 5,  // Change this to adjust grid size
  // ...
}) => {
  // ...
}
```

### Cell Size

Adjust the cell size for different spacing:

```typescript
const cellSize = 1.2; // World units per cell
```

### Model Scale

Adjust the scale of 3D models:

```typescript
<primitive object={clonedScene} scale={0.5} /> // Change scale here
```

## Future Enhancements

### Recommended Improvements

1. **Database Persistence for Placement**
   - Currently, placement is tracked in component state
   - Add API call in `handleCellDrop` to persist to database
   - Update `island-item` table with grid coordinates

2. **Load Placed Items on Mount**
   - Fetch items with `island_id` on page load
   - Reconstruct `placedObjects` state from database
   - Render all previously placed items

3. **Drag to Rearrange**
   - Allow dragging placed items to new positions
   - Update database with new coordinates
   - Show visual feedback during drag

4. **Remove Items**
   - Add right-click or button to remove items
   - Return item to inventory (clear `island_id`)
   - Remove from grid

5. **Item Rotation**
   - Allow rotating items when placing
   - Store rotation in database
   - Apply rotation to 3D models

6. **Grid Size Configuration**
   - Make grid size configurable per island
   - Store in island table
   - Unlock larger grids at higher levels

## Troubleshooting

### Models Not Loading

1. Check that model file exists in Supabase storage:
   - Bucket: `items`
   - Path: `{item_id}.glb`

2. Verify public access to storage bucket

3. Check browser console for CORS errors

4. Verify model URL in component state

### Items Not Appearing in Hotbar

1. Check `pos_x` and `pos_y` values in database
   - Should be: `pos_x` 0-9, `pos_y` 0 for hotbar

2. Verify `island_id` is NULL for inventory items

3. Check `useIslandItems` is fetching correctly

4. Verify `IslandItemsProvider` wraps component

### Drag and Drop Not Working

1. Check that item has `draggable` prop set to true

2. Verify `onItemDragStart` and `onItemDragEnd` callbacks

3. Check that `isDraggingItem` state is being set

4. Verify grid cells have proper event handlers

## Code Examples

### Adding a New Item Type

```typescript
// 1. Add item to database
INSERT INTO item (id, name, oxygen_rate, type, image_cover_path)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Tree',
  5,
  'decoration',
  'https://example.com/tree.png'
);

// 2. Upload 3D model to Supabase storage
// Bucket: items
// Path: 12345678-1234-1234-1234-123456789012.glb

// 3. Purchase item for user
await purchaseItem('12345678-1234-1234-1234-123456789012', userId);
```

### Custom Grid Cell Validation

```typescript
const isValidPosition = (cellId: string, y: number): boolean => {
  if (y === 0) return true; // Ground level
  
  // Must have support below
  if (!placedObjects[`${cellId}-${y - 1}`]) return false;
  
  // Custom: Maximum stack height
  if (y > 5) return false;
  
  return true;
};
```

### Custom Model Loading

```typescript
function CustomModel3D({ url, scale = 0.5 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  const clonedScene = scene.clone();
  
  // Custom material setup
  clonedScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Apply custom material
      if (mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).metalness = 0.2;
        (mesh.material as THREE.MeshStandardMaterial).roughness = 0.8;
      }
    }
  });

  return <primitive object={clonedScene} scale={scale} />;
}
```

## Support

For questions or issues, please refer to:
- Main README in repository root
- Component-level JSDoc comments
- Supabase documentation for storage setup
- React Three Fiber documentation for 3D rendering
