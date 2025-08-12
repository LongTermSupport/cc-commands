/**
 * @file Argument Parsing Domain Type Definitions
 * 
 * Defines all types used throughout the argument parsing domain for
 * command-line argument processing, validation, and standardization.
 */

import { ARGUMENT_ERROR_TYPES, ARGUMENT_FORMATS } from '../constants/ArgumentConstants.js'

/**
 * Supported argument formats for validation
 */
export type ArgumentFormat = typeof ARGUMENT_FORMATS[keyof typeof ARGUMENT_FORMATS]

/**
 * Argument parsing error types
 */
export type ArgumentErrorType = typeof ARGUMENT_ERROR_TYPES[keyof typeof ARGUMENT_ERROR_TYPES]

/**
 * Parsed argument structure
 */
export interface ParsedArgument {
  /** Whether this argument is quoted in original input */
  isQuoted: boolean
  /** Argument position (for positional args) */
  position?: number
  /** The raw input value */
  rawValue: string
  /** Sanitized/processed value */
  value: string
}

/**
 * Argument validation result for a single argument
 */
export interface ArgumentValidationResult {
  /** Argument name being validated */
  argumentName: string
  /** Error message if validation failed */
  error?: string
  /** Expected format */
  expectedFormat?: ArgumentFormat
  /** Whether the argument is valid */
  isValid: boolean
  /** Validated value (if valid) */
  validatedValue?: string
}

/**
 * Format error details
 */
export interface ArgumentFormatError {
  /** Argument name with format issue */
  argumentName: string
  /** Specific error message */
  error: string
  /** Expected format */
  expectedFormat: ArgumentFormat
  /** Provided value that failed validation */
  providedValue: string
}

/**
 * Argument definition for validation
 */
export interface ArgumentDefinition {
  /** Alternative names (aliases) */
  aliases?: string[]
  /** Default value if not provided */
  defaultValue?: string
  /** Human-readable description */
  description: string
  /** Expected format for validation */
  format?: ArgumentFormat
  /** Argument name */
  name: string
  /** Whether this argument is required */
  required: boolean
}

/**
 * Standard argument parsing patterns used by cc-commands
 */
export interface StandardArgumentPatterns {
  /** ISO date pattern */
  DATE: RegExp
  /** Email pattern */
  EMAIL: RegExp
  /** GitHub repository pattern (owner/repo) */
  GITHUB_REPO: RegExp
  /** JSON pattern */
  JSON: RegExp
  /** Path pattern */
  PATH: RegExp
  /** Permission level pattern */
  PERMISSION_LEVEL: RegExp
  /** URL pattern */
  URL: RegExp
}

/**
 * Argument parsing configuration
 */
export interface ArgumentParsingConfig {
  /** Custom parsing patterns */
  customPatterns?: Record<string, RegExp>
  /** Whether to convert flag names to lowercase */
  normalizeFlagNames: boolean
  /** Whether to preserve quoted strings */
  preserveQuotes: boolean
  /** Whether to trim whitespace from values */
  trimValues: boolean
}

/**
 * Key-value pair parsing result
 */
export interface KeyValuePair {
  /** The key name */
  key: string
  /** Original raw format (e.g., --key=value) */
  rawFormat: string
  /** The value */
  value: string
}

/**
 * Flag parsing result
 */
export interface FlagResult {
  /** Whether flag is present/enabled */
  enabled: boolean
  /** Flag name (without dashes) */
  name: string
  /** Original format (e.g., -f, --force) */
  originalFormat: string
}

/**
 * Argument parsing context
 */
export interface ParsingContext {
  /** Parsing configuration used */
  config: ArgumentParsingConfig
  /** Original command string */
  originalInput: string
  /** Parsing timestamp */
  parsedAt: Date
  /** Any parsing warnings */
  warnings: string[]
}