/**
 * @file Plan Validation Data Transfer Object
 * 
 * Represents the result of plan file validation including structural
 * validation, metadata checks, task format verification, and error reporting.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TPlanValidation } from '../types/FilesystemTypes.js'

/**
 * Data Transfer Object for plan file validation results
 * 
 * This DTO encapsulates comprehensive validation results for plan files,
 * including structural checks, content validation, and error reporting.
 */
export class PlanValidationDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PLAN_HAS_METADATA: 'PLAN_HAS_METADATA',
    PLAN_HAS_TASKS: 'PLAN_HAS_TASKS',
    PLAN_IS_VALID: 'PLAN_IS_VALID',
    PLAN_VALIDATION_ERRORS: 'PLAN_VALIDATION_ERRORS',
    PLAN_VALIDATION_WARNINGS: 'PLAN_VALIDATION_WARNINGS'
  } as const

  constructor(
    public readonly isValid: boolean,
    public readonly hasMetadata: boolean,
    public readonly hasTasks: boolean,
    public readonly errors: string[],
    public readonly warnings: string[],
    public readonly validatedAt: Date = new Date()
  ) {}

  /**
   * Create PlanValidationDTO from TPlanValidation type
   * 
   * @param validation - Plan validation structure
   * @returns New PlanValidationDTO instance
   */
  static fromPlanValidation(validation: TPlanValidation): PlanValidationDTO {
    return new PlanValidationDTO(
      validation.isValid,
      validation.hasMetadata,
      validation.hasTasks,
      validation.errors,
      validation.warnings
    )
  }

  /**
   * Create PlanValidationDTO from validation checks
   * 
   * @param checks - Individual validation check results
   * @returns New PlanValidationDTO instance
   */
  static fromValidationChecks(checks: {
    errors: string[]
    metadataPresent: boolean
    structureValid: boolean
    tasksFound: boolean
    warnings: string[]
  }): PlanValidationDTO {
    const isValid = checks.structureValid && checks.errors.length === 0
    
    return new PlanValidationDTO(
      isValid,
      checks.metadataPresent,
      checks.tasksFound,
      checks.errors,
      checks.warnings
    )
  }

  /**
   * Check if validation has any issues
   * 
   * @returns True if there are errors or warnings
   */
  get hasIssues(): boolean {
    return this.totalIssues > 0
  }

  /**
   * Get total number of issues (errors + warnings)
   * 
   * @returns Total count of validation issues
   */
  get totalIssues(): number {
    return this.errors.length + this.warnings.length
  }

  /**
   * Get comprehensive jq query hints for validation data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw validation results
      { 
        description: 'Plan validation status (valid/invalid)', 
        query: '.raw.plan_validation.is_valid',
        scope: 'single_item'
      },
      { 
        description: 'Plan has metadata section', 
        query: '.raw.plan_validation.has_metadata',
        scope: 'single_item'
      },
      { 
        description: 'Plan has defined tasks', 
        query: '.raw.plan_validation.has_tasks',
        scope: 'single_item'
      },
      { 
        description: 'Array of validation errors', 
        query: '.raw.plan_validation.errors',
        scope: 'single_item'
      },
      { 
        description: 'Array of validation warnings', 
        query: '.raw.plan_validation.warnings',
        scope: 'single_item'
      },
      { 
        description: 'Validation timestamp', 
        query: '.raw.plan_validation.validated_at',
        scope: 'single_item'
      },
      
      // Calculated validation analysis
      { 
        description: 'Total validation issues count (calculated)', 
        query: '.calculated.validation_analysis.total_issues',
        scope: 'single_item'
      },
      { 
        description: 'Validation severity breakdown (calculated)', 
        query: '.calculated.validation_analysis.severity_breakdown',
        scope: 'single_item'
      },
      { 
        description: 'Plan quality score (calculated)', 
        query: '.calculated.validation_analysis.quality_score',
        scope: 'single_item'
      },
      { 
        description: 'Validation completeness indicators', 
        query: '.calculated.validation_analysis.completeness_indicators',
        scope: 'single_item'
      },
      
      // Issue-specific queries
      { 
        description: 'Critical errors only', 
        query: '.raw.plan_validation.errors[] | select(contains("critical") or contains("fatal"))',
        scope: 'single_item'
      },
      { 
        description: 'Formatting warnings only', 
        query: '.raw.plan_validation.warnings[] | select(contains("format") or contains("style"))',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get validation severity level
   * 
   * @returns Severity classification based on errors and warnings
   */
  getSeverityLevel(): 'clean' | 'has-errors' | 'invalid' | 'warnings-only' {
    if (!this.isValid || this.errors.length > 0) return 'invalid'
    if (this.errors.length > 0) return 'has-errors'
    if (this.warnings.length > 0) return 'warnings-only'
    return 'clean'
  }

  /**
   * Get summary of validation results
   * 
   * @returns Brief validation description for logging/debugging
   */
  getSummary(): string {
    const status = this.isValid ? 'VALID' : 'INVALID'
    const issues = this.hasIssues ? ` (${this.errors.length} errors, ${this.warnings.length} warnings)` : ''
    return `${status}${issues}`
  }

  /**
   * Get validation quality score
   * 
   * @returns Quality score from 0-100 based on validation results
   */
  getValidationQualityScore(): number {
    if (!this.isValid) return 0
    
    let score = 100
    
    // Deduct points for errors (more severe)
    score -= this.errors.length * 20
    
    // Deduct points for warnings (less severe)
    score -= this.warnings.length * 5
    
    // Bonus points for having metadata and tasks
    if (this.hasMetadata) score += 10
    if (this.hasTasks) score += 10
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Check if validation indicates a well-structured plan
   * 
   * @returns True if plan meets quality standards
   */
  isWellStructured(): boolean {
    return this.isValid && this.hasMetadata && this.hasTasks && this.errors.length === 0
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete validation data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'validation_analysis': this.calculateValidationAnalysis()
      },
      raw: {
        'plan_validation': this.buildRawValidationData()
      }
    }
  }

  /**
   * Convert validation data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PlanValidationDTO.Keys.PLAN_HAS_METADATA]: String(this.hasMetadata),
      [PlanValidationDTO.Keys.PLAN_HAS_TASKS]: String(this.hasTasks),
      [PlanValidationDTO.Keys.PLAN_IS_VALID]: String(this.isValid),
      [PlanValidationDTO.Keys.PLAN_VALIDATION_ERRORS]: this.errors.join('; '),
      [PlanValidationDTO.Keys.PLAN_VALIDATION_WARNINGS]: this.warnings.join('; ')
    }
  }

  /**
   * Build raw plan validation data structure
   * 
   * @returns Raw validation data exactly as collected
   */
  private buildRawValidationData(): JsonObject {
    return {
      'errors': this.errors,
      'has_metadata': this.hasMetadata,
      'has_tasks': this.hasTasks,
      'is_valid': this.isValid,
      'validated_at': this.validatedAt.toISOString(),
      'warnings': this.warnings
    }
  }

  /**
   * Calculate comprehensive validation analysis
   * 
   * @returns Analysis of validation results and quality indicators
   */
  private calculateValidationAnalysis(): JsonObject {
    const severityLevel = this.getSeverityLevel()
    const qualityScore = this.getValidationQualityScore()
    
    // Categorize errors and warnings by type
    const errorTypes = this.categorizeIssues(this.errors)
    const warningTypes = this.categorizeIssues(this.warnings)
    
    // Completeness indicators
    const completenessIndicators = {
      has_metadata_section: this.hasMetadata,
      has_task_definitions: this.hasTasks,
      has_validation_errors: this.errors.length > 0,
      has_validation_warnings: this.warnings.length > 0,
      is_structurally_sound: this.isValid,
      meets_quality_standards: this.isWellStructured()
    }
    
    return {
      'completeness_indicators': completenessIndicators,
      'error_categorization': errorTypes,
      'quality_score': qualityScore,
      'severity_breakdown': {
        'error_count': this.errors.length,
        'severity_level': severityLevel,
        'total_issues': this.totalIssues,
        'warning_count': this.warnings.length
      },
      'validation_summary': {
        'has_critical_issues': this.errors.length > 0,
        'has_issues': this.hasIssues,
        'is_production_ready': this.isWellStructured() && this.warnings.length === 0,
        'is_well_structured': this.isWellStructured(),
        'overall_health': this.determineOverallHealth()
      },
      'warning_categorization': warningTypes
    }
  }

  /**
   * Categorize issues by their type/category
   * 
   * @param issues - Array of error or warning messages
   * @returns Categorized issue counts
   */
  private categorizeIssues(issues: string[]): Record<string, number> {
    const categories = {
      content: 0,
      format: 0,
      metadata: 0,
      structure: 0,
      syntax: 0,
      tasks: 0,
      unknown: 0
    }
    
    for (const issue of issues) {
      const issueLower = issue.toLowerCase()
      
      if (issueLower.includes('metadata') || issueLower.includes('header')) {
        categories['metadata']++
      } else if (issueLower.includes('task') || issueLower.includes('todo')) {
        categories['tasks']++
      } else if (issueLower.includes('format') || issueLower.includes('style')) {
        categories['format']++
      } else if (issueLower.includes('structure') || issueLower.includes('section')) {
        categories['structure']++
      } else if (issueLower.includes('syntax') || issueLower.includes('markdown')) {
        categories['syntax']++
      } else if (issueLower.includes('content') || issueLower.includes('text')) {
        categories['content']++
      } else {
        categories['unknown']++
      }
    }
    
    return categories
  }

  /**
   * Determine overall health classification
   * 
   * @returns Overall health status of the plan
   */
  private determineOverallHealth(): string {
    if (!this.isValid) return 'invalid'
    if (this.errors.length > 0) return 'poor'
    if (this.warnings.length > 5) return 'needs-attention'
    if (this.warnings.length > 0) return 'good-with-warnings'
    if (this.hasMetadata && this.hasTasks) return 'excellent'
    return 'acceptable'
  }
}