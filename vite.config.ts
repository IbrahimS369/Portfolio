import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Keep Three.js in its own long-cacheable chunk.
        manualChunks: { three: ['three'] },
      },
    },
  },
});

