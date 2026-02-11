import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    server: {
      deps: {
        inline: ['@testing-library/dom', '@testing-library/svelte']
      }
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '$lib': resolve(__dirname, './src/lib'),
      '$server': resolve(__dirname, './src/lib/server'),
      '$app': resolve(__dirname, './node_modules/@sveltejs/kit/src/runtime/app')
    }
  }
});
