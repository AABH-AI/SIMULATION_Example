import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build works from GitHub Pages' project-site
  // subpath (https://aabh-ai.github.io/SIMULATION_Example/) regardless of
  // the repo name — the default base:'/' would 404 every asset there.
  base: './',
  plugins: [react()],
})
