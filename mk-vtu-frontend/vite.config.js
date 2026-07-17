import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            return 'deps';
          }
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      "islamic-exception-reward.ngrok-free.dev",
      ".ngrok-free.dev",
      "all"
    ],
    proxy: {
      '/socket.io': { 
        target: 'http://localhost:8800', 
        ws: true, 
        timeout: 120000, 
        proxyTimeout: 120000 
      },
      '/api': { target: 'http://localhost:8800', timeout: 120000, proxyTimeout: 120000 },
      '/auth': { target: 'http://localhost:8800', timeout: 120000, proxyTimeout: 120000 },
      '/login': { 
        target: 'http://localhost:8800',
        bypass: (req) => (req.method === 'GET' && req.headers.accept?.includes('text/html')) ? '/index.html' : null
      },
      '/register': { 
        target: 'http://localhost:8800',
        bypass: (req) => (req.method === 'GET' && req.headers.accept?.includes('text/html')) ? '/index.html' : null
      },
      '/continue-signup': { 
        target: 'http://localhost:8800',
        bypass: (req) => (req.method === 'GET' && req.headers.accept?.includes('text/html')) ? '/index.html' : null
      },
      '/user': { 
        target: 'http://localhost:8800',
        bypass: (req) => (req.method === 'GET' && req.headers.accept?.includes('text/html')) ? '/index.html' : null
      },
      '/transactions': { 
        target: 'http://localhost:8800',
        bypass: (req) => (req.method === 'GET' && req.headers.accept?.includes('text/html')) ? '/index.html' : null
      },
      '/fund': { target: 'http://localhost:8800' },
      '/withdraw': { target: 'http://localhost:8800' },
      '/buy-airtime': { target: 'http://localhost:8800' },
      '/buy-data': { target: 'http://localhost:8800' },
      '/verify-otp': { target: 'http://localhost:8800' },
      '/resend-otp': { target: 'http://localhost:8800' },
      '/reseller-assets': { target: 'http://localhost:8800' },
      '/manifest.json': { target: 'http://localhost:8800' },
    }
  }
})
