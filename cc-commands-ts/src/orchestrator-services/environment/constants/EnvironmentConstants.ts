/**
 * @file Environment Domain Constants
 * 
 * Defines all constants used throughout the environment domain including
 * tool names, version requirements, and validation thresholds.
 */

/**
 * Required CLI tools for development environment
 */
export const REQUIRED_TOOLS = {
  GIT: 'git',
  GITHUB_CLI: 'gh',
  JQ: 'jq',
  NODE: 'node',
  NPM: 'npm'
} as const

/**
 * Optional tools that enhance development workflow
 */
export const OPTIONAL_TOOLS = {
  CURL: 'curl',
  DOCKER: 'docker',
  WGET: 'wget'
} as const

/**
 * All supported tools (required + optional)
 */
export const ALL_TOOLS = {
  ...REQUIRED_TOOLS,
  ...OPTIONAL_TOOLS
} as const

/**
 * Minimum version requirements for tools
 */
export const MIN_VERSIONS = {
  [REQUIRED_TOOLS.GIT]: '2.20.0',
  [REQUIRED_TOOLS.GITHUB_CLI]: '2.0.0',
  [REQUIRED_TOOLS.JQ]: '1.6',
  [REQUIRED_TOOLS.NODE]: '16.0.0',
  [REQUIRED_TOOLS.NPM]: '7.0.0'
} as const

/**
 * Required files that must exist in a project
 */
export const REQUIRED_PROJECT_FILES = [
  'package.json',
  'tsconfig.json'
] as const

/**
 * Required directories for TypeScript projects
 */
export const REQUIRED_PROJECT_DIRECTORIES = [
  'src',
  'node_modules'
] as const

/**
 * Environment validation error types
 */
export const ENVIRONMENT_ERROR_TYPES = {
  INVALID_VERSION: 'INVALID_VERSION',
  MISSING_DIRECTORY: 'MISSING_DIRECTORY',
  MISSING_FILE: 'MISSING_FILE',
  MISSING_TOOL: 'MISSING_TOOL',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
} as const

/**
 * Data keys for environment validation results
 */
export const ENVIRONMENT_DATA_KEYS = {
  ENVIRONMENT_VALID: 'ENVIRONMENT_VALID',
  PROJECT_STRUCTURE_VALID: 'PROJECT_STRUCTURE_VALID',
  REQUIRED_FILES_PRESENT: 'REQUIRED_FILES_PRESENT',
  TOOL_COUNT_AVAILABLE: 'TOOL_COUNT_AVAILABLE',
  TOOL_COUNT_MISSING: 'TOOL_COUNT_MISSING',
  TOOL_COUNT_TOTAL: 'TOOL_COUNT_TOTAL',
  TOOLS_AVAILABLE: 'TOOLS_AVAILABLE',
  TOOLS_MISSING: 'TOOLS_MISSING'
} as const

/**
 * Data keys for individual tool validation
 */
export const TOOL_DATA_KEYS = {
  TOOL_AVAILABLE: 'TOOL_AVAILABLE',
  TOOL_NAME: 'TOOL_NAME',
  TOOL_PATH: 'TOOL_PATH',
  TOOL_VERSION: 'TOOL_VERSION',
  VERSION_MEETS_REQUIREMENTS: 'VERSION_MEETS_REQUIREMENTS'
} as const