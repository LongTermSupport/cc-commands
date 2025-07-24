/**
 * @file Utility to get GitHub token from various sources
 *
 * Tries to get token in this order:
 * 1. Provided token parameter
 * 2. GITHUB_TOKEN environment variable
 * 3. gh CLI tool authentication
 */
import { execSync } from 'node:child_process';
/**
 * Get GitHub token from available sources
 *
 * @param providedToken - Token explicitly provided by user
 * @returns GitHub token or undefined if none available
 */
export function getGitHubToken(providedToken) {
    // 1. Use provided token if available
    if (providedToken) {
        return providedToken;
    }
    // 2. Check environment variable
    if (process.env['GITHUB_TOKEN']) {
        return process.env['GITHUB_TOKEN'];
    }
    // 3. Try to get from gh CLI
    try {
        const token = execSync('gh auth token', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'] // Suppress stderr
        }).trim();
        if (token && token.startsWith('gh')) {
            return token;
        }
    }
    catch {
        // gh CLI not available or not authenticated
    }
    return undefined;
}
