module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
      '@typescript-eslint',
  ],
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
  },
  rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow implicit return types for functions
      '@typescript-eslint/no-explicit-any': 'off', // Allow using 'any' type
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Ignore unused variables with underscore prefix
      'no-console': 'off', // Allow using console.log
      'no-inner-declarations': 'off', // Allow function declarations within loops
      'prefer-const': 'error', // Enforce using const for variables that are not reassigned
      'brace-style': ['error', '1tbs', { allowSingleLine: true }], // Enforce one true brace style with single line
      'comma-dangle': ['error', 'always-multiline'], // Require trailing comma in multiline object and array literals
      'quotes': ['error', 'single'], // Use single quotes for strings
      'indent': ['error', 4, { SwitchCase: 1 }], // Use 4 spaces for indentation
      'semi': ['error', 'always'], // Require semicolons
  },
};
