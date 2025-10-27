import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg','robots.txt','apple-touch-icon.png'],
        manifest: {
          name: 'Canhoto Digital',
          short_name: 'Canhoto',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0ea5e9',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          runtimeCaching: [
            { urlPattern: ({ url }) => url.origin === self.location.origin, handler: 'CacheFirst', options: { cacheName: 'static-assets' } },
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
          ],
        },
      }),
    ],
    server: { port: 5173, host: true },
    build: { sourcemap: true },
    define: { __APP_ENV__: env.APP_ENV },
  })
}
