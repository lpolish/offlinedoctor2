import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    headers: {
      // Enable COOP and COEP for SharedArrayBuffer support (needed for WebAssembly)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Configure for Transformers.js
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
    include: ['onnxruntime-web'],
  },
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        // Ensure WebAssembly files are properly handled
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
        // Improve chunking to reduce bundle size
        manualChunks: {
          'transformers': ['@xenova/transformers'],
          'react-vendor': ['react', 'react-dom'],
          'tauri-vendor': ['@tauri-apps/api', '@tauri-apps/plugin-opener'],
        },
      },
    },
    target: 'es2022', // Required for top-level await
    chunkSizeWarningLimit: 1000, // Increase limit for AI models
  },
  worker: {
    format: 'es',
  },
});
