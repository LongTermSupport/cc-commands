/**
 * @file Tool Detection Service Implementation
 * 
 * Implementation of tool detection and version validation using child_process.
 * Handles low-level tool availability checking and version extraction.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import which from 'which'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ALL_TOOLS, MIN_VERSIONS, OPTIONAL_TOOLS, REQUIRED_TOOLS } from '../constants/EnvironmentConstants.js'
import { ToolInventoryDTO } from '../dto/ToolInventoryDTO.js'
import { ToolValidationResultDTO } from '../dto/ToolValidationResultDTO.js'
import { IToolDetectionService } from '../interfaces/IToolDetectionService.js'
import { ProcessResult, ToolName, VersionExtractionConfig, VersionValidationResult } from '../types/EnvironmentTypes.js'

const execFileAsync = promisify(execFile)

/**
 * Tool Detection Service for environment validation
 * 
 * Provides low-level tool detection capabilities using child_process
 * and filesystem operations to validate development environment tools.
 */
export class ToolDetectionService implements IToolDetectionService {
  /**
   * Version extraction configurations for supported tools
   */
  private readonly versionConfigs: Record<ToolName, VersionExtractionConfig> = {
    [ALL_TOOLS.CURL]: {
      toolName: ALL_TOOLS.CURL,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /curl (\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.DOCKER]: {
      toolName: ALL_TOOLS.DOCKER,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /Docker version (\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.GIT]: {
      toolName: ALL_TOOLS.GIT,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /git version (\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.GITHUB_CLI]: {
      toolName: ALL_TOOLS.GITHUB_CLI,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /gh version (\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.JQ]: {
      toolName: ALL_TOOLS.JQ,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /jq-(\d+\.\d+(?:\.\d+)?)/
    },
    [ALL_TOOLS.NODE]: {
      toolName: ALL_TOOLS.NODE,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /v?(\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.NPM]: {
      toolName: ALL_TOOLS.NPM,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /(\d+\.\d+\.\d+)/
    },
    [ALL_TOOLS.WGET]: {
      toolName: ALL_TOOLS.WGET,
      versionArgs: ['--version'],
      versionGroup: 1,
      versionPattern: /GNU Wget (\d+\.\d+(?:\.\d+)?)/
    }
  }

  /**
   * Check availability of multiple specific tools
   * 
   * @param toolNames - Array of tool names to check
   * @returns Array of validation results for each tool
   */
  async checkTools(toolNames: ToolName[]): Promise<ToolValidationResultDTO[]> {
    try {
      const results: ToolValidationResultDTO[] = []
      
      // Process tools in parallel for efficiency
      const detectionPromises = toolNames.map(toolName => 
        this.detectTool(toolName).catch(error => 
          // Convert errors to missing tool results to avoid failing entire batch
           ToolValidationResultDTO.createMissing(
            toolName, 
            error instanceof Error ? error.message : String(error)
          )
        )
      )
      
      const detectionResults = await Promise.all(detectionPromises)
      results.push(...detectionResults)
      
      return results

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Check that all specified tools are valid tool names',
          'Verify system has sufficient resources for parallel detection',
          'Try checking tools individually to isolate issues',
          'Ensure process has permission to execute all tools'
        ],
        { toolCount: toolNames.length, toolNames }
      )
    }
  }

  /**
   * Detect a single tool's availability and version
   * 
   * @param toolName - Name of the tool to detect
   * @returns Tool validation result with availability and version info
   */
  async detectTool(toolName: ToolName): Promise<ToolValidationResultDTO> {
    try {
      // First check if tool exists in PATH
      const toolPath = await this.findToolPath(toolName)
      if (!toolPath) {
        return ToolValidationResultDTO.createMissing(
          toolName, 
          `Tool '${toolName}' not found in PATH`
        )
      }

      // Extract version information
      const version = await this.extractToolVersion(toolName)
      if (!version) {
        // Tool exists but version couldn't be determined
        return ToolValidationResultDTO.createAvailable(toolName, 'unknown', toolPath)
      }

      // Validate version against requirements if applicable
      let versionValidation: undefined | VersionValidationResult
      if (toolName in MIN_VERSIONS) {
        versionValidation = await this.validateToolVersion(toolName, version)
      }

      return ToolValidationResultDTO.createAvailable(
        toolName, 
        version, 
        toolPath, 
        versionValidation
      )

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          `Ensure ${toolName} is installed and available in PATH`,
          `Verify ${toolName} executable has proper permissions`,
          'Check system PATH environment variable',
          'Try reinstalling the tool if version detection fails'
        ],
        { toolName }
      )
    }
  }

  /**
   * Extract version string from tool output
   * 
   * @param toolName - Name of the tool
   * @returns Version string or null if extraction fails
   */
  async extractToolVersion(toolName: ToolName): Promise<null | string> {
    try {
      const config = this.versionConfigs[toolName]
      if (!config) {
        return null
      }

      const result = await this.executeCommand(toolName, config.versionArgs)
      if (!result.success) {
        return null
      }

      // Try to extract version from stdout first, then stderr
      const output = result.stdout || result.stderr
      const match = output.match(config.versionPattern)
      
      return match?.[config.versionGroup] || null

    } catch {
      // Version extraction failure is not critical - return null
      return null
    }
  }

  /**
   * Get comprehensive inventory of all supported tools
   * 
   * @returns Complete tool inventory with validation results
   */
  async getToolInventory(): Promise<ToolInventoryDTO> {
    try {
      const allToolNames = Object.values(ALL_TOOLS) as ToolName[]
      const toolResults = await this.checkTools(allToolNames)
      
      return ToolInventoryDTO.fromToolResults(
        toolResults,
        Object.values(REQUIRED_TOOLS),
        Object.values(OPTIONAL_TOOLS)
      )

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Check system PATH environment variable',
          'Verify tool installations are complete',
          'Ensure process has permission to execute tools',
          'Try running individual tool detection to isolate issues'
        ],
        { 
          optionalTools: Object.values(OPTIONAL_TOOLS),
          requiredTools: Object.values(REQUIRED_TOOLS)
        }
      )
    }
  }

  /**
   * Check if a tool executable exists at specified path
   * 
   * @param toolPath - Full path to tool executable
   * @returns True if tool exists and is executable
   */
  async validateToolPath(toolPath: string): Promise<boolean> {
    try {
      // Use which library to validate executable path
      const resolvedPath = await which(toolPath)
      return Boolean(resolvedPath)

    } catch {
      // which throws if path is not found or not executable
      return false
    }
  }

  /**
   * Validate tool version against minimum requirements
   * 
   * @param toolName - Name of the tool to validate
   * @param detectedVersion - Version string detected from tool
   * @returns Version validation result with comparison details
   */
  async validateToolVersion(toolName: ToolName, detectedVersion: string): Promise<VersionValidationResult> {
    try {
      const requiredVersion = MIN_VERSIONS[toolName as keyof typeof MIN_VERSIONS]
      if (!requiredVersion) {
        throw new Error(`No minimum version requirement defined for tool: ${toolName}`)
      }

      const comparison = this.compareVersions(detectedVersion, requiredVersion)
      
      return {
        comparison,
        detectedVersion,
        isValid: comparison >= 0,
        requiredVersion,
        toolName
      }

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          `Verify the detected version format: ${detectedVersion}`,
          `Check that ${toolName} reports version in expected format`,
          'Update tool to latest version if version is too old',
          'Check minimum version requirements in documentation'
        ],
        { detectedVersion, requiredVersion: MIN_VERSIONS[toolName as keyof typeof MIN_VERSIONS], toolName }
      )
    }
  }

  /**
   * Compare two semantic versions
   * 
   * @param version1 - First version to compare
   * @param version2 - Second version to compare
   * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  private compareVersions(version1: string, version2: string): -1 | 0 | 1 {
    return this.compareVersionStrings(version1, version2)
  }

  /**
   * Helper function to normalize and compare version strings
   */
  private compareVersionStrings(version1: string, version2: string): -1 | 0 | 1 {
    const v1Parts = this.normalizeVersion(version1)
    const v2Parts = this.normalizeVersion(version2)
    
    // Compare each part
    const maxLength = Math.max(v1Parts.length, v2Parts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }
    
    return 0
  }

  /**
   * Execute a command and return structured result
   * 
   * @param command - Command to execute
   * @param args - Command arguments
   * @returns Process execution result
   */
  private async executeCommand(command: string, args: string[]): Promise<ProcessResult> {
    try {
      const { stderr, stdout } = await execFileAsync(command, args, {
        encoding: 'utf8',
        timeout: 5000 // 5 second timeout
      })

      return {
        exitCode: 0,
        stderr: stderr.trim(),
        stdout: stdout.trim(),
        success: true
      }

    } catch (error: unknown) {
      const errorObj = error as {
        code?: number
        stderr?: string
        stdout?: string
      }
      
      return {
        error: error instanceof Error ? error : new Error(String(error)),
        exitCode: errorObj.code || 1,
        stderr: errorObj.stderr?.trim() || '',
        stdout: errorObj.stdout?.trim() || '',
        success: false
      }
    }
  }

  /**
   * Find tool path using which
   * 
   * @param toolName - Name of tool to find
   * @returns Tool path or null if not found
   */
  private async findToolPath(toolName: ToolName): Promise<null | string> {
    try {
      return await which(toolName)
    } catch {
      return null
    }
  }

  /**
   * Normalize version string to number array for comparison
   * 
   * @param version - Version string to normalize
   * @returns Array of version numbers
   */
  private normalizeVersion(version: string): number[] {
    return version.replace(/^v/, '').split('.').map(Number)
  }
}