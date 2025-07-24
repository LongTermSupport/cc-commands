/**
 * @file Authentication Error Factory
 * 
 * Factory functions for creating GitHub authentication-related OrchestratorErrors
 * including token validation, scope issues, and CLI authentication problems.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError'

/**
 * Factory class for creating GitHub authentication-related errors
 * 
 * Handles various authentication scenarios including missing tokens,
 * expired tokens, insufficient scopes, and CLI authentication issues.
 * Provides specific recovery guidance for each authentication problem.
 * 
 * @example
 * ```typescript
 * throw AuthenticationError.notAuthenticated()
 * throw AuthenticationError.insufficientScopes(['repo'], ['repo', 'read:org'])
 * ```
 */
export const AuthenticationError = {
  /**
   * Create error for rate limit on authentication endpoint
   * 
   * @param resetTime - When rate limit resets
   * @returns OrchestratorError for auth rate limit
   */
  authRateLimited(resetTime: string): OrchestratorError {
    const resetDate = new Date(resetTime)
    const waitMinutes = Math.ceil((resetDate.getTime() - Date.now()) / 60_000)
    const rateLimitError = new Error('Rate limited on GitHub authentication endpoint')
    
    return new OrchestratorError(
      rateLimitError,
      [
        `Wait ${waitMinutes} minutes until rate limit resets`,
        'Use GitHub App authentication for higher limits',
        'Avoid rapid authentication validation requests',
        'Cache authentication status to reduce API calls'
      ],
      {
        authMethod: 'token',
        resetTime,
        suggestion: 'Implement authentication caching',
        type: 'GITHUB_AUTH_RATE_LIMITED',
        waitMinutes
      }
    )
  },

  /**
   * Create error for GitHub CLI not authenticated
   * 
   * @param version - CLI version if available
   * @returns OrchestratorError for unauthenticated CLI
   */
  cliNotAuthenticated(version?: string): OrchestratorError {
    const cliAuthError = new Error('GitHub CLI is installed but not authenticated')
    
    return new OrchestratorError(
      cliAuthError,
      [
        'Run `gh auth login` to authenticate',
        'Choose authentication method (browser or token)',
        'Select appropriate scopes for your needs',
        'Verify authentication with `gh auth status`'
      ],
      {
        authenticationCommand: 'gh auth login',
        authMethod: 'cli',
        cliInfo: {
          authenticated: false,
          installed: true,
          version: version || 'Unknown'
        },
        cliVersion: version || 'Unknown version',
        statusCommand: 'gh auth status',
        type: 'GITHUB_CLI_NOT_AUTHENTICATED'
      }
    )
  },

  /**
   * Create error for GitHub CLI not installed
   * 
   * @returns OrchestratorError for missing CLI
   */
  cliNotInstalled(): OrchestratorError {
    const cliError = new Error('GitHub CLI (gh) is required but not installed')
    
    return new OrchestratorError(
      cliError,
      [
        'Install GitHub CLI from: https://cli.github.com/',
        'On macOS: `brew install gh`',
        'On Ubuntu: `sudo apt install gh`',
        'On Windows: Download from GitHub releases',
        'After installation, run `gh auth login`'
      ],
      {
        authMethod: 'cli',
        cliInfo: {
          authenticated: false,
          installed: false
        },
        installationUrl: 'https://cli.github.com/',
        platformSpecificInstructions: {
          macOS: 'brew install gh',
          ubuntu: 'sudo apt install gh',
          windows: 'Download from GitHub releases'
        },
        type: 'GITHUB_CLI_NOT_INSTALLED'
      }
    )
  },

  /**
   * Create error for insufficient token scopes
   * 
   * @param currentScopes - Currently available scopes
   * @param requiredScopes - Required scopes for operation
   * @returns OrchestratorError for insufficient scopes
   */
  insufficientScopes(
    currentScopes: string[],
    requiredScopes: string[]
  ): OrchestratorError {
    const missingScopes = requiredScopes.filter(scope => !currentScopes.includes(scope))
    const scopeError = new Error(`GitHub token lacks required permissions. Missing: ${missingScopes.join(', ')}`)
    
    return new OrchestratorError(
      scopeError,
      [
        'Update your GitHub token to include these scopes:',
        ...requiredScopes.map(scope => `  - ${scope}`),
        'Or re-authenticate with `gh auth login --scopes "' + requiredScopes.join(',') + '"`',
        'Visit https://github.com/settings/tokens to update token permissions'
      ],
      {
        authMethod: 'token',
        currentScopes: currentScopes.join(', '),
        missingScopes: missingScopes.join(', '),
        requiredScopes: requiredScopes.join(', '),
        tokenInfo: {
          expired: false,
          scopes: currentScopes.join(', ')
        },
        tokenUpdateUrl: 'https://github.com/settings/tokens',
        type: 'GITHUB_INSUFFICIENT_SCOPES'
      }
    )
  },

  /**
   * Create error for missing authentication
   * 
   * @returns OrchestratorError for no authentication
   */
  notAuthenticated(): OrchestratorError {
    const authError = new Error('GitHub authentication required but not found')
    
    return new OrchestratorError(
      authError,
      [
        'Run `gh auth login` to authenticate with GitHub CLI',
        'Or set GITHUB_TOKEN environment variable',
        'Ensure authentication has required permissions',
        'Verify token is not expired'
      ],
      {
        authenticationMethods: ['GitHub CLI (gh auth login)', 'Environment variable (GITHUB_TOKEN)'],
        authMethod: 'cli',
        recommendation: 'GitHub CLI authentication is recommended for interactive use',
        type: 'GITHUB_NOT_AUTHENTICATED'
      }
    )
  },

  /**
   * Create error for organization access denied
   * 
   * @param organization - Organization name
   * @param requiredMembership - Whether organization membership is required
   * @returns OrchestratorError for org access denied
   */
  organizationAccessDenied(
    organization: string,
    requiredMembership: boolean = false
  ): OrchestratorError {
    const membershipMessage = requiredMembership
      ? `You must be a member of ${organization} organization`
      : `Access denied to ${organization} organization`
    const orgError = new Error(membershipMessage)
    
    return new OrchestratorError(
      orgError,
      [
        `Request membership to ${organization} organization`,
        'Ensure your GitHub token has org:read permissions',
        'Check organization visibility settings',
        'Verify you are using the correct organization name',
        ...(requiredMembership ? [`Contact ${organization} administrators for access`] : [])
      ],
      {
        authMethod: 'token',
        organization,
        orgUrl: `https://github.com/${organization}`,
        requiredMembership,
        requiredPermissions: ['read:org'],
        type: 'GITHUB_ORG_ACCESS_DENIED'
      }
    )
  },

  /**
   * Create error for expired tokens
   * 
   * @param expiresAt - Token expiration date
   * @returns OrchestratorError for expired token
   */
  tokenExpired(expiresAt?: Date): OrchestratorError {
    const expiredMessage = expiresAt 
      ? `GitHub token expired on ${expiresAt.toISOString()}`
      : 'GitHub token has expired'
    const tokenError = new Error(expiredMessage)
    
    return new OrchestratorError(
      tokenError,
      [
        'Generate a new GitHub personal access token',
        'Or re-authenticate with `gh auth login`',
        'Update GITHUB_TOKEN environment variable if using token directly',
        'Consider using GitHub Apps for longer-lived authentication'
      ],
      {
        authMethod: 'token',
        expiredAt: expiresAt?.toISOString() || 'Unknown expiration date',
        recommendation: 'Set token expiration to "No expiration" for CI/CD use',
        tokenInfo: {
          expired: true,
          expiresAt: expiresAt?.toISOString() || 'Unknown',
          scopes: ''
        },
        tokenRegenerationUrl: 'https://github.com/settings/tokens',
        type: 'GITHUB_TOKEN_EXPIRED'
      }
    )
  },

  /**
   * Create error for token validation failures
   * 
   * @param details - Validation error details
   * @returns OrchestratorError for validation failure
   */
  tokenValidationFailed(details?: string): OrchestratorError {
    const validationMessage = `GitHub token validation failed${details ? `: ${details}` : ''}`
    const validationError = new Error(validationMessage)
    
    return new OrchestratorError(
      validationError,
      [
        'Verify your GitHub token is valid',
        'Check that token has not been revoked',
        'Ensure token format is correct (starts with ghp_ or gho_)',
        'Try generating a new token if current one is corrupted',
        'Run `gh auth status` to check CLI authentication'
      ],
      {
        authMethod: 'token',
        details: details || 'Token validation failed',
        tokenFormats: ['Personal Access Token (ghp_)', 'OAuth Token (gho_)'],
        type: 'GITHUB_TOKEN_VALIDATION_FAILED',
        validationEndpoint: 'https://api.github.com/user'
      }
    )
  },
};