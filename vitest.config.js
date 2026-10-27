import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    env: { VITE_FAVORIT_API_KEY: "test-key" },
    environment: "jsdom",
    include: ["tests/ui/**/*.test.jsx"],
    setupFiles: ["tests/ui/setup.js"],
    restoreMocks: true,
  },
});
