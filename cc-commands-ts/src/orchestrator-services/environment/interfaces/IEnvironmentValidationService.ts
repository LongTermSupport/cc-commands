/**
 * @file Environment Validation Service Interface
 * 
 * Interface contract for comprehensive environment validation operations.
 * Orchestrates tool detection and prerequisite checking for complete environment assessment.
 */

import { EnvironmentStatusDTO } from '../dto/EnvironmentStatusDTO.js'
import { PrerequisiteCheckResultDTO } from '../dto/PrerequisiteCheckResultDTO.js'
import { ToolInventoryDTO } from '../dto/ToolInventoryDTO.js'
import { EnvironmentValidationSummary } from '../types/EnvironmentTypes.js'

/**
 * Interface for comprehensive environment validation operations
 * 
 * This interface defines the contract for high-level environment validation
 * that orchestrates tool detection, prerequisite checking, and provides
 * complete environment readiness assessment.
 */
export interface IEnvironmentValidationService {
  /**
   * Get complete tool inventory for environment
   * 
   * Detects and validates all supported tools including version checking
   * and requirement validation. Provides comprehensive tool availability data.
   * 
   * @returns Complete tool inventory with validation results
   * @throws {OrchestratorError} When tool inventory process fails
   */
  getToolInventory(): Promise<ToolInventoryDTO>

  /**
   * Get environment validation summary
   * 
   * Provides high-level summary of environment status including
   * tool counts, validity status, and validation timestamp.
   * 
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns Environment validation summary with key metrics
   * @throws {OrchestratorError} When summary generation fails
   */
  getValidationSummary(projectRoot?: string): Promise<EnvironmentValidationSummary>

  /**
   * Check if environment meets minimum requirements
   * 
   * Validates that all required tools are available with acceptable versions
   * and that project prerequisites are satisfied.
   * 
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns True if environment meets all minimum requirements
   * @throws {OrchestratorError} When requirement checking fails
   */
  meetsMinimumRequirements(projectRoot?: string): Promise<boolean>

  /**
   * Quick environment health check
   * 
   * Performs rapid validation of critical tools and prerequisites
   * without comprehensive version checking. Optimized for speed.
   * 
   * @returns True if environment passes basic health checks
   * @throws {OrchestratorError} When health check process fails
   */
  performHealthCheck(): Promise<boolean>

  /**
   * Validate complete development environment
   * 
   * Performs comprehensive validation including tool detection,
   * version validation, prerequisite checking, and overall assessment.
   * 
   * @param projectRoot - Optional project root directory for prerequisite checking
   * @returns Complete environment status with all validation results
   * @throws {OrchestratorError} When environment validation process fails
   */
  validateEnvironment(projectRoot?: string): Promise<EnvironmentStatusDTO>

  /**
   * Validate environment for specific tool requirements
   * 
   * Checks that specific tools are available and meet version requirements.
   * Useful for validating environment before running specific operations.
   * 
   * @param requiredTools - Array of tool names that must be available
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns Environment status focused on specified tools
   * @throws {OrchestratorError} When targeted validation fails
   */
  validateForTools(requiredTools: string[], projectRoot?: string): Promise<EnvironmentStatusDTO>

  /**
   * Validate project prerequisites
   * 
   * Checks project structure, required files, and directories for
   * development environment readiness.
   * 
   * @param projectRoot - Root directory of the project to validate
   * @returns Prerequisite validation results
   * @throws {OrchestratorError} When prerequisite validation fails
   */
  validatePrerequisites(projectRoot: string): Promise<PrerequisiteCheckResultDTO>
}