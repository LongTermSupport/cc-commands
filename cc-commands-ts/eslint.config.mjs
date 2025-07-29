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
      'cc-commands/require-typed-data-access': 'error', // Enforce proper type safety
      'cc-commands/no-api-response-any': 'error',
      'unicorn/filename-case': 'off', // Allow PascalCase for TypeScript classes
      '@typescript-eslint/no-explicit-any': 'error', // Keep our strict no-any rule
      'eslint-comments/no-unlimited-disable': 'error', // Prevent eslint-disable abuse
      // Disable JSDoc rules - TypeScript provides type safety, JSDoc is redundant (2025 best practice)
      'jsdoc/check-alignment': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/check-types': 'off',
      'jsdoc/implements-on-classes': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns-type': 'off',
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
