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
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
    },
  },
})
