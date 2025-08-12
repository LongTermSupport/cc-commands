/**
 * @file Tool Validation Result Data Transfer Object
 * 
 * Represents the result of validating a single tool's availability and version.
 * Provides structured data for tool detection operations.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TOOL_DATA_KEYS } from '../constants/EnvironmentConstants.js'
import { ToolName, VersionValidationResult } from '../types/EnvironmentTypes.js'

/**
 * Data Transfer Object for tool validation results
 * 
 * Encapsulates all information about a tool's availability, version,
 * and validation status for environment assessment.
 */
export class ToolValidationResultDTO implements ILLMDataDTO {
  private static readonly Keys = TOOL_DATA_KEYS

  constructor(
    public readonly toolName: ToolName,
    public readonly isAvailable: boolean,
    public readonly version?: string,
    public readonly path?: string,
    public readonly versionMeetsRequirements?: boolean,
    public readonly versionValidation?: VersionValidationResult,
    public readonly error?: string
  ) {}

  /**
   * Create ToolValidationResultDTO for an available tool
   * 
   * @param toolName - Name of the tool
   * @param version - Detected version
   * @param path - Path to tool executable
   * @param versionValidation - Version validation result
   * @returns New ToolValidationResultDTO instance
   */
  static createAvailable(
    toolName: ToolName,
    version: string,
    path: string,
    versionValidation?: VersionValidationResult
  ): ToolValidationResultDTO {
    return new ToolValidationResultDTO(
      toolName,
      true,
      version,
      path,
      versionValidation?.isValid,
      versionValidation
    )
  }

  /**
   * Create ToolValidationResultDTO for a missing tool
   * 
   * @param toolName - Name of the tool
   * @param error - Error message describing why tool is not available
   * @returns New ToolValidationResultDTO instance
   */
  static createMissing(toolName: ToolName, error?: string): ToolValidationResultDTO {
    return new ToolValidationResultDTO(
      toolName,
      false,
      undefined,
      undefined,
      false,
      undefined,
      error
    )
  }

  /**
   * Get comprehensive jq query hints for tool data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw data queries
      {
        description: 'Tool name',
        query: '.raw.tool_detection.name',
        scope: 'single_item'
      },
      {
        description: 'Tool availability status',
        query: '.raw.tool_detection.is_available',
        scope: 'single_item'
      },
      {
        description: 'Detected tool version',
        query: '.raw.tool_detection.version',
        scope: 'single_item'
      },
      {
        description: 'Tool executable path',
        query: '.raw.tool_detection.path',
        scope: 'single_item'
      },
      {
        description: 'Version meets requirements status',
        query: '.raw.tool_detection.version_meets_requirements',
        scope: 'single_item'
      },
      
      // Calculated data queries
      {
        description: 'Tool status summary (calculated)',
        query: '.calculated.validation_summary.status',
        scope: 'single_item'
      },
      {
        description: 'Version comparison result (calculated)',
        query: '.calculated.version_analysis.comparison_result',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get a summary of the tool validation status
   * 
   * @returns Human-readable summary for logging/debugging
   */
  getSummary(): string {
    if (!this.isAvailable) {
      return `${this.toolName}: Not available${this.error ? ` (${this.error})` : ''}`
    }

    const versionInfo = this.version ? ` v${this.version}` : ''
    const pathInfo = this.path ? ` at ${this.path}` : ''
    const validationInfo = this.versionMeetsRequirements === false ? ' (version too old)' : ''
    
    return `${this.toolName}${versionInfo}${pathInfo}${validationInfo}`
  }

  /**
   * Check if this tool validation has version issues
   * 
   * @returns True if tool is available but version doesn't meet requirements
   */
  hasVersionIssue(): boolean {
    return this.isAvailable && this.versionMeetsRequirements === false
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete tool data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'validation_summary': this.buildValidationSummary(),
        'version_analysis': this.buildVersionAnalysis()
      },
      raw: {
        'tool_detection': this.buildRawToolData()
      }
    }
  }

  /**
   * Convert tool validation data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ToolValidationResultDTO.Keys.TOOL_AVAILABLE]: String(this.isAvailable),
      [ToolValidationResultDTO.Keys.TOOL_NAME]: this.toolName,
      [ToolValidationResultDTO.Keys.TOOL_PATH]: this.path || '',
      [ToolValidationResultDTO.Keys.TOOL_VERSION]: this.version || '',
      [ToolValidationResultDTO.Keys.VERSION_MEETS_REQUIREMENTS]: String(this.versionMeetsRequirements ?? false)
    }
  }

  /**
   * Build raw tool detection data structure
   * 
   * @returns Raw tool data exactly as detected
   */
  private buildRawToolData(): JsonObject {
    return {
      'error': this.error || null,
      'is_available': this.isAvailable,
      'name': this.toolName,
      'path': this.path || null,
      'version': this.version || null,
      'version_meets_requirements': this.versionMeetsRequirements ?? null
    }
  }

  /**
   * Build validation summary with calculated status
   * 
   * @returns Validation summary with status assessment
   */
  private buildValidationSummary(): JsonObject {
    let status = 'missing'
    if (this.isAvailable) {
      status = this.versionMeetsRequirements === false ? 'outdated' : 'valid';
    }

    return {
      'has_version_issue': this.hasVersionIssue(),
      status,
      'summary': this.getSummary()
    }
  }

  /**
   * Build version analysis data
   * 
   * @returns Version comparison and analysis details
   */
  private buildVersionAnalysis(): JsonObject {
    if (!this.versionValidation) {
      return {
        'comparison_result': null,
        'detected_version': this.version || null,
        'has_validation': false,
        'required_version': null
      }
    }

    return {
      'comparison_result': this.versionValidation.comparison,
      'detected_version': this.versionValidation.detectedVersion,
      'has_validation': true,
      'required_version': this.versionValidation.requiredVersion
    }
  }
}