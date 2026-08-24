import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Customer App Vite Configuration (Port 5173)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  }
})
