/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that don't affect code meaning (formatting, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or correcting tests
        'build',    // Changes to build system or dependencies
        'ci',       // Changes to CI configuration
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    // Scope is optional but recommended
    'scope-enum': [
      1,
      'always',
      [
        'cli',        // packages/cli
        'core',       // packages/core
        'generators', // packages/generators
        'client',     // packages/client
        'deps',       // dependency updates
        'release',    // release related
        'config',     // configuration changes
      ],
    ],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],
    // Subject max length
    'subject-max-length': [2, 'always', 100],
  },
};
