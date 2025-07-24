/**
 * @file GitHub REST API Service
 * 
 * Provides REST API operations for repositories, issues, pull requests, and commits.
 * Separate from GraphQL service which handles Projects v2.
 */

import { Octokit } from '@octokit/rest'

import { OrchestratorError } from '../../../core/error/OrchestratorError'
import { CommitDataDTO } from '../dto/CommitDataDTO'
import { IssueDataDTO } from '../dto/IssueDataDTO'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO'

/**
 * GitHub REST API Service for repository, issues, PRs, and commits
 * 
 * This service handles all REST API operations. Projects v2 operations
 * are handled by GitHubGraphQLService since they require GraphQL.
 */
export class GitHubRestApiService {
  private readonly octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token
    })
  }

  /**
   * Check if user has access to repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns True if accessible, false otherwise
   */
  async checkRepositoryAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({ owner, repo })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get authenticated user information
   * 
   * @returns GitHub username of authenticated user
   */
  async getAuthenticatedUser(): Promise<string> {
    try {
      const response = await this.octokit.rest.users.getAuthenticated()
      return response.data.login
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check GitHub token is valid', 'Verify token has required permissions', 'Check network connectivity']
      )
    }
  }

  /**
   * Get repository data
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns Repository data as DTO
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryDataDTO> {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo })
      // Type assertion: Octokit types are more complex than our DTOs expect
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return RepositoryDataDTO.fromGitHubApiResponse(response.data as any)
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check network connectivity'],
        { owner, repo }
      )
    }
  }

  /**
   * Search commits in a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Only commits created at or after this time
   * @returns Array of commit DTOs
   */
  async searchCommits(owner: string, repo: string, since: Date): Promise<CommitDataDTO[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        per_page: 100, // eslint-disable-line camelcase
        repo,
        since: since.toISOString()
      })

      return response.data
        .map(commit => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return CommitDataDTO.fromGitHubApiResponse(commit as any)
          } catch {
            // Skip invalid commits but don't fail entire operation
            return null
          }
        })
        .filter((commit): commit is CommitDataDTO => commit !== null)
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { owner, repo, since: since.toISOString() }
      )
    }
  }

  /**
   * Search issues in a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name  
   * @param since - Only issues updated at or after this time
   * @returns Array of issue DTOs
   */
  async searchIssues(owner: string, repo: string, since: Date): Promise<IssueDataDTO[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        direction: 'desc',
        owner,
        per_page: 100, // eslint-disable-line camelcase
        repo,
        since: since.toISOString(),
        sort: 'updated',
        state: 'all'
      })

      return response.data
        .map(issue => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return IssueDataDTO.fromGitHubApiResponse(issue as any)
          } catch {
            // Skip invalid issues but don't fail entire operation
            return null
          }
        })
        .filter((issue): issue is IssueDataDTO => issue !== null)
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { owner, repo, since: since.toISOString() }
      )
    }
  }

  /**
   * Search pull requests in a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Only PRs updated at or after this time
   * @returns Array of pull request DTOs
   */
  async searchPullRequests(owner: string, repo: string, since: Date): Promise<PullRequestDataDTO[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        direction: 'desc',
        owner,
        per_page: 100, // eslint-disable-line camelcase
        repo,
        sort: 'updated',
        state: 'all'
      })

      // Filter by date since API doesn't support since parameter for PRs
      const filteredPRs = response.data.filter(pr => {
        const updatedAt = new Date(pr.updated_at)
        return updatedAt >= since
      })

      return filteredPRs
        .map(pr => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return PullRequestDataDTO.fromGitHubApiResponse(pr as any)
          } catch {
            // Skip invalid PRs but don't fail entire operation
            return null
          }
        })
        .filter((pr): pr is PullRequestDataDTO => pr !== null)
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { owner, repo, since: since.toISOString() }
      )
    }
  }
}