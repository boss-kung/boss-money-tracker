import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👉 แก้ตรง base ให้เป็นชื่อ repo จริงของบอส
export default defineConfig({
  plugins: [react()],
  base: '/boss-money-tracker/',
})
