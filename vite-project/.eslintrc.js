module.exports = {
  env: {
    browser: true,
    es2021: true,
  },

  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    semi: 'off',
    'import/prefer-default-export': 'off',
    indent: ['error', 2],
    'import/extensions': [
      'warn',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', 'tsx'] }],
  },
  plugins: [
    'react',
  ],
  extends: [
    /* 'eslint:recommended', */
    'airbnb-base',
    /* 'plugin:react/recommended', */
    'react-app',
    'prettier',
    'eslint-config-prettier',
    /* 'eslint-plugin-import', */
  ],

};
