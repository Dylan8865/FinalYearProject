# wisdom-island

This workspace contains a Next.js app with a small 3D "Floating Island" demo at `/island`.

Quick start for the 3D demo:

1. Install the extra 3D dependencies (uses pnpm in this repo):

```powershell
pnpm add three @react-three/fiber @react-three/drei leva
```

2. Run the dev server:

```powershell
pnpm dev
```

3. Open http://localhost:3000/island to view the demo (`src/app/island/page.tsx`).

Notes:
- The page is a lightweight starting point: add models, textures, physics (cannon/rapier), or export presets.
- If you prefer npm or yarn, use the equivalent install commands.
