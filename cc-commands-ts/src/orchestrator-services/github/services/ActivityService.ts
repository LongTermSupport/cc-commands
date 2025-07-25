/**
 * @file GitHub Activity Analysis Service
 * 
 * High-level service for analyzing activity patterns across multiple repositories.
 * Aggregates activity data and provides project-level insights.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError'
import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO'
import { ProjectSummaryDTO } from '../dto/ProjectSummaryDTO'
import { RepositoryService } from './RepositoryService'

/**
 * GitHub Activity Service for high-level activity analysis
 * 
 * This service provides cross-repository activity analysis capabilities,
 * aggregating data from multiple repositories to provide project-level insights
 * and identify activity patterns across a GitHub organization or project.
 */
export class ActivityService {
  constructor(private readonly repositoryService: RepositoryService) {}

  /**
   * Aggregate activity metrics across multiple repositories
   * 
   * @param repos - Array of repository names in 'owner/repo' format
   * @param owner - Repository owner (user or organization)
   * @param since - Start date for activity analysis
   * @returns Aggregated activity metrics DTO
   * @throws {OrchestratorError} When any repository analysis fails
   */
  async aggregateActivityAcrossRepos(repos: string[], owner: string, since: Date): Promise<ActivityMetricsDTO> {
    if (repos.length === 0) {
      throw new OrchestratorError(
        new Error('No repositories provided for activity analysis'),
        [
          'Provide at least one repository for analysis',
          'Verify that the project contains repositories',
          'Check if the repositories are accessible'
        ],
        { owner, repositoryCount: repos.length, since: since.toISOString() }
      )
    }

    try {
      // Collect activity data from all repositories concurrently
      const repositoryActivities = await Promise.all(
        repos.map(async (repoFullName) => {
          const repoName = repoFullName.split('/')[1] || repoFullName
          return this.repositoryService.getRepositoryActivity(owner, repoName, since)
        })
      )

      // Aggregate all metrics
      return this.combineActivityMetrics(repositoryActivities, since)

    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify all repositories exist and are accessible',
          'Check if GitHub token has read access to all repositories',
          'Try reducing the time window if rate limits are exceeded',
          'Verify network connectivity to GitHub'
        ],
        { owner, repositories: repos, since: since.toISOString() }
      )
    }
  }

  /**
   * Calculate high-level project summary from activity metrics
   * 
   * @param activities - Array of activity metrics from different repositories
   * @returns Project summary DTO with aggregated insights
   * @throws {OrchestratorError} When summary calculation fails
   */
  async calculateActivitySummary(activities: ActivityMetricsDTO[]): Promise<ProjectSummaryDTO> {
    if (activities.length === 0) {
      throw new OrchestratorError(
        new Error('No activity metrics provided for summary calculation'),
        [
          'Provide at least one activity metrics object',
          'Ensure repositories have been analyzed first',
          'Check if the activity analysis completed successfully'
        ],
        { activitiesCount: activities.length }
      )
    }

    try {
      // Aggregate all activity data
      const combinedActivity = this.combineActivityMetrics(activities, activities[0]?.analysisPeriodStart || new Date())
      
      // Extract summary data from combined metrics
      const {repositoryList} = combinedActivity
      const primaryRepo = repositoryList[0] || 'unknown/unknown'
      const [owner, name] = primaryRepo.split('/')

      // Calculate health score based on activity patterns
      const healthScore = this.calculateHealthScore(combinedActivity)
      
      // Determine recent activity level
      const recentActivityLevel = this.determineActivityLevel(combinedActivity)

      // Create summary DTO with aggregated data
      return ProjectSummaryDTO.fromAggregatedData({
        activeContributors: combinedActivity.activeContributors,
        activeRepositories: repositoryList.length,
        averageIssueAgeDays: this.calculateAverageIssueAge(activities),
        averagePrAgeDays: this.calculateAveragePrAge(activities),
        commitsLast30Days: combinedActivity.commitsCount, // Simplified - using total for period
        createdAt: combinedActivity.analysisPeriodStart,
        description: `Project with ${repositoryList.length} repositories`,
        healthScore,
        issuesOpenCount: combinedActivity.openIssuesCount,
        issuesTotalCount: combinedActivity.totalIssuesCount,
        languages: ['Mixed'], // Simplified for aggregated analysis
        name: name || 'Unknown Project',
        owner: owner || 'unknown',
        primaryLanguage: 'Mixed', // Multi-repo projects have mixed languages
        prsOpenCount: combinedActivity.openPrsCount,
        prsTotalCount: combinedActivity.totalPrsCount,
        recentActivityLevel,
        repositoryCount: combinedActivity.repositoriesCount,
        starsTotal: 0, // Not available in activity metrics
        totalCommits: combinedActivity.commitsCount,
        totalContributors: combinedActivity.contributorsCount,
        updatedAt: combinedActivity.analysisPeriodEnd,
        url: `https://github.com/${owner}`
      })

    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify activity metrics contain valid data',
          'Check if repositories were properly analyzed',
          'Ensure activity data covers the expected time period'
        ],
        { activitiesCount: activities.length }
      )
    }
  }

  /**
   * Identify most active repositories from activity metrics
   * 
   * @param activities - Array of activity metrics from different repositories
   * @returns Array of repository names sorted by activity level
   * @throws {OrchestratorError} When activity analysis fails
   */
  async identifyMostActiveRepositories(activities: ActivityMetricsDTO[]): Promise<string[]> {
    if (activities.length === 0) {
      throw new OrchestratorError(
        new Error('No activity metrics provided for repository ranking'),
        [
          'Provide at least one activity metrics object',
          'Ensure repositories have been analyzed first',
          'Check if the activity analysis completed successfully'
        ],
        { activitiesCount: activities.length }
      )
    }

    try {
      // Calculate activity score for each repository
      const repositoryScores = activities.map(activity => ({
        repository: activity.mostActiveRepository || 'unknown/unknown',
        score: this.calculateRepositoryActivityScore(activity)
      }))

      // Sort by activity score descending and return repository names
      return repositoryScores
        .sort((a, b) => b.score - a.score)
        .map(item => item.repository)
        .filter(repo => repo !== 'unknown/unknown')

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify activity metrics contain valid repository data',
          'Check if activity scores can be calculated',
          'Ensure all repositories have valid names'
        ],
        { activitiesCount: activities.length }
      )
    }
  }

  /**
   * Calculate average issue age across all activities
   */
  private calculateAverageIssueAge(activities: ActivityMetricsDTO[]): number {
    // Simplified calculation - would need individual issue ages for accuracy
    // Using analysis period as proxy for average age
    let totalDays = 0
    for (const activity of activities) {
      totalDays += activity.analysisPeriodDays
    }

    return activities.length > 0 ? totalDays / activities.length : 0
  }

  /**
   * Calculate average PR age across all activities
   */
  private calculateAveragePrAge(activities: ActivityMetricsDTO[]): number {
    // Simplified calculation - would need individual PR ages for accuracy
    // Using analysis period as proxy for average age
    let totalDays = 0
    for (const activity of activities) {
      totalDays += activity.analysisPeriodDays
    }

    return activities.length > 0 ? totalDays / activities.length : 0
  }

  /**
   * Calculate earliest start, latest end, and total days from activities
   */
  private calculateDateRange(activities: ActivityMetricsDTO[], since: Date): {
    earliestStart: Date
    latestEnd: Date
    totalDays: number
  } {
    let earliestStart = activities[0]?.analysisPeriodStart || since
    let latestEnd = activities[0]?.analysisPeriodEnd || new Date()
    
    for (const activity of activities) {
      if (activity.analysisPeriodStart < earliestStart) {
        earliestStart = activity.analysisPeriodStart
      }

      if (activity.analysisPeriodEnd > latestEnd) {
        latestEnd = activity.analysisPeriodEnd
      }
    }

    const totalDays = Math.ceil((latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24))

    return { earliestStart, latestEnd, totalDays }
  }

  /**
   * Calculate health score based on activity patterns
   */
  private calculateHealthScore(activity: ActivityMetricsDTO): number {
    // Health score based on activity ratios and patterns
    const issueResolutionRate = activity.totalIssuesCount > 0 ? 
      activity.closedIssuesCount / activity.totalIssuesCount : 0
    
    const prMergeRate = activity.totalPrsCount > 0 ? 
      activity.mergedPrsCount / activity.totalPrsCount : 0
    
    const commitActivity = Math.min(activity.avgCommitsPerDay / 5, 1) // Normalize to daily commits
    
    // Weighted average of health indicators (0-100 scale)
    const healthScore = (
      (issueResolutionRate * 40) + // 40% weight on issue resolution
      (prMergeRate * 30) +         // 30% weight on PR merge rate
      (commitActivity * 30)        // 30% weight on commit activity
    ) * 100

    return Math.round(Math.min(healthScore, 100))
  }

  /**
   * Calculate repository activity score for ranking purposes
   */
  private calculateRepositoryActivityScore(activity: ActivityMetricsDTO): number {
    // Score based on multiple activity factors
    return (
      activity.commitsCount * 2 +        // Commits weighted highest
      activity.totalPrsCount * 1.5 +     // PRs weighted high
      Number(activity.totalIssuesCount) * 1 +    // Issues weighted medium
      activity.contributorsCount * 3     // Contributors weighted very high
    )
  }

  /**
   * Collect all unique repositories from activities
   */
  private collectAllRepositories(activities: ActivityMetricsDTO[]): Set<string> {
    const allRepositories = new Set<string>()
    for (const activity of activities) {
      for (const repo of activity.repositoryList) {
        allRepositories.add(repo)
      }
    }

    return allRepositories
  }

  /**
   * Combine multiple activity metrics into a single aggregated metric
   */
  private combineActivityMetrics(activities: ActivityMetricsDTO[], since: Date): ActivityMetricsDTO {
    if (activities.length === 0) {
      return this.createEmptyActivityMetrics(since)
    }

    const allRepositories = this.collectAllRepositories(activities)
    const totals = this.sumActivityTotals(activities)
    const { earliestStart, latestEnd, totalDays } = this.calculateDateRange(activities, since)
    const mostActiveRepo = this.findMostActiveRepository(activities)

    return new ActivityMetricsDTO(
      allRepositories.size, // repositoriesCount
      [...allRepositories], // repositoryList
      earliestStart, // analysisPeriodStart
      latestEnd, // analysisPeriodEnd
      totalDays, // analysisPeriodDays
      totals.commitsCount, // commitsCount
      totals.totalIssuesCount, // totalIssuesCount
      totals.openIssuesCount, // openIssuesCount
      totals.closedIssuesCount, // closedIssuesCount
      totals.totalPrsCount, // totalPrsCount
      totals.openPrsCount, // openPrsCount
      totals.mergedPrsCount, // mergedPrsCount
      totals.contributorsCount, // contributorsCount (simplified - may double-count)
      totals.contributorsCount, // activeContributors (simplified)
      mostActiveRepo?.mostActiveContributor || null, // mostActiveContributor
      mostActiveRepo?.mostActiveRepository || null, // mostActiveRepository
      0, // releaseCount (not available in current metrics)
      totals.totalAdditions, // totalAdditions
      totals.totalDeletions, // totalDeletions
      totals.totalFilesChanged, // totalFilesChanged
      totalDays > 0 ? totals.commitsCount / totalDays : 0, // avgCommitsPerDay
      totalDays > 0 ? totals.totalIssuesCount / totalDays : 0, // avgIssuesPerDay
      totalDays > 0 ? totals.totalPrsCount / totalDays : 0 // avgPrsPerDay
    )
  }

  /**
   * Create empty activity metrics for when no activities are provided
   */
  private createEmptyActivityMetrics(since: Date): ActivityMetricsDTO {
    const now = new Date()
    const periodDays = Math.ceil((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24))
    
    return new ActivityMetricsDTO(
      0, // repositoriesCount
      [], // repositoryList
      since, // analysisPeriodStart
      now, // analysisPeriodEnd
      periodDays, // analysisPeriodDays
      0, // commitsCount
      0, // totalIssuesCount
      0, // openIssuesCount
      0, // closedIssuesCount
      0, // totalPrsCount
      0, // openPrsCount
      0, // mergedPrsCount
      0, // contributorsCount
      0, // activeContributors
      null, // mostActiveContributor
      null, // mostActiveRepository
      0, // releaseCount
      0, // totalAdditions
      0, // totalDeletions
      0, // totalFilesChanged
      0, // avgCommitsPerDay
      0, // avgIssuesPerDay
      0 // avgPrsPerDay
    )
  }

  /**
   * Determine activity level based on recent metrics
   */
  private determineActivityLevel(activity: ActivityMetricsDTO): 'high' | 'low' | 'medium' {
    const dailyCommits = activity.avgCommitsPerDay
    const dailyIssues = activity.avgIssuesPerDay
    const dailyPRs = activity.avgPrsPerDay
    
    const totalDailyActivity = dailyCommits + dailyIssues + dailyPRs
    
    if (totalDailyActivity >= 5) return 'high'
    if (totalDailyActivity >= 1) return 'medium'
    return 'low'
  }

  /**
   * Find most active repository (by commits)
   */
  private findMostActiveRepository(activities: ActivityMetricsDTO[]): ActivityMetricsDTO | null {
    let mostActiveRepo: ActivityMetricsDTO | null = null
    for (const activity of activities) {
      if (mostActiveRepo === null || activity.commitsCount > mostActiveRepo.commitsCount) {
        mostActiveRepo = activity
      }
    }

    return mostActiveRepo
  }

  /**
   * Sum all numeric metrics from activities
   */
  private sumActivityTotals(activities: ActivityMetricsDTO[]): {
    closedIssuesCount: number
    commitsCount: number
    contributorsCount: number
    mergedPrsCount: number
    openIssuesCount: number
    openPrsCount: number
    totalAdditions: number
    totalDeletions: number
    totalFilesChanged: number
    totalIssuesCount: number
    totalPrsCount: number
  } {
    const totals = {
      closedIssuesCount: 0,
      commitsCount: 0,
      contributorsCount: 0,
      mergedPrsCount: 0,
      openIssuesCount: 0,
      openPrsCount: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      totalFilesChanged: 0,
      totalIssuesCount: 0,
      totalPrsCount: 0
    }

    for (const activity of activities) {
      totals.closedIssuesCount += activity.closedIssuesCount
      totals.commitsCount += activity.commitsCount
      totals.contributorsCount += activity.contributorsCount
      totals.mergedPrsCount += activity.mergedPrsCount
      totals.openIssuesCount += activity.openIssuesCount
      totals.openPrsCount += activity.openPrsCount
      totals.totalAdditions += activity.totalAdditions
      totals.totalDeletions += activity.totalDeletions
      totals.totalFilesChanged += activity.totalFilesChanged
      totals.totalIssuesCount += activity.totalIssuesCount
      totals.totalPrsCount += activity.totalPrsCount
    }

    return totals
  }
}