import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      clientPort: 443,
      host: '0.0.0.0'
    },
    cors: true,
    // This allows any host to access the application
    // Note: For production, this should be restricted
    allowedHosts: ['.replit.dev', '.janeway.replit.dev', 'aed871b4-58cf-41a1-b855-0c8d2bbbfbea-00-1gnv87t7jgm7.janeway.replit.dev', '172.31.128.132']
  }
})