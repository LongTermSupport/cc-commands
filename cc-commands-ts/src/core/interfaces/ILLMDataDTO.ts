/**
 * @file Interface for Data Transfer Objects that provide data to LLMInfo
 * 
 * All DTOs that need to contribute data to LLM responses must implement
 * this interface. This ensures consistent data transformation and type safety.
 * 
 * DTOs now support dual output formats:
 * 1. Key-value pairs for LLM stdout consumption (existing)
 * 2. Structured JSON with data provenance namespacing (new)
 */

import { DataNamespaceStructure } from '../types/JsonResultTypes.js'
import { JqHint } from './JqHint.js'

/**
 * Interface for all DTOs that provide data to LLMInfo
 * 
 * This interface enforces consistent patterns for converting structured data objects
 * into both key-value format (for LLM stdout) and JSON format (for result files).
 */
export interface ILLMDataDTO {
  /**
   * Provide jq query hints for efficient data access
   * 
   * @returns Array of query hints with scope information for hierarchical merging
   * 
   * @example
   * ```typescript
   * getJqHints(): JqHint[] {
   *   return [
   *     {
   *       query: ".raw.github_api.name",
   *       description: "Repository name from GitHub API",
   *       scope: "single_item"
   *     },
   *     {
   *       query: ".calculated.time_calculations.age_days",
   *       description: "Repository age in days (calculated)",
   *       scope: "single_item"
   *     }
   *   ]
   * }
   * ```
   */
  getJqHints(): JqHint[]
  
  /**
   * Convert the DTO to structured JSON with data provenance namespacing
   * 
   * @returns DataNamespaceStructure with clear separation between raw API data
   *          and calculated/transformed values
   * 
   * @example
   * ```typescript
   * toJsonData(): DataNamespaceStructure {
   *   return {
   *     raw: {
   *       github_api: {
   *         name: this.name,
   *         created_at: this.createdAt,
   *         commits: this.commits.map(c => ({ sha: c.sha, date: c.date }))
   *       }
   *     },
   *     calculated: {
   *       time_calculations: {
   *         age_days: this.calculateAgeDays(),
   *         days_since_updated: this.calculateDaysSinceUpdate()
   *       },
   *       mathematical_ratios: {
   *         forks_to_stars_ratio: this.calculateForksToStarsRatio()
   *       }
   *     }
   *   }
   * }
   * ```
   */
  toJsonData(): DataNamespaceStructure
  
  /**
   * Convert the DTO to key-value pairs for LLM stdout consumption
   * 
   * @returns Record of data keys to string values. All values must be strings.
   *          Complex data should be serialized appropriately (e.g., arrays as comma-separated).
   * 
   * @example
   * ```typescript
   * toLLMData(): Record<string, string> {
   *   return {
   *     REPOSITORY_NAME: this.name,
   *     REPOSITORY_OWNER: this.owner,
   *     TOPICS: this.topics.join(', ')
   *   }
   * }
   * ```
   */
  toLLMData(): Record<string, string>
}