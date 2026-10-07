import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Forward every /api/* call to the Spring Boot backend on Render
      "/api": {
        target: "https://smart-ai-classroom-server.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
