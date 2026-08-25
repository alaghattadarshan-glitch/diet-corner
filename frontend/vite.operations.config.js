import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'operations-rewrite',

      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0]

          if (
            url === '/' ||
            (
              !url.includes('.') &&
              !url.startsWith('/api') &&
              !url.startsWith('/@') &&
              !url.startsWith('/src') &&
              !url.startsWith('/node_modules')
            )
          ) {
            req.url = '/operations.html'
          }

          next()
        })
      },

      generateBundle(options, bundle) {
        const operationsHtml = bundle['operations.html']

        if (operationsHtml) {
          operationsHtml.fileName = 'index.html'
          bundle['index.html'] = operationsHtml
          delete bundle['operations.html']
        }
      }
    }
  ],

  server: {
    port: 5174,
    strictPort: true
  },

  build: {
    rollupOptions: {
      input: {
        operations: resolve(__dirname, 'operations.html')
      }
    }
  }
})
