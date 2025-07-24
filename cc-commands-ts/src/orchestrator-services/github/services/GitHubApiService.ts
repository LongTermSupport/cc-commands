/**
 * @file GitHub API Service
 * 
 * Low-level wrapper for GitHub API interactions using GitHub CLI.
 * Provides methods for fetching data from GitHub's REST API, GraphQL API,
 * and CLI commands. Handles rate limiting, error recovery, and data transformation.
 */

import type { 
  GitHubCliRepositoryOutput,
  GitHubCommitResponse,
  GitHubIssueResponse,
  GitHubProjectV2Response,
  GitHubPullRequestResponse
} from '../types/GitHubApiTypes.ts'

import { OrchestratorError } from '../../../core/error/OrchestratorError.ts'
import { CLI_COMMANDS, PAGINATION, RATE_LIMITS } from '../constants/GitHubConstants.ts'
import { CommitDataDTO } from '../dto/CommitDataDTO.ts'
import { IssueDataDTO } from '../dto/IssueDataDTO.ts'
import { ProjectDataDTO } from '../dto/ProjectDataDTO.ts'
import { ProjectItemDTO } from '../dto/ProjectItemDTO.ts'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO.ts'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO.ts'
import { AuthenticationError } from '../errors/AuthenticationError.ts'
import { GitHubApiError } from '../errors/GitHubApiError.ts'

/**
 * GitHub CLI wrapper interface for dependency injection
 */
export interface IGitHubCliWrapper {
  /**
   * Check if GitHub CLI is authenticated
   * 
   * @returns Promise resolving to authentication status
   */
  checkAuthentication(): Promise<boolean>
  
  /**
   * Execute a GitHub CLI command
   * 
   * @param command - The gh command to execute
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise resolving to command output
   */
  executeCommand(command: string, timeout?: number): Promise<string>
  
  /**
   * Get current GitHub CLI version
   * 
   * @returns Promise resolving to version string
   */
  getVersion(): Promise<string>
}

/**
 * GitHub API Service for low-level API operations
 * 
 * Provides a comprehensive wrapper around GitHub's APIs using the GitHub CLI.
 * Handles authentication, rate limiting, error recovery, and data transformation
 * to DTOs for use by higher-level services.
 * 
 * @example
 * ```typescript
 * const apiService = new GitHubApiService(cliWrapper)
 * const repo = await apiService.getRepository('owner', 'repo-name')
 * const project = await apiService.getProjectV2('owner', '123')
 * ```
 */
export class GitHubApiService {
  private readonly retryDelays: number[] = []
  
  constructor(private readonly ghCliWrapper: IGitHubCliWrapper) {
    // Initialize exponential backoff delays
    for (let i = 0; i < RATE_LIMITS.MAX_RETRIES; i++) {
      this.retryDelays.push(
        Math.min(
          RATE_LIMITS.RETRY_DELAY_MS * RATE_LIMITS.BACKOFF_MULTIPLIER**i,
          RATE_LIMITS.MAX_RETRY_DELAY_MS
        )
      )
    }
  }

  /**
   * Get issue comments for activity tracking
   * 
   * @param _owner - Repository owner
   * @param _repo - Repository name
   * @param _since - Only comments after this date
   * @returns Promise resolving to comment data
   */
  async getIssueComments(_owner: string, _repo: string, _since: Date): Promise<Array<{
    author: string
    createdAt: string
    id: string
    issueNumber: number
  }>> {
    await this.ensureAuthenticated()
    
    // This would require a more complex implementation with multiple API calls
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Get project items from GitHub Projects v2
   * 
   * @param owner - Project owner
   * @param projectId - Numeric project ID
   * @param maxItems - Maximum items to fetch (default: 100)
   * @returns Promise resolving to array of ProjectItemDTOs
   */
  async getProjectItems(
    owner: string, 
    projectId: string, 
    maxItems: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<ProjectItemDTO[]> {
    await this.ensureAuthenticated()
    
    const command = `${CLI_COMMANDS.PROJECT.ITEM_LIST
      .replace('{project_id}', projectId)
      .replace('{owner}', owner)} --limit ${maxItems}`
    
    try {
      const output = await this.executeWithRetry(command)
      const itemsData = JSON.parse(output) as Array<{
        content?: unknown
        fields?: unknown
        id: string
        type: string
      }>
      
      return itemsData.map(item => ProjectItemDTO.fromCliOutput(item as Parameters<typeof ProjectItemDTO.fromCliOutput>[0], projectId))
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw this.handleRateLimit(error.message)
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Get GitHub Projects v2 data
   * 
   * @param owner - Project owner (organization or user)
   * @param projectId - Numeric project ID
   * @returns Promise resolving to ProjectDataDTO
   * @throws GitHubApiError on API failures
   */
  async getProjectV2(owner: string, projectId: string): Promise<ProjectDataDTO> {
    await this.ensureAuthenticated()
    
    const command = CLI_COMMANDS.PROJECT.VIEW
      .replace('{project_id}', projectId)
      .replace('{owner}', owner)
    
    try {
      const output = await this.executeWithRetry(command)
      const projectData = JSON.parse(output) as GitHubProjectV2Response
      
      return ProjectDataDTO.fromGitHubProjectV2Response(projectData)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Not Found') || error.message.includes('404')) {
          throw GitHubApiError.projectAccessDenied(owner, projectId)
        }

        if (error.message.includes('rate limit')) {
          throw this.handleRateLimit(error.message)
        }
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Get repository data using GitHub CLI
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Promise resolving to RepositoryDataDTO
   * @throws GitHubApiError on API failures
   * @throws AuthenticationError on auth issues
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryDataDTO> {
    await this.ensureAuthenticated()
    
    const command = CLI_COMMANDS.REPOSITORY.VIEW
      .replace('{owner}', owner)
      .replace('{repo}', repo)
    
    try {
      const output = await this.executeWithRetry(command)
      const repoData = JSON.parse(output) as GitHubCliRepositoryOutput
      
      return RepositoryDataDTO.fromGitHubCliOutput(repoData)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Not Found') || error.message.includes('404')) {
          throw GitHubApiError.repositoryAccessDenied(owner, repo, 404)
        }

        if (error.message.includes('rate limit')) {
          throw this.handleRateLimit(error.message)
        }
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Get repository events for activity tracking
   * 
   * @param _owner - Repository owner
   * @param _repo - Repository name
   * @param _since - Only events after this date
   * @returns Promise resolving to event data
   */
  async getRepositoryEvents(_owner: string, _repo: string, _since: Date): Promise<Array<{
    actor: string
    createdAt: string
    type: string
  }>> {
    await this.ensureAuthenticated()
    
    // This would require REST API calls as CLI doesn't expose events
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Search for commits in a repository
   * 
   * @param _owner - Repository owner
   * @param _repo - Repository name
   * @param _since - Only commits after this date
   * @param maxItems - Maximum commits to fetch
   * @returns Promise resolving to array of CommitDataDTOs
   */
  async searchCommits(
    _owner: string, 
    _repo: string, 
    _since: Date, 
    maxItems: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<CommitDataDTO[]> {
    await this.ensureAuthenticated()
    
    const sinceString = _since.toISOString().split('T')[0] // GitHub CLI expects YYYY-MM-DD format
    const command = `${CLI_COMMANDS.SEARCH.COMMITS
      .replace('{owner}', _owner)
      .replace('{repo}', _repo)} oid,message,author,committer,parents,url --limit ${maxItems} --sort committer-date --order desc --since ${sinceString}`
    
    try {
      const output = await this.executeWithRetry(command)
      const commitsData = JSON.parse(output) as GitHubCommitResponse[]
      
      // Transform GitHub API format to CLI output format expected by DTO
      return commitsData.map(commit => CommitDataDTO.fromCliOutput({
        additions: commit.stats?.additions,
        author: commit.commit.author ? {
          date: commit.commit.author.date,
          email: commit.commit.author.email,
          name: commit.commit.author.name
        } : undefined,
        committer: commit.commit.committer ? {
          date: commit.commit.committer.date,
          email: commit.commit.committer.email,
          name: commit.commit.committer.name
        } : undefined,
        deletions: commit.stats?.deletions,
        files: commit.files?.length,
        message: commit.commit.message,
        oid: commit.sha,
        parents: { totalCount: commit.parents?.length || 0 },
        url: commit.html_url,
        verification: commit.commit.verification ? {
          reason: commit.commit.verification.reason,
          signature: commit.commit.verification.signature || undefined,
          verified: commit.commit.verification.verified
        } : undefined
      }))
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw this.handleRateLimit(error.message)
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Search for issues in a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Only issues updated after this date
   * @param maxItems - Maximum issues to fetch
   * @returns Promise resolving to array of IssueDataDTOs
   */
  async searchIssues(
    owner: string, 
    repo: string, 
    since: Date, 
    maxItems: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<IssueDataDTO[]> {
    await this.ensureAuthenticated()
    
    const sinceString = since.toISOString()
    const command = `${CLI_COMMANDS.ISSUE.LIST
      .replace('{owner}', owner)
      .replace('{repo}', repo)} id,number,title,body,state,createdAt,updatedAt,closedAt,author,assignees,labels,milestone,comments --limit ${maxItems} --search "updated:>=${sinceString}"`
    
    try {
      const output = await this.executeWithRetry(command)
      const issuesData = JSON.parse(output) as GitHubIssueResponse[]
      
      // Transform GitHub API format to CLI output format expected by DTO
      return issuesData.map(issue => IssueDataDTO.fromCliOutput({
        assignees: issue.assignees?.map(a => a.login) || [],
        body: issue.body || undefined,
        closedAt: issue.closed_at || undefined,
        comments: issue.comments,
        createdAt: issue.created_at,
        id: issue.id.toString(),
        labels: issue.labels?.map(l => l.name) || [],
        milestone: undefined, // Not available in base API response
        number: issue.number,
        repository: undefined, // Would need to be passed separately
        state: issue.state,
        title: issue.title,
        updatedAt: issue.updated_at,
        url: issue.url,
        user: { login: issue.user.login }
      }))
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw this.handleRateLimit(error.message)
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Search for pull requests in a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Only PRs updated after this date
   * @param maxItems - Maximum PRs to fetch
   * @returns Promise resolving to array of PullRequestDataDTOs
   */
  async searchPullRequests(
    owner: string, 
    repo: string, 
    since: Date, 
    maxItems: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PullRequestDataDTO[]> {
    await this.ensureAuthenticated()
    
    const sinceString = since.toISOString()
    const command = `${CLI_COMMANDS.PR.LIST
      .replace('{owner}', owner)
      .replace('{repo}', repo)} id,number,title,body,state,createdAt,updatedAt,closedAt,mergedAt,merged,draft,additions,deletions,changedFiles,baseRefName,headRefName,author,assignees,labels,milestone --limit ${maxItems} --search "updated:>=${sinceString}"`
    
    try {
      const output = await this.executeWithRetry(command)
      const prsData = JSON.parse(output) as GitHubPullRequestResponse[]
      
      // Transform GitHub API format to CLI output format expected by DTO
      return prsData.map(pr => PullRequestDataDTO.fromCliOutput({
        additions: pr.additions,
        assignees: pr.assignees?.map(a => a.login) || [],
        baseRefName: pr.base.ref,
        body: pr.body || undefined,
        changedFiles: pr.changed_files,
        closedAt: pr.closed_at || undefined,
        comments: pr.comments,
        createdAt: pr.created_at,
        deletions: pr.deletions,
        draft: false, // Not available in base API response
        headRefName: pr.head.ref,
        id: pr.id.toString(),
        labels: pr.labels?.map(l => l.name) || [],
        merged: pr.merged,
        mergedAt: pr.merged_at || undefined,
        milestone: undefined, // Not available in base API response
        number: pr.number,
        repository: `${pr.base.repo.owner.login}/${pr.base.repo.name}`,
        state: pr.state,
        title: pr.title,
        updatedAt: pr.updated_at,
        url: pr.url,
        user: { login: pr.user.login }
      }))
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw this.handleRateLimit(error.message)
      }
      
      throw GitHubApiError.cliCommandFailed(command, 1, String(error))
    }
  }

  /**
   * Utility method to delay execution
   * 
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  /**
   * Ensure GitHub CLI is authenticated
   * 
   * @throws AuthenticationError if not authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    try {
      const isAuthenticated = await this.ghCliWrapper.checkAuthentication()
      if (!isAuthenticated) {
        throw AuthenticationError.cliNotAuthenticated()
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw AuthenticationError.cliNotInstalled()
      }

      throw error
    }
  }

  /**
   * Execute command with retry logic for rate limiting
   * 
   * @param command - Command to execute
   * @returns Promise resolving to command output
   */
  private async executeWithRetry(command: string): Promise<string> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < RATE_LIMITS.MAX_RETRIES; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await this.ghCliWrapper.executeCommand(command)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // If it's a rate limit error, wait and retry
        if (lastError.message.includes('rate limit')) {
          if (attempt < RATE_LIMITS.MAX_RETRIES - 1) {
            const delayMs = this.retryDelays[attempt]
            if (delayMs !== undefined) {
              // eslint-disable-next-line no-await-in-loop
              await this.delay(delayMs)
            }
            continue
          }
        }
        
        // For non-rate-limit errors, don't retry
        break
      }
    }
    
    throw lastError
  }

  /**
   * Handle rate limit errors by parsing response for reset time
   * 
   * @param errorMessage - Error message from GitHub CLI
   * @returns GitHubApiError for rate limiting
   */
  private handleRateLimit(errorMessage: string): OrchestratorError {
    // Try to extract reset time from error message
    const resetMatch = errorMessage.match(/reset at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/)
    const resetTime = resetMatch?.[1] ?? new Date(Date.now() + 3_600_000).toISOString()
    
    return GitHubApiError.rateLimited(0, resetTime, 5000)
  }
}