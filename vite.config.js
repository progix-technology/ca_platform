import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Electron ke liye relative paths zaroori hain
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Aapka backend port
    },
  },
})