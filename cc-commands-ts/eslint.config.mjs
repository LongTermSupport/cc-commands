import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import eslintComments from 'eslint-plugin-eslint-comments'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import customRules from './eslint-rules/index.mjs'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    // Add eslint-comments plugin and custom rules
    plugins: {
      'eslint-comments': eslintComments,
      'cc-commands': customRules
    },
    // Override specific rules we don't want
    rules: {
      // Custom rules for type safety
      'cc-commands/no-direct-abstract-types': 'error',
      'cc-commands/no-unsafe-type-casting': 'error',
      'cc-commands/no-string-based-service-args': 'error',
      'cc-commands/require-typed-data-access': 'warn', // Start as warning due to many violations
      'cc-commands/no-api-response-any': 'error',
      'unicorn/filename-case': 'off', // Allow PascalCase for TypeScript classes
      '@typescript-eslint/no-explicit-any': 'error', // Keep our strict no-any rule
      'eslint-comments/no-unlimited-disable': 'error', // Prevent eslint-disable abuse
      'jsdoc/check-tag-names': ['error', {
        definedTags: ['final'] // Allow @final tag for non-overridable methods
      }],
      // Disable dot-notation rule to respect TypeScript's noPropertyAccessFromIndexSignature
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'off',
      // Allow unlimited constructor parameters for DTO classes
      'max-params': ['error', { max: 4 }] // Default max for regular classes
    }
  },
  {
    // Special rules for DTO classes - allow unlimited constructor parameters
    files: ['**/*DTO.ts'],
    rules: {
      'max-params': 'off' // DTOs can have any number of constructor parameters
    }
  },
  {
    // GitHub API services - allow snake_case properties from GitHub API responses
    files: [
      'src/orchestrator-services/github/services/GitHubRestApiService.ts',
      'src/orchestrator-services/github/services/GitHubGraphQLService.ts',
      'src/orchestrator-services/github/types/GitHubApiTypes.ts'
    ],
    rules: {
      'camelcase': 'off' // GitHub API responses use snake_case properties
    }
  }
]
