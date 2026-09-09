// Minimal on purpose. The one rule that matters here is no-undef: three bugs
// this codebase shipped were identifiers that did not exist — a removed
// destructure, a deleted helper, a renamed constant — and none of them were
// caught by `tsc --noEmit`, which does not check .jsx, or by the Vite build,
// which happily bundles an undefined reference and fails at runtime instead.
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  // react-hooks is registered so the eslint-disable-next-line comments the
  // ported files already carry resolve, rather than erroring as unknown rules.
  plugins: ['react', 'react-hooks'],
  // react/jsx-uses-vars stops components used only inside JSX from being
  // reported as unused, which is what makes no-undef usable in a React file.
  extends: ['eslint:recommended', 'plugin:react/jsx-runtime'],
  rules: {
    'no-undef': 'error',
    'react/jsx-uses-vars': 'error',
    // Everything else is off: this is a safety net for real breakage, not a
    // style pass over 70 ported files.
    'no-unused-vars': 'off',
    'no-empty': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'no-control-regex': 'off',
    'no-misleading-character-class': 'off',
    'no-fallthrough': 'off',
    'no-cond-assign': 'off',
    'no-sparse-arrays': 'off',
    'no-irregular-whitespace': 'off',
    // while (true) with a break is how a stream reader is written.
    'no-constant-condition': ['error', { checkLoops: false }],
    'react-hooks/exhaustive-deps': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
};
