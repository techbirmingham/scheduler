import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@fullcalendar/react',
      '@fullcalendar/resource-timeline',
      '@fullcalendar/resource',
    ],
  },
  build: {
    rollupOptions: {
      external: ['@fullcalendar/resource'],
    },
  },
})