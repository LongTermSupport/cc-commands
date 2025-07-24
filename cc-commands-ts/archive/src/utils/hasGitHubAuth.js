/**
 * @file Check if GitHub authentication is available
 */
import { getGitHubToken } from './getGitHubToken';
/**
 * Check if GitHub authentication is available from any source
 *
 * @param providedToken - Token explicitly provided by user
 * @returns true if authentication is available
 */
export function hasGitHubAuth(providedToken) {
    return getGitHubToken(providedToken) !== undefined;
}
