/**
 * @file Factory for creating GitHub-specific CommandErrors
 *
 * This factory creates CommandError instances with GitHub-specific
 * recovery instructions and debug information.
 *
 * @example
 * ```typescript
 * // In a GitHub command
 * if (response.status === 401) {
 *   throw GitHubErrorFactory.authenticationError({
 *     endpoint: '/user/projects'
 *   })
 * }
 * ```
 */
import { ErrorContext } from '../types/DataTypes';
import { CommandError } from './CommandError';
/**
 * Factory for creating GitHub-related errors with appropriate recovery instructions
 */
export declare const GitHubErrorFactory: {
    /**
     * Create an authentication error
     *
     * @param context - Additional context about the authentication failure
     * @returns CommandError with GitHub auth recovery instructions
     */
    authenticationError(context?: ErrorContext): CommandError;
    /**
     * Create a GraphQL error
     *
     * @param query - The GraphQL query that failed
     * @param errors - GraphQL error details
     * @param context - Additional context
     * @returns CommandError with GraphQL debugging instructions
     */
    graphqlError(query: string, errors: unknown[], context?: ErrorContext): CommandError;
    /**
     * Create a permission denied error
     *
     * @param resource - What the user doesn't have permission to access
     * @param requiredScope - The OAuth scope needed
     * @param context - Additional context
     * @returns CommandError with permission fixing instructions
     */
    permissionDeniedError(resource: string, requiredScope?: string, context?: ErrorContext): CommandError;
    /**
     * Create a project not found error
     *
     * @param org - Organization name
     * @param projectNumber - Project number that wasn't found
     * @returns CommandError with project discovery instructions
     */
    projectNotFoundError(org: string, projectNumber: number): CommandError;
    /**
     * Create a rate limit error
     *
     * @param resetTime - When the rate limit resets
     * @param limit - The rate limit that was hit
     * @param remaining - Remaining requests (should be 0)
     * @param context - Additional context
     * @returns CommandError with rate limit recovery instructions
     */
    rateLimitError(resetTime: Date, limit?: number, remaining?: number, context?: ErrorContext): CommandError;
    /**
     * Create a repository not found error
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @returns CommandError with repository access instructions
     */
    repositoryNotFoundError(owner: string, repo: string): CommandError;
};
