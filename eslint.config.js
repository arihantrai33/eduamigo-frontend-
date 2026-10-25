import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // android/ and ios/ hold copies of the built website (and Gradle build output); test-results/ is Playwright's output.
  globalIgnores(['dist', 'android', 'ios', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Files that run in Node, not in the browser: build and test configuration, the end-to-end tests and scripts.
    files: ['*.config.js', 'e2e/**/*.{js,mjs}', '*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
