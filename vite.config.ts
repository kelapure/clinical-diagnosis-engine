import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
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
              // Inject API key from .env.local
              const key = env.ANTHROPIC_API_KEY
              if (key) {
                proxyReq.setHeader('x-api-key', key)
                proxyReq.setHeader('anthropic-version', '2023-06-01')
              }

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
  }
})
