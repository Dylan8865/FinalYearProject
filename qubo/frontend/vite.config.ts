import { defineConfig, type Plugin } from 'vite'
import { createReadStream, existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const unityBrotliHeaders = (): Plugin => {
  const gameDirectory = fileURLToPath(new URL('./public/game/', import.meta.url))
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathname = req.url?.split('?')[0] ?? ''

    if (!pathname.startsWith('/game/') || !pathname.endsWith('.br')) {
      next()
      return
    }

    const filePath = resolve(gameDirectory, pathname.slice('/game/'.length))
    if (!filePath.startsWith(gameDirectory) || !existsSync(filePath)) {
      next()
      return
    }

    res.setHeader('Content-Encoding', 'br')
    res.setHeader('Content-Type', pathname.endsWith('.wasm.br') ? 'application/wasm' : 'application/octet-stream')
    createReadStream(filePath).pipe(res)
  }

  return {
    name: 'unity-brotli-headers',
    configureServer(server) {
      server.middlewares.stack.unshift({ route: '', handle: middleware })
    },
    configurePreviewServer(server) {
      server.middlewares.stack.unshift({ route: '', handle: middleware })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), unityBrotliHeaders()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Three.js is isolated behind the lazy model routes; the initial app bundle
    // stays small while the 3D engine is downloaded only when it is needed.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@react-three') || id.includes('/three/')) return 'three-vendor'
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts-vendor'
          if (id.includes('@supabase') || id.includes('/axios/')) return 'data-vendor'
          if (id.includes('react-icons')) return 'icons-vendor'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router') || id.includes('/zustand/')) return 'react-vendor'
          return undefined
        },
      },
    },
  },
})
