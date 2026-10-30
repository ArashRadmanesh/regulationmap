import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        -> dist/ : the installable web app (PWA) to host on any static server
// `npm run build:single` -> dist-single/index.html : one self-contained file (used for the preview)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: single ? [react(), viteSingleFile()] : [react()],
    define: { __SINGLE_FILE__: JSON.stringify(single) },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      copyPublicDir: !single,
      assetsInlineLimit: single ? 100000000 : 4096,
    },
  };
});
