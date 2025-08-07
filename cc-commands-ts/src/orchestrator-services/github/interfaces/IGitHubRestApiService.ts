/**
 * @file GitHub REST API Service Interface
 * 
 * Interface contract for GitHub REST API operations.
 * Provides repository, issue, PR, and commit data access.
 */

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

/**
 * Rate limit information from GitHub API
 */
export interface GitHubRateLimit {
  readonly limit: number
  readonly remaining: number
  readonly reset: number
  readonly used: number
}

/**
 * Interface for GitHub REST API service operations
 * 
 * This interface defines the contract for accessing GitHub data via REST API.
 * Implementations should handle authentication, rate limiting, and error handling.
 */
export interface IGitHubRestApiService {
  /**
   * Check if repository is accessible with current authentication
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns True if repository is accessible, false otherwise
   */
  checkRepositoryAccess(owner: string, repo: string): Promise<boolean>

  /**
   * Get all commits for a repository with complete API responses and pagination
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection options (limit, time filter)
   * @returns Array of complete GitHub commit API responses
   * @throws {OrchestratorError} When collection fails or repository is not accessible
   */
  getAllCommitsRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubCommitApiResponse[]>

  /**
   * Get all issues for a repository with complete API responses and pagination
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection options (limit, time filter)
   * @returns Array of complete GitHub issue API responses
   * @throws {OrchestratorError} When collection fails or repository is not accessible
   */
  getAllIssuesRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubIssueApiResponse[]>

  /**
   * Get all pull requests for a repository with complete API responses and pagination
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection options (limit, time filter)
   * @returns Array of complete GitHub PR API responses
   * @throws {OrchestratorError} When collection fails or repository is not accessible
   */
  getAllPullRequestsRaw(
    owner: string, 
    repo: string, 
    options?: { limit?: number; since?: string; until?: string }
  ): Promise<GitHubPullRequestApiResponse[]>

  /**
   * Get authenticated user information
   * 
   * @returns Username of authenticated user
   * @throws {OrchestratorError} When authentication fails or API is unavailable
   */
  getAuthenticatedUser(): Promise<string>

  /**
   * Get all comments for an issue with complete API responses
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue number
   * @param limit - Maximum number of comments to retrieve
   * @returns Array of complete GitHub comment API responses
   * @throws {OrchestratorError} When collection fails or issue is not accessible
   */
  getIssueCommentsRaw(
    owner: string, 
    repo: string, 
    issueNumber: number, 
    limit?: number
  ): Promise<GitHubCommentApiResponse[]>

  /**
   * Get all review comments for a pull request with complete API responses
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Array of complete GitHub review comment API responses
   * @throws {OrchestratorError} When collection fails or PR is not accessible
   */
  getPullRequestReviewCommentsRaw(
    owner: string, 
    repo: string, 
    prNumber: number
  ): Promise<GitHubReviewCommentApiResponse[]>

  // ===== COMPREHENSIVE DATA COLLECTION METHODS FOR RAW API RESPONSES =====

  /**
   * Get all reviews for a pull request with complete API responses
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @param limit - Maximum number of reviews to retrieve
   * @returns Array of complete GitHub review API responses
   * @throws {OrchestratorError} When collection fails or PR is not accessible
   */
  getPullRequestReviewsRaw(
    owner: string, 
    repo: string, 
    prNumber: number, 
    limit?: number
  ): Promise<GitHubReviewApiResponse[]>

  /**
   * Get current rate limit status
   * 
   * @returns Current rate limit information
   * @throws {OrchestratorError} When rate limit check fails
   */
  getRateLimit(): Promise<GitHubRateLimit>

  /**
   * Get repository data
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns Repository data DTO
   * @throws {OrchestratorError} When repository is not accessible or API fails
   */
  getRepository(owner: string, repo: string): Promise<RepositoryDataDTO>

  /**
   * Get repository metadata with complete API response
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Complete GitHub repository API response
   * @throws {OrchestratorError} When repository is not accessible or API fails
   */
  getRepositoryRaw(owner: string, repo: string): Promise<GitHubRepositoryApiResponse>

  /**
   * Search for commits in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for commit search
   * @returns Array of commit data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchCommits(owner: string, repo: string, since: Date): Promise<CommitDataDTO[]>

  /**
   * Search for issues in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name  
   * @param since - Start date for issue search
   * @returns Array of issue data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchIssues(owner: string, repo: string, since: Date): Promise<IssueDataDTO[]>

  /**
   * Search for pull requests in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for PR search
   * @returns Array of pull request data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchPullRequests(owner: string, repo: string, since: Date): Promise<PullRequestDataDTO[]>
}