import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import eslintComments from 'eslint-plugin-eslint-comments'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    // Add eslint-comments plugin
    plugins: {
      'eslint-comments': eslintComments
    },
    // Override specific rules we don't want
    rules: {
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
  }
]
