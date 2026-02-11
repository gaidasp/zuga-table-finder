module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    extraFileExtensions: ['.svelte']
  },
  extends: [
    'eslint:recommended',
    'plugin:svelte/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      files: ['*.ts', '*.js'],
      parser: '@typescript-eslint/parser'
    }
  ],
  ignorePatterns: ['.svelte-kit', 'build', 'node_modules']
};
