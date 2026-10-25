import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // The Android and iOS apps (npm run build:mobile) load their files from the phone, so the API address must be a
  // full URL, given when building (.env.mobile or the shell). Nothing is hard-coded here.
  if (mode === 'mobile') {
    const api = loadEnv(mode, process.cwd(), '').VITE_API_URL || ''
    if (!/^https?:\/\//.test(api)) {
      throw new Error('Mobile build: set VITE_API_URL to the full API address, e.g. VITE_API_URL=https://api.example.com/api (see docs/MOBILE.md)')
    }
  }

  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Registered from main.jsx, and only on the website (not inside the mobile apps).
        injectRegister: false,
        manifest: {
          name: 'EduAmigo',
          short_name: 'EduAmigo',
          description: 'School app for students, parents, teachers and school staff',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          // EduAmigo icon (source: assets/*.svg). The old entry pointed at Vite's template sprite of social-media logos.
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: [
        'shrine-switch-pushover.ngrok-free.dev',
        'localhost',
        // gvps.localhost: a school's own address on this machine (see docs/audit/AUTH_AUDIT.md, local subdomains)
        '.localhost'
      ],
      // Local development: the app calls /api on its own origin and Vite forwards it to the
      // backend, so the browser never makes a cross-origin request. Production builds use
      // VITE_API_URL from the hosting provider and are not affected.
      proxy: {
        '/api': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8000', changeOrigin: true }
      }
    }
  }
})
