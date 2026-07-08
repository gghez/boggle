import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["dictionary.bin", "definitions.bin", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Boggle FR",
        short_name: "Boggle",
        lang: "fr",
        description: "Boggle français : trouve un max de mots en 3 minutes.",
        start_url: ".",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f1726",
        theme_color: "#1565c0",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,bin,png,svg}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    }),
  ],
});
