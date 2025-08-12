/**
 * @file Filesystem domain constants
 *
 * Contains all constants used throughout the filesystem domain including
 * file patterns, directory names, plan structure definitions, and data keys.
 */

/**
 * Standard directory names and patterns for file discovery
 */
export const FILESYSTEM_DIRECTORIES = {
  ARCHIVE_DIR: 'archive',
  CLAUDE_ALT: 'claude', 
  CLAUDE_MAIN: 'CLAUDE',
  DOCS_DIR: 'docs',
  PLAN_DIR: 'plan'
} as const

/**
 * File patterns for different types of discovery
 */
export const FILE_PATTERNS = {
  ALL_DOCS: '**/*.md',
  CLAUDE_FILE: 'CLAUDE.md',
  CONFIG_JSON: '*.json',
  CONFIG_YAML: '*.{yml,yaml}',
  MARKDOWN: '*.md',
  PLAN_FILES: '*.md',
  README: 'README.md'
} as const

/**
 * Plan file status markers and patterns
 */
export const PLAN_MARKERS = {
  ALL_DONE: 'ALL DONE!',
  DATE_PREFIX: '**Date**:',
  PRIORITY_PREFIX: '**Priority**:',
  STATUS_PREFIX: '**Status**:',
  TASK_COMPLETED: /^\[✓\]/,
  TASK_IN_PROGRESS: /^\[⏳\]/,
  TASK_PENDING: /^\[\s\]/
} as const

/**
 * Plan directory structure patterns
 */
export const PLAN_STRUCTURE = {
  ACTIVE_PATH_PATTERNS: [
    'CLAUDE/plan',
    'claude/plan'
  ],
  ARCHIVE_PATH_PATTERNS: [
    'CLAUDE/plan/archive',
    'claude/plan/archive'
  ],
  MAX_SEARCH_DEPTH: 2
} as const

/**
 * Documentation discovery patterns
 */
export const DOCUMENTATION_PATTERNS = {
  EXCLUDE_PATTERNS: [
    '.claude/cc-commands/*',
    'cc-commands/*',
    'node_modules/*',
    '.git/*'
  ],
  SEARCH_PATHS: [
    'CLAUDE/*.md',
    'CLAUDE/**/*.md', 
    'CLAUDE.md',
    'README.md',
    'docs/*.md',
    'docs/**/*.md'
  ]
} as const

/**
 * File metadata extraction patterns
 */
export const METADATA_PATTERNS = {
  CODE_BLOCK: /```[\s\S]*?```/g,
  FRONTMATTER: /^---\n([\s\S]*?)\n---/,
  HEADING: /^#+\s+(.+)$/gm,
  LINK: /\[([^\]]+)\]\(([^)]+)\)/g
} as const

/**
 * LLM Data keys for filesystem operations
 */
export const FILESYSTEM_DATA_KEYS = {
  // Plan discovery results
  ACTIVE_PLANS_COUNT: 'ACTIVE_PLANS_COUNT',
  ALL_DONE: 'ALL_DONE',
  ARCHIVED_PLANS_COUNT: 'ARCHIVED_PLANS_COUNT',
  
  CLAUDE_FILES: 'CLAUDE_FILES',
  COMPLETED_TASKS: 'COMPLETED_TASKS', 
  COMPLETION_PERCENTAGE: 'COMPLETION_PERCENTAGE',
  // Directory structure
  DIRECTORY_COUNT: 'DIRECTORY_COUNT',
  
  DOCS_DIRECTORY_FILES: 'DOCS_DIRECTORY_FILES',
  FILE_COUNT: 'FILE_COUNT',
  FILE_CREATED: 'FILE_CREATED',
  FILE_MODIFIED: 'FILE_MODIFIED',
  FILE_PERMISSIONS: 'FILE_PERMISSIONS',
  
  // File metadata
  FILE_SIZE: 'FILE_SIZE',
  // File discovery results
  FILES_FOUND: 'FILES_FOUND',
  IN_PROGRESS_TASKS: 'IN_PROGRESS_TASKS',
  MARKDOWN_FILES: 'MARKDOWN_FILES',
  
  MAX_DEPTH: 'MAX_DEPTH',
  PENDING_TASKS: 'PENDING_TASKS',
  PLAN_DATE: 'PLAN_DATE',
  PLAN_DIRECTORY: 'PLAN_DIRECTORY',
  PLAN_PRIORITY: 'PLAN_PRIORITY',
  // Plan metadata  
  PLAN_STATUS: 'PLAN_STATUS',
  // Documentation discovery results
  README_FILES: 'README_FILES',
  SEARCH_DIRECTORY: 'SEARCH_DIRECTORY',
  SEARCH_PATTERN: 'SEARCH_PATTERN',
  
  TOTAL_DOCUMENTATION: 'TOTAL_DOCUMENTATION',
  TOTAL_PLANS: 'TOTAL_PLANS',
  TOTAL_SIZE: 'TOTAL_SIZE',
  TOTAL_TASKS: 'TOTAL_TASKS'
} as const

/**
 * Default configuration values
 */
export const DEFAULTS = {
  DIRECTORY_SCAN_DEPTH: 3,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SEARCH_RESULTS: 100,
  PREVIEW_LINES: 5
} as const

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  CONTENT_PARSE_ERROR: 'Failed to parse content: {error}',
  DIRECTORY_NOT_FOUND: 'Directory not found: {path}',
  FILE_NOT_FOUND: 'File not found: {path}',
  FILE_TOO_LARGE: 'File too large: {path} ({size} bytes)',
  INVALID_PATH: 'Invalid file path: {path}',
  PERMISSION_DENIED: 'Permission denied: {path}',
  PLAN_PARSE_ERROR: 'Failed to parse plan file: {path}'
} as const