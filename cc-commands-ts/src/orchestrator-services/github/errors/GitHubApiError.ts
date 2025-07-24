/**
 * @file GitHub API Error Factory
 * 
 * Factory functions for creating GitHub API-related OrchestratorErrors
 * with specialized error handling for rate limiting, authentication issues,
 * and API response errors.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError'

/**
 * Factory class for creating GitHub API-related errors
 * 
 * Provides specialized error creation for GitHub API issues including
 * rate limiting, authentication failures, and API response errors.
 * All methods return OrchestratorError instances with appropriate context.
 * 
 * @example
 * ```typescript
 * throw GitHubApiError.rateLimited(0, '2025-01-24T16:30:00Z', 5000)
 * throw GitHubApiError.authenticationFailed('Invalid token')
 * ```
 */
export const GitHubApiError = {
  /**
   * Create error for authentication failures
   * 
   * @param details - Authentication error details
   * @returns OrchestratorError for authentication
   */
  authenticationFailed(details?: string): OrchestratorError {
    const errorMessage = `GitHub authentication failed${details ? `: ${details}` : ''}`
    const authError = new Error(errorMessage)
    
    return new OrchestratorError(
      authError,
      [
        'Run `gh auth login` to authenticate with GitHub',
        'Verify your GitHub token has required permissions',
        'Check that token is not expired',
        'Ensure token has access to the target organization/repository'
      ],
      { 
        details: details || 'No additional details provided',
        statusCode: 401,
        type: 'GITHUB_AUTH_FAILED'
      }
    )
  },

  /**
   * Create error for CLI command failures
   * 
   * @param command - GitHub CLI command that failed
   * @param exitCode - Process exit code
   * @param stderr - Error output from CLI
   * @returns OrchestratorError for CLI failures
   */
  cliCommandFailed(
    command: string,
    exitCode: number,
    stderr: string
  ): OrchestratorError {
    const cliError = new Error(`GitHub CLI command failed: ${command}`)
    
    return new OrchestratorError(
      cliError,
      [
        'Ensure GitHub CLI (gh) is installed and up to date',
        'Run `gh auth status` to verify authentication',
        'Check command syntax and arguments',
        'Try running the command manually to debug the issue'
      ],
      {
        command,
        exitCode,
        stderr: stderr.trim(),
        suggestion: 'Run command manually for more details',
        type: 'GITHUB_CLI_FAILED'
      }
    )
  },

  /**
   * Create error for invalid API responses
   * 
   * @param endpoint - API endpoint that returned invalid response
   * @param expectedFormat - What was expected
   * @param receivedData - What was actually received
   * @returns OrchestratorError for invalid responses
   */
  invalidResponse(
    endpoint: string,
    expectedFormat: string,
    receivedData: unknown
  ): OrchestratorError {
    const responseError = new Error(`Invalid response from GitHub API endpoint ${endpoint}`)
    
    return new OrchestratorError(
      responseError,
      [
        'Check if GitHub API format has changed',
        'Verify the API endpoint is correct',
        'Try the request again in case of temporary API issues',
        'Update cc-commands if GitHub API has been updated'
      ],
      {
        endpoint,
        expectedFormat,
        receivedData: JSON.stringify(receivedData, null, 2),
        receivedDataType: typeof receivedData,
        type: 'GITHUB_INVALID_RESPONSE'
      }
    )
  },

  /**
   * Create error for network/connection issues
   * 
   * @param operation - Operation that failed
   * @param cause - Underlying error cause
   * @returns OrchestratorError for network issues
   */
  networkError(operation: string, cause?: Error): OrchestratorError {
    const networkError = cause || new Error(`Network error during ${operation}`)
    
    return new OrchestratorError(
      networkError,
      [
        'Check your internet connection',
        'Verify GitHub API is accessible (https://api.github.com)',
        'Try the operation again after a short delay',
        'Check if GitHub is experiencing outages (https://githubstatus.com)'
      ],
      { 
        cause: cause?.message || 'Unknown network error',
        operation,
        type: 'GITHUB_NETWORK_ERROR',
        userAgent: 'cc-commands-github-client/1.0.0'
      }
    )
  },

  /**
   * Create error for project access issues
   * 
   * @param owner - Project owner
   * @param projectId - Project ID
   * @returns OrchestratorError for project access
   */
  projectAccessDenied(owner: string, projectId: string): OrchestratorError {
    const projectError = new Error(`Access denied to project ${projectId} owned by ${owner}`)
    
    return new OrchestratorError(
      projectError,
      [
        `Verify project ${projectId} exists and is accessible`,
        'Check that your GitHub token has project read permissions',
        'Ensure you have access to the organization/user account',
        'Confirm project ID is correct (numeric value)'
      ],
      { 
        owner,
        projectId,
        statusCode: 403, 
        type: 'GITHUB_PROJECT_ACCESS_DENIED'
      }
    )
  },

  /**
   * Create error for rate limiting scenarios
   * 
   * @param remaining - Remaining requests
   * @param resetTime - When rate limit resets
   * @param limit - Total requests allowed
   * @returns OrchestratorError for rate limiting
   */
  rateLimited(
    remaining: number,
    resetTime: string,
    limit: number
  ): OrchestratorError {
    const resetDate = new Date(resetTime)
    const waitMinutes = Math.ceil((resetDate.getTime() - Date.now()) / 60_000)
    
    const rateLimitError = new Error(`GitHub API rate limit exceeded. ${remaining} of ${limit} requests remaining.`)
    
    return new OrchestratorError(
      rateLimitError,
      [
        `Wait ${waitMinutes} minutes until rate limit resets at ${resetTime}`,
        'Use GitHub App authentication for higher rate limits (5000 req/hour)',
        'Implement exponential backoff for retries',
        'Consider caching API responses to reduce requests'
      ],
      { 
        rateLimit: { limit, remaining, resetTime },
        requestsExceeded: limit - remaining,
        resetTime,
        statusCode: 429,
        type: 'GITHUB_RATE_LIMITED',
        waitMinutes
      }
    )
  },

  /**
   * Create error for repository access issues
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param statusCode - HTTP status code
   * @returns OrchestratorError for repository access
   */
  repositoryAccessDenied(
    owner: string,
    repo: string,
    statusCode: number = 403
  ): OrchestratorError {
    const repoPath = `${owner}/${repo}`
    const accessError = new Error(`Access denied to repository ${repoPath}`)
    
    return new OrchestratorError(
      accessError,
      [
        `Verify repository ${repoPath} exists and is not private`,
        'Check that your GitHub token has access to this repository',
        'If repository is in an organization, ensure token has org access',
        'Confirm repository name and owner are spelled correctly'
      ],
      { 
        owner,
        repo,
        repository: repoPath, 
        statusCode, 
        type: 'GITHUB_REPO_ACCESS_DENIED'
      }
    )
  },
};