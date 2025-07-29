/**
 * @file GitHub Repository Operations Service
 * 
 * High-level service for repository data collection and activity analysis.
 * Coordinates GitHubRestApiService for repository operations.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO.js'
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
      // Validate repository format
      if (!owner || !repo || owner.includes('/') || repo.includes('/')) {
        throw new OrchestratorError(
          new Error(`Invalid repository format: "${owner}/${repo}"`),
          ['Use format "owner/repo"', 'Ensure owner and repo names are valid'],
          { owner, repo }
        )
      }

      // Collect activity data from multiple endpoints with error handling
      const [issues, pullRequests, commits] = await Promise.allSettled([
        this.restService.searchIssues(owner, repo, since),
        this.restService.searchPullRequests(owner, repo, since),
        this.restService.searchCommits(owner, repo, since)
      ])

      // Extract successful results or empty arrays for failed requests
      const issuesData = issues.status === 'fulfilled' ? issues.value : []
      const pullRequestsData = pullRequests.status === 'fulfilled' ? pullRequests.value : []
      const commitsData = commits.status === 'fulfilled' ? commits.value : []

      // Check if all requests failed (likely due to 404 or access denied)
      if (issues.status === 'rejected' && pullRequests.status === 'rejected' && commits.status === 'rejected') {
        // Log the specific error for debugging but handle gracefully
        const sampleError = issues.reason
        
        // Check various ways the 404 status might be represented
        const is404 = sampleError?.status === 404 || 
                      sampleError?.response?.status === 404 ||
                      (sampleError?.message && sampleError.message.includes('Not Found'))
        
        if (is404) {
          throw new OrchestratorError(
            new Error(`Repository not found or access denied: ${owner}/${repo}`),
            ['Check if repository exists', 'Verify repository is public or token has access', 'Check repository name spelling'],
            { owner, repo, status: 404 }
          )
        }
        
        // For other errors, extract proper error message
        let errorMessage = 'Unknown repository access error'
        if (sampleError instanceof Error) {
          errorMessage = sampleError.message
        } else if (sampleError && typeof sampleError === 'object' && 'message' in sampleError) {
          errorMessage = String(sampleError.message)
        } else if (sampleError) {
          errorMessage = String(sampleError)
        }
        
        throw new OrchestratorError(
          new Error(errorMessage),
          ['Check repository exists', 'Verify GitHub token permissions', 'Check network connectivity'],
          { originalError: String(sampleError), owner, repo }
        )
      }

      // Calculate activity metrics using the extracted data
      const totalIssues = issuesData.length
      const openIssues = issuesData.filter(issue => issue.state === 'open').length
      const closedIssues = totalIssues - openIssues

      const totalPullRequests = pullRequestsData.length
      const openPullRequests = pullRequestsData.filter(pr => pr.state === 'open').length
      const mergedPullRequests = pullRequestsData.filter(pr => pr.merged).length
      // closedPullRequests calculated for completeness but not used in this DTO
      // const closedPullRequests = totalPullRequests - openPullRequests - mergedPullRequests

      const totalCommits = commitsData.length

      // Extract unique contributors
      const contributors = new Set<string>()
      for (const issue of issuesData) {
        if (issue.creator) {
          contributors.add(issue.creator)
        }
      }

      for (const pr of pullRequestsData) {
        if (pr.creator) {
          contributors.add(pr.creator)
        }
      }

      for (const commit of commitsData) {
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
      const totalAdditions = commitsData.reduce((sum, commit) => sum + commit.additions, 0)
      const totalDeletions = commitsData.reduce((sum, commit) => sum + commit.deletions, 0)
      const totalFilesChanged = commitsData.reduce((sum, commit) => sum + commit.filesChanged, 0)

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
        contributors.size > 0 ? [...contributors].at(0) ?? null : null, // mostActiveContributor
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