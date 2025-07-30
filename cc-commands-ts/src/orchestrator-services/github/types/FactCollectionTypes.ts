/**
 * @file Fact Collection Types
 * 
 * Pure data types for fact collection services. These types represent
 * raw data structures without any analysis, interpretation, or subjective
 * assessment. All fields are factual measurements or calculations.
 */

/**
 * Individual contributor activity data
 * 
 * Raw numerical data about a contributor's activity within a specific
 * time window. Contains only factual counts and timestamps.
 */
export interface ContributorData {
  /** Total number of commits by this contributor */
  commitCount: number
  /** Date of first contribution in the analysis window */
  firstContribution: Date
  /** Total number of issues created by this contributor */
  issueCount: number
  /** Date of last contribution in the analysis window */
  lastContribution: Date
  /** GitHub login/username */
  login: string
  /** Total number of pull requests created by this contributor */
  prCount: number
}

/**
 * Time-based activity data point
 * 
 * Represents activity counts for a specific time period.
 * Used for trend analysis and time-based pattern detection.
 */
export interface TimeSeriesData {
  /** Number of commits in this time period */
  commits: number
  /** Number of active contributors in this time period */
  contributors: number
  /** Date/time of this data point */
  date: Date
  /** Number of issues in this time period */
  issues: number
  /** Number of pull requests in this time period */
  pullRequests: number
}

/**
 * Repository activity summary
 * 
 * Aggregated activity counts and basic metrics for a repository
 * within a specific time window. Contains only factual counts.
 */
export interface RepositoryActivitySummary {
  /** End date of the analysis period */
  periodEnd: Date
  /** Start date of the analysis period */
  periodStart: Date
  /** Repository identifier (owner/repo) */
  repository: string
  /** Total commits in the analysis period */
  totalCommits: number
  /** Total issues in the analysis period */
  totalIssues: number
  /** Total pull requests in the analysis period */
  totalPullRequests: number
  /** Number of unique contributors in the analysis period */
  uniqueContributors: number
}

/**
 * Issue timing data
 * 
 * Raw timing measurements for issues without any interpretation
 * of what constitutes "fast" or "slow" resolution.
 */
export interface IssueTimingData {
  /** Date issue was closed (null if still open) */
  closedAt: Date | null
  /** Date issue was created */
  createdAt: Date
  /** Issue number */
  issueNumber: number
  /** Hours from creation to closure (null if still open) */
  resolutionTimeHours: null | number
  /** Issue state ('open' or 'closed') */
  state: 'closed' | 'open'
}

/**
 * Pull request timing data
 * 
 * Raw timing measurements for pull requests without any interpretation
 * of what constitutes good or bad performance.
 */
export interface PullRequestTimingData {
  /** Date PR was closed */
  closedAt: Date | null
  /** Number of commits in this PR */
  commitCount: number
  /** Date PR was created */
  createdAt: Date
  /** Number of files changed */
  filesChanged: number
  /** Total lines added */
  linesAdded: number
  /** Total lines deleted */
  linesDeleted: number
  /** Date PR was merged (null if not merged) */
  mergedAt: Date | null
  /** Hours from creation to merge (null if not merged) */
  mergeTimeHours: null | number
  /** PR number */
  prNumber: number
  /** PR state ('open', 'closed', 'merged') */
  state: 'closed' | 'merged' | 'open'
}

/**
 * Release timing data
 * 
 * Raw data about repository releases and their timing patterns.
 */
export interface ReleaseTimingData {
  /** Days since previous release (null for first release) */
  daysSincePrevious: null | number
  /** Whether this is a draft */
  isDraft: boolean
  /** Whether this is a pre-release */
  isPrerelease: boolean
  /** Release publication date */
  publishedAt: Date
  /** Release tag name */
  tagName: string
}

/**
 * Time window configuration
 * 
 * Defines the time period for fact collection and analysis.
 */
export interface TimeWindow {
  /** Total business days in the window (excluding weekends) */
  businessDays: number
  /** End date of the analysis window */
  endDate: Date
  /** Start date of the analysis window */
  startDate: Date
  /** Total days in the window */
  totalDays: number
}

/**
 * Repository metadata
 * 
 * Basic factual information about a repository without any
 * interpretation or quality assessment.
 */
export interface RepositoryMetadata {
  /** Repository creation date */
  createdAt: Date
  /** Default branch name */
  defaultBranch: string
  /** Fork count */
  forksCount: number
  /** Repository full name (owner/repo) */
  fullName: string
  /** Whether repository is archived */
  isArchived: boolean
  /** Whether repository is a fork */
  isFork: boolean
  /** Whether repository is private */
  isPrivate: boolean
  /** Primary programming language */
  language: null | string
  /** Repository name */
  name: string
  /** Open issues count */
  openIssuesCount: number
  /** Repository owner */
  owner: string
  /** Last push date */
  pushedAt: Date | null
  /** Repository size in KB */
  sizeKb: number
  /** Star count */
  stargazersCount: number
  /** Last update date */
  updatedAt: Date
  /** Watcher count */
  watchersCount: number
}

/**
 * Aggregation configuration
 * 
 * Configuration for how facts should be aggregated and calculated.
 */
export interface AggregationConfig {
  /** Whether to include weekend activity in business metrics */
  includeWeekends: boolean
  /** Percentiles to calculate for timing metrics */
  percentiles: number[] // e.g., [10, 25, 50, 75, 90]
  /** Time windows for different metric calculations */
  timeWindows: {
    long: number   // days for long-term metrics (e.g., 90)
    medium: number // days for medium-term metrics (e.g., 30)
    short: number  // days for short-term metrics (e.g., 7)
  }
  /** Number of top contributors to track */
  topContributorsCount: number
}