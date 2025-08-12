/**
 * @file Environment Validation Service Implementation
 * 
 * High-level service that orchestrates tool detection and prerequisite checking
 * to provide comprehensive environment validation and assessment.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ALL_TOOLS, REQUIRED_TOOLS } from '../constants/EnvironmentConstants.js'
import { EnvironmentStatusDTO } from '../dto/EnvironmentStatusDTO.js'
import { PrerequisiteCheckResultDTO } from '../dto/PrerequisiteCheckResultDTO.js'
import { ToolInventoryDTO } from '../dto/ToolInventoryDTO.js'
import { IEnvironmentValidationService } from '../interfaces/IEnvironmentValidationService.js'
import { IPrerequisiteCheckService } from '../interfaces/IPrerequisiteCheckService.js'
import { IToolDetectionService } from '../interfaces/IToolDetectionService.js'
import { EnvironmentValidationSummary, ToolName } from '../types/EnvironmentTypes.js'

/**
 * Environment Validation Service for comprehensive environment assessment
 * 
 * Orchestrates tool detection and prerequisite checking services to provide
 * complete development environment validation and readiness assessment.
 */
export class EnvironmentValidationService implements IEnvironmentValidationService {
  constructor(
    private readonly toolDetectionService: IToolDetectionService,
    private readonly prerequisiteCheckService: IPrerequisiteCheckService
  ) {}

  /**
   * Get complete tool inventory for environment
   * 
   * @returns Complete tool inventory with validation results
   */
  async getToolInventory(): Promise<ToolInventoryDTO> {
    try {
      return await this.toolDetectionService.getToolInventory()

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Check system PATH environment variable',
          'Verify development tools are properly installed',
          'Ensure process has permission to execute tools',
          'Try running tool detection individually to isolate issues'
        ],
        { operation: 'getToolInventory' }
      )
    }
  }

  /**
   * Get environment validation summary
   * 
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns Environment validation summary with key metrics
   */
  async getValidationSummary(projectRoot?: string): Promise<EnvironmentValidationSummary> {
    try {
      const environmentStatus = await this.validateEnvironment(projectRoot)
      
      return {
        availableToolsCount: environmentStatus.toolInventory.getAvailableTools().length,
        isValid: environmentStatus.isValid,
        missingToolsCount: environmentStatus.toolInventory.getMissingTools().length,
        projectStructureValid: environmentStatus.prerequisiteCheck.isValid,
        totalToolsCount: environmentStatus.toolInventory.toolResults.length,
        validatedAt: environmentStatus.validationTimestamp
      }

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify environment validation can complete successfully',
          'Check that both tool detection and prerequisite validation work',
          'Try getting individual components (tools, prerequisites) separately',
          'Ensure sufficient permissions for validation operations'
        ],
        { operation: 'getValidationSummary', projectRoot: projectRoot || null }
      )
    }
  }

  /**
   * Check if environment meets minimum requirements
   * 
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns True if environment meets all minimum requirements
   */
  async meetsMinimumRequirements(projectRoot?: string): Promise<boolean> {
    try {
      const environmentStatus = await this.validateEnvironment(projectRoot)
      return environmentStatus.isValid

    } catch {
      // If validation throws an error, requirements are not met
      return false
    }
  }

  /**
   * Quick environment health check
   * 
   * @returns True if environment passes basic health checks
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      // Check critical tools only for speed
      const criticalTools: ToolName[] = [
        REQUIRED_TOOLS.GIT,
        REQUIRED_TOOLS.NODE,
        REQUIRED_TOOLS.NPM
      ]
      
      const toolResults = await this.toolDetectionService.checkTools(criticalTools)
      
      // Health check passes if all critical tools are available
      const allCriticalToolsAvailable = toolResults.every(result => result.isAvailable)
      
      return allCriticalToolsAvailable

    } catch {
      // If health check throws an error, health check fails
      return false
    }
  }

  /**
   * Validate complete development environment
   * 
   * @param projectRoot - Optional project root directory for prerequisite checking
   * @returns Complete environment status with all validation results
   */
  async validateEnvironment(projectRoot?: string): Promise<EnvironmentStatusDTO> {
    try {
      const validationErrors: string[] = []
      
      // Get tool inventory
      const toolInventory = await this.getToolInventory()
      
      // Get prerequisite validation if project root is provided
      const prerequisiteCheck: PrerequisiteCheckResultDTO = projectRoot 
        ? await this.validatePrerequisites(projectRoot)
        : PrerequisiteCheckResultDTO.fromValidationResults(
            process.cwd(),
            [],
            [],
            ['No project root specified - prerequisite validation skipped']
          )
      
      return EnvironmentStatusDTO.fromComponentResults(
        toolInventory,
        prerequisiteCheck,
        validationErrors
      )

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify system has required development tools installed',
          'Check that project directory structure is valid',
          'Ensure file system permissions allow validation',
          'Try validating tools and prerequisites separately',
          'Run individual validation steps to isolate issues'
        ],
        { projectRoot: projectRoot || null }
      )
    }
  }

  /**
   * Validate environment for specific tool requirements
   * 
   * @param requiredTools - Array of tool names that must be available
   * @param projectRoot - Optional project root for prerequisite checking
   * @returns Environment status focused on specified tools
   */
  async validateForTools(requiredTools: string[], projectRoot?: string): Promise<EnvironmentStatusDTO> {
    try {
      // Validate that tool names are supported
      const allSupportedTools = Object.values(ALL_TOOLS)
      const validToolNames = requiredTools.filter(tool => 
        allSupportedTools.includes(tool as ToolName)
      )
      
      if (validToolNames.length !== requiredTools.length) {
        const invalidTools = requiredTools.filter(tool => !validToolNames.includes(tool))
        throw new Error(`Unsupported tools specified: ${invalidTools.join(', ')}`)
      }
      
      // Check specified tools
      const toolResults = await this.toolDetectionService.checkTools(validToolNames as ToolName[])
      const toolInventory = ToolInventoryDTO.fromToolResults(
        toolResults,
        validToolNames as ToolName[],
        []  // No optional tools for targeted validation
      )
      
      // Get prerequisite validation if project root is provided
      const prerequisiteCheck: PrerequisiteCheckResultDTO = projectRoot 
        ? await this.validatePrerequisites(projectRoot)
        : PrerequisiteCheckResultDTO.fromValidationResults(
            process.cwd(),
            [],
            [],
            ['No project root specified - prerequisite validation skipped']
          )
      
      return EnvironmentStatusDTO.fromComponentResults(
        toolInventory,
        prerequisiteCheck,
        []
      )

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify all specified tool names are supported',
          'Check that required tools are installed and available',
          'Ensure tool names match expected values',
          'Try validating with standard tool set first'
        ],
        { operation: 'validateForTools', projectRoot: projectRoot || null, requiredTools }
      )
    }
  }

  /**
   * Validate project prerequisites
   * 
   * @param projectRoot - Root directory of the project to validate
   * @returns Prerequisite validation results
   */
  async validatePrerequisites(projectRoot: string): Promise<PrerequisiteCheckResultDTO> {
    try {
      return await this.prerequisiteCheckService.validateTypeScriptProject(projectRoot)

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          `Verify project exists at: ${projectRoot}`,
          'Ensure required project files are present (package.json, tsconfig.json)',
          'Check that required directories exist (src, node_modules)',
          'Run npm install to install dependencies',
          'Verify file system permissions for project directory'
        ],
        { operation: 'validatePrerequisites', projectRoot }
      )
    }
  }
}