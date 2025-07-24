/**
 * @file Project Domain Constants
 * 
 * Constants specific to GitHub Projects v2 functionality, project analysis,
 * and summary generation. These constants support project detection,
 * data collection, and analysis operations.
 */

/**
 * GitHub Projects v2 specific constants
 */
export const PROJECT_V2 = {
  /** Common project field names */
  COMMON_FIELDS: {
    ASSIGNEES: 'Assignees',
    LABELS: 'Labels',
    MILESTONE: 'Milestone',
    PRIORITY: 'Priority',
    REPOSITORY: 'Repository',
    STATUS: 'Status',
    TITLE: 'Title'
  },
  /** Project item content types */
  CONTENT_TYPES: {
    DRAFT_ISSUE: 'DraftIssue',
    ISSUE: 'Issue',
    PULL_REQUEST: 'PullRequest'
  },
  /** Project field types */
  FIELD_TYPES: {
    DATE: 'date',
    ITERATION: 'iteration',
    NUMBER: 'number',
    SINGLE_SELECT: 'single_select',
    TEXT: 'text'
  }
} as const

/**
 * Project detection and parsing constants
 */
export const PROJECT_DETECTION = {
  /** Detection modes */
  MODES: {
    AUTO: 'auto',
    MANUAL: 'manual',
    URL: 'url'
  },
  /** Git remote detection */
  REMOTE_PATTERNS: {
    /** Maximum remotes to check */
    MAX_REMOTES_TO_CHECK: 5,
    /** Common git remote names to check */
    REMOTE_NAMES: ['origin', 'upstream', 'github']
  },
  /** Project URL validation */
  URL_VALIDATION: {
    /** Maximum project ID value (reasonable limit) */
    MAX_PROJECT_ID: 999_999,
    /** Minimum project ID value */
    MIN_PROJECT_ID: 1
  }
} as const

/**
 * Project analysis configuration constants
 */
export const ANALYSIS_CONFIG = {
  /** Activity analysis defaults */
  ACTIVITY: {
    /** Default comparison period multiplier */
    COMPARISON_MULTIPLIER: 2,
    /** Default time window in days */
    DEFAULT_WINDOW_DAYS: 30,
    /** Maximum time window in days */
    MAX_WINDOW_DAYS: 365,
    /** Minimum time window in days */
    MIN_WINDOW_DAYS: 1
  },
  /** Contributor analysis limits */
  CONTRIBUTORS: {
    /** Default top contributors to highlight */
    DEFAULT_TOP_CONTRIBUTORS: 20,
    /** Maximum contributors to analyze */
    MAX_CONTRIBUTORS: 500,
    /** Minimum contributions for inclusion */
    MIN_CONTRIBUTIONS_THRESHOLD: 1
  },
  /** Repository analysis limits */
  REPOSITORY: {
    /** Default repositories to highlight in summary */
    DEFAULT_TOP_REPOSITORIES: 10,
    /** Maximum repositories to analyze per project */
    MAX_REPOSITORIES: 100,
    /** Minimum repositories for meaningful analysis */
    MIN_REPOSITORIES_FOR_ANALYSIS: 1
  }
} as const

/**
 * Health score calculation constants
 */
export const HEALTH_SCORE = {
  /** Score ranges for health categories */
  RANGES: {
    CRITICAL: { MAX: 19, MIN: 0 },
    EXCELLENT: { MAX: 100, MIN: 80 },
    FAIR: { MAX: 59, MIN: 40 },
    GOOD: { MAX: 79, MIN: 60 },
    POOR: { MAX: 39, MIN: 20 }
  },
  /** Thresholds for health indicators */
  THRESHOLDS: {
    /** Issue resolution rate threshold (percentage) */
    GOOD_ISSUE_RESOLUTION_RATE: 70,
    /** PR merge rate threshold (percentage) */
    GOOD_PR_MERGE_RATE: 80,
    /** Minimum verified commit ratio for good code quality */
    GOOD_VERIFIED_COMMIT_RATIO: 0.5,
    /** Days since last commit for maintenance concern */
    STALE_COMMIT_DAYS: 30
  },
  /** Weighting factors for health calculation */
  WEIGHTS: {
    /** Activity trend weight */
    ACTIVITY_TREND: 0.25,
    /** Code quality weight */
    CODE_QUALITY: 0.15,
    /** Community engagement weight */
    COMMUNITY_ENGAGEMENT: 0.1,
    /** Issue resolution rate weight */
    ISSUE_RESOLUTION: 0.2,
    /** Maintenance activity weight */
    MAINTENANCE: 0.1,
    /** PR merge rate weight */
    PR_MERGE_RATE: 0.2
  }
} as const

/**
 * Activity classification constants
 */
export const ACTIVITY_LEVELS = {
  /** Activity level thresholds */
  THRESHOLDS: {
    /** Commits per day for high activity */
    HIGH_COMMITS_PER_DAY: 5,
    /** Issues per day for high activity */
    HIGH_ISSUES_PER_DAY: 2,
    /** PRs per day for high activity */
    HIGH_PRS_PER_DAY: 1,
    /** Commits per day for medium activity */
    MEDIUM_COMMITS_PER_DAY: 1,
    /** Issues per day for medium activity */
    MEDIUM_ISSUES_PER_DAY: 0.5,
    /** PRs per day for medium activity */
    MEDIUM_PRS_PER_DAY: 0.2
  },
  /** Activity trend classification */
  TREND_THRESHOLDS: {
    /** Percentage change for significant decrease */
    SIGNIFICANT_DECREASE: -20,
    /** Percentage change for significant increase */
    SIGNIFICANT_INCREASE: 20,
    /** Percentage change range considered stable */
    STABLE_RANGE: 10
  }
} as const

/**
 * Summary generation constants
 */
export const SUMMARY_GENERATION = {
  /** Target audiences and their preferences */
  AUDIENCES: {
    BUSINESS: {
      DETAIL_LEVEL: 'medium',
      FOCUS: ['project_progress', 'team_productivity', 'milestone_completion'],
      KEY: 'business'
    },
    DEVELOPER: {
      DETAIL_LEVEL: 'high',
      FOCUS: ['recent_activity', 'active_contributors', 'open_issues', 'pending_prs'],
      KEY: 'developer'
    },
    EXECUTIVE: {
      DETAIL_LEVEL: 'low',
      FOCUS: ['overall_health', 'key_metrics', 'risk_indicators'],
      KEY: 'executive'
    },
    TECHNICAL: {
      DETAIL_LEVEL: 'high',
      FOCUS: ['code_quality', 'commit_activity', 'pr_metrics', 'issue_resolution'],
      KEY: 'technical'
    }
  },
  /** Content formatting preferences */
  FORMATTING: {
    /** Maximum number of key points to highlight */
    MAX_KEY_POINTS: 10,
    /** Maximum number of recommendations */
    MAX_RECOMMENDATIONS: 5,
    /** Maximum length for summary descriptions */
    MAX_SUMMARY_LENGTH: 500
  }
} as const

/**
 * Data validation constants
 */
export const VALIDATION = {
  /** Project identifier validation */
  PROJECT: {
    /** Maximum length for descriptions */
    MAX_DESCRIPTION_LENGTH: 1000,
    /** Maximum length for project names */
    MAX_NAME_LENGTH: 100,
    /** Valid project state values */
    VALID_STATES: ['OPEN', 'CLOSED'],
    /** Valid project visibility values */
    VALID_VISIBILITY: ['PUBLIC', 'PRIVATE']
  },
  /** Repository validation */
  REPOSITORY: {
    /** Maximum repositories to process */
    MAX_REPOSITORIES_TO_PROCESS: 200,
    /** Repository name pattern */
    NAME_PATTERN: /^[a-zA-Z0-9._-]+$/,
    /** Owner name pattern */
    OWNER_PATTERN: /^[a-zA-Z0-9-]+$/
  },
  /** Time window validation */
  TIME_WINDOW: {
    /** Default units for time windows */
    DEFAULT_UNIT: 'days',
    /** Maximum analysis window in hours */
    MAX_HOURS: 24 * 365, // 1 year
    /** Minimum analysis window in hours */
    MIN_HOURS: 1
  }
} as const

/**
 * Cache and performance constants
 */
export const PERFORMANCE = {
  /** Cache settings */
  CACHE: {
    /** Activity data cache TTL (10 minutes) */
    ACTIVITY_DATA_TTL_MS: 10 * 60 * 1000,
    /** Default cache TTL in milliseconds (5 minutes) */
    DEFAULT_TTL_MS: 5 * 60 * 1000,
    /** Maximum cache entries */
    MAX_CACHE_ENTRIES: 1000,
    /** Project data cache TTL (15 minutes) */
    PROJECT_DATA_TTL_MS: 15 * 60 * 1000
  },
  /** Concurrency limits */
  CONCURRENCY: {
    /** Batch size for processing items */
    BATCH_SIZE: 50,
    /** Maximum concurrent repository analysis */
    MAX_CONCURRENT_REPOS: 5,
    /** Maximum concurrent API requests */
    MAX_CONCURRENT_REQUESTS: 10
  },
  /** Timeout settings */
  TIMEOUTS: {
    /** Overall analysis timeout (5 minutes) */
    ANALYSIS_MS: 5 * 60 * 1000,
    /** Default API request timeout (30 seconds) */
    API_REQUEST_MS: 30 * 1000,
    /** CLI command timeout (60 seconds) */
    CLI_COMMAND_MS: 60 * 1000
  }
} as const

/**
 * Error recovery and retry constants
 */
export const ERROR_RECOVERY = {
  /** Fallback strategies */
  FALLBACK: {
    /** Continue with partial data on non-critical errors */
    ALLOW_PARTIAL_DATA: true,
    /** Minimum success rate to continue processing */
    MIN_SUCCESS_RATE: 0.5,
    /** Use cached data if available when API fails */
    USE_CACHE_ON_ERROR: true
  },
  /** Retry configuration */
  RETRY: {
    /** Exponential backoff multiplier */
    BACKOFF_MULTIPLIER: 2,
    /** Base delay between retries (milliseconds) */
    BASE_DELAY_MS: 1000,
    /** Maximum retry attempts */
    MAX_ATTEMPTS: 3,
    /** Maximum delay between retries (milliseconds) */
    MAX_DELAY_MS: 10_000
  }
} as const

/**
 * Command line argument parsing constants
 */
export const CLI_ARGS = {
  /** Default values */
  DEFAULTS: {
    /** Default target audience */
    AUDIENCE: 'technical',
    /** Default include archived repositories */
    INCLUDE_ARCHIVED: 'false',
    /** Default include forks */
    INCLUDE_FORKS: 'true',
    /** Default maximum repositories */
    MAX_REPOS: '50',
    /** Default time window specification */
    TIME_WINDOW: '30d'
  },
  /** Argument patterns */
  PATTERNS: {
    /** GitHub URL pattern */
    GITHUB_URL: /^https:\/\/github\.com\//,
    /** Owner/repo pattern */
    OWNER_REPO: /^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/,
    /** Project ID pattern */
    PROJECT_ID: /^\d+$/,
    /** Time window pattern (e.g., "30d", "2w", "6m") */
    TIME_WINDOW: /^(\d+)([dwmy])$/
  }
} as const

/**
 * Output formatting constants
 */
export const OUTPUT_FORMAT = {
  /** Data formatting rules */
  FORMATTING: {
    /** Date format for output */
    DATE_FORMAT: 'YYYY-MM-DD',
    /** Number precision for percentages */
    PERCENTAGE_PRECISION: 1,
    /** Number precision for scores */
    SCORE_PRECISION: 0,
    /** Timestamp format for output */
    TIMESTAMP_FORMAT: 'YYYY-MM-DDTHH:mm:ss.sssZ'
  },
  /** LLM data key prefixes */
  KEY_PREFIXES: {
    ACTIVITY: 'ACTIVITY_',
    HEALTH: 'HEALTH_',
    PROJECT: 'PROJECT_',
    REPOSITORY: 'REPOSITORY_',
    SUMMARY: 'SUMMARY_'
  }
} as const