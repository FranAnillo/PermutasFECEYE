import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: mode === 'test' ? false : undefined,
    host: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  }
}))