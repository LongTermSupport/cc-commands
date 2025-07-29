/**
 * @file GitHub Authentication Service
 * 
 * Handles GitHub authentication token management and validation.
 * Uses gh CLI for token retrieval and Octokit for validation.
 */

import { Octokit } from '@octokit/rest'
import { execSync } from 'node:child_process'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * GitHub Authentication Service
 * 
 * This service handles GitHub authentication token management.
 * It uses the GitHub CLI for token retrieval and Octokit for validation.
 */
export class AuthService {
  /**
   * Get authenticated user information
   * 
   * @param token - GitHub authentication token
   * @returns GitHub username of authenticated user
   * @throws {OrchestratorError} When authentication fails
   */
  async getAuthenticatedUser(token: string): Promise<string> {
    try {
      const octokit = new Octokit({ auth: token })
      const response = await octokit.rest.users.getAuthenticated()
      return response.data.login
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Check if GitHub token is valid',
          'Verify token has required permissions',
          'Run "gh auth refresh" to refresh token',
          'Check network connectivity to GitHub'
        ],
        { token: token ? `${token.slice(0, 7)}...` : 'none' }
      )
    }
  }

  /**
   * Get GitHub token from gh CLI
   * 
   * @returns GitHub authentication token
   * @throws {OrchestratorError} When token retrieval fails
   */
  async getGitHubToken(): Promise<string> {
    try {
      const token = execSync('gh auth token', { 
        encoding: 'utf8',
        timeout: 5000 // 5 second timeout
      }).trim()
      
      if (!token) {
        throw new OrchestratorError(
          new Error('GitHub CLI returned empty token'),
          [
            'Run "gh auth login" to authenticate with GitHub',
            'Ensure GitHub CLI is properly configured',
            'Check if token has required permissions'
          ]
        )
      }
      
      return token
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Install GitHub CLI: https://cli.github.com/',
          'Run "gh auth login" to authenticate',
          'Ensure gh CLI is in your PATH'
        ]
      )
    }
  }

  /**
   * Validate GitHub token by making test API call
   * 
   * @param token - GitHub authentication token to validate
   * @returns True if token is valid, false otherwise
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: token })
      await octokit.rest.users.getAuthenticated()
      return true
    } catch {
      return false
    }
  }
}