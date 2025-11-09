import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react({})],
  root: "./src/renderer",
  build: {
    outDir: "../../.vite/renderer/main_window",
  },
  server: {
    port: 5173,
  },
});
