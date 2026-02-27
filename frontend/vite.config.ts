import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/VPE/', // Для корректной работы путей на GitHub Pages (github.com/Migrabe/VPE)
  plugins: [react()],
})
