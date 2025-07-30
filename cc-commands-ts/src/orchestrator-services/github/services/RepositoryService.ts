/**
 * @file GitHub Repository Operations Service
 * 
 * High-level service for repository data collection and activity analysis.
 * Coordinates GitHubRestApiService for repository operations.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO.js'
import { CommitDataDTO } from '../dto/CommitDataDTO.js'
import { IssueDataDTO } from '../dto/IssueDataDTO.js'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO.js'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO.js'
import { GitHubRestApiService } from './GitHubRestApiService.js'

/**
 * GitHub Repository Service for high-level repository operations
 * 
 * This service provides repository-level operations that coordinate
 * REST API calls for repository data collection and activity analysis.
 */
export class RepositoryService {
  constructor(private readonly restService: GitHubRestApiService) {}

  /**
   * Get repository activity metrics for a time period
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @param since - Start date for activity analysis
   * @returns Activity metrics DTO
   * @throws {OrchestratorError} When API requests fail
   */
  async getRepositoryActivity(owner: string, repo: string, since: Date): Promise<ActivityMetricsDTO> {
    try {
      this.validateRepositoryFormat(owner, repo)
      
      const [issuesData, pullRequestsData, commitsData] = await this.fetchActivityData(owner, repo, since)
      const contributors = this.extractContributors(issuesData, pullRequestsData, commitsData)
      
      return this.buildActivityMetrics(owner, repo, since, {
        commits: commitsData,
        contributors,
        issues: issuesData,
        pullRequests: pullRequestsData
      })

    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the repository owner and name are correct',
          'Check if the repository exists and is accessible',
          'Ensure GitHub token has read access to repository issues, PRs, and commits',
          'Try reducing the time window if rate limits are exceeded',
          'Verify network connectivity to GitHub'
        ],
        { owner, repo, since: since.toISOString() }
      )
    }
  }

  /**
   * Get comprehensive repository data
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns Repository data DTO
   * @throws {OrchestratorError} When API request fails
   */
  async getRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO> {
    try {
      return await this.restService.getRepository(owner, repo)
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the repository owner and name are correct',
          'Check if the repository exists and is accessible',
          'Ensure GitHub token has read access to the repository',
          'Verify network connectivity to GitHub'
        ],
        { owner, repo }
      )
    }
  }

  /**
   * Validate that a repository exists and is accessible
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns True if repository is accessible, false otherwise
   */
  async validateRepositoryAccess(owner: string, repo: string): Promise<boolean> {
    try {
      return await this.restService.checkRepositoryAccess(owner, repo)
    } catch {
      // For validation, we return false instead of throwing
      // This allows callers to handle missing repositories gracefully
      return false
    }
  }

  /**
   * Add commit contributors to the set
   */
  private addCommitContributors(contributors: Set<string>, commitsData: CommitDataDTO[]): void {
    for (const commit of commitsData) {
      if (commit.authorName?.trim()) {
        contributors.add(commit.authorName)
      }

      if (commit.committerName?.trim()) {
        contributors.add(commit.committerName)
      }
    }
  }

  /**
   * Add issue contributors to the set
   */
  private addIssueContributors(contributors: Set<string>, issuesData: IssueDataDTO[]): void {
    for (const issue of issuesData) {
      if (issue.creator?.trim()) {
        contributors.add(issue.creator)
      }

      for (const assignee of issue.assignees) {
        if (assignee?.trim()) {
          contributors.add(assignee)
        }
      }
    }
  }

  /**
   * Add pull request contributors to the set
   */
  private addPullRequestContributors(contributors: Set<string>, pullRequestsData: PullRequestDataDTO[]): void {
    for (const pr of pullRequestsData) {
      if (pr.creator?.trim()) {
        contributors.add(pr.creator)
      }

      for (const assignee of pr.assignees) {
        if (assignee?.trim()) {
          contributors.add(assignee)
        }
      }

      for (const reviewer of pr.requestedReviewers) {
        if (reviewer?.trim()) {
          contributors.add(reviewer)
        }
      }

      if (pr.mergedBy?.trim()) {
        contributors.add(pr.mergedBy)
      }
    }
  }

  /**
   * Build activity metrics DTO from collected data
   */
  private buildActivityMetrics(
    owner: string, 
    repo: string, 
    since: Date,
    activityData: {
      commits: CommitDataDTO[]
      contributors: Set<string>
      issues: IssueDataDTO[]
      pullRequests: PullRequestDataDTO[]
    }
  ): ActivityMetricsDTO {
    // Count activity by type
    const openIssues = activityData.issues.filter(i => i.state === 'open').length
    const closedIssues = activityData.issues.filter(i => i.state === 'closed').length
    const openPRs = activityData.pullRequests.filter(pr => pr.state === 'open').length
    const mergedPRs = activityData.pullRequests.filter(pr => pr.mergedAt).length
    
    // Calculate date ranges
    const endDate = new Date()
    const daysSincePeriodStart = Math.floor((endDate.getTime() - since.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate averages
    const avgCommitsPerDay = daysSincePeriodStart > 0 ? activityData.commits.length / daysSincePeriodStart : 0
    const avgIssuesPerDay = daysSincePeriodStart > 0 ? activityData.issues.length / daysSincePeriodStart : 0
    const avgPrsPerDay = daysSincePeriodStart > 0 ? activityData.pullRequests.length / daysSincePeriodStart : 0
    
    // Calculate code changes (simplified - would need actual API data for accurate numbers)
    const totalAdditions = 0 // This would come from detailed commit data
    const totalDeletions = 0 // This would come from detailed commit data
    const totalFilesChanged = 0 // This would come from detailed commit data
    
    return new ActivityMetricsDTO(
      1, // repositoriesCount - single repository
      [`${owner}/${repo}`], // repositoryList
      since, // analysisPeriodStart
      endDate, // analysisPeriodEnd
      daysSincePeriodStart, // analysisPeriodDays
      activityData.commits.length, // commitsCount
      activityData.issues.length, // totalIssuesCount
      openIssues, // openIssuesCount
      closedIssues, // closedIssuesCount
      activityData.pullRequests.length, // totalPrsCount
      openPRs, // openPrsCount
      mergedPRs, // mergedPrsCount
      activityData.contributors.size, // contributorsCount
      activityData.contributors.size, // activeContributors (simplified - all contributors are active)
      activityData.contributors.size > 0 ? [...activityData.contributors].at(0) || null : null, // mostActiveContributor (simplified)
      `${owner}/${repo}`, // mostActiveRepository (single repo)
      0, // releaseCount (would need separate API call)
      totalAdditions, // totalAdditions
      totalDeletions, // totalDeletions
      totalFilesChanged, // totalFilesChanged
      Math.round(avgCommitsPerDay * 100) / 100, // avgCommitsPerDay
      Math.round(avgIssuesPerDay * 100) / 100, // avgIssuesPerDay
      Math.round(avgPrsPerDay * 100) / 100 // avgPrsPerDay
    )
  }

  /**
   * Extract unique contributors from activity data
   */
  private extractContributors(issuesData: IssueDataDTO[], pullRequestsData: PullRequestDataDTO[], commitsData: CommitDataDTO[]): Set<string> {
    const contributors = new Set<string>()
    
    this.addIssueContributors(contributors, issuesData)
    this.addPullRequestContributors(contributors, pullRequestsData)
    this.addCommitContributors(contributors, commitsData)
    
    return contributors
  }

  /**
   * Fetch activity data from API in parallel
   */
  private async fetchActivityData(owner: string, repo: string, since: Date) {
    return Promise.all([
      this.restService.searchIssues(owner, repo, since),
      this.restService.searchPullRequests(owner, repo, since),
      this.restService.searchCommits(owner, repo, since)
    ])
  }

  /**
   * Validate repository format to ensure owner and repo are non-empty
   */
  private validateRepositoryFormat(owner: string, repo: string): void {
    if (!owner?.trim() || !repo?.trim()) {
      throw new OrchestratorError(
        new Error('Invalid repository format: owner and repo must be non-empty'),
        [
          'Provide both owner and repository name',
          'Use format: owner/repository'
        ],
        { owner, repo }
      )
    }
  }
}