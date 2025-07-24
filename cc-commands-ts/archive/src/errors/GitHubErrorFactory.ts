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

import { ErrorContext } from '../types/DataTypes'
import { CommandError } from './CommandError'

/**
 * Factory for creating GitHub-related errors with appropriate recovery instructions
 */
export const GitHubErrorFactory = {
  /**
   * Create an authentication error
   * 
   * @param context - Additional context about the authentication failure
   * @returns CommandError with GitHub auth recovery instructions
   */
  authenticationError(context?: ErrorContext): CommandError {
    return new CommandError(
      new Error('GitHub authentication failed'),
      [
        'Authenticate with GitHub CLI: gh auth login',
        'Or set GITHUB_TOKEN environment variable: export GITHUB_TOKEN=ghp_...',
        'For fine-grained PATs, ensure these scopes: repo, read:project',
        'Check token expiration: gh auth status',
        'Tokens can be created at: https://github.com/settings/tokens'
      ],
      { 
        ...context, 
        errorDomain: 'github', 
        errorType: 'authentication',
        timestamp: new Date().toISOString()
      }
    )
  },
  
  /**
   * Create a GraphQL error
   * 
   * @param query - The GraphQL query that failed
   * @param errors - GraphQL error details
   * @param context - Additional context
   * @returns CommandError with GraphQL debugging instructions
   */
  graphqlError(
    query: string, 
    errors: unknown[],
    context?: ErrorContext
  ): CommandError {
    const errorMessages = errors.map(e => {
      if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as {message: unknown}).message === 'string') {
        return (e as {message: string}).message
      }

      return JSON.stringify(e)
    }).join(', ')
    
    return new CommandError(
      new Error(`GitHub GraphQL query failed: ${errorMessages}`),
      [
        'Check the GraphQL query syntax',
        'Verify field names match the GitHub GraphQL schema',
        'Test query in GitHub GraphQL Explorer: https://docs.github.com/en/graphql/overview/explorer',
        'Check API version compatibility',
        'Some fields may require specific permissions',
        'Review error messages for specific field issues'
      ],
      {
        ...context,
        errorDomain: 'github',
        errorMessages,
        errors: JSON.stringify(errors),
        errorType: 'graphql',
        query: query.slice(0, 200) + (query.length > 200 ? '...' : '')
      }
    )
  },
  
  /**
   * Create a permission denied error
   * 
   * @param resource - What the user doesn't have permission to access
   * @param requiredScope - The OAuth scope needed
   * @param context - Additional context
   * @returns CommandError with permission fixing instructions
   */
  permissionDeniedError(
    resource: string,
    requiredScope?: string,
    context?: ErrorContext
  ): CommandError {
    const scopes = requiredScope ? [requiredScope] : ['repo', 'read:project', 'read:org']
    
    return new CommandError(
      new Error(`Permission denied: insufficient access to ${resource}`),
      [
        `Check your token permissions: gh auth status`,
        `Required scope(s): ${scopes.join(', ')}`,
        'Create a new token with proper scopes: https://github.com/settings/tokens/new',
        'For organization resources, ensure you are a member',
        'Some resources require admin or maintain permissions',
        'If using SSO, authorize your token for the organization'
      ],
      {
        ...context,
        errorDomain: 'github',
        errorType: 'permissionDenied',
        helpUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github',
        requiredScope: scopes.join(', '),
        resource
      }
    )
  },
  
  /**
   * Create a project not found error
   * 
   * @param org - Organization name
   * @param projectNumber - Project number that wasn't found
   * @returns CommandError with project discovery instructions
   */
  projectNotFoundError(org: string, projectNumber: number): CommandError {
    return new CommandError(
      new Error(`Project #${projectNumber} not found in organization ${org}`),
      [
        `List available projects: gh project list --owner ${org}`,
        'Verify the project number is correct (not the project ID)',
        `Check your access to organization: gh api orgs/${org}`,
        'For private projects, ensure you have appropriate permissions',
        'Project may have been deleted or archived',
        `View in browser: https://github.com/orgs/${org}/projects`
      ],
      {
        errorDomain: 'github',
        errorType: 'projectNotFound',
        organization: org,
        projectNumber,
        projectUrl: `https://github.com/orgs/${org}/projects/${projectNumber}`
      }
    )
  },
  
  /**
   * Create a rate limit error
   * 
   * @param resetTime - When the rate limit resets
   * @param limit - The rate limit that was hit
   * @param remaining - Remaining requests (should be 0)
   * @param context - Additional context
   * @returns CommandError with rate limit recovery instructions
   */
  rateLimitError(
    resetTime: Date, 
    limit: number = 60,
    remaining: number = 0,
    context?: ErrorContext
  ): CommandError {
    const now = new Date()
    const waitMinutes = Math.ceil((resetTime.getTime() - now.getTime()) / 60_000)
    const resetTimeLocal = resetTime.toLocaleTimeString()
    
    return new CommandError(
      new Error(`GitHub API rate limit exceeded (${remaining}/${limit} requests remaining)`),
      [
        `Rate limit will reset in ${waitMinutes} minutes (at ${resetTimeLocal})`,
        'For higher limits, authenticate: gh auth login',
        'Check current rate limits: gh api rate_limit | jq .rate',
        'Consider implementing caching to reduce API calls',
        'Use conditional requests with ETags when possible',
        'For CI/CD, use GITHUB_TOKEN from workflow context'
      ],
      { 
        ...context, 
        errorDomain: 'github', 
        errorType: 'rateLimit',
        limit,
        remaining,
        resetTime: resetTime.toISOString(),
        resetTimeLocal,
        waitMinutes
      }
    )
  },
  
  /**
   * Create a repository not found error
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns CommandError with repository access instructions
   */
  repositoryNotFoundError(owner: string, repo: string): CommandError {
    return new CommandError(
      new Error(`Repository ${owner}/${repo} not found or inaccessible`),
      [
        `Check if repository exists: gh repo view ${owner}/${repo}`,
        'For private repositories, ensure you have access',
        'Verify the repository name and owner are correct',
        `Clone the repository: gh repo clone ${owner}/${repo}`,
        'Check your GitHub permissions and organization membership',
        `View in browser: https://github.com/${owner}/${repo}`
      ],
      {
        errorDomain: 'github',
        errorType: 'repositoryNotFound',
        fullName: `${owner}/${repo}`,
        owner,
        repo,
        repoUrl: `https://github.com/${owner}/${repo}`
      }
    )
  },
};