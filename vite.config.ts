import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH wird beim GitHub-Pages-Build auf "/BeatThatGame/" gesetzt.
// Lokal und beim Kopieren auf das Tablet bleibt es "/".
const base = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
  .BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Beat That! Spielleiter',
        short_name: 'Beat That!',
        description:
          'Digitaler Spielleiter fuer Beat That! - Chips, Punkte und Runden auf dem Tablet.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#10131a',
        theme_color: '#10131a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
