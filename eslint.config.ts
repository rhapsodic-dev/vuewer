import { rhapsodic } from '@rhapsodic/eslint-config';

export default rhapsodic(
  {
    vue: {
      a11y: true,
    },
    typescript: true,
    ignores: [
      '.output/',
      '.data/',
      '.cache/',
      '.idea/',
      '.fleet/',
      '.DS_Store/',
      'dist/',
      'public/',
      'playground/dist/',
      'node_modules/',
      '**/logs/',
      '**/*.log',
    ],
  },
  [
    {
      files: ['components/icons/**/*.vue'],
      rules: { 'vue/max-len': 'off' },
    },
    {
      rules: {
        'no-empty-function': 'off',
        'ts/no-empty-function': 'off',
        'vue-a11y/click-events-have-key-events': 'off',
        'vue-a11y/no-static-element-interactions': 'off',
      },
    },
  ],
);
