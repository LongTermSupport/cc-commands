/**
 * @file Project-specific Types and Interfaces
 * 
 * Defines internal data structures and configuration types specific to
 * GitHub Projects v2 functionality and project management operations.
 * These types are for internal application logic, separate from external API types.
 */

/**
 * Project detection modes supported by the system
 */
export type ProjectDetectionMode = 'auto' | 'manual' | 'url'

/**
 * Project visibility levels
 */
export type ProjectVisibility = 'PRIVATE' | 'PUBLIC'

/**
 * Project state options
 */
export type ProjectState = 'CLOSED' | 'OPEN'

/**
 * Supported time window units for activity analysis
 */
export type TimeWindowUnit = 'days' | 'hours' | 'months' | 'weeks'

/**
 * Activity level classifications
 */
export type ActivityLevel = 'high' | 'low' | 'medium'

/**
 * Project health score ranges
 */
export type HealthScoreRange = 'critical' | 'excellent' | 'fair' | 'good' | 'poor'

/**
 * Time window configuration for activity analysis
 */
export interface TimeWindow {
  /** Unit of time measurement */
  unit: TimeWindowUnit
  /** End date for analysis (defaults to now if not specified) */
  until?: Date
  /** Number of time units to look back */
  value: number
}

/**
 * Project identification information
 */
export interface ProjectIdentifier {
  /** Detection mode used to find this project */
  detectionMode: ProjectDetectionMode
  /** Organization or user owner */
  owner: string
  /** Numeric project ID from GitHub */
  projectId: string
  /** Project number (user-friendly identifier) */
  projectNumber?: number
  /** Full project URL */
  url?: string
}

/**
 * Project summary configuration options
 */
export interface ProjectSummaryConfig {
  /** Time window for activity analysis */
  activityWindow: TimeWindow
  /** Whether to include archived repositories */
  includeArchived: boolean
  /** Whether to include fork repositories */
  includeForks: boolean
  /** Maximum number of repositories to analyze */
  maxRepositories?: number
  /** Target audience for the summary */
  targetAudience?: 'business' | 'developer' | 'executive' | 'technical'
}

/**
 * Repository analysis configuration
 */
export interface RepositoryAnalysisConfig {
  /** Time window for commit analysis */
  commitWindow: TimeWindow
  /** Whether to analyze commit verification */
  includeCommitVerification: boolean
  /** Whether to include issue analysis */
  includeIssues: boolean
  /** Whether to include pull request analysis */
  includePullRequests: boolean
  /** Time window for issue analysis */
  issueWindow: TimeWindow
  /** Maximum number of commits to analyze per repository */
  maxCommitsPerRepo?: number
  /** Time window for pull request analysis */
  prWindow: TimeWindow
}

/**
 * Project field definition for GitHub Projects v2
 */
export interface ProjectFieldDefinition {
  /** Field data type */
  dataType: 'date' | 'iteration' | 'number' | 'single_select' | 'text'
  /** Field identifier */
  id: string
  /** Field display name */
  name: string
  /** Available options for select fields */
  options?: Array<{
    id: string
    name: string
  }>
}

/**
 * Project field value for a specific item
 */
export interface ProjectFieldValue {
  /** Date value for date fields */
  date?: Date
  /** Field definition reference */
  field: ProjectFieldDefinition
  /** Iteration value for iteration fields */
  iteration?: {
    id: string
    title: string
  }
  /** Numeric value for number fields */
  number?: number
  /** Selected option for single_select fields */
  singleSelect?: {
    id: string
    name: string
  }
  /** Text value for text fields */
  text?: string
}

/**
 * Project item content type union
 */
export type ProjectItemContentType = 'DraftIssue' | 'Issue' | 'PullRequest'

/**
 * Repository reference in project context
 */
export interface ProjectRepository {
  /** Full repository name (owner/repo) */
  fullName: string
  /** Repository display name */
  name: string
  /** Repository owner */
  owner: string
  /** Repository URL */
  url?: string
}

/**
 * Project milestone information
 */
export interface ProjectMilestone {
  /** Milestone due date */
  dueDate?: Date
  /** Milestone identifier */
  id: string
  /** Milestone title */
  title: string
}

/**
 * Project team member information
 */
export interface ProjectTeamMember {
  /** Member avatar URL */
  avatarUrl?: string
  /** Member login/username */
  login: string
  /** Member display name */
  name?: string
  /** Member role in the project */
  role?: 'admin' | 'member' | 'owner' | 'viewer'
  /** Member profile URL */
  url?: string
}

/**
 * Project statistics summary
 */
export interface ProjectStatistics {
  /** Number of active contributors in the time window */
  activeContributors: number
  /** Average age of open issues in days */
  averageIssueAge: number
  /** Average age of open pull requests in days */
  averagePrAge: number
  /** Total commits in the time window */
  commitsInWindow: number
  /** Issues closed ratio as percentage */
  issuesClosedRatio: number
  /** Total open issues */
  openIssues: number
  /** Total open pull requests */
  openPullRequests: number
  /** Pull requests merged ratio as percentage */
  prsMergedRatio: number
  /** Total project items */
  totalItems: number
  /** Total repositories in project */
  totalRepositories: number
}

/**
 * Activity trend analysis data
 */
export interface ActivityTrend {
  /** Current period activity level */
  current: ActivityLevel
  /** Activity direction trend */
  direction: 'decreasing' | 'increasing' | 'stable'
  /** Percentage change from previous period */
  percentageChange?: number
  /** Previous period activity level for comparison */
  previous?: ActivityLevel
}

/**
 * Project health assessment
 */
export interface ProjectHealthAssessment {
  /** Health score category */
  healthCategory: HealthScoreRange
  /** Overall health score (0-100) */
  healthScore: number
  /** Key health indicators */
  indicators: {
    /** Activity trend assessment */
    activityTrend: ActivityTrend
    /** Code quality indicators */
    codeQuality: {
      /** Average commits per pull request */
      avgCommitsPerPr: number
      /** Percentage of verified commits */
      verifiedCommitRatio: number
    }
    /** Community engagement indicators */
    communityEngagement: {
      /** Average response time to issues in hours */
      avgIssueResponseTime: number
      /** Number of external contributors */
      externalContributors: number
    }
    /** Project maintenance indicators */
    maintenance: {
      /** Days since last commit */
      daysSinceLastCommit: number
      /** Days since last release */
      daysSinceLastRelease?: number
      /** Percentage of stale issues (>30 days old) */
      staleIssuesRatio: number
    }
  }
  /** Recommendations for improvement */
  recommendations: string[]
}

/**
 * Command arguments for project summary operations
 */
export interface ProjectSummaryArgs {
  /** Project analysis configuration */
  config: ProjectSummaryConfig
  /** Project identification */
  project: ProjectIdentifier
  /** Repository analysis configuration */
  repositoryConfig: RepositoryAnalysisConfig
}

/**
 * GitHub authentication context
 */
export interface GitHubAuthContext {
  /** Authenticated user login */
  login: string
  /** Available authentication scopes */
  scopes: string[]
  /** Authentication token (not stored, just for validation) */
  tokenValid: boolean
}