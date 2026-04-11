import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const entry = fileURLToPath(new URL('src/index.ts', import.meta.url));
const tsconfigPath = fileURLToPath(new URL('tsconfig.build.json', import.meta.url));
const { default: dts } = await import('vite-plugin-dts');

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath,
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry,
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue', '@vueuse/core'],
    },
  },
});
