// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import oxlint from 'eslint-plugin-oxlint'

export default withNuxt(
  // Disable rules that oxlint handles (prevents conflicts)
  oxlint.configs['flat/recommended'],

  // Additional ESLint-specific rules oxlint doesn't cover
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Enforce consistent naming conventions (TypeScript files only)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid'
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allowDouble',
          trailingUnderscore: 'forbid'
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'property',
          format: ['camelCase', 'snake_case', 'UPPER_CASE'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'property',
          format: null,
          // Allow HTTP headers, route paths, and XML attributes that require quotes
          filter: {
            regex: '^(Content-Type|User-Agent|@version|/)$',
            match: true
          }
        },
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE']
        }
      ],

      // Enforce explicit accessibility modifiers
      '@typescript-eslint/explicit-member-accessibility': ['error', {
        accessibility: 'explicit'
      }]
    }
  },

  // Rules for all files
  {
    rules: {
      // Prevent accidental console logs in production
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },

  // Allow console.log in scripts directory (CLI tools need logging)
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off'
    }
  }
)
