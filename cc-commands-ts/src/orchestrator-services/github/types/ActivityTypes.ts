/**
 * @file Activity Analysis Types and Interfaces
 * 
 * Defines types for activity analysis, metrics aggregation, and
 * cross-repository activity tracking. These types support the
 * activity analysis functionality for GitHub project summaries.
 */

/**
 * Activity metric aggregation periods
 */
export type ActivityPeriod = 'daily' | 'monthly' | 'weekly'

/**
 * Repository activity classification levels
 */
export type RepositoryActivityLevel = 'dormant' | 'high' | 'low' | 'medium'

/**
 * Types of contributions tracked in activity analysis
 */
export type ContributionType = 'commits' | 'issues' | 'pull_requests' | 'reviews'

/**
 * Issue state classifications for activity tracking
 */
export type IssueActivityState = 'closed' | 'opened' | 'reopened'

/**
 * Pull request state classifications for activity tracking
 */
export type PullRequestActivityState = 'closed' | 'merged' | 'opened' | 'reopened'

/**
 * Individual contributor activity data
 */
export interface ContributorActivity {
  /** Total commits by this contributor */
  commits: number
  /** First contribution date in the analysis window */
  firstContribution: Date
  /** Issues closed by this contributor */
  issuesClosed: number
  /** Issues opened by this contributor */
  issuesOpened: number
  /** Last contribution date in the analysis window */
  lastContribution: Date
  /** Contributor login/username */
  login: string
  /** Pull requests merged by this contributor */
  prsMerged: number
  /** Pull requests opened by this contributor */
  prsOpened: number
  /** Reviews provided by this contributor */
  reviewsProvided: number
}

/**
 * Time-series activity data point
 */
export interface ActivityDataPoint {
  /** Number of commits in this period */
  commits: number
  /** Time period this data point represents */
  date: Date
  /** Number of issues activity in this period */
  issues: number
  /** Activity period (daily, weekly, monthly) */
  period: ActivityPeriod
  /** Number of pull requests activity in this period */
  pullRequests: number
  /** Number of reviews in this period */
  reviews: number
}

/**
 * Repository-specific activity metrics
 */
export interface RepositoryActivityMetrics {
  /** Activity level classification */
  activityLevel: RepositoryActivityLevel
  /** Average commits per day in the analysis window */
  avgCommitsPerDay: number
  /** Average issues per day in the analysis window */
  avgIssuesPerDay: number
  /** Average pull requests per day in the analysis window */
  avgPullRequestsPerDay: number
  /** List of contributor activities */
  contributors: ContributorActivity[]
  /** Days since last commit */
  daysSinceLastCommit: number
  /** Days since last issue activity */
  daysSinceLastIssue: number
  /** Days since last pull request activity */
  daysSinceLastPullRequest: number
  /** Repository full name (owner/repo) */
  repository: string
  /** Time-series activity data */
  timeSeries: ActivityDataPoint[]
  /** Total activity score (0-100) */
  totalActivityScore: number
}

/**
 * Cross-repository activity aggregation
 */
export interface AggregatedActivityMetrics {
  /** Activity trends across all repositories */
  activityTrends: {
    /** Overall trend direction */
    direction: 'decreasing' | 'increasing' | 'stable'
    /** Peak activity date */
    peakActivityDate: Date
    /** Activity comparison with previous period */
    previousPeriodComparison: number
  }
  /** Analysis time window */
  analysisWindow: {
    /** End date of analysis */
    endDate: Date
    /** Start date of analysis */
    startDate: Date
  }
  /** Top contributors across all repositories */
  topContributors: ContributorActivity[]
  /** Most active repositories */
  topRepositories: RepositoryActivityMetrics[]
  /** Total metrics across all repositories */
  totals: {
    /** Total active contributors */
    activeContributors: number
    /** Total commits across all repositories */
    commits: number
    /** Total contributors across all repositories */
    contributors: number
    /** Total issues across all repositories */
    issues: number
    /** Total pull requests across all repositories */
    pullRequests: number
    /** Total repositories analyzed */
    repositories: number
    /** Total reviews across all repositories */
    reviews: number
  }
}

/**
 * Activity comparison data between time periods
 */
export interface ActivityComparison {
  /** Current period metrics */
  current: {
    /** Average daily commits */
    avgDailyCommits: number
    /** Average daily issues */
    avgDailyIssues: number
    /** Average daily pull requests */
    avgDailyPullRequests: number
    /** End date of current period */
    endDate: Date
    /** Start date of current period */
    startDate: Date
  }
  /** Percentage changes from previous to current */
  percentageChanges: {
    /** Commits change percentage */
    commits: number
    /** Contributors change percentage */
    contributors: number
    /** Issues change percentage */
    issues: number
    /** Pull requests change percentage */
    pullRequests: number
  }
  /** Previous period metrics */
  previous?: {
    /** Average daily commits */
    avgDailyCommits: number
    /** Average daily issues */
    avgDailyIssues: number
    /** Average daily pull requests */
    avgDailyPullRequests: number
    /** End date of previous period */
    endDate: Date
    /** Start date of previous period */
    startDate: Date
  }
}

/**
 * Activity pattern analysis results
 */
export interface ActivityPatterns {
  /** Busiest days of the week */
  busiestDays: Array<{
    /** Average activity score for this day */
    averageScore: number
    /** Day name */
    dayName: string
    /** Day of week (0=Sunday, 6=Saturday) */
    dayOfWeek: number
  }>
  /** Peak activity hours (0-23) */
  peakHours: Array<{
    /** Average activity score for this hour */
    averageScore: number
    /** Hour of day (0-23) */
    hour: number
  }>
  /** Seasonal activity trends */
  seasonalTrends: Array<{
    /** Average activity score for this month */
    averageScore: number
    /** Month number (1-12) */
    month: number
    /** Month name */
    monthName: string
  }>
  /** Weekly activity rhythm */
  weeklyRhythm: {
    /** Average weekday activity */
    weekdayActivity: number
    /** Average weekend activity */
    weekendActivity: number
    /** Ratio of weekend to weekday activity */
    weekendToWeekdayRatio: number
  }
}

/**
 * Activity anomaly detection results
 */
export interface ActivityAnomalies {
  /** Detected activity drops */
  drops: Array<{
    /** Date of the drop */
    date: Date
    /** Activity score during drop */
    score: number
    /** Type of activity that dropped */
    type: ContributionType
  }>
  /** Periods of unusual inactivity */
  inactivityPeriods: Array<{
    /** Number of days of inactivity */
    duration: number
    /** End date of inactive period */
    endDate: Date
    /** Start date of inactive period */
    startDate: Date
  }>
  /** Detected activity spikes */
  spikes: Array<{
    /** Date of the spike */
    date: Date
    /** Activity score during spike */
    score: number
    /** Type of activity that spiked */
    type: ContributionType
  }>
}

/**
 * Activity velocity metrics
 */
export interface ActivityVelocity {
  /** Average time from issue open to close (hours) */
  avgIssueResolutionTime: number
  /** Average time from PR open to merge (hours) */
  avgPullRequestMergeTime: number
  /** Average time for first response to issues (hours) */
  avgTimeToFirstResponse: number
  /** Current development velocity score (0-100) */
  velocityScore: number
  /** Velocity trend compared to previous period */
  velocityTrend: 'decreasing' | 'increasing' | 'stable'
}

/**
 * Comprehensive activity analysis result
 */
export interface ActivityAnalysisResult {
  /** Aggregated metrics across all repositories */
  aggregatedMetrics: AggregatedActivityMetrics
  /** Activity anomaly detection results */
  anomalies: ActivityAnomalies
  /** Activity comparison with previous periods */
  comparison: ActivityComparison
  /** Activity patterns analysis */
  patterns: ActivityPatterns
  /** Individual repository metrics */
  repositoryMetrics: RepositoryActivityMetrics[]
  /** Development velocity metrics */
  velocity: ActivityVelocity
}

/**
 * Activity analysis configuration
 */
export interface ActivityAnalysisConfig {
  /** Minimum activity threshold for classification */
  activityThreshold: {
    /** Minimum commits per day for 'high' activity */
    highActivityCommits: number
    /** Minimum commits per day for 'medium' activity */
    mediumActivityCommits: number
  }
  /** Time period for aggregation */
  aggregationPeriod: ActivityPeriod
  /** Whether to analyze activity patterns */
  analyzePatterns: boolean
  /** Whether to calculate velocity metrics */
  calculateVelocity: boolean
  /** Whether to detect activity anomalies */
  detectAnomalies: boolean
  /** Number of top contributors to include */
  topContributorsCount: number
  /** Number of top repositories to highlight */
  topRepositoriesCount: number
}

/**
 * Activity query parameters for data collection
 */
export interface ActivityQueryParams {
  /** End date for activity search */
  endDate: Date
  /** Types of contributions to include */
  includeTypes: ContributionType[]
  /** Maximum number of items to fetch per query */
  maxItems?: number
  /** Repository to search (owner/repo format) */
  repository: string
  /** Start date for activity search */
  startDate: Date
}

/**
 * Activity data cache entry
 */
export interface ActivityCacheEntry {
  /** Cached activity data */
  data: ActivityAnalysisResult
  /** Cache expiration timestamp */
  expiresAt: Date
  /** Cache key identifier */
  key: string
  /** Timestamp when cached */
  timestamp: Date
}