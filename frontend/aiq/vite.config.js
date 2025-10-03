import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // 1. Proxy for Standard API Calls (e.g., fetch('/api/data/chart'))
      "/api": {
        target: "http://127.0.0.1:5000", // Targets your locally running Flask app
        changeOrigin: true,
        // Rewrites /api/data/chart to /data/chart for the Flask app (if needed)
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // 2. Proxy for Socket.IO/WebSockets
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: true, // Critical for WebSockets
      },
    },
  },
});
