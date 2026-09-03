import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/taiwan-weather-go/",
  plugins: [react()],
});
