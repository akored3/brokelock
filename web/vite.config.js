import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // stable vendor chunks so app-code edits don't bust the heavy caches
        manualChunks(id) {
          const m = id.match(/node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/);
          if (!m) return undefined;
          const pkg = m[1].replace(/\\/g, '/');
          if (pkg === 'react-day-picker') return 'picker';
          if (['viem', 'ox', 'abitype', 'isows', 'ws'].includes(pkg) || pkg.startsWith('@noble/') || pkg.startsWith('@scure/'))
            return 'viem';
          if (pkg === 'motion' || pkg === 'framer-motion' || pkg.startsWith('motion-')) return 'motion';
          return 'vendor';
        },
      },
    },
  },
});
