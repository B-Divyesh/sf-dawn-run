import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  {
    ...eslint.configs.recommended,
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.serviceworker } },
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts'],
    languageOptions: {
      ...config.languageOptions,
      globals: { ...globals.browser, ...globals.node },
    },
  })),
);
