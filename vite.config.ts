import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Strip browser-identifying headers so the API treats this as server-to-server
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            for (const header of proxyReq.getHeaderNames()) {
              if (header.startsWith('sec-')) {
                proxyReq.removeHeader(header);
              }
            }
          });
        },
      },
    },
  },
})
