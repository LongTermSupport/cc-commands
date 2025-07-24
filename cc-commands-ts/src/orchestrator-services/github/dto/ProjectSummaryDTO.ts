/**
 * @file GitHub Project Summary Data Transfer Object
 * 
 * Represents a comprehensive GitHub project summary that aggregates data from
 * multiple sources (repositories, issues, pull requests, commits, activity metrics).
 * This is the top-level DTO that combines all other DTOs for final LLM processing.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO'

/**
 * Data Transfer Object for GitHub project summaries
 * 
 * This DTO encapsulates a complete project summary including repository
 * information, development activity, issue tracking, pull request metrics,
 * and overall project health indicators. It aggregates data from multiple
 * other DTOs to provide a comprehensive view for LLM analysis.
 */
export class ProjectSummaryDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_ACTIVE_CONTRIBUTORS: 'PROJECT_ACTIVE_CONTRIBUTORS',
    PROJECT_ACTIVE_REPOSITORIES: 'PROJECT_ACTIVE_REPOSITORIES',
    PROJECT_AVERAGE_ISSUE_AGE_DAYS: 'PROJECT_AVERAGE_ISSUE_AGE_DAYS',
    PROJECT_AVERAGE_PR_AGE_DAYS: 'PROJECT_AVERAGE_PR_AGE_DAYS',
    PROJECT_COMMITS_LAST_30_DAYS: 'PROJECT_COMMITS_LAST_30_DAYS',
    PROJECT_CREATED_AT: 'PROJECT_CREATED_AT',
    PROJECT_DESCRIPTION: 'PROJECT_DESCRIPTION',
    PROJECT_HEALTH_SCORE: 'PROJECT_HEALTH_SCORE',
    PROJECT_ISSUES_CLOSED_RATIO: 'PROJECT_ISSUES_CLOSED_RATIO',
    PROJECT_ISSUES_OPEN_COUNT: 'PROJECT_ISSUES_OPEN_COUNT',
    PROJECT_ISSUES_TOTAL_COUNT: 'PROJECT_ISSUES_TOTAL_COUNT',
    PROJECT_LANGUAGES: 'PROJECT_LANGUAGES',
    PROJECT_NAME: 'PROJECT_NAME',
    PROJECT_OWNER: 'PROJECT_OWNER',
    PROJECT_PRIMARY_LANGUAGE: 'PROJECT_PRIMARY_LANGUAGE',
    PROJECT_PRS_MERGED_RATIO: 'PROJECT_PRS_MERGED_RATIO',
    PROJECT_PRS_OPEN_COUNT: 'PROJECT_PRS_OPEN_COUNT',
    PROJECT_PRS_TOTAL_COUNT: 'PROJECT_PRS_TOTAL_COUNT',
    PROJECT_RECENT_ACTIVITY_LEVEL: 'PROJECT_RECENT_ACTIVITY_LEVEL',
    PROJECT_REPOSITORY_COUNT: 'PROJECT_REPOSITORY_COUNT',
    PROJECT_STARS_TOTAL: 'PROJECT_STARS_TOTAL',
    PROJECT_TOTAL_COMMITS: 'PROJECT_TOTAL_COMMITS',
    PROJECT_TOTAL_CONTRIBUTORS: 'PROJECT_TOTAL_CONTRIBUTORS',
    PROJECT_UPDATED_AT: 'PROJECT_UPDATED_AT',
    PROJECT_URL: 'PROJECT_URL'
  } as const

  constructor(
    public readonly name: string,
    public readonly owner: string,
    public readonly description: string,
    public readonly url: string,
    public readonly primaryLanguage: string,
    public readonly languages: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly repositoryCount: number,
    public readonly activeRepositories: number,
    public readonly starsTotal: number,
    public readonly totalCommits: number,
    public readonly commitsLast30Days: number,
    public readonly totalContributors: number,
    public readonly activeContributors: number,
    public readonly issuesTotalCount: number,
    public readonly issuesOpenCount: number,
    public readonly issuesClosedRatio: number,
    public readonly averageIssueAgeDays: number,
    public readonly prsTotalCount: number,
    public readonly prsOpenCount: number,
    public readonly prsMergedRatio: number,
    public readonly averagePrAgeDays: number,
    public readonly recentActivityLevel: 'high' | 'low' | 'medium',
    public readonly healthScore: number
  ) {}

  /**
   * Create ProjectSummaryDTO from aggregated data sources
   * 
   * @param summaryData - Aggregated data from multiple DTOs and analysis
   * @returns New ProjectSummaryDTO instance
   */
  static fromAggregatedData(summaryData: {
    activeContributors?: number
    activeRepositories?: number
    averageIssueAgeDays?: number
    averagePrAgeDays?: number
    commitsLast30Days?: number
    createdAt?: Date | string
    description?: string
    healthScore?: number
    
    issuesOpenCount?: number
    // Issue metrics
    issuesTotalCount?: number
    languages?: string[]
    
    // Basic project info
    name: string
    owner: string
    
    primaryLanguage?: string
    prsOpenCount?: number
    
    // Pull request metrics
    prsTotalCount?: number
    // Calculated metrics
    recentActivityLevel?: 'high' | 'low' | 'medium'
    // Repository metrics
    repositoryCount?: number
    
    starsTotal?: number
    // Commit metrics
    totalCommits?: number
    // Contributor metrics  
    totalContributors?: number
    
    updatedAt?: Date | string
    url?: string
  }): ProjectSummaryDTO {
    this.validateAggregatedData(summaryData)
    
    return this.createFromAggregatedData(summaryData)
  }

  /**
   * Create ProjectSummaryDTO from manual construction with defaults
   * 
   * @param basicData - Essential project data with optional metrics
   * @returns New ProjectSummaryDTO instance
   */
  static fromBasicData(basicData: {
    createdAt?: Date | string
    description?: string
    name: string
    owner: string
    updatedAt?: Date | string
    url?: string
  }): ProjectSummaryDTO {
    this.validateBasicData(basicData)
    
    return new ProjectSummaryDTO(
      basicData.name,
      basicData.owner,
      basicData.description || 'No description available',
      basicData.url || '',
      'Unknown',
      [],
      this.parseDate(basicData.createdAt) || new Date(),
      this.parseDate(basicData.updatedAt) || new Date(),
      0, // repositoryCount
      0, // activeRepositories
      0, // starsTotal
      0, // totalCommits
      0, // commitsLast30Days
      0, // totalContributors
      0, // activeContributors
      0, // issuesTotalCount
      0, // issuesOpenCount
      0, // issuesClosedRatio
      0, // averageIssueAgeDays
      0, // prsTotalCount
      0, // prsOpenCount
      0, // prsMergedRatio
      0, // averagePrAgeDays
      'low', // recentActivityLevel
      0 // healthScore
    )
  }

  /**
   * Calculate closed/merged ratio as percentage
   */
  private static calculateClosedRatio(total: number, open: number): number {
    if (total === 0) return 0
    const closed = total - open
    return Math.round((closed / total) * 100)
  }

  /**
   * Calculate a basic health score based on available metrics
   */
  private static calculateDefaultHealthScore(issuesClosedRatio: number, prsMergedRatio: number): number {
    // Simple scoring: average of issue resolution and PR merge rates
    return Math.round((issuesClosedRatio + prsMergedRatio) / 2)
  }

  /**
   * Create ProjectSummaryDTO from aggregated data with comprehensive defaults
   */
  private static createFromAggregatedData(summaryData: {
    activeContributors?: number
    activeRepositories?: number
    averageIssueAgeDays?: number
    averagePrAgeDays?: number
    commitsLast30Days?: number
    createdAt?: Date | string
    description?: string
    healthScore?: number
    
    issuesOpenCount?: number
    // Issue metrics
    issuesTotalCount?: number
    languages?: string[]
    
    // Basic project info
    name: string
    owner: string
    
    primaryLanguage?: string
    prsOpenCount?: number
    
    // Pull request metrics
    prsTotalCount?: number
    // Calculated metrics
    recentActivityLevel?: 'high' | 'low' | 'medium'
    // Repository metrics
    repositoryCount?: number
    
    starsTotal?: number
    // Commit metrics
    totalCommits?: number
    // Contributor metrics  
    totalContributors?: number
    
    updatedAt?: Date | string
    url?: string
  }): ProjectSummaryDTO {
    const basicData = this.extractBasicData(summaryData)
    const repositoryMetrics = this.extractRepositoryMetrics(summaryData)
    const activityMetrics = this.extractActivityMetrics(summaryData)
    const issueMetrics = this.extractIssueMetrics(summaryData)
    const prMetrics = this.extractPrMetrics(summaryData)
    const calculatedMetrics = this.extractCalculatedMetrics(summaryData, issueMetrics, prMetrics)

    return new ProjectSummaryDTO(
      basicData.name,
      basicData.owner,
      basicData.description,
      basicData.url,
      basicData.primaryLanguage,
      basicData.languages,
      basicData.createdAt,
      basicData.updatedAt,
      repositoryMetrics.repositoryCount,
      repositoryMetrics.activeRepositories,
      repositoryMetrics.starsTotal,
      activityMetrics.totalCommits,
      activityMetrics.commitsLast30Days,
      activityMetrics.totalContributors,
      activityMetrics.activeContributors,
      issueMetrics.issuesTotalCount,
      issueMetrics.issuesOpenCount,
      calculatedMetrics.issuesClosedRatio,
      issueMetrics.averageIssueAgeDays,
      prMetrics.prsTotalCount,
      prMetrics.prsOpenCount,
      calculatedMetrics.prsMergedRatio,
      prMetrics.averagePrAgeDays,
      calculatedMetrics.recentActivityLevel,
      calculatedMetrics.healthScore
    )
  }

  /**
   * Extract activity metrics with defaults
   */
  private static extractActivityMetrics(summaryData: {
    activeContributors?: number
    commitsLast30Days?: number
    totalCommits?: number
    totalContributors?: number
  }): {
    activeContributors: number
    commitsLast30Days: number
    totalCommits: number
    totalContributors: number
  } {
    return {
      activeContributors: summaryData.activeContributors || 0,
      commitsLast30Days: summaryData.commitsLast30Days || 0,
      totalCommits: summaryData.totalCommits || 0,
      totalContributors: summaryData.totalContributors || 0
    }
  }

  /**
   * Extract basic project data with defaults
   */
  private static extractBasicData(summaryData: {
    createdAt?: Date | string
    description?: string
    languages?: string[]
    name: string
    owner: string
    primaryLanguage?: string
    updatedAt?: Date | string
    url?: string
  }): {
    createdAt: Date
    description: string
    languages: string[]
    name: string
    owner: string
    primaryLanguage: string
    updatedAt: Date
    url: string
  } {
    return {
      createdAt: this.parseDate(summaryData.createdAt) || new Date(),
      description: summaryData.description || 'No description available',
      languages: summaryData.languages || [],
      name: summaryData.name,
      owner: summaryData.owner,
      primaryLanguage: summaryData.primaryLanguage || 'Unknown',
      updatedAt: this.parseDate(summaryData.updatedAt) || new Date(),
      url: summaryData.url || ''
    }
  }

  /**
   * Extract and calculate derived metrics
   */
  private static extractCalculatedMetrics(
    summaryData: {
      healthScore?: number
      recentActivityLevel?: 'high' | 'low' | 'medium'
    },
    issueMetrics: { issuesOpenCount: number; issuesTotalCount: number; },
    prMetrics: { prsOpenCount: number; prsTotalCount: number; }
  ): {
    healthScore: number
    issuesClosedRatio: number
    prsMergedRatio: number
    recentActivityLevel: 'high' | 'low' | 'medium'
  } {
    const issuesClosedRatio = this.calculateClosedRatio(issueMetrics.issuesTotalCount, issueMetrics.issuesOpenCount)
    const prsMergedRatio = this.calculateClosedRatio(prMetrics.prsTotalCount, prMetrics.prsOpenCount)

    return {
      healthScore: summaryData.healthScore || this.calculateDefaultHealthScore(issuesClosedRatio, prsMergedRatio),
      issuesClosedRatio,
      prsMergedRatio,
      recentActivityLevel: summaryData.recentActivityLevel || 'low'
    }
  }

  /**
   * Extract issue metrics with defaults
   */
  private static extractIssueMetrics(summaryData: {
    averageIssueAgeDays?: number
    issuesOpenCount?: number
    issuesTotalCount?: number
  }): {
    averageIssueAgeDays: number
    issuesOpenCount: number
    issuesTotalCount: number
  } {
    return {
      averageIssueAgeDays: summaryData.averageIssueAgeDays || 0,
      issuesOpenCount: summaryData.issuesOpenCount || 0,
      issuesTotalCount: summaryData.issuesTotalCount || 0
    }
  }

  /**
   * Extract pull request metrics with defaults
   */
  private static extractPrMetrics(summaryData: {
    averagePrAgeDays?: number
    prsOpenCount?: number
    prsTotalCount?: number
  }): {
    averagePrAgeDays: number
    prsOpenCount: number
    prsTotalCount: number
  } {
    return {
      averagePrAgeDays: summaryData.averagePrAgeDays || 0,
      prsOpenCount: summaryData.prsOpenCount || 0,
      prsTotalCount: summaryData.prsTotalCount || 0
    }
  }

  /**
   * Extract repository metrics with defaults
   */
  private static extractRepositoryMetrics(summaryData: {
    activeRepositories?: number
    repositoryCount?: number
    starsTotal?: number
  }): {
    activeRepositories: number
    repositoryCount: number
    starsTotal: number
  } {
    return {
      activeRepositories: summaryData.activeRepositories || 0,
      repositoryCount: summaryData.repositoryCount || 0,
      starsTotal: summaryData.starsTotal || 0
    }
  }

  /**
   * Parse date from string or Date object
   */
  private static parseDate(date?: Date | string): Date | null {
    if (!date) return null
    if (date instanceof Date) return date
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  /**
   * Validate aggregated data input
   */
  private static validateAggregatedData(summaryData: unknown): void {
    if (!summaryData || typeof summaryData !== 'object') {
      throw new Error('Invalid project summary data: data is null, undefined, or not an object')
    }

    const data = summaryData as Record<string, unknown>
    if (!data['name'] || typeof data['name'] !== 'string') {
      throw new Error('Invalid project summary data: name is required and must be a string')
    }

    if (!data['owner'] || typeof data['owner'] !== 'string') {
      throw new Error('Invalid project summary data: owner is required and must be a string')
    }
  }

  /**
   * Validate basic data input
   */
  private static validateBasicData(basicData: unknown): void {
    if (!basicData || typeof basicData !== 'object') {
      throw new Error('Invalid basic project data: data is null, undefined, or not an object')
    }

    const data = basicData as Record<string, unknown>
    if (!data['name'] || typeof data['name'] !== 'string') {
      throw new Error('Invalid basic project data: name is required and must be a string')
    }

    if (!data['owner'] || typeof data['owner'] !== 'string') {
      throw new Error('Invalid basic project data: owner is required and must be a string')
    }
  }

  /**
   * Get activity level as human-readable string
   * 
   * @returns Activity level description
   */
  getActivityDescription(): string {
    switch (this.recentActivityLevel) {
      case 'high': {
        return 'Very active with frequent commits and updates'
      }

      case 'low': {
        return 'Low activity with infrequent updates'
      }

      case 'medium': {
        return 'Moderately active with regular updates'
      }

      default: {
        return 'Activity level unknown'
      }
    }
  }

  /**
   * Get project age in days
   * 
   * @returns Number of days since project creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   * 
   * @returns Number of days since last project update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get health status based on health score
   * 
   * @returns Health status description
   */
  getHealthStatus(): string {
    if (this.healthScore >= 80) return 'Excellent'
    if (this.healthScore >= 60) return 'Good'
    if (this.healthScore >= 40) return 'Fair'
    if (this.healthScore >= 20) return 'Poor'
    return 'Critical'
  }

  /**
   * Get a human-readable summary of the project
   * 
   * @returns Brief project description
   */
  getSummary(): string {
    const languageInfo = this.primaryLanguage === 'Unknown' ? '' : ` (${this.primaryLanguage})`
    const repoInfo = this.repositoryCount > 1 ? ` with ${this.repositoryCount} repositories` : ''
    const activityInfo = this.isActivelyMaintained() ? ' - actively maintained' : ' - low activity'
    
    return `${this.owner}/${this.name}${languageInfo}${repoInfo}${activityInfo}`
  }

  /**
   * Check if project has recent activity (updated within specified days)
   * 
   * @param days - Number of days to consider as recent (default: 30)
   * @returns True if project was updated within the specified time frame
   */
  hasRecentActivity(days: number = 30): boolean {
    return this.getDaysSinceUpdate() <= days
  }

  /**
   * Check if project is actively maintained based on multiple factors
   * 
   * @returns True if project shows signs of active maintenance
   */
  isActivelyMaintained(): boolean {
    return this.hasRecentActivity(30) && 
           this.activeContributors > 0 && 
           this.commitsLast30Days > 0 &&
           this.healthScore > 20
  }

  /**
   * Convert project summary data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectSummaryDTO.Keys.PROJECT_ACTIVE_CONTRIBUTORS]: String(this.activeContributors),
      [ProjectSummaryDTO.Keys.PROJECT_ACTIVE_REPOSITORIES]: String(this.activeRepositories),
      [ProjectSummaryDTO.Keys.PROJECT_AVERAGE_ISSUE_AGE_DAYS]: String(this.averageIssueAgeDays),
      [ProjectSummaryDTO.Keys.PROJECT_AVERAGE_PR_AGE_DAYS]: String(this.averagePrAgeDays),
      [ProjectSummaryDTO.Keys.PROJECT_COMMITS_LAST_30_DAYS]: String(this.commitsLast30Days),
      [ProjectSummaryDTO.Keys.PROJECT_CREATED_AT]: this.createdAt.toISOString(),
      [ProjectSummaryDTO.Keys.PROJECT_DESCRIPTION]: this.description,
      [ProjectSummaryDTO.Keys.PROJECT_HEALTH_SCORE]: String(this.healthScore),
      [ProjectSummaryDTO.Keys.PROJECT_ISSUES_CLOSED_RATIO]: String(this.issuesClosedRatio),
      [ProjectSummaryDTO.Keys.PROJECT_ISSUES_OPEN_COUNT]: String(this.issuesOpenCount),
      [ProjectSummaryDTO.Keys.PROJECT_ISSUES_TOTAL_COUNT]: String(this.issuesTotalCount),
      [ProjectSummaryDTO.Keys.PROJECT_LANGUAGES]: this.languages.join(', '),
      [ProjectSummaryDTO.Keys.PROJECT_NAME]: this.name,
      [ProjectSummaryDTO.Keys.PROJECT_OWNER]: this.owner,
      [ProjectSummaryDTO.Keys.PROJECT_PRIMARY_LANGUAGE]: this.primaryLanguage,
      [ProjectSummaryDTO.Keys.PROJECT_PRS_MERGED_RATIO]: String(this.prsMergedRatio),
      [ProjectSummaryDTO.Keys.PROJECT_PRS_OPEN_COUNT]: String(this.prsOpenCount),
      [ProjectSummaryDTO.Keys.PROJECT_PRS_TOTAL_COUNT]: String(this.prsTotalCount),
      [ProjectSummaryDTO.Keys.PROJECT_RECENT_ACTIVITY_LEVEL]: this.recentActivityLevel,
      [ProjectSummaryDTO.Keys.PROJECT_REPOSITORY_COUNT]: String(this.repositoryCount),
      [ProjectSummaryDTO.Keys.PROJECT_STARS_TOTAL]: String(this.starsTotal),
      [ProjectSummaryDTO.Keys.PROJECT_TOTAL_COMMITS]: String(this.totalCommits),
      [ProjectSummaryDTO.Keys.PROJECT_TOTAL_CONTRIBUTORS]: String(this.totalContributors),
      [ProjectSummaryDTO.Keys.PROJECT_UPDATED_AT]: this.updatedAt.toISOString(),
      [ProjectSummaryDTO.Keys.PROJECT_URL]: this.url
    }
  }
}