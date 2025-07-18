import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/templates/**/tests/**',  // Exclude template test files
      '**/templates/**/*.test.ts'   // Exclude any test files in templates
    ]
  }
});