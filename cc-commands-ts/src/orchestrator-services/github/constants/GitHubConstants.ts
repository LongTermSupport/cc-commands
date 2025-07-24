/**
 * @file GitHub Domain Constants
 * 
 * Centralized constants for GitHub API interactions, configuration values,
 * and standardized error messages. Eliminates magic strings throughout
 * the GitHub domain services.
 */

/**
 * GitHub API endpoints and base URLs
 */
export const GITHUB_API = {
  /** GitHub REST API base URL */
  BASE_URL: 'https://api.github.com',
  /** GitHub GraphQL API endpoint */
  GRAPHQL_URL: 'https://api.github.com/graphql',
  /** GitHub web base URL */
  WEB_BASE_URL: 'https://github.com'
} as const

/**
 * GitHub API rate limiting configuration
 */
export const RATE_LIMITS = {
  /** Multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Default delay between API calls (milliseconds) */
  DEFAULT_DELAY_MS: 100,
  /** Maximum number of retries for rate-limited requests */
  MAX_RETRIES: 3,
  /** Maximum retry delay (milliseconds) */
  MAX_RETRY_DELAY_MS: 30_000,
  /** Initial retry delay (milliseconds) */
  RETRY_DELAY_MS: 1000
} as const

/**
 * GitHub API pagination defaults
 */
export const PAGINATION = {
  /** Default page size for API requests */
  DEFAULT_PAGE_SIZE: 100,
  /** Maximum page size allowed by GitHub API */
  MAX_PAGE_SIZE: 100,
  /** Maximum number of pages to fetch */
  MAX_PAGES: 50,
  /** Maximum total items to fetch per query */
  MAX_TOTAL_ITEMS: 5000
} as const

/**
 * GitHub authentication scopes required
 */
export const REQUIRED_SCOPES = {
  /** Required for reading organization data */
  ORGANIZATION_READ: 'read:org',
  /** Required for reading project data */
  PROJECT_READ: 'read:project',
  /** Required for reading repository data */
  REPOSITORY_READ: 'repo',
  /** Required for reading user data */
  USER_READ: 'read:user'
} as const

/**
 * GitHub API response field names
 */
export const API_FIELDS = {
  /** Commit fields */
  COMMIT: {
    AUTHOR: 'author',
    COMMIT: 'commit',
    COMMITTER: 'committer',
    HTML_URL: 'html_url',
    MESSAGE: 'message',
    PARENTS: 'parents',
    SHA: 'sha',
    STATS: 'stats',
    URL: 'url'
  },
  /** Issue fields */
  ISSUE: {
    ASSIGNEES: 'assignees',
    BODY: 'body',
    CLOSED_AT: 'closed_at',
    COMMENTS: 'comments',
    CREATED_AT: 'created_at',
    HTML_URL: 'html_url',
    ID: 'id',
    LABELS: 'labels',
    NUMBER: 'number',
    STATE: 'state',
    TITLE: 'title',
    UPDATED_AT: 'updated_at',
    USER: 'user'
  },
  /** Pull request fields */
  PULL_REQUEST: {
    ADDITIONS: 'additions',
    BASE: 'base',
    CHANGED_FILES: 'changed_files',
    CLOSED_AT: 'closed_at',
    COMMITS: 'commits',
    CREATED_AT: 'created_at',
    DELETIONS: 'deletions',
    DRAFT: 'draft',
    HEAD: 'head',
    HTML_URL: 'html_url',
    ID: 'id',
    MERGEABLE: 'mergeable',
    MERGED: 'merged',
    MERGED_AT: 'merged_at',
    NUMBER: 'number',
    STATE: 'state',
    TITLE: 'title',
    UPDATED_AT: 'updated_at'
  },
  /** Repository fields */
  REPOSITORY: {
    CREATED_AT: 'created_at',
    DEFAULT_BRANCH: 'default_branch',
    DESCRIPTION: 'description',
    FULL_NAME: 'full_name',
    HTML_URL: 'html_url',
    LANGUAGE: 'language',
    NAME: 'name',
    OPEN_ISSUES_COUNT: 'open_issues_count',
    OWNER: 'owner',
    PRIVATE: 'private',
    PUSHED_AT: 'pushed_at',
    STARGAZERS_COUNT: 'stargazers_count',
    UPDATED_AT: 'updated_at'
  }
} as const

/**
 * GitHub CLI command templates
 */
export const CLI_COMMANDS = {
  /** Authentication commands */
  AUTH: {
    LOGIN: 'gh auth login',
    STATUS: 'gh auth status'
  },
  /** Issue commands */
  ISSUE: {
    LIST: 'gh issue list --repo {owner}/{repo} --json',
    VIEW: 'gh issue view {number} --repo {owner}/{repo} --json'
  },
  /** Pull request commands */
  PR: {
    LIST: 'gh pr list --repo {owner}/{repo} --json',
    VIEW: 'gh pr view {number} --repo {owner}/{repo} --json'
  },
  /** Project commands */
  PROJECT: {
    ITEM_LIST: 'gh project item-list {project_id} --owner {owner} --json',
    LIST: 'gh project list --owner {owner} --json',
    VIEW: 'gh project view {project_id} --owner {owner} --json'
  },
  /** Repository commands */
  REPOSITORY: {
    LIST: 'gh repo list {owner} --json',
    VIEW: 'gh repo view {owner}/{repo} --json'
  },
  /** Search commands */
  SEARCH: {
    COMMITS: 'gh search commits --repo {owner}/{repo} --json',
    ISSUES: 'gh search issues --repo {owner}/{repo} --json',
    PRS: 'gh search prs --repo {owner}/{repo} --json'
  }
} as const

/**
 * GitHub GraphQL query fragments
 */
export const GRAPHQL_FRAGMENTS = {
  /** Issue fragment */
  ISSUE: `
    fragment IssueInfo on Issue {
      id
      number
      title
      body
      state
      createdAt
      updatedAt
      closedAt
      author {
        login
      }
      assignees(first: 10) {
        nodes {
          login
        }
      }
      labels(first: 20) {
        nodes {
          name
        }
      }
      comments {
        totalCount
      }
    }
  `,
  /** Pull request fragment */
  PULL_REQUEST: `
    fragment PullRequestInfo on PullRequest {
      id
      number
      title
      body
      state
      createdAt
      updatedAt
      closedAt
      mergedAt
      merged
      draft
      additions
      deletions
      changedFiles
      baseRefName
      headRefName
      author {
        login
      }
      assignees(first: 10) {
        nodes {
          login
        }
      }
      commits {
        totalCount
      }
      comments {
        totalCount
      }
      reviews {
        totalCount
      }
    }
  `,
  /** Repository fragment */
  REPOSITORY: `
    fragment RepositoryInfo on Repository {
      id
      name
      nameWithOwner
      description
      url
      createdAt
      updatedAt
      pushedAt
      stargazerCount
      forkCount
      isArchived
      isDisabled
      isFork
      isPrivate
      primaryLanguage {
        name
      }
      defaultBranchRef {
        name
      }
      owner {
        login
      }
    }
  `
} as const

/**
 * Standard error messages for GitHub operations
 */
export const ERROR_MESSAGES = {
  /** API errors */
  API: {
    INVALID_RESPONSE: 'Invalid response from GitHub API.',
    NETWORK_ERROR: 'Network error connecting to GitHub API.',
    RATE_LIMITED: 'GitHub API rate limit exceeded. Please retry later.',
    SERVER_ERROR: 'GitHub API server error.',
    TIMEOUT: 'GitHub API request timeout.'
  },
  /** Authentication errors */
  AUTH: {
    FAILED_TO_VALIDATE: 'Failed to validate GitHub authentication.',
    INSUFFICIENT_SCOPES: 'GitHub token lacks required permissions for this operation.',
    INVALID_TOKEN: 'GitHub authentication token is invalid or expired.',
    NOT_AUTHENTICATED: 'GitHub authentication required. Run `gh auth login` to authenticate.'
  },
  /** CLI errors */
  CLI: {
    COMMAND_FAILED: 'GitHub CLI command failed.',
    INVALID_OUTPUT: 'Invalid output from GitHub CLI command.',
    NOT_INSTALLED: 'GitHub CLI (gh) is not installed or not in PATH.',
    VERSION_INCOMPATIBLE: 'GitHub CLI version is incompatible.'
  },
  /** Data errors */
  DATA: {
    EMPTY_RESPONSE: 'Empty response from GitHub API.',
    INVALID_FORMAT: 'Invalid data format received from GitHub.',
    MISSING_REQUIRED_FIELD: 'Required field missing from GitHub response.',
    PARSE_ERROR: 'Failed to parse GitHub response data.'
  },
  /** Project errors */
  PROJECT: {
    INVALID_ID: 'Invalid project ID format.',
    INVALID_URL: 'Invalid GitHub project URL format.',
    NO_REPOSITORIES: 'No repositories found in project.',
    NOT_FOUND: 'GitHub project not found or access denied.'
  },
  /** Repository errors */
  REPOSITORY: {
    ACCESS_DENIED: 'Access denied to repository. Check permissions.',
    ARCHIVED: 'Repository is archived and may have limited data.',
    INVALID_NAME: 'Invalid repository name format. Expected: owner/repo',
    NOT_FOUND: 'Repository not found or access denied.'
  }
} as const

/**
 * GitHub entity state constants
 */
export const GITHUB_STATES = {
  /** Issue states */
  ISSUE: {
    CLOSED: 'closed',
    OPEN: 'open'
  },
  /** Project states */
  PROJECT: {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN'
  },
  /** Pull request states */
  PULL_REQUEST: {
    CLOSED: 'closed',
    MERGED: 'merged',
    OPEN: 'open'
  },
  /** Repository visibility */
  VISIBILITY: {
    INTERNAL: 'internal',
    PRIVATE: 'private',
    PUBLIC: 'public'
  }
} as const

/**
 * GitHub API version and user agent configuration
 */
export const API_CONFIG = {
  /** Accept header for API requests */
  ACCEPT_HEADER: 'application/vnd.github+json',
  /** GitHub API version header */
  API_VERSION: '2022-11-28',
  /** User agent string for API requests */
  USER_AGENT: 'cc-commands-github-client/1.0.0'
} as const

/**
 * Time-based constants for activity analysis
 */
export const TIME_CONSTANTS = {
  /** Default activity analysis windows */
  DEFAULT_ACTIVITY_DAYS: 30,
  DEFAULT_COMPARISON_DAYS: 60,
  /** Activity classification thresholds */
  HIGH_ACTIVITY_COMMITS_PER_DAY: 5,
  MEDIUM_ACTIVITY_COMMITS_PER_DAY: 1,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_MINUTE: 60 * 1000,
  /** Milliseconds in common time units */
  MS_PER_SECOND: 1000,
  MS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
  STALE_ISSUE_DAYS: 30,
  STALE_PR_DAYS: 14
} as const

/**
 * GitHub URL patterns and regex
 */
export const URL_PATTERNS = {
  /** Git remote URL patterns */
  GIT_REMOTE: {
    HTTPS: /^https:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/,
    SSH: /^git@github\.com:([^/]+)\/([^/]+)\.git$/
  },
  /** GitHub project URL regex */
  PROJECT_URL: /^https:\/\/github\.com\/(?:orgs|users)\/([^/]+)\/projects\/(\d+)(?:\/.*)?$/,
  /** GitHub repository URL regex */
  REPOSITORY_URL: /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/
} as const

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Default activity aggregation period */
  ACTIVITY_PERIOD: 'daily' as const,
  /** Default maximum commits per repository */
  MAX_COMMITS_PER_REPO: 1000,
  /** Default maximum issues per repository */
  MAX_ISSUES_PER_REPO: 500,
  /** Default maximum PRs per repository */
  MAX_PRS_PER_REPO: 200,
  /** Default maximum repositories to analyze */
  MAX_REPOSITORIES: 50,
  /** Default target audience */
  TARGET_AUDIENCE: 'technical' as const,
  /** Default time window for analysis */
  TIME_WINDOW_DAYS: 30
} as const