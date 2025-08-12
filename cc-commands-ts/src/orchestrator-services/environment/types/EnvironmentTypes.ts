/**
 * @file Environment Domain Type Definitions
 * 
 * Defines all types used throughout the environment domain for
 * tool detection, validation, and environment assessment.
 */

import { ALL_TOOLS, ENVIRONMENT_ERROR_TYPES } from '../constants/EnvironmentConstants.js'

/**
 * Supported tool names
 */
export type ToolName = typeof ALL_TOOLS[keyof typeof ALL_TOOLS]

/**
 * Environment validation error types
 */
export type EnvironmentErrorType = typeof ENVIRONMENT_ERROR_TYPES[keyof typeof ENVIRONMENT_ERROR_TYPES]

/**
 * Tool detection result for a single tool
 */
export interface ToolDetectionResult {
  /** Error message if detection failed */
  error?: string
  /** Whether the tool is available on the system */
  isAvailable: boolean
  /** Full path to the tool executable */
  path?: string
  /** Tool name being checked */
  toolName: ToolName
  /** Detected version (if available) */
  version?: string
}

/**
 * Version comparison result
 */
export interface VersionValidationResult {
  /** Comparison result (-1 if lower, 0 if equal, 1 if higher) */
  comparison: -1 | 0 | 1
  /** Detected version */
  detectedVersion: string
  /** Whether the detected version meets requirements */
  isValid: boolean
  /** Required minimum version */
  requiredVersion: string
  /** Tool name being validated */
  toolName: ToolName
}

/**
 * File existence check result
 */
export interface FileCheckResult {
  /** Error message if check failed */
  error?: string
  /** Whether the file exists */
  exists: boolean
  /** File path that was checked */
  filePath: string
  /** Whether the file is readable */
  isReadable?: boolean
  /** File size in bytes (if accessible) */
  size?: number
}

/**
 * Directory structure validation result
 */
export interface DirectoryCheckResult {
  /** Directory path that was checked */
  directoryPath: string
  /** Error message if check failed */
  error?: string
  /** Whether the directory exists */
  exists: boolean
  /** Whether the directory is accessible */
  isAccessible?: boolean
}

/**
 * Project structure validation configuration
 */
export interface ProjectStructureConfig {
  /** Project root directory */
  projectRoot: string
  /** Required directories relative to project root */
  requiredDirectories: string[]
  /** Required files relative to project root */
  requiredFiles: string[]
}

/**
 * Overall environment validation summary
 */
export interface EnvironmentValidationSummary {
  /** Number of tools that are available */
  availableToolsCount: number
  /** Whether the environment is completely valid */
  isValid: boolean
  /** Number of tools that are missing */
  missingToolsCount: number
  /** Whether project structure is valid */
  projectStructureValid: boolean
  /** Total number of tools checked */
  totalToolsCount: number
  /** Validation timestamp */
  validatedAt: Date
}

/**
 * Child process execution result
 */
export interface ProcessResult {
  /** Error from process execution (if any) */
  error?: Error
  /** Process exit code */
  exitCode: number
  /** Standard error output */
  stderr: string
  /** Standard output */
  stdout: string
  /** Whether the process executed successfully */
  success: boolean
}

/**
 * Tool version extraction patterns
 */
export interface VersionExtractionConfig {
  /** Tool name */
  toolName: ToolName
  /** Command arguments to get version */
  versionArgs: string[]
  /** Which capture group contains the version */
  versionGroup: number
  /** Regex pattern to extract version from output */
  versionPattern: RegExp
}