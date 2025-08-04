/**
 * @file Core JSON result type system with recursive structure support
 * 
 * Defines the fundamental types for the JSON result file system, including:
 * - Recursive JSON value types
 * - Data provenance namespace structure (raw vs calculated)
 * - Complete result file structure with metadata
 * 
 * These types enforce clear separation between raw API data and calculated values,
 * ensuring LLMs can easily distinguish data sources during analysis.
 */

// Scalar leaf values in JSON
export type JsonScalar = boolean | null | number | string | undefined

// Recursive JSON structure - can contain scalars, arrays, or objects
export type JsonValue = 
  | JsonObject
  | JsonScalar
  | JsonValue[]
  | readonly JsonValue[]

// Object with string keys to any JsonValue
export interface JsonObject {
  readonly [key: string]: JsonValue
}

// Enforced namespace structure for data provenance
export interface DataNamespaceStructure extends JsonObject {
  readonly calculated: {
    readonly [calculationType: string]: JsonObject  // 'time_calculations', 'mathematical_ratios', etc.
  }
  readonly raw: {
    readonly [dataSource: string]: JsonObject  // 'github_api', 'git_remote', 'filesystem'
  }
}

// Complete result file structure
export interface ResultJsonStructure extends JsonObject {
  readonly calculated: JsonObject
  readonly metadata: {
    readonly arguments: string
    readonly command: string
    readonly execution_time_ms: number
    readonly generated_at: string
  }
  readonly raw: JsonObject
  readonly [additionalKeys: string]: JsonValue  // Allow 'repositories', etc.
}