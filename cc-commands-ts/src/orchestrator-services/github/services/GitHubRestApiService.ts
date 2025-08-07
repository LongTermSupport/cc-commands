/**
 * @file GitHub REST API Service
 * 
 * Provides REST API operations for repositories, issues, pull requests, and commits.
 * Separate from GraphQL service which handles Projects v2.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable complexity */
 

import { Octokit } from '@octokit/rest'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import {
  GitHubCommentApiResponse,
  GitHubCommitApiResponse,
  GitHubIssueApiResponse,
  GitHubPullRequestApiResponse,
  GitHubRepositoryApiResponse,
  GitHubReviewApiResponse,
  GitHubReviewCommentApiResponse
} from '../../../core/types/JsonResultTypes.js'
import { CommitDataDTO } from '../dto/CommitDataDTO.js'
import { IssueDataDTO } from '../dto/IssueDataDTO.js'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO.js'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO.js'
import { GitHubRateLimit } from '../interfaces/IGitHubRestApiService.js'
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
   * Get all commits for a repository with complete API responses and pagination
   */
  async getAllCommitsRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubCommitApiResponse[]> {
    try {
      const allCommits: GitHubCommitApiResponse[] = []
      const perPage = 100
      const maxPages = options?.limit ? Math.ceil(options.limit / perPage) : 10 // Default max 1000 commits
      
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage && page <= maxPages) {
        const requestOptions: any = {
          owner,
          page,
          per_page: perPage,
          repo
        }
        
        if (options?.since) {
          requestOptions.since = options.since
        }
        
        if (options?.until) {
          requestOptions.until = options.until
        }
        
        const response = await this.octokit.rest.repos.listCommits(requestOptions)
        
        const mappedCommits = response.data.map(commit => this.mapCommitToApiResponse(commit))
        allCommits.push(...mappedCommits)
        
        // Stop if we've hit our limit or there are no more commits
        if (response.data.length < perPage || (options?.limit && allCommits.length >= options.limit)) {
          hasNextPage = false
        } else {
          page++
        }
      }
      
      // Apply final limit
      const finalCommits = options?.limit 
        ? allCommits.slice(0, options.limit) 
        : allCommits
      
      return finalCommits
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { options: options || {}, owner, repo }
      )
    }
  }

  /**
   * Get all issues for a repository with complete API responses and pagination
   */
  async getAllIssuesRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubIssueApiResponse[]> {
    try {
      const allIssues: GitHubIssueApiResponse[] = []
      const perPage = 100
      const maxPages = options?.limit ? Math.ceil(options.limit / perPage) : 10 // Default max 1000 issues
      
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage && page <= maxPages) {
        const response = await this.octokit.rest.issues.listForRepo({
          direction: 'desc',
          owner,
          page,
          per_page: perPage,
          repo,
          since: options?.since,
          sort: 'updated',
          state: 'all'
        })
        
        const mappedIssues = response.data.map(issue => this.mapIssueToApiResponse(issue))
        allIssues.push(...mappedIssues)
        
        // Stop if we've hit our limit or there are no more issues
        if (response.data.length < perPage || (options?.limit && allIssues.length >= options.limit)) {
          hasNextPage = false
        } else {
          page++
        }
        
        // Apply until filter if specified
        if (options?.until) {
          const untilDate = new Date(options.until)
          const lastIssueDate = new Date(response.data.at(-1)?.updated_at || '')
          if (lastIssueDate < untilDate) {
            hasNextPage = false
          }
        }
      }
      
      // Apply final limit and until filter
      let filteredIssues = allIssues
      
      if (options?.until) {
        const untilDate = new Date(options.until)
        filteredIssues = filteredIssues.filter(issue => {
          const issueDate = new Date(issue.updated_at)
          return issueDate < untilDate
        })
      }
      
      if (options?.limit) {
        filteredIssues = filteredIssues.slice(0, options.limit)
      }
      
      return filteredIssues
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { options: options || {}, owner, repo }
      )
    }
  }

  /**
   * Get all pull requests for a repository with complete API responses and pagination
   */
  async getAllPullRequestsRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubPullRequestApiResponse[]> {
    try {
      const allPRs: GitHubPullRequestApiResponse[] = []
      const perPage = 100
      const maxPages = options?.limit ? Math.ceil(options.limit / perPage) : 5 // Default max 500 PRs
      
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage && page <= maxPages) {
        const response = await this.octokit.rest.pulls.list({
          direction: 'desc',
          owner,
          page,
          per_page: perPage,
          repo,
          sort: 'updated',
          state: 'all'
        })
        
        const mappedPRs = response.data.map(pr => this.mapPRToApiResponse(pr))
        
        // Apply since filter
        const filteredPRs = options?.since 
          ? mappedPRs.filter(pr => new Date(pr.updated_at) >= new Date(options.since!))
          : mappedPRs
          
        allPRs.push(...filteredPRs)
        
        // Stop if we've hit our limit or there are no more PRs
        if (response.data.length < perPage || (options?.limit && allPRs.length >= options.limit)) {
          hasNextPage = false
        } else {
          page++
        }
        
        // Apply until filter if specified
        if (options?.until) {
          const untilDate = new Date(options.until)
          const lastPRDate = new Date(response.data.at(-1)?.updated_at || '')
          if (lastPRDate < untilDate) {
            hasNextPage = false
          }
        }
      }
      
      // Apply final limit and until filter
      let finalPRs = allPRs
      
      if (options?.until) {
        const untilDate = new Date(options.until)
        finalPRs = finalPRs.filter(pr => {
          const prDate = new Date(pr.updated_at)
          return prDate < untilDate
        })
      }
      
      if (options?.limit) {
        finalPRs = finalPRs.slice(0, options.limit)
      }
      
      return finalPRs
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check repository exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { options: options || {}, owner, repo }
      )
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
   * Get all comments for an issue with complete API responses
   */
  async getIssueCommentsRaw(
    owner: string, 
    repo: string, 
    issueNumber: number, 
    limit?: number
  ): Promise<GitHubCommentApiResponse[]> {
    try {
      const allComments: GitHubCommentApiResponse[] = []
      const perPage = 100
      const maxPages = limit ? Math.ceil(limit / perPage) : 5 // Default max 500 comments
      
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage && page <= maxPages) {
        const response = await this.octokit.rest.issues.listComments({
          issue_number: issueNumber,
          owner,
          page,
          per_page: perPage,
          repo
        })
        
        const mappedComments = response.data.map(comment => this.mapCommentToApiResponse(comment))
        allComments.push(...mappedComments)
        
        // Stop if we've hit our limit or there are no more comments
        if (response.data.length < perPage || (limit && allComments.length >= limit)) {
          hasNextPage = false
        } else {
          page++
        }
      }
      
      // Apply final limit
      const finalComments = limit 
        ? allComments.slice(0, limit) 
        : allComments
      
      return finalComments
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check issue exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { issueNumber, limit: limit || 'unlimited', owner, repo }
      )
    }
  }

  /**
   * Get all review comments for a pull request with complete API responses
   */
  async getPullRequestReviewCommentsRaw(
    owner: string, 
    repo: string, 
    prNumber: number
  ): Promise<GitHubReviewCommentApiResponse[]> {
    try {
      const allComments: GitHubReviewCommentApiResponse[] = []
      const perPage = 100
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage) {
        const response = await this.octokit.rest.pulls.listReviewComments({
          owner,
          page,
          per_page: perPage,
          pull_number: prNumber,
          repo
        })
        
        const mappedComments = response.data.map(comment => this.mapReviewCommentToApiResponse(comment))
        allComments.push(...mappedComments)
        
        // Stop if there are no more comments
        if (response.data.length < perPage) {
          hasNextPage = false
        } else {
          page++
        }
      }
      
      return allComments
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check pull request exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { owner, prNumber, repo }
      )
    }
  }

  // ===== COMPREHENSIVE DATA COLLECTION METHODS FOR RAW API RESPONSES =====

  /**
   * Get all reviews for a pull request with complete API responses
   */
  async getPullRequestReviewsRaw(
    owner: string, 
    repo: string, 
    prNumber: number, 
    limit?: number
  ): Promise<GitHubReviewApiResponse[]> {
    try {
      const allReviews: GitHubReviewApiResponse[] = []
      const perPage = 100
      const maxPages = limit ? Math.ceil(limit / perPage) : 2 // Default max 200 reviews
      
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage && page <= maxPages) {
        const response = await this.octokit.rest.pulls.listReviews({
          owner,
          page,
          per_page: perPage,
          pull_number: prNumber,
          repo
        })
        
        const mappedReviews = response.data.map(review => this.mapReviewToApiResponse(review))
        allReviews.push(...mappedReviews)
        
        // Stop if we've hit our limit or there are no more reviews
        if (response.data.length < perPage || (limit && allReviews.length >= limit)) {
          hasNextPage = false
        } else {
          page++
        }
      }
      
      // Apply final limit
      const finalReviews = limit 
        ? allReviews.slice(0, limit) 
        : allReviews
      
      return finalReviews
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check pull request exists and is accessible', 'Verify GitHub token permissions', 'Check rate limits'],
        { limit: limit || 'unlimited', owner, prNumber, repo }
      )
    }
  }

  /**
   * Get current rate limit status
   * 
   * @returns Current rate limit information
   * @throws {OrchestratorError} When rate limit check fails
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    try {
      const { data } = await this.octokit.rest.rateLimit.get()
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: data.rate.reset,
        used: data.rate.used
      }
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check GitHub token permissions', 'Verify network connectivity'],
        {}
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
   * Get repository metadata with complete API response
   */
  async getRepositoryRaw(owner: string, repo: string): Promise<GitHubRepositoryApiResponse> {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo })
      return this.mapRepositoryToApiResponse(response.data)
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
        per_page: 100,
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
        per_page: 100,
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
        per_page: 100,
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

  // Private mapping methods to convert Octokit responses to our API response types

  private mapCommentToApiResponse(comment: any): GitHubCommentApiResponse {
    return {
      author_association: comment.author_association,
      body: comment.body,
      body_html: comment.body_html,
      body_text: comment.body_text,
      created_at: comment.created_at,
      html_url: comment.html_url,
      id: comment.id,
      issue_url: comment.issue_url,
      node_id: comment.node_id,
      performed_via_github_app: comment.performed_via_github_app,
      reactions: comment.reactions,
      updated_at: comment.updated_at,
      url: comment.url,
      user: comment.user || {}
    }
  }

  private mapCommitToApiResponse(commit: any): GitHubCommitApiResponse {
    return {
      author: commit.author,
      comments_url: commit.comments_url,
      commit: commit.commit,
      committer: commit.committer,
      files: commit.files,
      html_url: commit.html_url,
      node_id: commit.node_id,
      parents: commit.parents,
      sha: commit.sha,
      stats: commit.stats,
      url: commit.url
    }
  }

  private mapIssueToApiResponse(issue: any): GitHubIssueApiResponse {
    return {
      active_lock_reason: issue.active_lock_reason,
      assignee: issue.assignee,
      assignees: issue.assignees || [],
      body: issue.body,
      body_html: issue.body_html || null,
      body_text: issue.body_text || null,
      closed_at: issue.closed_at,
      closed_by: issue.closed_by,
      comments: issue.comments,
      comments_url: issue.comments_url,
      created_at: issue.created_at,
      draft: Boolean(issue.draft),
      events_url: issue.events_url,
      html_url: issue.html_url,
      id: issue.id,
      labels: issue.labels?.filter((label: any) => typeof label !== 'string' && isGitHubLabel(label)) || [],
      labels_url: issue.labels_url,
      locked: issue.locked,
      milestone: issue.milestone,
      node_id: issue.node_id,
      number: issue.number,
      pull_request: issue.pull_request,
      repository_url: issue.repository_url,
      state: issue.state,
      state_reason: issue.state_reason,
      timeline_url: issue.timeline_url,
      title: issue.title,
      updated_at: issue.updated_at,
      url: issue.url,
      user: issue.user || {
        avatar_url: '',
        events_url: '',
        followers_url: '',
        following_url: '',
        gists_url: '',
        gravatar_id: null,
        html_url: '',
        id: 0,
        login: 'unknown',
        node_id: '',
        organizations_url: '',
        received_events_url: '',
        repos_url: '',
        site_admin: false,
        starred_url: '',
        subscriptions_url: '',
        type: 'User',
        url: ''
      }
    }
  }

  private mapPRToApiResponse(pr: any): GitHubPullRequestApiResponse {
    return {
      _links: pr._links,
      active_lock_reason: pr.active_lock_reason,
      additions: pr.additions || 0,
      assignee: pr.assignee,
      assignees: pr.assignees || [],
      author_association: pr.author_association,
      auto_merge: pr.auto_merge,
      base: pr.base,
      body: pr.body,
      changed_files: pr.changed_files || 0,
      closed_at: pr.closed_at,
      comments: pr.comments || 0,
      comments_url: pr.comments_url,
      commits: pr.commits || 0,
      commits_url: pr.commits_url,
      created_at: pr.created_at,
      deletions: pr.deletions || 0,
      diff_url: pr.diff_url,
      draft: Boolean(pr.draft),
      head: pr.head,
      html_url: pr.html_url,
      id: pr.id,
      issue_url: pr.issue_url,
      labels: pr.labels || [],
      locked: pr.locked,
      maintainer_can_modify: Boolean(pr.maintainer_can_modify),
      merge_commit_sha: pr.merge_commit_sha,
      mergeable: pr.mergeable,
      mergeable_state: pr.mergeable_state,
      merged: Boolean(pr.merged_at),
      merged_at: pr.merged_at,
      merged_by: pr.merged_by,
      milestone: pr.milestone,
      node_id: pr.node_id,
      number: pr.number,
      patch_url: pr.patch_url,
      rebaseable: pr.rebaseable,
      requested_reviewers: pr.requested_reviewers || [],
      requested_teams: pr.requested_teams || [],
      review_comment_url: pr.review_comment_url,
      review_comments: pr.review_comments || 0,
      review_comments_url: pr.review_comments_url,
      state: pr.state,
      statuses_url: pr.statuses_url,
      title: pr.title,
      updated_at: pr.updated_at,
      url: pr.url,
      user: pr.user || {}
    }
  }

  private mapRepositoryToApiResponse(repo: any): GitHubRepositoryApiResponse {
    return {
      allow_auto_merge: Boolean(repo.allow_auto_merge),
      allow_merge_commit: Boolean(repo.allow_merge_commit),
      allow_rebase_merge: Boolean(repo.allow_rebase_merge),
      allow_squash_merge: Boolean(repo.allow_squash_merge),
      allow_update_branch: Boolean(repo.allow_update_branch),
      archive_url: repo.archive_url,
      archived: repo.archived,
      assignees_url: repo.assignees_url,
      blobs_url: repo.blobs_url,
      branches_url: repo.branches_url,
      clone_url: repo.clone_url,
      collaborators_url: repo.collaborators_url,
      comments_url: repo.comments_url,
      commits_url: repo.commits_url,
      compare_url: repo.compare_url,
      contents_url: repo.contents_url,
      contributors_url: repo.contributors_url,
      created_at: repo.created_at,
      default_branch: repo.default_branch,
      delete_branch_on_merge: Boolean(repo.delete_branch_on_merge),
      deployments_url: repo.deployments_url,
      description: repo.description,
      disabled: repo.disabled,
      downloads_url: repo.downloads_url,
      events_url: repo.events_url,
      fork: repo.fork,
      forks_count: repo.forks_count,
      forks_url: repo.forks_url,
      full_name: repo.full_name,
      git_commits_url: repo.git_commits_url,
      git_refs_url: repo.git_refs_url,
      git_tags_url: repo.git_tags_url,
      git_url: repo.git_url,
      has_discussions: Boolean(repo.has_discussions),
      has_downloads: Boolean(repo.has_downloads),
      has_issues: repo.has_issues,
      has_pages: repo.has_pages,
      has_projects: repo.has_projects,
      has_wiki: repo.has_wiki,
      homepage: repo.homepage,
      hooks_url: repo.hooks_url,
      html_url: repo.html_url,
      id: repo.id,
      is_template: Boolean(repo.is_template),
      issue_comment_url: repo.issue_comment_url,
      issue_events_url: repo.issue_events_url,
      issues_url: repo.issues_url,
      keys_url: repo.keys_url,
      labels_url: repo.labels_url,
      language: repo.language,
      languages_url: repo.languages_url,
      license: repo.license,
      merge_commit_message: repo.merge_commit_message || 'PR_TITLE',
      merge_commit_title: repo.merge_commit_title || 'MERGE_MESSAGE',
      merges_url: repo.merges_url,
      milestones_url: repo.milestones_url,
      mirror_url: repo.mirror_url,
      name: repo.name,
      network_count: repo.network_count || 0,
      node_id: repo.node_id,
      notifications_url: repo.notifications_url,
      open_issues_count: repo.open_issues_count,
      owner: {
        id: repo.owner.id,
        login: repo.owner.login,
        node_id: repo.owner.node_id,
        type: repo.owner.type
      },
      permissions: repo.permissions,
      private: repo.private,
      pulls_url: repo.pulls_url,
      pushed_at: repo.pushed_at,
      releases_url: repo.releases_url,
      size: repo.size,
      squash_merge_commit_message: repo.squash_merge_commit_message || 'COMMIT_MESSAGES',
      squash_merge_commit_title: repo.squash_merge_commit_title || 'COMMIT_OR_PR_TITLE',
      ssh_url: repo.ssh_url,
      stargazers_count: repo.stargazers_count,
      stargazers_url: repo.stargazers_url,
      statuses_url: repo.statuses_url,
      subscribers_count: repo.subscribers_count || 0,
      subscribers_url: repo.subscribers_url,
      subscription_url: repo.subscription_url,
      svn_url: repo.svn_url,
      tags_url: repo.tags_url,
      teams_url: repo.teams_url,
      temp_clone_token: repo.temp_clone_token,
      template_repository: repo.template_repository,
      topics: repo.topics || [],
      trees_url: repo.trees_url,
      updated_at: repo.updated_at,
      url: repo.url,
      use_squash_pr_title_as_default: Boolean(repo.use_squash_pr_title_as_default),
      visibility: repo.visibility,
      watchers_count: repo.watchers_count
    }
  }

  private mapReviewCommentToApiResponse(comment: any): GitHubReviewCommentApiResponse {
    return {
      _links: comment._links,
      author_association: comment.author_association,
      body: comment.body,
      commit_id: comment.commit_id,
      created_at: comment.created_at,
      diff_hunk: comment.diff_hunk,
      html_url: comment.html_url,
      id: comment.id,
      in_reply_to_id: comment.in_reply_to_id,
      line: comment.line,
      node_id: comment.node_id,
      original_commit_id: comment.original_commit_id,
      original_line: comment.original_line,
      original_position: comment.original_position,
      original_start_line: comment.original_start_line,
      path: comment.path,
      position: comment.position,
      pull_request_review_id: comment.pull_request_review_id,
      pull_request_url: comment.pull_request_url,
      reactions: comment.reactions || {},
      side: comment.side,
      start_line: comment.start_line,
      start_side: comment.start_side,
      updated_at: comment.updated_at,
      url: comment.url,
      user: comment.user || {}
    }
  }

  private mapReviewToApiResponse(review: any): GitHubReviewApiResponse {
    return {
      _links: review._links,
      author_association: review.author_association,
      body: review.body,
      commit_id: review.commit_id,
      html_url: review.html_url,
      id: review.id,
      node_id: review.node_id,
      pull_request_url: review.pull_request_url,
      state: review.state,
      submitted_at: review.submitted_at,
      user: review.user
    }
  }
}