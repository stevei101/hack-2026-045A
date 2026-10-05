import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 43211,
    proxy: {
      "/api": "http://127.0.0.1:43201",
      "/healthz": "http://127.0.0.1:43201",
      "/readyz": "http://127.0.0.1:43201",
    },
  },
});
