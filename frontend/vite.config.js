import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production build will:
// - Use /static/ as base URL
// - Store JS & CSS inside /assets folder
// - Output build inside Django static folder

export default defineConfig({
  base: '/static/',
  plugins: [react()],
  build: {
    outDir: '../backend/static',   // Adjust to your Django static folder
    emptyOutDir: true,
    assetsDir: 'assets',           // 👈 This creates /static/assets/
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
