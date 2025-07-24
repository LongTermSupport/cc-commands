/**
 * @file Generic data keys used across the application
 * 
 * This file contains only truly generic keys that are reused across
 * multiple contexts. Domain-specific keys should be defined within
 * their respective DTO classes.
 */

/**
 * Generic data keys for common concepts
 * 
 * These keys represent generic concepts that appear across multiple
 * domains. For domain-specific keys (e.g., REPOSITORY_NAME, COMMIT_COUNT),
 * define them within the relevant DTO class as private static constants.
 */
export const DataKeys = {
  ANALYZED_AT: 'ANALYZED_AT',
  // Generic counts
  COUNT: 'COUNT',
  // Generic temporal
  CREATED_AT: 'CREATED_AT',
  
  DATE: 'DATE',
  // Generic descriptive
  DESCRIPTION: 'DESCRIPTION',
  ERROR_CONTEXT: 'ERROR_CONTEXT',
  ERROR_MESSAGE: 'ERROR_MESSAGE',
  ERROR_RECOVERY: 'ERROR_RECOVERY',
  
  // Error related
  ERROR_TYPE: 'ERROR_TYPE',
  ID: 'ID',
  
  LANGUAGE: 'LANGUAGE',
  MESSAGE: 'MESSAGE',
  MODE: 'MODE',
  // Generic identifiers
  NAME: 'NAME',
  
  OWNER: 'OWNER',
  STATUS: 'STATUS',
  TOTAL: 'TOTAL',
  TYPE: 'TYPE',
  
  UPDATED_AT: 'UPDATED_AT',
  URL: 'URL',
  // Generic validation/status
  VALID: 'VALID',
  VERSION: 'VERSION',
} as const

/**
 * Type-safe data key type
 */
export type DataKey = typeof DataKeys[keyof typeof DataKeys]