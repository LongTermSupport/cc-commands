/**
 * @file Environment Status Data Transfer Object
 * 
 * Represents the complete status of the development environment including
 * tool availability, version validation, and prerequisite checks.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { ENVIRONMENT_DATA_KEYS } from '../constants/EnvironmentConstants.js'
import { PrerequisiteCheckResultDTO } from './PrerequisiteCheckResultDTO.js'
import { ToolInventoryDTO } from './ToolInventoryDTO.js'

/**
 * Data Transfer Object for complete environment status
 * 
 * Aggregates tool inventory and prerequisite checks to provide a comprehensive
 * assessment of the development environment's readiness.
 */
export class EnvironmentStatusDTO implements ILLMDataDTO {
  private static readonly Keys = ENVIRONMENT_DATA_KEYS

  constructor(
    public readonly isValid: boolean,
    public readonly toolInventory: ToolInventoryDTO,
    public readonly prerequisiteCheck: PrerequisiteCheckResultDTO,
    public readonly validationTimestamp: Date,
    public readonly validationErrors: string[]
  ) {}

  /**
   * Create EnvironmentStatusDTO from component results
   * 
   * @param toolInventory - Complete tool inventory results
   * @param prerequisiteCheck - Prerequisite validation results
   * @param validationErrors - Any overall validation errors
   * @returns New EnvironmentStatusDTO instance
   */
  static fromComponentResults(
    toolInventory: ToolInventoryDTO,
    prerequisiteCheck: PrerequisiteCheckResultDTO,
    validationErrors: string[] = []
  ): EnvironmentStatusDTO {
    const isValid = EnvironmentStatusDTO.calculateOverallValidity(
      toolInventory,
      prerequisiteCheck,
      validationErrors
    )

    return new EnvironmentStatusDTO(
      isValid,
      toolInventory,
      prerequisiteCheck,
      new Date(),
      validationErrors
    )
  }

  /**
   * Calculate overall environment validity
   * 
   * @param toolInventory - Tool inventory results
   * @param prerequisiteCheck - Prerequisite check results
   * @param validationErrors - Overall validation errors
   * @returns True if environment is completely valid
   */
  private static calculateOverallValidity(
    toolInventory: ToolInventoryDTO,
    prerequisiteCheck: PrerequisiteCheckResultDTO,
    validationErrors: string[]
  ): boolean {
    if (validationErrors.length > 0) return false
    
    return toolInventory.hasAllRequiredTools() && prerequisiteCheck.isValid
  }

  /**
   * Get critical issues that prevent environment usage
   * 
   * @returns Array of critical issue descriptions
   */
  getCriticalIssues(): string[] {
    const issues: string[] = []
    
    // Missing required tools are critical
    const missingRequired = this.toolInventory.getMissingRequiredTools()
    for (const tool of missingRequired) {
      issues.push(`Required tool missing: ${tool.toolName}`)
    }
    
    // Tools with version issues are critical
    const versionIssues = this.toolInventory.getToolsWithVersionIssues()
    for (const tool of versionIssues) {
      issues.push(`Tool version outdated: ${tool.toolName} (${tool.version})`)
    }
    
    // Missing critical files are critical
    const missingFiles = this.prerequisiteCheck.getMissingFiles()
    for (const file of missingFiles) {
      issues.push(`Required file missing: ${file.filePath}`)
    }
    
    // Add any validation errors
    issues.push(...this.validationErrors)
    
    return issues
  }

  /**
   * Get comprehensive jq query hints for environment data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Top-level environment queries
      {
        description: 'Overall environment validity',
        query: '.raw.environment_status.is_valid',
        scope: 'single_item'
      },
      {
        description: 'Environment validation timestamp',
        query: '.raw.environment_status.validation_timestamp',
        scope: 'single_item'
      },
      {
        description: 'Environment validation errors',
        query: '.raw.environment_status.validation_errors',
        scope: 'all_items'
      },
      
      // Tool inventory delegation
      {
        description: 'Available tools count',
        query: '.calculated.environment_analysis.tool_summary.available_count',
        scope: 'single_item'
      },
      {
        description: 'Missing required tools',
        query: '.calculated.environment_analysis.tool_summary.missing_required_tools',
        scope: 'all_items'
      },
      
      // Prerequisites delegation
      {
        description: 'Project structure validity',
        query: '.calculated.environment_analysis.prerequisite_summary.is_valid',
        scope: 'single_item'
      },
      {
        description: 'Missing files',
        query: '.calculated.environment_analysis.prerequisite_summary.missing_files',
        scope: 'all_items'
      },
      
      // Overall status queries
      {
        description: 'Environment readiness score (calculated)',
        query: '.calculated.environment_summary.readiness_score',
        scope: 'single_item'
      },
      {
        description: 'Critical issues count (calculated)',
        query: '.calculated.environment_summary.critical_issues_count',
        scope: 'single_item'
      },
      {
        description: 'Environment status summary',
        query: '.calculated.environment_summary.status_summary',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Calculate environment readiness score (0-100)
   * 
   * @returns Readiness score based on tool availability and prerequisites
   */
  getReadinessScore(): number {
    let score = 0
    
    // Tool availability (60% of score)
    const toolScore = (this.toolInventory.getAvailableTools().length / 
                      this.toolInventory.toolResults.length) * 60
    score += toolScore
    
    // Required tools (additional 20% penalty for missing required)
    if (this.toolInventory.hasAllRequiredTools()) {
      score += 20
    }
    
    // Prerequisites (20% of score)
    if (this.prerequisiteCheck.isValid) {
      score += 20
    }
    
    return Math.round(score)
  }

  /**
   * Get a summary of the environment status
   * 
   * @returns Human-readable summary for logging/debugging
   */
  getSummary(): string {
    if (this.isValid) {
      return 'Environment: Valid (all tools and prerequisites satisfied)'
    }
    
    const issues = []
    if (!this.toolInventory.hasAllRequiredTools()) {
      const missing = this.toolInventory.getMissingRequiredTools().length
      issues.push(`${missing} required tools missing`)
    }
    
    if (!this.prerequisiteCheck.isValid) {
      const missingFiles = this.prerequisiteCheck.getMissingFiles().length
      const missingDirs = this.prerequisiteCheck.getMissingDirectories().length
      if (missingFiles > 0) issues.push(`${missingFiles} files missing`)
      if (missingDirs > 0) issues.push(`${missingDirs} directories missing`)
    }
    
    if (this.validationErrors.length > 0) {
      issues.push(`${this.validationErrors.length} validation errors`)
    }
    
    return `Environment: Invalid (${issues.join(', ')})`
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete environment data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'environment_analysis': this.buildEnvironmentAnalysis(),
        'environment_summary': this.buildEnvironmentSummary()
      },
      raw: {
        'environment_status': this.buildRawEnvironmentData(),
        'prerequisite_check': this.prerequisiteCheck.toJsonData().raw['prerequisite_check'] as JsonObject,
        'tool_inventory': this.toolInventory.toJsonData().raw['tool_inventory'] as JsonObject
      }
    }
  }

  /**
   * Convert environment status data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    // Combine our data with tool inventory and prerequisite data
    const toolData = this.toolInventory.toLLMData()
    const prerequisiteData = this.prerequisiteCheck.toLLMData()
    
    return {
      [EnvironmentStatusDTO.Keys.ENVIRONMENT_VALID]: String(this.isValid),
      ...toolData,
      ...prerequisiteData,
      'CRITICAL_ISSUES': this.getCriticalIssues().join('; '),
      'CRITICAL_ISSUES_COUNT': String(this.getCriticalIssues().length),
      'READINESS_SCORE': String(this.getReadinessScore()),
      // Additional environment-level data
      'VALIDATION_TIMESTAMP': this.validationTimestamp.toISOString()
    }
  }

  /**
   * Build environment analysis with component summaries
   * 
   * @returns Analysis combining tool and prerequisite information
   */
  private buildEnvironmentAnalysis(): JsonObject {
    return {
      'prerequisite_summary': {
        is_valid: this.prerequisiteCheck.isValid,
        missing_directories: this.prerequisiteCheck.getMissingDirectories().map(d => d.directoryPath),
        missing_files: this.prerequisiteCheck.getMissingFiles().map(f => f.filePath)
      },
      'tool_summary': {
        all_required_available: this.toolInventory.hasAllRequiredTools(),
        available_count: this.toolInventory.getAvailableTools().length,
        missing_required_tools: this.toolInventory.getMissingRequiredTools().map(t => t.toolName),
        total_count: this.toolInventory.toolResults.length
      }
    }
  }

  /**
   * Build environment summary with overall assessment
   * 
   * @returns Summary with scores, issues, and status
   */
  private buildEnvironmentSummary(): JsonObject {
    return {
      'critical_issues': this.getCriticalIssues(),
      'critical_issues_count': this.getCriticalIssues().length,
      'readiness_score': this.getReadinessScore(),
      'status_summary': this.getSummary()
    }
  }

  /**
   * Build raw environment data structure
   * 
   * @returns Raw environment data exactly as collected
   */
  private buildRawEnvironmentData(): JsonObject {
    return {
      'is_valid': this.isValid,
      'validation_errors': this.validationErrors,
      'validation_timestamp': this.validationTimestamp.toISOString()
    }
  }
}