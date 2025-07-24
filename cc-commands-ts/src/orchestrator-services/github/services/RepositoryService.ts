/**
 * @file GitHub Repository Operations Service
 * 
 * High-level service for repository data collection and activity analysis.
 * Coordinates GitHubRestApiService for repository operations.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError'
import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO'
import { GitHubRestApiService } from './GitHubRestApiService'

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
      // Collect activity data from multiple endpoints
      const [issues, pullRequests, commits] = await Promise.all([
        this.restService.searchIssues(owner, repo, since),
        this.restService.searchPullRequests(owner, repo, since),
        this.restService.searchCommits(owner, repo, since)
      ])

      // Calculate activity metrics
      const totalIssues = issues.length
      const openIssues = issues.filter(issue => issue.state === 'open').length
      const closedIssues = totalIssues - openIssues

      const totalPullRequests = pullRequests.length
      const openPullRequests = pullRequests.filter(pr => pr.state === 'open').length
      const mergedPullRequests = pullRequests.filter(pr => pr.merged).length
      // closedPullRequests calculated for completeness but not used in this DTO
      // const closedPullRequests = totalPullRequests - openPullRequests - mergedPullRequests

      const totalCommits = commits.length

      // Extract unique contributors
      const contributors = new Set<string>()
      for (const issue of issues) {
        if (issue.creator) {
          contributors.add(issue.creator)
        }
      }

      for (const pr of pullRequests) {
        if (pr.creator) {
          contributors.add(pr.creator)
        }
      }

      for (const commit of commits) {
        if (commit.authorName) {
          contributors.add(commit.authorName)
        }
      }

      // Age calculations not used in current ActivityMetricsDTO implementation
      // Could be added in future versions if needed
      const now = new Date()

      // This service handles single repository, so we'll create metrics for one repo
      const repositoryList = [`${owner}/${repo}`]
      const analysisPeriodStart = since
      const analysisPeriodEnd = now
      const analysisPeriodDays = Math.ceil((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate daily averages
      const avgCommitsPerDay = analysisPeriodDays > 0 ? totalCommits / analysisPeriodDays : 0
      const avgIssuesPerDay = analysisPeriodDays > 0 ? totalIssues / analysisPeriodDays : 0
      const avgPrsPerDay = analysisPeriodDays > 0 ? totalPullRequests / analysisPeriodDays : 0
      
      // Calculate totals for code changes
      const totalAdditions = commits.reduce((sum, commit) => sum + commit.additions, 0)
      const totalDeletions = commits.reduce((sum, commit) => sum + commit.deletions, 0)
      const totalFilesChanged = commits.reduce((sum, commit) => sum + commit.filesChanged, 0)

      return new ActivityMetricsDTO(
        1, // repositoriesCount
        repositoryList,
        analysisPeriodStart,
        analysisPeriodEnd,
        analysisPeriodDays,
        totalCommits,
        totalIssues,
        openIssues,
        closedIssues,
        totalPullRequests,
        openPullRequests,
        mergedPullRequests,
        contributors.size, // contributorsCount
        contributors.size, // activeContributors (same as total for single repo)
        contributors.size > 0 ? [...contributors][0] ?? null : null, // mostActiveContributor
        `${owner}/${repo}`, // mostActiveRepository
        0, // releaseCount (not calculated in this method)
        totalAdditions,
        totalDeletions,
        totalFilesChanged,
        avgCommitsPerDay,
        avgIssuesPerDay,
        avgPrsPerDay
      )

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
}