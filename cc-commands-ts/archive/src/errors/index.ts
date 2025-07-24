/**
 * @file Central export point for all error-related classes
 * 
 * This module provides:
 * - CommandError: The base error class that enforces recovery instructions
 * - Domain-specific error factories for creating appropriate errors
 * 
 * @example
 * ```typescript
 * import { CommandError, GitHubErrorFactory, ValidationErrorFactory } from './errors'
 * 
 * // Use factories for domain-specific errors
 * throw GitHubErrorFactory.authenticationError()
 * 
 * // Or create custom errors
 * throw new CommandError(
 *   originalError,
 *   ['Step 1 to fix', 'Step 2 to fix'],
 *   { context: 'data' }
 * )
 * ```
 */

export { CommandError } from './CommandError'
export { GitHubErrorFactory } from './GitHubErrorFactory'
export { ValidationErrorFactory } from './ValidationErrorFactory'