/**
 * @file GitHub REST API Service
 * 
 * Provides REST API operations for repositories, issues, pull requests, and commits.
 * Separate from GraphQL service which handles Projects v2.
 */

import { Octokit } from '@octokit/rest'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { CommitDataDTO } from '../dto/CommitDataDTO.js'
import { IssueDataDTO } from '../dto/IssueDataDTO.js'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO.js'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO.js'
import { GitHubIssueResponse, GitHubPullRequestResponse, GitHubRepositoryResponse } from '../types/GitHubApiTypes.js'
import { isGitHubLabel, isGitHubUser } from '../utils/TypeGuards.js'

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
      // Map Octokit response to our interface
      /* eslint-disable camelcase */
      const mappedResponse: GitHubRepositoryResponse = {
        archived: response.data.archived,
        clone_url: response.data.clone_url,
        created_at: response.data.created_at,
        default_branch: response.data.default_branch,
        description: response.data.description,
        disabled: response.data.disabled,
        fork: response.data.fork,
        forks_count: response.data.forks_count,
        full_name: response.data.full_name,
        has_issues: response.data.has_issues,
        has_pages: response.data.has_pages,
        has_projects: response.data.has_projects,
        has_wiki: response.data.has_wiki,
        html_url: response.data.html_url,
        id: response.data.id,
        language: response.data.language,
        name: response.data.name,
        open_issues_count: response.data.open_issues_count,
        owner: {
          avatar_url: response.data.owner.avatar_url,
          id: response.data.owner.id,
          login: response.data.owner.login,
          node_id: response.data.owner.node_id,
          type: response.data.owner.type as 'Organization' | 'User',
          url: response.data.owner.url
        },
        private: response.data.private,
        pushed_at: response.data.pushed_at,
        size: response.data.size,
        ssh_url: response.data.ssh_url,
        stargazers_count: response.data.stargazers_count,
        updated_at: response.data.updated_at,
        url: response.data.url,
        visibility: response.data.visibility,
        watchers_count: response.data.watchers_count
      }
      /* eslint-enable camelcase */
      return RepositoryDataDTO.fromGitHubApiResponse(mappedResponse)
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
            // Map to our expected structure
            // CommitDataDTO expects a different structure than GitHubCommitResponse
            const dtoApiResponse = {
              author: commit.commit.author || undefined,
              commit: {
                author: commit.commit.author || undefined,
                committer: commit.commit.committer || undefined,
                message: commit.commit.message,
                url: commit.commit.url,
                verification: commit.commit.verification
              },
              committer: commit.commit.committer || undefined,
              html_url: commit.html_url,
              parents: commit.parents,
              sha: commit.sha,
              stats: commit.stats,
              url: commit.url
            }
            return CommitDataDTO.fromGitHubApiResponse(dtoApiResponse)
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
            // Map to our expected structure
            const mappedIssue: GitHubIssueResponse = {
              assignee: issue.assignee ? {
                avatar_url: issue.assignee.avatar_url,
                id: issue.assignee.id,
                login: issue.assignee.login,
                node_id: issue.assignee.node_id,
                type: issue.assignee.type as 'Organization' | 'User',
                url: issue.assignee.url
              } : null,
              assignees: issue.assignees?.map(a => ({
                avatar_url: a.avatar_url,
                id: a.id,
                login: a.login,
                node_id: a.node_id,
                type: a.type as 'Organization' | 'User',
                url: a.url
              })) || [],
              author_association: issue.author_association,
              body: issue.body,
              closed_at: issue.closed_at,
              comments: issue.comments,
              created_at: issue.created_at,
              draft: issue.draft,
              html_url: issue.html_url,
              id: issue.id,
              labels: issue.labels?.filter((label): label is { color: string; description?: null | string; id: number; name: string } => 
                typeof label !== 'string' && isGitHubLabel(label)
              ) || [],
              locked: issue.locked,
              milestone: issue.milestone,
              node_id: issue.node_id,
              number: issue.number,
              pull_request: issue.pull_request,
              repository_url: issue.repository_url,
              state: issue.state as 'closed' | 'open',
              state_reason: issue.state_reason,
              title: issue.title,
              updated_at: issue.updated_at,
              url: issue.url,
              user: issue.user ? {
                avatar_url: issue.user.avatar_url,
                id: issue.user.id,
                login: issue.user.login,
                node_id: issue.user.node_id,
                type: issue.user.type as 'Organization' | 'User',
                url: issue.user.url
              } : {
                avatar_url: '',
                id: 0,
                login: 'unknown',
                node_id: '',
                type: 'User' as const,
                url: ''
              }
            }
            return IssueDataDTO.fromGitHubApiResponse(mappedIssue)
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
            // Map to our expected structure
            const mappedPR: GitHubPullRequestResponse = {
              assignee: pr.assignee ? {
                avatar_url: pr.assignee.avatar_url,
                id: pr.assignee.id,
                login: pr.assignee.login,
                node_id: pr.assignee.node_id,
                type: pr.assignee.type as 'Organization' | 'User',
                url: pr.assignee.url
              } : null,
              assignees: pr.assignees?.map(a => ({
                avatar_url: a.avatar_url,
                id: a.id,
                login: a.login,
                node_id: a.node_id,
                type: a.type as 'Organization' | 'User',
                url: a.url
              })) || [],
              author_association: pr.author_association,
              base: {
                ref: pr.base.ref,
                repo: null, // List endpoint doesn't return full repo
                sha: pr.base.sha
              },
              body: pr.body,
              closed_at: pr.closed_at,
              created_at: pr.created_at,
              diff_url: pr.diff_url,
              draft: pr.draft,
              head: {
                ref: pr.head.ref,
                repo: null, // List endpoint doesn't return full repo
                sha: pr.head.sha
              },
              html_url: pr.html_url,
              id: pr.id,
              labels: pr.labels?.filter((label) => 
                typeof label !== 'string' && isGitHubLabel(label)
              ).map(label => ({
                color: label.color || '',
                description: label.description || null,
                id: label.id || 0,
                name: label.name || ''
              })) || [],
              locked: pr.locked,
              merge_commit_sha: pr.merge_commit_sha,
              merged: Boolean(pr.merged_at),
              merged_at: pr.merged_at,
              milestone: pr.milestone,
              node_id: pr.node_id,
              number: pr.number,
              patch_url: pr.patch_url,
              requested_reviewers: pr.requested_reviewers?.filter(isGitHubUser).map(r => ({
                avatar_url: r.avatar_url,
                id: r.id,
                login: r.login,
                node_id: r.node_id,
                type: r.type as 'Organization' | 'User',
                url: r.url
              })) || [],
              requested_teams: pr.requested_teams || [],
              state: pr.state as 'closed' | 'open',
              title: pr.title,
              updated_at: pr.updated_at,
              url: pr.url,
              user: pr.user ? {
                avatar_url: pr.user.avatar_url,
                id: pr.user.id,
                login: pr.user.login,
                node_id: pr.user.node_id,
                type: pr.user.type as 'Organization' | 'User',
                url: pr.user.url
              } : {
                avatar_url: '',
                id: 0,
                login: 'unknown',
                node_id: '',
                type: 'User' as const,
                url: ''
              }
            }
            return PullRequestDataDTO.fromGitHubApiResponse(mappedPR)
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