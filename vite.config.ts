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
        background_color: "#fbf3e0",
        theme_color: "#f5a623",
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
