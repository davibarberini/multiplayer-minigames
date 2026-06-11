import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/multiplayer-minigames/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      shared: path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    host: true, // Listen on all network interfaces
  },
}));
