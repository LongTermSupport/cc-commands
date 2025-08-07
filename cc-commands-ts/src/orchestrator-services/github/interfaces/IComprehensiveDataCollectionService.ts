/**
 * @file Comprehensive Data Collection Service Interface
 * 
 * Defines the interface for collecting complete GitHub project data
 * including all individual items (issues, PRs, commits, comments, reviews).
 * 
 * This interface supports the optimal flat array structure for efficient
 * jq querying and complete raw API data preservation.
 */

import {
  CollectionOptions,
  GitHubCommentApiResponse,
  GitHubCommitApiResponse,
  GitHubIssueApiResponse,
  GitHubPullRequestApiResponse,
  GitHubRepositoryApiResponse,
  GitHubReviewApiResponse,
  GitHubReviewCommentApiResponse,
  OptimalGitHubResult,
  OptimalIndexes,
  RateLimitUsage
} from '../../../core/types/JsonResultTypes.js'

/**
 * Complete dataset for a single repository including all items and relationships
 */
export interface RepositoryDataSet {
  readonly commits: readonly GitHubCommitApiResponse[]
  readonly issue_comments: readonly GitHubCommentApiResponse[]
  readonly issues: readonly GitHubIssueApiResponse[]
  readonly pr_review_comments: readonly GitHubReviewCommentApiResponse[]
  readonly pr_reviews: readonly GitHubReviewApiResponse[]
  readonly pull_requests: readonly GitHubPullRequestApiResponse[]
  readonly repository: GitHubRepositoryApiResponse
}

/**
 * Issues with their associated comments for a repository
 */
export interface IssueDataSet {
  readonly comments: readonly GitHubCommentApiResponse[]
  readonly issues: readonly GitHubIssueApiResponse[]
}

/**
 * Pull requests with their associated reviews and review comments
 */
export interface PullRequestDataSet {
  readonly pull_requests: readonly GitHubPullRequestApiResponse[]
  readonly review_comments: readonly GitHubReviewCommentApiResponse[]
  readonly reviews: readonly GitHubReviewApiResponse[]
}

/**
 * Commits for a repository with complete metadata
 */
export interface CommitDataSet {
  readonly commits: readonly GitHubCommitApiResponse[]
}

/**
 * Rate limit estimation for planned collection operations
 */
export interface CallEstimate {
  readonly estimated_calls: number
  readonly estimated_duration_minutes: number
  readonly estimated_graphql_points: number
  readonly feasible_within_limits: boolean
  readonly recommended_batch_size: number
}

/**
 * Comprehensive data collection service interface
 * 
 * This service coordinates the collection of complete GitHub project data
 * organized in the optimal flat array structure for efficient jq querying.
 * 
 * Key responsibilities:
 * - Collect all individual items (issues, PRs, commits, comments, reviews)
 * - Preserve complete raw API data from GitHub responses
 * - Build optimized indexes for common query patterns
 * - Manage rate limits and streaming for large datasets
 * - Generate OptimalGitHubResult structure
 */
export interface IComprehensiveDataCollectionService {
  /**
   * Build optimized indexes from collected raw data
   * 
   * Creates pre-computed indexes for common jq query patterns:
   * - Repository-based indexes for scoped queries
   * - Author-based indexes for contributor analysis
   * - Label-based indexes for categorization
   * - Relationship indexes for comments and reviews
   * 
   * @param rawData - Complete raw data arrays
   * @returns Optimized indexes for efficient querying
   */
  buildOptimizedIndexes(rawData: {
    readonly commits: readonly GitHubCommitApiResponse[]
    readonly issue_comments: readonly GitHubCommentApiResponse[]
    readonly issues: readonly GitHubIssueApiResponse[]
    readonly pr_review_comments: readonly GitHubReviewCommentApiResponse[]
    readonly pr_reviews: readonly GitHubReviewApiResponse[]
    readonly pull_requests: readonly GitHubPullRequestApiResponse[]
    readonly repositories: readonly GitHubRepositoryApiResponse[]
  }): OptimalIndexes

  /**
   * Collect all issues with their comments for a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection configuration
   * @returns Issues and their associated comments
   */
  collectAllIssuesWithComments(
    owner: string, 
    repo: string, 
    options?: Partial<CollectionOptions>
  ): Promise<IssueDataSet>

  /**
   * Collect all pull requests with reviews and review comments
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection configuration
   * @returns Pull requests with all associated reviews and comments
   */
  collectAllPullRequestsWithReviews(
    owner: string, 
    repo: string, 
    options?: Partial<CollectionOptions>
  ): Promise<PullRequestDataSet>

  /**
   * Collect complete project data with optimal structure
   * 
   * @param projectId - GitHub Project v2 node ID
   * @param options - Collection configuration and limits
   * @returns Complete OptimalGitHubResult with flat arrays and indexes
   */
  collectCompleteProjectData(
    projectId: string, 
    options: CollectionOptions
  ): Promise<OptimalGitHubResult>

  /**
   * Collect recent commits with complete metadata
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Only collect commits after this date (ISO string)
   * @param options - Collection configuration
   * @returns Commits with complete API data
   */
  collectRecentCommits(
    owner: string, 
    repo: string, 
    since?: string, 
    options?: Partial<CollectionOptions>
  ): Promise<CommitDataSet>

  /**
   * Collect all data for a single repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection configuration
   * @returns Complete RepositoryDataSet with all items
   */
  collectRepositoryData(
    owner: string, 
    repo: string, 
    options?: Partial<CollectionOptions>
  ): Promise<RepositoryDataSet>
}

/**
 * Rate limit management service interface
 * 
 * Handles GitHub API rate limit monitoring and intelligent backoff strategies
 */
export interface IRateLimitService {
  /**
   * Check current rate limit status for both REST and GraphQL APIs
   * 
   * @returns Current rate limit status and remaining capacity
   */
  checkCurrentLimits(): Promise<RateLimitUsage>

  /**
   * Estimate API calls required for a collection operation
   * 
   * @param repos - List of repositories to analyze
   * @param options - Collection configuration
   * @returns Estimated API usage and feasibility assessment
   */
  estimateRequiredCalls(
    repos: readonly string[], 
    options: CollectionOptions
  ): Promise<CallEstimate>

  /**
   * Implement intelligent backoff strategy after rate limit error
   * 
   * @param error - GitHub API error indicating rate limit exceeded
   * @returns Promise that resolves when safe to retry
   */
  implementSmartBackoff(error: Error): Promise<void>

  /**
   * Monitor rate limit usage during collection
   * 
   * @param operation - Description of current operation
   * @param callsMade - Number of API calls made so far
   * @returns Updated rate limit status
   */
  monitorUsageDuringCollection(
    operation: string, 
    callsMade: number
  ): Promise<RateLimitUsage>

  /**
   * Validate that a collection operation is feasible within current rate limits
   * 
   * @param estimate - Call estimate from estimateRequiredCalls
   * @returns True if operation can proceed without exceeding limits
   */
  validateCollectionFeasible(estimate: CallEstimate): Promise<boolean>
}

/**
 * Streaming data collection service interface
 * 
 * Handles memory-efficient collection of large datasets using generators
 */
export interface IStreamingCollectionService {
  /**
   * Stream all repository data in manageable chunks
   * 
   * @param repos - List of repository full names
   * @param options - Collection configuration
   * @yields Individual repository datasets as they're collected
   */
  streamAllRepositoryData(
    repos: readonly string[], 
    options: CollectionOptions
  ): AsyncGenerator<RepositoryDataSet>

  /**
   * Stream issues with comments for a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection configuration
   * @yields Issues with their comments in batches
   */
  streamIssuesWithComments(
    owner: string, 
    repo: string, 
    options: CollectionOptions
  ): AsyncGenerator<IssueDataSet>

  /**
   * Stream pull requests with reviews for a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Collection configuration
   * @yields Pull requests with reviews and review comments in batches
   */
  streamPullRequestsWithReviews(
    owner: string, 
    repo: string, 
    options: CollectionOptions
  ): AsyncGenerator<PullRequestDataSet>
}