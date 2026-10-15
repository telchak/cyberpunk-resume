/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro's Vite config, so tests understand the same files as the site (Svelte components included).
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
