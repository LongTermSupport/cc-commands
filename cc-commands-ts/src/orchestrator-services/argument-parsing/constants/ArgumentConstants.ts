/**
 * @file Argument Parsing Constants
 * 
 * Central repository for all constants used in the argument parsing domain
 * including formats, error types, patterns, and data keys.
 */

/**
 * Supported argument formats for validation
 */
export const ARGUMENT_FORMATS = {
  BOOLEAN: 'boolean',
  DATE: 'date',
  EMAIL: 'email',
  GITHUB_REPO: 'github-repo',
  JSON: 'json',
  NUMBER: 'number',
  PATH: 'path',
  PERMISSION_LEVEL: 'permission-level',
  STRING: 'string',
  URL: 'url'
} as const

/**
 * Argument parsing error types
 */
export const ARGUMENT_ERROR_TYPES = {
  ARGUMENT_COUNT_INVALID: 'ARGUMENT_COUNT_INVALID',
  FORMAT_INVALID: 'FORMAT_INVALID',
  MALFORMED_INPUT: 'MALFORMED_INPUT',
  PARSING_FAILED: 'PARSING_FAILED',
  REQUIRED_MISSING: 'REQUIRED_MISSING',
  UNKNOWN_FLAG: 'UNKNOWN_FLAG',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
} as const

/**
 * Standard LLM data keys for argument parsing results
 */
export const ARGUMENT_DATA_KEYS = {
  // Validation results
  ARGUMENTS_VALID: 'ARGUMENTS_VALID',
  DATE_ARGS_DETECTED: 'DATE_ARGS_DETECTED',
  FLAGS: 'FLAGS',
  // Standard patterns detected
  GITHUB_REPO_DETECTED: 'GITHUB_REPO_DETECTED',
  HAS_QUOTED_ARGS: 'HAS_QUOTED_ARGS',
  
  INVALID_FORMATS: 'INVALID_FORMATS',
  KEY_VALUE_PAIRS: 'KEY_VALUE_PAIRS',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  // Parsing context
  PARSING_TIMESTAMP: 'PARSING_TIMESTAMP',
  
  PARSING_WARNINGS: 'PARSING_WARNINGS',
  PATH_ARGS_DETECTED: 'PATH_ARGS_DETECTED',
  // Core parsing results
  POSITIONAL_ARGS: 'POSITIONAL_ARGS',
  
  RAW_INPUT: 'RAW_INPUT',
  TOTAL_ARGUMENTS: 'TOTAL_ARGUMENTS',
  VALIDATED_COUNT: 'VALIDATED_COUNT'
} as const

/**
 * Regular expressions for standard argument patterns
 */
export const ARGUMENT_PATTERNS = {
  // ISO date format (YYYY-MM-DD)
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // Email address
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // GitHub repository (owner/repo)
  GITHUB_REPO: /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
  
  // JSON string
  JSON: /^[{[].*[}]]$/,
  
  // Key-value patterns
  KEY_VALUE: /^--([a-zA-Z][a-zA-Z0-9-]*)=(.+)$/,
  
  LONG_FLAG: /^--[a-zA-Z][a-zA-Z0-9-]*$/,
  
  // File/directory path
  PATH: /^[^\0]+$/,
  
  // Permission levels
  PERMISSION_LEVEL: /^(low|medium|high)$/i,
  // Quoted string
  QUOTED_STRING: /^["'].*["']$/,
  
  // Flag patterns
  SHORT_FLAG: /^-[a-zA-Z]$/,
  
  // Basic URL
  URL: /^https?:\/\/[^\s]+$/
} as const

/**
 * Standard boolean flags used in cc-commands
 */
export const STANDARD_FLAGS = [
  'force',
  'dry-run',
  'verbose',
  'help',
  'quiet',
  'debug',
  'yes',
  'no'
] as const

/**
 * Default argument parsing configuration
 */
export const DEFAULT_PARSING_CONFIG = {
  customPatterns: {},
  normalizeFlagNames: true,
  preserveQuotes: false,
  trimValues: true
} as const

/**
 * Maximum allowed arguments to prevent DoS
 */
export const MAX_ARGUMENTS = 100

/**
 * Maximum argument length to prevent excessive memory usage
 */
export const MAX_ARGUMENT_LENGTH = 1000