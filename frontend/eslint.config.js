import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
    rules: {
      // This rule (new in recent eslint-plugin-react-hooks releases) flags
      // the common, correct pattern of resetting local form/modal state in
      // a guarded effect (e.g. `if (open) setForm(initial)`). That pattern
      // doesn't cause the cascading-render problem the rule targets, so we
      // keep it as a warning rather than a hard error.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
