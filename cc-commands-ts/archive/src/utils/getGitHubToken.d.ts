/**
 * @file Utility to get GitHub token from various sources
 *
 * Tries to get token in this order:
 * 1. Provided token parameter
 * 2. GITHUB_TOKEN environment variable
 * 3. gh CLI tool authentication
 */
/**
 * Get GitHub token from available sources
 *
 * @param providedToken - Token explicitly provided by user
 * @returns GitHub token or undefined if none available
 */
export declare function getGitHubToken(providedToken?: string): string | undefined;
