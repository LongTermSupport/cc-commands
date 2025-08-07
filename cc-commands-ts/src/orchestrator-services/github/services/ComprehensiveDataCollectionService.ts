/**
 * @file Comprehensive Data Collection Service Implementation
 * 
 * Concrete implementation of the comprehensive data collection service
 * that gathers complete GitHub project data in the optimal flat array structure.
 * 
 * This service coordinates multiple GitHub API endpoints to collect:
 * - All repositories in a project
 * - All issues with comments for each repository
 * - All pull requests with reviews and review comments
 * - Recent commits with complete metadata
 * - Pre-computed indexes for efficient jq querying
 */

/* eslint-disable camelcase */
/* eslint-disable complexity */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-warning-comments */
 
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-return-await */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import {
  CollectionOptions,
  GitHubCommentApiResponse,
  GitHubCommitApiResponse,
  GitHubIssueApiResponse,
  GitHubPullRequestApiResponse,
  GitHubRepositoryApiResponse,
  GitHubReviewApiResponse,
  GitHubReviewCommentApiResponse,
  ItemReference,
  OptimalGitHubResult,
  OptimalIndexes
} from '../../../core/types/JsonResultTypes.js'
import { GitHubApiError } from '../errors/GitHubApiError.js'
import {
  CommitDataSet,
  IComprehensiveDataCollectionService,
  IRateLimitService,
  IssueDataSet,
  PullRequestDataSet,
  RepositoryDataSet
} from '../interfaces/IComprehensiveDataCollectionService.js'
import { IGitHubRestApiService } from '../interfaces/IGitHubRestApiService.js'
import { IProjectService } from '../interfaces/IProjectService.js'

/**
 * Default collection options for optimal data gathering
 */
const DEFAULT_COLLECTION_OPTIONS: CollectionOptions = {
  includeComments: true,
  includeCommits: true,
  includeIssues: true,
  includePullRequests: true,
  includeReviews: true,
  limits: {
    maxCommentsPerIssue: 50,
    maxCommitsPerRepo: 1000,
    maxIssuesPerRepo: 500,
    maxPRsPerRepo: 200,
    maxReviewsPerPR: 20
  },
  timeFilter: {}
}

/**
 * Comprehensive data collection service implementation
 * 
 * Coordinates multiple GitHub services to collect complete project data
 * in the optimal flat array structure for efficient jq querying.
 */
export class ComprehensiveDataCollectionService implements IComprehensiveDataCollectionService {
  constructor(
    private readonly githubRestApi: IGitHubRestApiService,
    private readonly projectService: IProjectService,
    private readonly rateLimitService: IRateLimitService
  ) {
    // All services are now properly utilized
  }

  /**
   * Build optimized indexes from collected raw data
   */
  buildOptimizedIndexes(rawData: {
    readonly commits: readonly GitHubCommitApiResponse[]
    readonly issue_comments: readonly GitHubCommentApiResponse[]
    readonly issues: readonly GitHubIssueApiResponse[]
    readonly pr_review_comments: readonly GitHubReviewCommentApiResponse[]
    readonly pr_reviews: readonly GitHubReviewApiResponse[]
    readonly pull_requests: readonly GitHubPullRequestApiResponse[]
    readonly repositories: readonly GitHubRepositoryApiResponse[]
  }): OptimalIndexes {
    // Initialize indexes
    const issuesByRepo: Record<string, number[]> = {}
    const prsByRepo: Record<string, number[]> = {}
    const commitsByRepo: Record<string, number[]> = {}
    const itemsByAuthor: Record<string, ItemReference[]> = {}
    const itemsByLabel: Record<string, ItemReference[]> = {}
    const commentsByIssue: Record<number, number[]> = {}
    const reviewsByPr: Record<number, number[]> = {}
    
    // Build repository-based indexes
    for (const [index, issue] of rawData.issues.entries()) {
      const repoName = issue.repository_name || 'unknown'
      if (!issuesByRepo[repoName]) issuesByRepo[repoName] = []
      issuesByRepo[repoName].push(index)
      
      // Author index
      const author = issue.user.login
      if (!itemsByAuthor[author]) itemsByAuthor[author] = []
      itemsByAuthor[author].push({
        index,
        repository_name: repoName,
        type: 'issue'
      })
      
      // Label index
      for (const label of issue.labels) {
        if (label.name) {
          const labelName = label.name
          if (!itemsByLabel[labelName]) itemsByLabel[labelName] = []
          itemsByLabel[labelName].push({
            index,
            repository_name: repoName,
            type: 'issue'
          })
        }
      }
    }
    
    for (const [index, pr] of rawData.pull_requests.entries()) {
      const repoName = pr.repository_name || 'unknown'
      if (!prsByRepo[repoName]) prsByRepo[repoName] = []
      prsByRepo[repoName].push(index)
      
      // Author index
      const author = (pr.user as { login: string }).login
      if (!itemsByAuthor[author]) itemsByAuthor[author] = []
      itemsByAuthor[author].push({
        index,
        repository_name: repoName,
        type: 'pull_request'
      })
    }
    
    for (const [index, commit] of rawData.commits.entries()) {
      const repoName = commit.repository_name || 'unknown'
      if (!commitsByRepo[repoName]) commitsByRepo[repoName] = []
      commitsByRepo[repoName].push(index)
      
      // Author index (use commit author name)
      const author = commit.commit.author?.name || 'unknown'
      if (!itemsByAuthor[author]) itemsByAuthor[author] = []
      itemsByAuthor[author].push({
        index,
        repository_name: repoName,
        type: 'commit'
      })
    }
    
    // Build comment relationship indexes
    for (const [index, comment] of rawData.issue_comments.entries()) {
      if (comment.issue_id) {
        const issueId = comment.issue_id
        if (!commentsByIssue[issueId]) commentsByIssue[issueId] = []
        commentsByIssue[issueId].push(index)
      }
    }
    
    for (const [index, review] of rawData.pr_reviews.entries()) {
      if (review.pull_request_id) {
        const prId = review.pull_request_id
        if (!reviewsByPr[prId]) reviewsByPr[prId] = []
        reviewsByPr[prId].push(index)
      }
    }
    
    return {
      comments_by_issue: commentsByIssue,
      commits_by_repo: commitsByRepo,
      issues_by_repo: issuesByRepo,
      items_by_author: itemsByAuthor,
      items_by_label: itemsByLabel,
      prs_by_repo: prsByRepo,
      reviews_by_pr: reviewsByPr
    }
  }

  /**
   * Collect all issues with their comments for a repository
   */
  async collectAllIssuesWithComments(
    owner: string,
    repo: string,
    options: Partial<CollectionOptions> = {}
  ): Promise<IssueDataSet> {
    const fullOptions = { ...DEFAULT_COLLECTION_OPTIONS, ...options }
    
    try {
      // Get all issues (paginated)
      const issues = await this.collectAllIssues(owner, repo, fullOptions)
      
      // Add repository_name to each issue for flat array structure
      const issuesWithRepo = issues.map(issue => ({
        ...issue,
        repository_name: `${owner}/${repo}`
      }))
      
      // Collect comments for all issues if enabled
      const comments: GitHubCommentApiResponse[] = []
      
      if (fullOptions.includeComments) {
        for (const issue of issuesWithRepo) {
          if (issue.comments > 0) {
            const issueComments = await this.collectIssueComments(
              owner, 
              repo, 
              issue.number,
              fullOptions.limits.maxCommentsPerIssue
            )
            
            // Add issue_id and repository_name for relationship mapping
            const commentsWithMetadata = issueComments.map(comment => ({
              ...comment,
              issue_id: issue.id,
              repository_name: `${owner}/${repo}`
            }))
            
            comments.push(...commentsWithMetadata)
          }
        }
      }
      
      return {
        comments,
        issues: issuesWithRepo
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        `collect issues and comments for ${owner}/${repo}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Collect all pull requests with reviews and review comments
   */
  async collectAllPullRequestsWithReviews(
    owner: string,
    repo: string,
    options: Partial<CollectionOptions> = {}
  ): Promise<PullRequestDataSet> {
    const fullOptions = { ...DEFAULT_COLLECTION_OPTIONS, ...options }
    
    try {
      // Get all pull requests (paginated)
      const pullRequests = await this.collectAllPullRequests(owner, repo, fullOptions)
      
      // Add repository_name to each PR for flat array structure
      const prsWithRepo = pullRequests.map(pr => ({
        ...pr,
        repository_name: `${owner}/${repo}`
      }))
      
      // Collect reviews and review comments if enabled
      const reviews: GitHubReviewApiResponse[] = []
      const reviewComments: GitHubReviewCommentApiResponse[] = []
      
      if (fullOptions.includeReviews) {
        for (const pr of prsWithRepo) {
          // Get reviews for this PR
          const prReviews = await this.collectPullRequestReviews(
            owner, 
            repo, 
            pr.number,
            fullOptions.limits.maxReviewsPerPR
          )
          
          // Add pr_id and repository_name for relationship mapping
          const reviewsWithMetadata = prReviews.map(review => ({
            ...review,
            pull_request_id: pr.id,
            repository_name: `${owner}/${repo}`
          }))
          
          reviews.push(...reviewsWithMetadata)
          
          // Get review comments for this PR
          const prReviewComments = await this.collectPullRequestReviewComments(
            owner, 
            repo, 
            pr.number
          )
          
          // Add pr_id and repository_name for relationship mapping
          const reviewCommentsWithMetadata = prReviewComments.map(comment => ({
            ...comment,
            pull_request_id: pr.id,
            repository_name: `${owner}/${repo}`
          }))
          
          reviewComments.push(...reviewCommentsWithMetadata)
        }
      }
      
      return {
        pull_requests: prsWithRepo,
        review_comments: reviewComments,
        reviews
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        `collect pull requests and reviews for ${owner}/${repo}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Collect complete project data with optimal structure
   */
  async collectCompleteProjectData(
    projectId: string,
    options: CollectionOptions = DEFAULT_COLLECTION_OPTIONS
  ): Promise<OptimalGitHubResult> {
    const collectionStartTime = new Date()
    
    try {
      // Validate rate limits before starting
      const rateLimitStatus = await this.rateLimitService.checkCurrentLimits()
      
      // Get project details and repositories
      const projectData = await this.projectService.getProjectWithItems(projectId)
      const repositories = await this.projectService.getRepositoriesFromProject(projectId)
      
      if (repositories.length === 0) {
        throw new OrchestratorError(
          new Error('No repositories found in the specified project'),
          [
            'Verify the project contains issues or pull requests',
            'Check if the project has any linked repositories',
            'Ensure you have access to the project\'s repositories'
          ],
          { projectId, projectTitle: projectData.title }
        )
      }
      
      // Estimate API calls required
      const callEstimate = await this.rateLimitService.estimateRequiredCalls(repositories, options)
      const feasible = await this.rateLimitService.validateCollectionFeasible(callEstimate)
      
      if (!feasible) {
        throw new OrchestratorError(
          new Error('Collection operation would exceed GitHub API rate limits'),
          [
            'Reduce collection limits in options (maxIssuesPerRepo, etc.)',
            'Use time filters to collect only recent data',
            'Wait for rate limits to reset before retrying',
            'Consider running collection in smaller batches'
          ],
          { 
            estimatedCalls: callEstimate.estimated_calls,
            remainingCalls: rateLimitStatus.github_rest_api.remaining,
            repositories: repositories.length
          }
        )
      }
      
      // Collect data for all repositories in parallel (with concurrency limits)
      const repositoryDataSets = await this.collectAllRepositoryData(repositories, options)
      
      // Flatten all data into optimal structure
      const flattenedData = this.flattenRepositoryData(repositoryDataSets)
      
      // Build optimized indexes
      const indexes = this.buildOptimizedIndexes(flattenedData)
      
      // Calculate comprehensive metrics
      const metrics = this.calculateProjectMetrics(flattenedData)
      
      // Get final rate limit status
      const finalRateLimitStatus = await this.rateLimitService.checkCurrentLimits()
      
      const collectionEndTime = new Date()
      
      // Build OptimalGitHubResult
      const result: OptimalGitHubResult = {
        indexes,
        metadata: {
          api_usage: finalRateLimitStatus,
          collection: {
            collection_completed_at: collectionEndTime.toISOString(),
            collection_options: options,
            collection_started_at: collectionStartTime.toISOString(),
            errors_encountered: 0, // TODO: Track errors properly
            items_collected: {
              commits: flattenedData.commits.length,
              issue_comments: flattenedData.issue_comments.length,
              issues: flattenedData.issues.length,
              pr_review_comments: flattenedData.pr_review_comments.length,
              pr_reviews: flattenedData.pr_reviews.length,
              pull_requests: flattenedData.pull_requests.length
            },
            repositories_processed: flattenedData.repositories.length
          },
          execution: {
            arguments: projectId,
            command: 'g-gh-project-comprehensive-summary',
            execution_time_ms: collectionEndTime.getTime() - collectionStartTime.getTime(),
            generated_at: collectionEndTime.toISOString(),
            version: '1.0.0'
          }
        },
        metrics,
        raw: {
          commits: flattenedData.commits,
          issue_comments: flattenedData.issue_comments,
          issues: flattenedData.issues,
          pr_review_comments: flattenedData.pr_review_comments,
          pr_reviews: flattenedData.pr_reviews,
          project: {
            created_at: projectData.createdAt.toISOString(),
            description: projectData.description || null,
            id: projectData.id,
            item_count: projectData.itemCount,
            owner: projectData.owner,
            owner_type: projectData.ownerType,
            state: projectData.state,
            title: projectData.title,
            updated_at: projectData.updatedAt.toISOString(),
            url: projectData.url,
            visibility: projectData.visibility
          },
          pull_requests: flattenedData.pull_requests,
          repositories: flattenedData.repositories
        }
      }
      
      return result
      
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the project ID is correct and accessible',
          'Check GitHub authentication and rate limits',
          'Ensure repositories in the project are accessible',
          'Try reducing collection limits if rate limited'
        ],
        { 
          error: error instanceof Error ? error.message : String(error),
          projectId
        }
      )
    }
  }

  /**
   * Collect recent commits with complete metadata
   */
  async collectRecentCommits(
    owner: string,
    repo: string,
    since?: string,
    options: Partial<CollectionOptions> = {}
  ): Promise<CommitDataSet> {
    const fullOptions = { ...DEFAULT_COLLECTION_OPTIONS, ...options }
    
    try {
      const commits = await this.collectAllCommits(owner, repo, since, fullOptions)
      
      // Add repository_name to each commit for flat array structure
      const commitsWithRepo = commits.map(commit => ({
        ...commit,
        repository_name: `${owner}/${repo}`
      }))
      
      return {
        commits: commitsWithRepo
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        `collect commits for ${owner}/${repo}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Collect all data for a single repository
   */
  async collectRepositoryData(
    owner: string,
    repo: string,
    options: Partial<CollectionOptions> = {}
  ): Promise<RepositoryDataSet> {
    const fullOptions = { ...DEFAULT_COLLECTION_OPTIONS, ...options }
    
    try {
      // Get repository metadata
      const repository = await this.collectRepositoryMetadata(owner, repo)
      
      // Collect all data types in parallel
      const [issueData, prData, commitData] = await Promise.all([
        fullOptions.includeIssues 
          ? this.collectAllIssuesWithComments(owner, repo, fullOptions)
          : Promise.resolve({ comments: [], issues: [] }),
        fullOptions.includePullRequests
          ? this.collectAllPullRequestsWithReviews(owner, repo, fullOptions)
          : Promise.resolve({ pull_requests: [], review_comments: [], reviews: [] }),
        fullOptions.includeCommits
          ? this.collectRecentCommits(owner, repo, fullOptions.timeFilter.since, fullOptions)
          : Promise.resolve({ commits: [] })
      ])
      
      return {
        commits: commitData.commits,
        issue_comments: issueData.comments,
        issues: issueData.issues,
        pr_review_comments: prData.review_comments,
        pr_reviews: prData.reviews,
        pull_requests: prData.pull_requests,
        repository
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        `collect complete repository data for ${owner}/${repo}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  // Private helper methods for actual API collection
  // These would be implemented using the existing GitHub services

  private calculateProjectMetrics(flattenedData: any): any {
    // TODO: Implement comprehensive metrics calculation
    return {
      contributor_metrics: [],
      project_summary: {
        activity_summary: {
          active_contributors_last_30_days: 0,
          commits_last_30_days: 0,
          issues_opened_last_30_days: 0,
          prs_opened_last_30_days: 0
        },
        health_metrics: {
          avg_issue_resolution_days: null,
          avg_pr_merge_days: null,
          issue_response_rate: 0,
          pr_review_coverage: 0
        },
        languages: [],
        primary_language: 'Unknown',
        total_commits: flattenedData.commits.length,
        total_contributors: 0,
        total_forks: 0,
        total_issues: flattenedData.issues.length,
        total_pull_requests: flattenedData.pull_requests.length,
        total_repositories: flattenedData.repositories.length,
        total_stars: 0
      },
      repository_metrics: [],
      timeline_metrics: {
        activity_trends: {
          commits_trend: 'stable' as const,
          issues_trend: 'stable' as const,
          prs_trend: 'stable' as const
        },
        monthly_activity: {},
        weekly_activity: {}
      }
    }
  }

  private async collectAllCommits(owner: string, repo: string, since: string | undefined, options: CollectionOptions): Promise<GitHubCommitApiResponse[]> {
    return await this.githubRestApi.getAllCommitsRaw(owner, repo, {
      limit: options.limits.maxCommitsPerRepo,
      since: since || options.timeFilter.since,
      until: options.timeFilter.until
    })
  }

  private async collectAllIssues(owner: string, repo: string, options: CollectionOptions): Promise<GitHubIssueApiResponse[]> {
    return await this.githubRestApi.getAllIssuesRaw(owner, repo, {
      limit: options.limits.maxIssuesPerRepo,
      since: options.timeFilter.since,
      until: options.timeFilter.until
    })
  }

  private async collectAllPullRequests(owner: string, repo: string, options: CollectionOptions): Promise<GitHubPullRequestApiResponse[]> {
    return await this.githubRestApi.getAllPullRequestsRaw(owner, repo, {
      limit: options.limits.maxPRsPerRepo,
      since: options.timeFilter.since,
      until: options.timeFilter.until
    })
  }

  private async collectAllRepositoryData(
    repositories: readonly string[],
    options: CollectionOptions
  ): Promise<RepositoryDataSet[]> {
    // Implementation would collect data for all repositories in parallel
    // with appropriate concurrency limits to respect rate limits
    const results: RepositoryDataSet[] = []
    
    // TODO: Implement parallel collection with rate limit management
    for (const repoFullName of repositories) {
      const [owner, repo] = repoFullName.split('/')
      if (owner && repo) {
        try {
          const repoData = await this.collectRepositoryData(owner, repo, options)
          results.push(repoData)
        } catch (error) {
          // Log error but continue with other repositories
          console.warn(`Failed to collect data for ${repoFullName}:`, error)
        }
      }
    }
    
    return results
  }

  private async collectIssueComments(owner: string, repo: string, issueNumber: number, maxComments: number): Promise<GitHubCommentApiResponse[]> {
    return await this.githubRestApi.getIssueCommentsRaw(owner, repo, issueNumber, maxComments)
  }

  private async collectPullRequestReviewComments(owner: string, repo: string, prNumber: number): Promise<GitHubReviewCommentApiResponse[]> {
    return await this.githubRestApi.getPullRequestReviewCommentsRaw(owner, repo, prNumber)
  }

  private async collectPullRequestReviews(owner: string, repo: string, prNumber: number, maxReviews: number): Promise<GitHubReviewApiResponse[]> {
    return await this.githubRestApi.getPullRequestReviewsRaw(owner, repo, prNumber, maxReviews)
  }

  // Repository metadata collection
  private async collectRepositoryMetadata(owner: string, repo: string): Promise<GitHubRepositoryApiResponse> {
    return await this.githubRestApi.getRepositoryRaw(owner, repo)
  }

  private flattenRepositoryData(repositoryDataSets: RepositoryDataSet[]): {
    readonly commits: readonly GitHubCommitApiResponse[]
    readonly issue_comments: readonly GitHubCommentApiResponse[]
    readonly issues: readonly GitHubIssueApiResponse[]
    readonly pr_review_comments: readonly GitHubReviewCommentApiResponse[]
    readonly pr_reviews: readonly GitHubReviewApiResponse[]
    readonly pull_requests: readonly GitHubPullRequestApiResponse[]
    readonly repositories: readonly GitHubRepositoryApiResponse[]
  } {
    return {
      commits: repositoryDataSets.flatMap(repo => repo.commits),
      issue_comments: repositoryDataSets.flatMap(repo => repo.issue_comments),
      issues: repositoryDataSets.flatMap(repo => repo.issues),
      pr_review_comments: repositoryDataSets.flatMap(repo => repo.pr_review_comments),
      pr_reviews: repositoryDataSets.flatMap(repo => repo.pr_reviews),
      pull_requests: repositoryDataSets.flatMap(repo => repo.pull_requests),
      repositories: repositoryDataSets.map(repo => repo.repository)
    }
  }
}