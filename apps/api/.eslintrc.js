module.exports = {
  extends: ['../../.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};