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
  },
  {
    // Environment domain DTOs - allow snake_case for JSON data structures
    files: [
      'src/orchestrator-services/environment/dto/*.ts',
      'src/orchestrator-services/environment/services/*.ts'
    ],
    rules: {
      'camelcase': 'off' // JSON data structures use snake_case for consistency with API responses
    }
  },
  {
    // Argument parsing DTOs - allow snake_case for JSON data structures
    files: [
      'src/orchestrator-services/argument-parsing/dto/*.ts',
      'src/orchestrator-services/argument-parsing/services/*.ts'
    ],
    rules: {
      'camelcase': 'off' // JSON data structures use snake_case for consistency with external data formats
    }
  },
  {
    // Filesystem DTOs - allow snake_case for JSON data structures
    files: [
      'src/orchestrator-services/filesystem/dto/*.ts'
    ],
    rules: {
      'camelcase': 'off', // JSON data structures use snake_case for consistency with external data formats
      'cc-commands/require-typed-data-access': 'off' // DTOs use bounds-checked array access patterns
    }
  },
  {
    // Filesystem services - allow await in loops for sequential file operations
    files: [
      'src/orchestrator-services/filesystem/services/*.ts'
    ],
    rules: {
      'max-depth': 'off', // File operations often need nested directory traversal
      'no-await-in-loop': 'off' // Sequential file processing is often necessary
    }
  },
  {
    // File operations interface - allow BufferEncoding global type
    files: [
      'src/orchestrator-services/filesystem/interfaces/IFileOperationsService.ts'
    ],
    rules: {
      'no-undef': 'off' // BufferEncoding is a global Node.js type
    }
  },
  {
    // Test files - enforce type-safe mocking patterns and relax some rules for mock data
    files: ['test/**/*.ts', 'test/**/*.js', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'cc-commands/prefer-production-types-in-mocks': 'error', // Enforce production types over any/unknown in mocks
      'camelcase': 'off', // Allow snake_case in test mocks to match API responses
      'max-nested-callbacks': 'off', // Allow deeper nesting in test describe/it blocks
      'no-await-in-loop': 'off' // Allow await in loops for sequential test scenarios
    }
  }
]
