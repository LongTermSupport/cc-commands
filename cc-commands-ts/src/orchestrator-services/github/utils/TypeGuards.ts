/**
 * @file Type Guards Utility Module
 * 
 * Provides type-safe runtime type checking utilities for GitHub API responses
 * and other data structures. Replaces unsafe `any` type guards with proper
 * type predicates.
 */

import type { GitHubOwner } from '../types/GitHubApiTypes.js'

/**
 * Type guard for GitHub User type
 * Checks if an object has the required properties of a GitHub user
 */
export function isGitHubUser(obj: unknown): obj is GitHubOwner {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  
  const user = obj as Record<string, unknown>
  return (
    typeof user['login'] === 'string' &&
    typeof user['id'] === 'number' &&
    typeof user['node_id'] === 'string' &&
    typeof user['avatar_url'] === 'string' &&
    typeof user['url'] === 'string' &&
    (user['type'] === 'User' || user['type'] === 'Organization')
  )
}

/**
 * Type guard for GitHub Label type
 * Checks if an object has the required properties of a GitHub label
 */
export function isGitHubLabel(obj: unknown): obj is {
  color: string
  default?: boolean
  description?: null | string
  id: number
  name: string
  node_id?: string
  url?: string
} {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  
  const label = obj as Record<string, unknown>
  return (
    typeof label['id'] === 'number' &&
    typeof label['name'] === 'string' &&
    typeof label['color'] === 'string' &&
    (label['description'] === undefined || 
     label['description'] === null || 
     typeof label['description'] === 'string')
  )
}

/**
 * Type guard for checking if a value is defined (not null or undefined)
 * Useful for filtering arrays
 */
export function isDefined<T>(value: null | T | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for checking if a value is a valid array index
 */
export function isValidArrayIndex<T>(array: T[], index: number): index is number {
  return Number.isInteger(index) && index >= 0 && index < array.length
}

/**
 * Safely access array element with bounds checking
 * Returns undefined if index is out of bounds
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  if (isValidArrayIndex(array, index)) {
    return array[index]
  }

  return undefined
}

/**
 * Type guard for checking if an object has a specific property
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return obj !== null && 
         typeof obj === 'object' && 
         prop in obj
}

/**
 * Type guard for checking if an object is a record with string keys
 */
export function isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && 
         typeof obj === 'object' && 
         !Array.isArray(obj)
}