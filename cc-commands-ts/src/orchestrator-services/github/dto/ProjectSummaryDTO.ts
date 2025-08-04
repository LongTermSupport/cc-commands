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

import { StatisticsCalculator } from '../../../core/helpers/StatisticsCalculator.js'
import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'

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
   * Get comprehensive jq query hints for project summary data
   * 
   * @returns Array of jq hints for efficient project data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw project data queries
      { 
        description: 'Project name', 
        query: '.raw.project_summary.name',
        scope: 'single_item'
      },
      { 
        description: 'Project owner/organization', 
        query: '.raw.project_summary.owner',
        scope: 'single_item' 
      },
      { 
        description: 'Primary programming language', 
        query: '.raw.project_summary.primary_language',
        scope: 'single_item'
      },
      { 
        description: 'Total number of repositories', 
        query: '.raw.project_summary.repository_count',
        scope: 'single_item'
      },
      { 
        description: 'Total star count across all repositories', 
        query: '.raw.project_summary.stars_total',
        scope: 'single_item'
      },
      
      // Calculated metrics queries  
      { 
        description: 'Recent commit activity (calculated)', 
        query: '.calculated.activity_metrics.commits_last_30_days',
        scope: 'single_item'
      },
      { 
        description: 'Development velocity ratio (calculated)', 
        query: '.calculated.development_ratios.commits_to_issues_ratio',
        scope: 'single_item'
      },
      { 
        description: 'Community engagement ratio (calculated)', 
        query: '.calculated.engagement_metrics.contributors_to_repos_ratio',
        scope: 'single_item'
      },
      { 
        description: 'Issue resolution rate (calculated)', 
        query: '.calculated.quality_indicators.issues_closed_ratio',
        scope: 'single_item'
      },
      { 
        description: 'Project maturity in days (calculated)', 
        query: '.calculated.time_analysis.age_days',
        scope: 'single_item'
      },
      
      // Cross-namespace analysis queries
      { 
        description: 'Project name and maturity', 
        query: '{name: .raw.project_summary.name, maturity: .calculated.time_analysis.age_days}',
        scope: 'single_item'
      },
      { 
        description: 'Available activity measurements', 
        query: '.calculated.activity_metrics | keys',
        scope: 'single_item'
      },
      { 
        description: 'All development ratio metrics', 
        query: '.calculated.development_ratios | to_entries[]',
        scope: 'all_items'
      },
      { 
        description: 'Quality metrics array', 
        query: '[.calculated.quality_indicators.issues_closed_ratio, .calculated.quality_indicators.prs_merged_ratio]',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete project summary with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'activity_metrics': this.calculateActivityMetrics(),
        'development_ratios': this.calculateDevelopmentRatios(),
        'engagement_metrics': this.calculateEngagementMetrics(),
        'quality_indicators': this.calculateQualityIndicators(),
        'time_analysis': this.calculateTimeAnalysis()
      },
      raw: {
        'project_summary': this.buildRawProjectData()
      }
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

  /**
   * Build raw project summary data structure
   * 
   * @returns Raw project data with no calculations applied
   */
  private buildRawProjectData(): JsonObject {
    return {
      'active_contributors': this.activeContributors,
      'active_repositories': this.activeRepositories,
      'average_issue_age_days': this.averageIssueAgeDays,
      'average_pr_age_days': this.averagePrAgeDays,
      'commits_last_30_days': this.commitsLast30Days,
      'created_at': this.createdAt.toISOString(),
      'description': this.description,
      'issues_open_count': this.issuesOpenCount,
      'issues_total_count': this.issuesTotalCount,
      'languages': this.languages,
      'name': this.name,
      'owner': this.owner,
      'primary_language': this.primaryLanguage,
      'prs_open_count': this.prsOpenCount,
      'prs_total_count': this.prsTotalCount,
      'repository_count': this.repositoryCount,
      'stars_total': this.starsTotal,
      'total_commits': this.totalCommits,
      'total_contributors': this.totalContributors,
      'updated_at': this.updatedAt.toISOString(),
      'url': this.url
    }
  }

  /**
   * Calculate activity-based metrics
   * 
   * @returns Mathematical activity measurements
   */
  private calculateActivityMetrics(): JsonObject {
    return {
      'active_repo_ratio': this.repositoryCount > 0 ? 
        Math.round((this.activeRepositories / this.repositoryCount) * 100) / 100 : 0,
      'activity_density_last_30_days': this.activityDensityLast30Days,
      'avg_commits_per_day_30d': Math.round((this.commitsLast30Days / 30) * 100) / 100,
      'commit_velocity': this.totalCommits > 0 ? 
        Math.round((this.commitsLast30Days / this.totalCommits) * 100) / 100 : 0,
      'commits_last_30_days': this.commitsLast30Days
    }
  }

  /**
   * Calculate community health score
   * 
   * @returns Score from 0-1 representing community health
   */
  private calculateCommunityHealthScore(): number {
    const metrics = [
      this.activeContributors > 1 ? 0.3 : 0,
      this.contributorsToReposRatio > 0.5 ? 0.2 : this.contributorsToReposRatio * 0.4,
      this.starsToReposRatio > 10 ? 0.3 : Math.min(this.starsToReposRatio / 10, 1) * 0.3,
      this.issuesClosedRatio > 0.7 ? 0.2 : this.issuesClosedRatio * 0.2 / 0.7
    ]
    
    return Math.round(StatisticsCalculator.calculateMean(metrics) * 100) / 100
  }

  /**
   * Calculate development workflow ratios
   * 
   * @returns Mathematical ratios between development activities
   */
  private calculateDevelopmentRatios(): JsonObject {
    return {
      'commits_to_issues_ratio': this.commitsToIssuesRatio,
      'commits_to_prs_ratio': this.commitsToPrsRatio,
      'contributors_to_repos_ratio': this.contributorsToReposRatio,
      'issues_to_commits_ratio': this.totalCommits > 0 ? 
        Math.round((this.issuesTotalCount / this.totalCommits) * 100) / 100 : 0,
      'prs_to_commits_ratio': this.totalCommits > 0 ? 
        Math.round((this.prsTotalCount / this.totalCommits) * 100) / 100 : 0,
      'stars_to_repos_ratio': this.starsToReposRatio
    }
  }

  /**
   * Calculate community engagement metrics
   * 
   * @returns Mathematical measures of community involvement
   */
  private calculateEngagementMetrics(): JsonObject {
    return {
      'active_contributor_ratio': this.totalContributors > 0 ? 
        Math.round((this.activeContributors / this.totalContributors) * 100) / 100 : 0,
      'avg_stars_per_repo': this.repositoryCount > 0 ? 
        Math.round((this.starsTotal / this.repositoryCount) * 100) / 100 : 0,
      'community_health_score': this.calculateCommunityHealthScore(),
      'contributor_density': this.repositoryCount > 0 ? 
        Math.round((this.totalContributors / this.repositoryCount) * 100) / 100 : 0,
      'contributors_to_repos_ratio': this.contributorsToReposRatio
    }
  }

  /**
   * Calculate maintenance score
   * 
   * @returns Score from 0-1 representing project maintenance quality
   */
  private calculateMaintenanceScore(): number {
    const metrics = [
      this.issuesClosedRatio * 0.4,
      this.prsMergedRatio * 0.3,
      Math.max(0, 1 - (this.daysSinceUpdate / 365)) * 0.3
    ]
    
    return Math.round(StatisticsCalculator.calculateMean(metrics) * 100) / 100
  }

  /**
   * Calculate project maturity score
   * 
   * @returns Score from 0-1 representing project maturity
   */
  private calculateProjectMaturityScore(): number {
    const ageScore = Math.min(this.ageDays / 730, 1) * 0.3  // 2 years = mature
    const activityScore = (this.totalCommits > 100 ? 1 : this.totalCommits / 100) * 0.3
    const communityScore = (this.totalContributors > 5 ? 1 : this.totalContributors / 5) * 0.2
    const starsScore = (this.starsTotal > 50 ? 1 : this.starsTotal / 50) * 0.2
    
    return Math.round((ageScore + activityScore + communityScore + starsScore) * 100) / 100
  }

  /**
   * Calculate quality and maintenance indicators
   * 
   * @returns Mathematical quality measurements
   */
  private calculateQualityIndicators(): JsonObject {
    return {
      'avg_issue_resolution_days': this.averageIssueAgeDays,
      'avg_pr_merge_days': this.averagePrAgeDays,
      'issue_backlog_ratio': this.issuesTotalCount > 0 ? 
        Math.round((this.issuesOpenCount / this.issuesTotalCount) * 100) / 100 : 0,
      'issues_closed_ratio': this.issuesClosedRatio,
      'maintenance_score': this.calculateMaintenanceScore(),
      'pr_backlog_ratio': this.prsTotalCount > 0 ? 
        Math.round((this.prsOpenCount / this.prsTotalCount) * 100) / 100 : 0,
      'prs_merged_ratio': this.prsMergedRatio
    }
  }

  /**
   * Calculate recency score based on update frequency
   * 
   * @returns Score from 0-1 representing how recently active
   */
  private calculateRecencyScore(): number {
    if (this.daysSinceUpdate <= 7) return 1
    if (this.daysSinceUpdate <= 30) return 0.8
    if (this.daysSinceUpdate <= 90) return 0.5
    if (this.daysSinceUpdate <= 365) return 0.2
    return 0
  }

  /**
   * Calculate time-based analysis
   * 
   * @returns Time-based project measurements
   */
  private calculateTimeAnalysis(): JsonObject {
    return {
      'age_days': this.ageDays,
      'age_in_years': Math.round((this.ageDays / 365.25) * 100) / 100,
      'days_since_update': this.daysSinceUpdate,
      'months_since_update': Math.round((this.daysSinceUpdate / 30.44) * 100) / 100,
      'project_maturity_score': this.calculateProjectMaturityScore(),
      'recency_score': this.calculateRecencyScore()
    }
  }
}