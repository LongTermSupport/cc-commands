/**
 * @file GitHub Project Summary Data Transfer Object
 * 
 * Represents a comprehensive GitHub project summary with pure mathematical facts
 * from multiple sources (repositories, issues, pull requests, commits, activity metrics).
 * This DTO provides raw numerical data and ratios for LLM analysis and interpretation.
 * 
 * CRITICAL: This DTO contains ONLY mathematical facts and ratios. No subjective
 * analysis, interpretation, or quality judgments are included.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'

/**
 * Data Transfer Object for GitHub project summaries
 * 
 * This DTO encapsulates mathematical facts about a project including repository
 * counts, development activity ratios, issue metrics, pull request statistics,
 * and time-based calculations. It aggregates numerical data from multiple
 * sources to provide factual measurements for LLM interpretation.
 */
export class ProjectSummaryDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_ACTIVE_CONTRIBUTORS: 'PROJECT_ACTIVE_CONTRIBUTORS',
    PROJECT_ACTIVE_REPOSITORIES: 'PROJECT_ACTIVE_REPOSITORIES',
    PROJECT_ACTIVITY_DENSITY_LAST_30_DAYS: 'PROJECT_ACTIVITY_DENSITY_LAST_30_DAYS',
    PROJECT_AGE_DAYS: 'PROJECT_AGE_DAYS',
    PROJECT_AVERAGE_ISSUE_AGE_DAYS: 'PROJECT_AVERAGE_ISSUE_AGE_DAYS',
    PROJECT_AVERAGE_PR_AGE_DAYS: 'PROJECT_AVERAGE_PR_AGE_DAYS',
    PROJECT_COMMITS_LAST_30_DAYS: 'PROJECT_COMMITS_LAST_30_DAYS',
    PROJECT_COMMITS_TO_ISSUES_RATIO: 'PROJECT_COMMITS_TO_ISSUES_RATIO',
    PROJECT_COMMITS_TO_PRS_RATIO: 'PROJECT_COMMITS_TO_PRS_RATIO',
    PROJECT_CONTRIBUTORS_TO_REPOS_RATIO: 'PROJECT_CONTRIBUTORS_TO_REPOS_RATIO',
    PROJECT_CREATED_AT: 'PROJECT_CREATED_AT',
    PROJECT_DAYS_SINCE_UPDATE: 'PROJECT_DAYS_SINCE_UPDATE',
    PROJECT_DESCRIPTION: 'PROJECT_DESCRIPTION',
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
    PROJECT_REPOSITORY_COUNT: 'PROJECT_REPOSITORY_COUNT',
    PROJECT_STARS_TO_REPOS_RATIO: 'PROJECT_STARS_TO_REPOS_RATIO',
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
    public readonly commitsToIssuesRatio: number,
    public readonly commitsToPrsRatio: number,
    public readonly contributorsToReposRatio: number,
    public readonly starsToReposRatio: number,
    public readonly ageDays: number,
    public readonly daysSinceUpdate: number,
    public readonly activityDensityLast30Days: number
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
    
    const createdAt = this.parseDate(basicData.createdAt) || new Date()
    const updatedAt = this.parseDate(basicData.updatedAt) || new Date()
    
    return new ProjectSummaryDTO(
      basicData.name,
      basicData.owner,
      basicData.description || 'No description available',
      basicData.url || '',
      'Unknown',
      [],
      createdAt,
      updatedAt,
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
      0, // commitsToIssuesRatio
      0, // commitsToPrsRatio
      0, // contributorsToReposRatio
      0, // starsToReposRatio
      this.calculateAgeDays(createdAt), // ageDays
      this.calculateDaysSinceUpdate(updatedAt), // daysSinceUpdate
      0 // activityDensityLast30Days
    )
  }

  /**
   * Calculate activity density (commits per day)
   */
  private static calculateActivityDensity(commits: number, days: number): number {
    if (days === 0) return 0
    return Math.round((commits / days) * 100) / 100
  }

  /**
   * Calculate age in days from creation date
   */
  private static calculateAgeDays(createdAt: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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
   * Calculate days since last update
   */
  private static calculateDaysSinceUpdate(updatedAt: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate mathematical ratios from extracted metrics
   */
  private static calculateMathematicalRatios(
    activityMetrics: { totalCommits: number; totalContributors: number; },
    issueMetrics: { issuesOpenCount: number; issuesTotalCount: number; },
    prMetrics: { prsOpenCount: number; prsTotalCount: number; },
    repositoryMetrics: { repositoryCount: number; starsTotal: number; }
  ): {
    commitsToIssuesRatio: number
    commitsToPrsRatio: number
    contributorsToReposRatio: number
    issuesClosedRatio: number
    prsMergedRatio: number
    starsToReposRatio: number
  } {
    const issuesClosedRatio = this.calculateClosedRatio(issueMetrics.issuesTotalCount, issueMetrics.issuesOpenCount)
    const prsMergedRatio = this.calculateClosedRatio(prMetrics.prsTotalCount, prMetrics.prsOpenCount)
    const commitsToIssuesRatio = this.calculateRatio(activityMetrics.totalCommits, issueMetrics.issuesTotalCount)
    const commitsToPrsRatio = this.calculateRatio(activityMetrics.totalCommits, prMetrics.prsTotalCount)
    const contributorsToReposRatio = this.calculateRatio(activityMetrics.totalContributors, repositoryMetrics.repositoryCount)
    const starsToReposRatio = this.calculateRatio(repositoryMetrics.starsTotal, repositoryMetrics.repositoryCount)

    return {
      commitsToIssuesRatio,
      commitsToPrsRatio,
      contributorsToReposRatio,
      issuesClosedRatio,
      prsMergedRatio,
      starsToReposRatio
    }
  }

  /**
   * Calculate mathematical ratio with division by zero protection
   */
  private static calculateRatio(numerator: number, denominator: number): number {
    if (denominator === 0) return 0
    return Math.round((numerator / denominator) * 100) / 100
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
    const calculatedMetrics = this.calculateMathematicalRatios(activityMetrics, issueMetrics, prMetrics, repositoryMetrics)

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
      calculatedMetrics.commitsToIssuesRatio,
      calculatedMetrics.commitsToPrsRatio,
      calculatedMetrics.contributorsToReposRatio,
      calculatedMetrics.starsToReposRatio,
      this.calculateAgeDays(basicData.createdAt),
      this.calculateDaysSinceUpdate(basicData.updatedAt),
      this.calculateActivityDensity(activityMetrics.commitsLast30Days, 30)
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
   * Convert project summary data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized mathematical facts for LLM interpretation
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectSummaryDTO.Keys.PROJECT_ACTIVE_CONTRIBUTORS]: String(this.activeContributors),
      [ProjectSummaryDTO.Keys.PROJECT_ACTIVE_REPOSITORIES]: String(this.activeRepositories),
      [ProjectSummaryDTO.Keys.PROJECT_ACTIVITY_DENSITY_LAST_30_DAYS]: String(this.activityDensityLast30Days),
      [ProjectSummaryDTO.Keys.PROJECT_AGE_DAYS]: String(this.ageDays),
      [ProjectSummaryDTO.Keys.PROJECT_AVERAGE_ISSUE_AGE_DAYS]: String(this.averageIssueAgeDays),
      [ProjectSummaryDTO.Keys.PROJECT_AVERAGE_PR_AGE_DAYS]: String(this.averagePrAgeDays),
      [ProjectSummaryDTO.Keys.PROJECT_COMMITS_LAST_30_DAYS]: String(this.commitsLast30Days),
      // Mathematical ratios
      [ProjectSummaryDTO.Keys.PROJECT_COMMITS_TO_ISSUES_RATIO]: String(this.commitsToIssuesRatio),
      [ProjectSummaryDTO.Keys.PROJECT_COMMITS_TO_PRS_RATIO]: String(this.commitsToPrsRatio),
      [ProjectSummaryDTO.Keys.PROJECT_CONTRIBUTORS_TO_REPOS_RATIO]: String(this.contributorsToReposRatio),
      [ProjectSummaryDTO.Keys.PROJECT_CREATED_AT]: this.createdAt.toISOString(),
      [ProjectSummaryDTO.Keys.PROJECT_DAYS_SINCE_UPDATE]: String(this.daysSinceUpdate),
      [ProjectSummaryDTO.Keys.PROJECT_DESCRIPTION]: this.description,
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
      [ProjectSummaryDTO.Keys.PROJECT_REPOSITORY_COUNT]: String(this.repositoryCount),
      [ProjectSummaryDTO.Keys.PROJECT_STARS_TO_REPOS_RATIO]: String(this.starsToReposRatio),
      [ProjectSummaryDTO.Keys.PROJECT_STARS_TOTAL]: String(this.starsTotal),
      [ProjectSummaryDTO.Keys.PROJECT_TOTAL_COMMITS]: String(this.totalCommits),
      [ProjectSummaryDTO.Keys.PROJECT_TOTAL_CONTRIBUTORS]: String(this.totalContributors),
      [ProjectSummaryDTO.Keys.PROJECT_UPDATED_AT]: this.updatedAt.toISOString(),
      [ProjectSummaryDTO.Keys.PROJECT_URL]: this.url
    }
  }
}