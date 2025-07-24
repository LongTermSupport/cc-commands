/**
 * Type definitions for data-only objects (no functions/methods)
 */

/**
 * Represents any valid JSON value
 */
export type JsonValue = 
  | boolean 
  | JsonArray 
  | JsonObject 
  | null
  | number
  | string

/**
 * JSON object (data only, no functions)
 */
export interface JsonObject {
  [key: string]: JsonValue
}

/**
 * JSON array
 */
export type JsonArray = JsonValue[]

/**
 * Simple data object with only primitive values
 */
export type SimpleDataObject = Record<string, boolean | null | number | string>

/**
 * Context data for errors and debugging
 * Enforces string values for most common cases
 */
export type ErrorContext = {
  [key: string]: boolean | null | number | string | string[] | undefined
  // Specific known fields
  action?: string
  command?: string
  directory?: string
  errorDomain?: string
  errorType?: string
  file?: string
  host?: string
  path?: string
  port?: number
  resource?: string
  url?: string
}

/**
 * Debug info that should be serializable
 */
export type DebugInfo = JsonObject

/**
 * Type guard to check if a value is a JsonObject
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' 
    && value !== null 
    && !Array.isArray(value)
    && Object.values(value).every(v => 
      v === null ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      isJsonObject(v) ||
      Array.isArray(v)
    )
}

/**
 * Type guard to ensure no functions in object
 */
export function isDataOnly(obj: unknown): obj is JsonObject {
  if (!isJsonObject(obj)) return false
  
  const checkValue = (val: unknown): boolean => {
    if (typeof val === 'function') return false
    if (Array.isArray(val)) return val.every(item => checkValue(item))
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).every(item => checkValue(item))
    }

    return true
  }
  
  return checkValue(obj)
}