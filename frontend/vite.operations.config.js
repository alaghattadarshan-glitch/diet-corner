import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Operations App Vite Configuration (Port 5174)
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'operations-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];
          // Rewrite root and SPA routes to operations.html
          if (
            url === '/' || 
            (!url.includes('.') && 
             !url.startsWith('/api') && 
             !url.startsWith('/@') && 
             !url.startsWith('/src') && 
             !url.startsWith('/node_modules'))
          ) {
            req.url = '/operations.html';
          }
          next();
        });
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
