import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // server: {
  //   headers: {
  //     "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  //     // Ensure COEP is NOT set during auth:
  //     // "Cross-Origin-Embedder-Policy": "require-corp"
  //   },
  // },
  // preview: {
  //   headers: {
  //     "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  //   },
  // },
});
