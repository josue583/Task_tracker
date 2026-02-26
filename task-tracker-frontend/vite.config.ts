import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    // Don't hardcode HMR port — Vite will use the same port as the dev server.
    // That way updates work on 5173, 5174, or whatever port you use.
    hmr: true,
    watch: { usePolling: true },
  },
});
