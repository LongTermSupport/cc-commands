/**
 * @file GitHub Activity Metrics Data Transfer Object
 * 
 * Aggregates cross-repository activity data for comprehensive project analysis.
 * Provides metrics on commits, issues, pull requests, and general repository
 * activity over specified time periods for LLM consumption.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'

/**
 * Data Transfer Object for GitHub activity metrics
 * 
 * This DTO aggregates activity data across multiple repositories to provide
 * comprehensive project-level statistics. It supports both individual repository
 * metrics and cross-repository aggregation for project analysis.
 */
export class ActivityMetricsDTO implements ILLMDataDTO {
  private static readonly Keys = {
    ACTIVITY_ACTIVE_CONTRIBUTORS: 'ACTIVITY_ACTIVE_CONTRIBUTORS',
    ACTIVITY_ANALYSIS_PERIOD_DAYS: 'ACTIVITY_ANALYSIS_PERIOD_DAYS',
    ACTIVITY_ANALYSIS_PERIOD_END: 'ACTIVITY_ANALYSIS_PERIOD_END',
    ACTIVITY_ANALYSIS_PERIOD_START: 'ACTIVITY_ANALYSIS_PERIOD_START',
    ACTIVITY_AVG_COMMITS_PER_DAY: 'ACTIVITY_AVG_COMMITS_PER_DAY',
    ACTIVITY_AVG_ISSUES_PER_DAY: 'ACTIVITY_AVG_ISSUES_PER_DAY',
    ACTIVITY_AVG_PRS_PER_DAY: 'ACTIVITY_AVG_PRS_PER_DAY',
    ACTIVITY_CLOSED_ISSUES_COUNT: 'ACTIVITY_CLOSED_ISSUES_COUNT',
    ACTIVITY_COMMITS_COUNT: 'ACTIVITY_COMMITS_COUNT',
    ACTIVITY_CONTRIBUTORS_COUNT: 'ACTIVITY_CONTRIBUTORS_COUNT',
    ACTIVITY_MERGED_PRS_COUNT: 'ACTIVITY_MERGED_PRS_COUNT',
    ACTIVITY_MOST_ACTIVE_CONTRIBUTOR: 'ACTIVITY_MOST_ACTIVE_CONTRIBUTOR',
    ACTIVITY_MOST_ACTIVE_REPOSITORY: 'ACTIVITY_MOST_ACTIVE_REPOSITORY',
    ACTIVITY_OPEN_ISSUES_COUNT: 'ACTIVITY_OPEN_ISSUES_COUNT',
    ACTIVITY_OPEN_PRS_COUNT: 'ACTIVITY_OPEN_PRS_COUNT',
    ACTIVITY_RELEASE_COUNT: 'ACTIVITY_RELEASE_COUNT',
    ACTIVITY_REPOSITORIES_COUNT: 'ACTIVITY_REPOSITORIES_COUNT',
    ACTIVITY_REPOSITORY_LIST: 'ACTIVITY_REPOSITORY_LIST',
    ACTIVITY_TOTAL_ADDITIONS: 'ACTIVITY_TOTAL_ADDITIONS',
    ACTIVITY_TOTAL_DELETIONS: 'ACTIVITY_TOTAL_DELETIONS',
    ACTIVITY_TOTAL_FILES_CHANGED: 'ACTIVITY_TOTAL_FILES_CHANGED',
    ACTIVITY_TOTAL_ISSUES_COUNT: 'ACTIVITY_TOTAL_ISSUES_COUNT',
    ACTIVITY_TOTAL_PRS_COUNT: 'ACTIVITY_TOTAL_PRS_COUNT'
  } as const

  constructor(
    public readonly repositoriesCount: number,
    public readonly repositoryList: string[],
    public readonly analysisPeriodStart: Date,
    public readonly analysisPeriodEnd: Date,
    public readonly analysisPeriodDays: number,
    public readonly commitsCount: number,
    public readonly totalIssuesCount: number,
    public readonly openIssuesCount: number,
    public readonly closedIssuesCount: number,
    public readonly totalPrsCount: number,
    public readonly openPrsCount: number,
    public readonly mergedPrsCount: number,
    public readonly contributorsCount: number,
    public readonly activeContributors: number,
    public readonly mostActiveContributor: null | string,
    public readonly mostActiveRepository: null | string,
    public readonly releaseCount: number,
    public readonly totalAdditions: number,
    public readonly totalDeletions: number,
    public readonly totalFilesChanged: number,
    public readonly avgCommitsPerDay: number,
    public readonly avgIssuesPerDay: number,
    public readonly avgPrsPerDay: number
  ) {}

  /**
   * Create empty metrics for repositories with no activity
   * 
   * @param repositories - Repository names
   * @param periodStart - Analysis start date
   * @param periodEnd - Analysis end date
   * @returns ActivityMetricsDTO with zero metrics
   */
  static createEmpty(repositories: string[], periodStart: Date, periodEnd: Date): ActivityMetricsDTO {
    const periodDays = ActivityMetricsDTO.calculateDaysBetween(periodStart, periodEnd)
    
    return new ActivityMetricsDTO(
      repositories.length,
      repositories,
      periodStart,
      periodEnd,
      periodDays,
      0, // commits
      0, // total issues
      0, // open issues
      0, // closed issues
      0, // total PRs
      0, // open PRs
      0, // merged PRs
      0, // contributors
      0, // active contributors
      null, // most active contributor
      null, // most active repository
      0, // releases
      0, // additions
      0, // deletions
      0, // files changed
      0, // avg commits per day
      0, // avg issues per day
      0  // avg PRs per day
    )
  }

  /**
   * Create ActivityMetricsDTO from aggregated repository data
   * 
   * @param repositories - Array of repository names
   * @param periodStart - Analysis period start date
   * @param periodEnd - Analysis period end date
   * @param metrics - Aggregated metrics data
   * @param metrics.commits - Total commit count
   * @param metrics.issues - Issue statistics
   * @param metrics.issues.total - Total issue count
   * @param metrics.issues.open - Open issue count
   * @param metrics.issues.closed - Closed issue count
   * @param metrics.pullRequests - Pull request statistics
   * @param metrics.pullRequests.total - Total PR count
   * @param metrics.pullRequests.open - Open PR count
   * @param metrics.pullRequests.merged - Merged PR count
   * @param metrics.contributors - Contributor statistics
   * @param metrics.contributors.total - Total contributor count
   * @param metrics.contributors.active - Active contributor count
   * @param metrics.contributors.mostActive - Most active contributor name
   * @param metrics.mostActiveRepo - Most active repository name
   * @param metrics.releases - Release count
   * @param metrics.codeChanges - Code change statistics
   * @param metrics.codeChanges.additions - Lines added
   * @param metrics.codeChanges.deletions - Lines deleted
   * @param metrics.codeChanges.filesChanged - Files changed
   * @returns New ActivityMetricsDTO instance
   */
  static fromAggregatedData(
    repositories: string[],
    periodStart: Date,
    periodEnd: Date,
    metrics: {
      codeChanges: { additions: number; deletions: number; filesChanged: number }
      commits: number
      contributors: { active: number; mostActive?: string; total: number; }
      issues: { closed: number; open: number; total: number; }
      mostActiveRepo?: string
      pullRequests: { merged: number; open: number; total: number; }
      releases: number
    }
  ): ActivityMetricsDTO {
    const periodDays = ActivityMetricsDTO.calculateDaysBetween(periodStart, periodEnd)
    
    return new ActivityMetricsDTO(
      repositories.length,
      repositories,
      periodStart,
      periodEnd,
      periodDays,
      metrics.commits,
      metrics.issues.total,
      metrics.issues.open,
      metrics.issues.closed,
      metrics.pullRequests.total,
      metrics.pullRequests.open,
      metrics.pullRequests.merged,
      metrics.contributors.total,
      metrics.contributors.active,
      metrics.contributors.mostActive || null,
      metrics.mostActiveRepo || null,
      metrics.releases,
      metrics.codeChanges.additions,
      metrics.codeChanges.deletions,
      metrics.codeChanges.filesChanged,
      ActivityMetricsDTO.calculateAverage(metrics.commits, periodDays),
      ActivityMetricsDTO.calculateAverage(metrics.issues.total, periodDays),
      ActivityMetricsDTO.calculateAverage(metrics.pullRequests.total, periodDays)
    )
  }

  /**
   * Create ActivityMetricsDTO from time-based analysis
   * 
   * @param repositories - Repository names to analyze
   * @param timeWindow - Time window in days (7, 30, 90, etc.)
   * @param rawMetrics - Raw metrics collected from APIs
   * @param rawMetrics.commitData - Commit data per repository
   * @param rawMetrics.issueData - Issue data per repository
   * @param rawMetrics.prData - Pull request data per repository
   * @param rawMetrics.contributorData - Contributor data per repository
   * @param rawMetrics.releaseData - Release data per repository
   * @returns New ActivityMetricsDTO instance
   */
  static fromTimeWindow(
    repositories: string[],
    timeWindow: number,
    rawMetrics: {
      commitData: Array<{ additions: number; count: number; deletions: number; files: number; repo: string; }>
      contributorData: Array<{ activeContributors: string[]; contributors: string[]; repo: string; }>
      issueData: Array<{ closed: number; open: number; repo: string; total: number; }>
      prData: Array<{ merged: number; open: number; repo: string; total: number; }>
      releaseData: Array<{ releases: number; repo: string; }>
    }
  ): ActivityMetricsDTO {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (timeWindow * 24 * 60 * 60 * 1000))
    
    // Aggregate commit data
    const totalCommits = rawMetrics.commitData.reduce((sum, repo) => sum + repo.count, 0)
    const totalAdditions = rawMetrics.commitData.reduce((sum, repo) => sum + repo.additions, 0)
    const totalDeletions = rawMetrics.commitData.reduce((sum, repo) => sum + repo.deletions, 0)
    const totalFilesChanged = rawMetrics.commitData.reduce((sum, repo) => sum + repo.files, 0)
    
    // Aggregate issue data
    const totalIssues = rawMetrics.issueData.reduce((sum, repo) => sum + repo.total, 0)
    const openIssues = rawMetrics.issueData.reduce((sum, repo) => sum + repo.open, 0)
    const closedIssues = rawMetrics.issueData.reduce((sum, repo) => sum + repo.closed, 0)
    
    // Aggregate PR data
    const totalPrs = rawMetrics.prData.reduce((sum, repo) => sum + repo.total, 0)
    const openPrs = rawMetrics.prData.reduce((sum, repo) => sum + repo.open, 0)
    const mergedPrs = rawMetrics.prData.reduce((sum, repo) => sum + repo.merged, 0)
    
    // Aggregate contributor data
    const allContributors = new Set<string>()
    const allActiveContributors = new Set<string>()
    
    for (const repoData of rawMetrics.contributorData) {
      for (const contributor of repoData.contributors) {
        allContributors.add(contributor)
      }

      for (const activeContributor of repoData.activeContributors) {
        allActiveContributors.add(activeContributor)
      }
    }
    
    // Find most active contributor and repository
    const mostActiveContributor = ActivityMetricsDTO.findMostActiveContributor(rawMetrics.contributorData)
    const mostActiveRepo = ActivityMetricsDTO.findMostActiveRepository(rawMetrics.commitData)
    
    // Aggregate release data
    const totalReleases = rawMetrics.releaseData.reduce((sum, repo) => sum + repo.releases, 0)
    
    return new ActivityMetricsDTO(
      repositories.length,
      repositories,
      startDate,
      endDate,
      timeWindow,
      totalCommits,
      totalIssues,
      openIssues,
      closedIssues,
      totalPrs,
      openPrs,
      mergedPrs,
      allContributors.size,
      allActiveContributors.size,
      mostActiveContributor,
      mostActiveRepo,
      totalReleases,
      totalAdditions,
      totalDeletions,
      totalFilesChanged,
      ActivityMetricsDTO.calculateAverage(totalCommits, timeWindow),
      ActivityMetricsDTO.calculateAverage(totalIssues, timeWindow),
      ActivityMetricsDTO.calculateAverage(totalPrs, timeWindow)
    )
  }

  /**
   * Calculate average value over time period
   */
  private static calculateAverage(total: number, days: number): number {
    if (days === 0) return 0
    return Math.round((total / days) * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Calculate days between two dates
   */
  private static calculateDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Find most active contributor across repositories
   */
  private static findMostActiveContributor(
    contributorData: Array<{ activeContributors: string[]; contributors: string[]; repo: string; }>
  ): null | string {
    const contributorCounts = new Map<string, number>()
    
    for (const repoData of contributorData) {
      for (const contributor of repoData.activeContributors) {
        contributorCounts.set(contributor, (contributorCounts.get(contributor) || 0) + 1)
      }
    }
    
    if (contributorCounts.size === 0) return null
    
    let mostActive = ''
    let maxCount = 0
    
    for (const [contributor, count] of contributorCounts) {
      if (count > maxCount) {
        maxCount = count
        mostActive = contributor
      }
    }
    
    return mostActive || null
  }

  /**
   * Find most active repository based on commit count
   */
  private static findMostActiveRepository(
    commitData: Array<{ additions: number; count: number; deletions: number; files: number; repo: string; }>
  ): null | string {
    if (commitData.length === 0) return null
    
    let mostActive = ''
    let maxCommits = 0
    
    for (const repoData of commitData) {
      if (repoData.count > maxCommits) {
        maxCommits = repoData.count
        mostActive = repoData.repo
      }
    }
    
    return mostActive || null
  }

  /**
   * Calculate average daily total activity (mathematical fact)
   * 
   * @returns Average daily activity count (commits + issues + PRs per day)
   */
  getAverageDailyActivity(): number {
    const totalActivity = this.commitsCount + this.totalIssuesCount + this.totalPrsCount
    if (this.analysisPeriodDays === 0) return 0
    return Math.round((totalActivity / this.analysisPeriodDays) * 100) / 100
  }

  /**
   * Calculate contributor engagement ratio
   * 
   * @returns Ratio of active contributors to total contributors (0-1)
   */
  getContributorEngagementRatio(): number {
    if (this.contributorsCount === 0) return 0
    return Math.round((this.activeContributors / this.contributorsCount) * 100) / 100
  }

  /**
   * Calculate issue resolution rate percentage
   * 
   * @returns Percentage of issues that were closed (0-100)
   */
  getIssueResolutionRate(): number {
    if (this.totalIssuesCount === 0) return 0
    return Math.round((this.closedIssuesCount / this.totalIssuesCount) * 100)
  }

  /**
   * Calculate merge rate percentage for pull requests
   * 
   * @returns Percentage of PRs that were merged (0-100)
   */
  getMergeRate(): number {
    if (this.totalPrsCount === 0) return 0
    return Math.round((this.mergedPrsCount / this.totalPrsCount) * 100)
  }

  /**
   * Get a human-readable summary of the activity metrics
   * 
   * @returns Brief activity summary for logging/debugging
   */
  getSummary(): string {
    const avgDaily = this.getAverageDailyActivity()
    const repos = this.repositoriesCount === 1 ? 'repository' : 'repositories'
    return `${this.repositoriesCount} ${repos}, ${this.analysisPeriodDays} days: ${this.commitsCount} commits, ${this.totalIssuesCount} issues, ${this.totalPrsCount} PRs (${avgDaily} avg daily activity)`
  }

  /**
   * Check if metrics indicate active development
   * 
   * @returns True if project shows signs of active development
   */
  isActivelyDeveloped(): boolean {
    // Consider active if there's at least 1 commit per week on average
    const weeklyCommitThreshold = this.analysisPeriodDays / 7
    return this.commitsCount >= weeklyCommitThreshold && this.activeContributors > 0
  }

  /**
   * Convert activity metrics to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ActivityMetricsDTO.Keys.ACTIVITY_ACTIVE_CONTRIBUTORS]: String(this.activeContributors),
      [ActivityMetricsDTO.Keys.ACTIVITY_ANALYSIS_PERIOD_DAYS]: String(this.analysisPeriodDays),
      [ActivityMetricsDTO.Keys.ACTIVITY_ANALYSIS_PERIOD_END]: this.analysisPeriodEnd.toISOString(),
      [ActivityMetricsDTO.Keys.ACTIVITY_ANALYSIS_PERIOD_START]: this.analysisPeriodStart.toISOString(),
      [ActivityMetricsDTO.Keys.ACTIVITY_AVG_COMMITS_PER_DAY]: String(this.avgCommitsPerDay),
      [ActivityMetricsDTO.Keys.ACTIVITY_AVG_ISSUES_PER_DAY]: String(this.avgIssuesPerDay),
      [ActivityMetricsDTO.Keys.ACTIVITY_AVG_PRS_PER_DAY]: String(this.avgPrsPerDay),
      [ActivityMetricsDTO.Keys.ACTIVITY_CLOSED_ISSUES_COUNT]: String(this.closedIssuesCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_COMMITS_COUNT]: String(this.commitsCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_CONTRIBUTORS_COUNT]: String(this.contributorsCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_MERGED_PRS_COUNT]: String(this.mergedPrsCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_MOST_ACTIVE_CONTRIBUTOR]: this.mostActiveContributor || '',
      [ActivityMetricsDTO.Keys.ACTIVITY_MOST_ACTIVE_REPOSITORY]: this.mostActiveRepository || '',
      [ActivityMetricsDTO.Keys.ACTIVITY_OPEN_ISSUES_COUNT]: String(this.openIssuesCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_OPEN_PRS_COUNT]: String(this.openPrsCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_RELEASE_COUNT]: String(this.releaseCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_REPOSITORIES_COUNT]: String(this.repositoriesCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_REPOSITORY_LIST]: this.repositoryList.join(', '),
      [ActivityMetricsDTO.Keys.ACTIVITY_TOTAL_ADDITIONS]: String(this.totalAdditions),
      [ActivityMetricsDTO.Keys.ACTIVITY_TOTAL_DELETIONS]: String(this.totalDeletions),
      [ActivityMetricsDTO.Keys.ACTIVITY_TOTAL_FILES_CHANGED]: String(this.totalFilesChanged),
      [ActivityMetricsDTO.Keys.ACTIVITY_TOTAL_ISSUES_COUNT]: String(this.totalIssuesCount),
      [ActivityMetricsDTO.Keys.ACTIVITY_TOTAL_PRS_COUNT]: String(this.totalPrsCount)
    }
  }
}