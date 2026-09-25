import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps: { entries: ['index.html'] },
  server: {
    fs: {
      strict: true,
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/data/**',
        '**/docs/**',
        '**/.cache/**',
      ],
    },
  },
  build: { sourcemap: false },
});
