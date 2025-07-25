/**
 * @file Authentication Service Interface
 * 
 * Interface contract for GitHub authentication operations.
 * Provides token management and authentication validation.
 */

/**
 * Interface for GitHub authentication operations
 * 
 * This interface defines the contract for GitHub authentication management
 * including token retrieval, validation, and user information access.
 * Implementations should handle secure token management and validation.
 */
export interface IAuthService {
  /**
   * Get authenticated user information
   * 
   * Retrieves the username of the currently authenticated user.
   * Useful for confirming authentication context and user identity.
   * 
   * @param token - GitHub personal access token
   * @returns Username of the authenticated user
   * @throws {OrchestratorError} When token is invalid or API call fails
   */
  getAuthenticatedUser(token: string): Promise<string>

  /**
   * Get GitHub authentication token
   * 
   * Retrieves GitHub authentication token from GitHub CLI or other
   * configured authentication sources. The token should be ready
   * for use with GitHub API calls.
   * 
   * @returns GitHub personal access token
   * @throws {OrchestratorError} When authentication setup is incomplete or token retrieval fails
   */
  getGitHubToken(): Promise<string>

  /**
   * Validate GitHub token
   * 
   * Verifies that the provided token is valid and has appropriate
   * permissions for GitHub API access. Returns boolean result.
   * 
   * @param token - GitHub personal access token to validate
   * @returns True if token is valid and functional, false otherwise
   */
  validateToken(token: string): Promise<boolean>
}