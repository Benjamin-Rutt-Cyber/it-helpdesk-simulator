module.exports = {
  extends: ['next/core-web-vitals'],
  env: {
    jest: true,
  },
  rules: {
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
  },
};