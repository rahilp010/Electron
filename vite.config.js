import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer/src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@babel/plugin-proposal-throw-expressions',
        '@babel/plugin-syntax-import-meta',
        '@babel/plugin-proposal-json-strings',
        'dmg-license',
        'moment-timezone'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['better-sqlite3']
  }
})
