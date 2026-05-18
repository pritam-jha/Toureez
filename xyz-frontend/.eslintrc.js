/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Enforce explicit return types on functions for readability
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    // Disallow any except where explicitly commented
    '@typescript-eslint/no-explicit-any': 'warn',
    // Require await on async functions
    '@typescript-eslint/no-floating-promises': 'error',
    // Prevent accidental misuse of promises
    '@typescript-eslint/no-misused-promises': 'error',
    // Enforce consistent type imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    // No unused variables
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'build/'],
};
