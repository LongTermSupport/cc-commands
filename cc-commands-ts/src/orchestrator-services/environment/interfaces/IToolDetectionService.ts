/**
 * @file Tool Detection Service Interface
 * 
 * Interface contract for tool detection and version validation operations.
 * Provides low-level tool availability checking and version extraction.
 */

import { ToolInventoryDTO } from '../dto/ToolInventoryDTO.js'
import { ToolValidationResultDTO } from '../dto/ToolValidationResultDTO.js'
import { ToolName, VersionValidationResult } from '../types/EnvironmentTypes.js'

/**
 * Interface for tool detection and validation operations
 * 
 * This interface defines the contract for low-level tool detection operations
 * including availability checking, version extraction, and validation against
 * minimum version requirements.
 */
export interface IToolDetectionService {
  /**
   * Check availability of multiple specific tools
   * 
   * Efficiently checks multiple tools and returns validation results.
   * Useful for validating specific tool sets without full inventory.
   * 
   * @param toolNames - Array of tool names to check
   * @returns Array of validation results for each tool
   * @throws {OrchestratorError} When batch checking process fails
   */
  checkTools(toolNames: ToolName[]): Promise<ToolValidationResultDTO[]>

  /**
   * Detect a single tool's availability and version
   * 
   * Attempts to locate the tool executable, extract version information,
   * and validate against minimum version requirements if applicable.
   * 
   * @param toolName - Name of the tool to detect
   * @returns Tool validation result DTO with availability and version info
   * @throws {OrchestratorError} When tool detection process fails unexpectedly
   */
  detectTool(toolName: ToolName): Promise<ToolValidationResultDTO>

  /**
   * Extract version string from tool output
   * 
   * Runs version command for tool and extracts version string
   * using configured patterns. Returns raw version string.
   * 
   * @param toolName - Name of the tool
   * @returns Version string or null if extraction fails
   * @throws {OrchestratorError} When version extraction process fails
   */
  extractToolVersion(toolName: ToolName): Promise<null | string>

  /**
   * Get comprehensive inventory of all supported tools
   * 
   * Detects availability and validates versions for all known tools
   * in both required and optional categories.
   * 
   * @returns Complete tool inventory with validation results
   * @throws {OrchestratorError} When inventory process fails
   */
  getToolInventory(): Promise<ToolInventoryDTO>

  /**
   * Check if a tool executable exists at specified path
   * 
   * Validates that a tool exists at a specific filesystem path
   * and is executable. Does not perform version validation.
   * 
   * @param toolPath - Full path to tool executable
   * @returns True if tool exists and is executable
   * @throws {OrchestratorError} When path checking fails
   */
  validateToolPath(toolPath: string): Promise<boolean>

  /**
   * Validate tool version against minimum requirements
   * 
   * Compares detected version against minimum required version
   * using semantic version comparison rules.
   * 
   * @param toolName - Name of the tool to validate
   * @param detectedVersion - Version string detected from tool
   * @returns Version validation result with comparison details
   * @throws {OrchestratorError} When version parsing or comparison fails
   */
  validateToolVersion(toolName: ToolName, detectedVersion: string): Promise<VersionValidationResult>
}