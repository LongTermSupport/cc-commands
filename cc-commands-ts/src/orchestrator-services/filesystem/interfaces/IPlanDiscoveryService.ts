/**
 * @file Plan discovery service interface
 *
 * Defines the contract for discovering and analyzing plan files in cc-commands
 * structure including active plans, archived plans, metadata extraction,
 * and plan validation.
 */

import type { PlanDiscoveryResultDTO } from '../dto/PlanDiscoveryResultDTO.js'
import type { PlanFileDTO } from '../dto/PlanFileDTO.js'
import type { PlanListDTO } from '../dto/PlanListDTO.js'
import type { PlanMetadataDTO } from '../dto/PlanMetadataDTO.js'
import type { PlanValidationDTO } from '../dto/PlanValidationDTO.js'
import type { TPlanDiscoveryOptions, TPlanMatchType } from '../types/FilesystemTypes.js'

/**
 * Service interface for plan file discovery and analysis
 * 
 * Handles discovery of plan files in cc-commands CLAUDE/plan structure,
 * extraction of plan metadata, validation of plan format, and analysis
 * of task completion status.
 */
export interface IPlanDiscoveryService {
  /**
   * Analyze task completion across all plans
   * 
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to aggregate task statistics
   */
  analyzePlanProgress(directory?: string): Promise<{
    completedPlans: number
    completedTasks: number
    overallCompletionPercentage: number
    plansInProgress: number
    totalPlans: number
    totalTasks: number
  }>

  /**
   * Find a specific plan by name with fuzzy matching
   * 
   * @param name - Plan name to search for (with or without .md extension)
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to plan file DTO or null if not found
   */
  findPlanByName(name: string, directory?: string): Promise<null | PlanFileDTO>

  /**
   * Get plan directory paths (handles case-insensitive discovery)
   * 
   * @param directory - Root directory to search from (defaults to current directory)
   * @returns Promise resolving to object with found plan directories
   */
  findPlanDirectories(directory?: string): Promise<{
    archiveDirectory: null | string
    archiveDirectoryExists: boolean
    planDirectory: null | string
    planDirectoryExists: boolean
  }>

  /**
   * Discover all plan files in the project structure
   * 
   * @param directory - Root directory to search from (defaults to current directory)
   * @param options - Discovery options for filtering and processing
   * @returns Promise resolving to comprehensive plan discovery results
   */
  findPlanFiles(directory?: string, options?: TPlanDiscoveryOptions): Promise<PlanDiscoveryResultDTO>

  /**
   * Extract metadata from a plan file
   * 
   * @param path - Path to the plan file
   * @returns Promise resolving to plan metadata DTO
   * @throws FileOperationError if file can't be read or parsed
   */
  getPlanMetadata(path: string): Promise<PlanMetadataDTO>

  /**
   * Get recent plans sorted by modification time
   * 
   * @param directory - Directory to search in (defaults to current directory)
   * @param limit - Maximum number of plans to return (default: 10)
   * @returns Promise resolving to list of recent plans
   */
  getRecentPlans(directory?: string, limit?: number): Promise<PlanListDTO>

  /**
   * List all active plans (not in archive directory)
   * 
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to list of active plans
   */
  listActivePlans(directory?: string): Promise<PlanListDTO>

  /**
   * List all archived plans (in archive directory)
   * 
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to list of archived plans
   */
  listArchivedPlans(directory?: string): Promise<PlanListDTO>

  /**
   * Create plan file path for new plan (does not create the file)
   * 
   * @param planName - Name of the plan (will be sanitized)
   * @param directory - Directory to create in (defaults to current directory)
   * @returns Promise resolving to object with plan path information
   */
  preparePlanPath(planName: string, directory?: string): Promise<{
    alreadyExists: boolean
    planDirectory: string
    planName: string
    planPath: string
  }>

  /**
   * Search for plans matching a pattern
   * 
   * @param searchTerm - Term to search for in plan names
   * @param directory - Directory to search in (defaults to current directory)  
   * @returns Promise resolving to object with match type and results
   */
  searchPlans(
    searchTerm: string, 
    directory?: string
  ): Promise<{
    matches: PlanFileDTO[]
    matchType: TPlanMatchType
    searchTerm: string
  }>

  /**
   * Validate a plan file format and structure
   * 
   * @param path - Path to the plan file
   * @returns Promise resolving to validation results
   */
  validatePlanFile(path: string): Promise<PlanValidationDTO>
}