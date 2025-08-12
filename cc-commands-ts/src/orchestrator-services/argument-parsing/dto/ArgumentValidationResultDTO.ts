/**
 * @file Argument Validation Result Data Transfer Object
 * 
 * Represents the result of validating parsed command-line arguments
 * against requirements, formats, and constraints.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { ARGUMENT_DATA_KEYS } from '../constants/ArgumentConstants.js'
import { ArgumentFormatError, ArgumentValidationResult } from '../types/ArgumentTypes.js'

/**
 * Data Transfer Object for argument validation results
 * 
 * Contains the comprehensive result of validating parsed arguments
 * including validity status, missing arguments, format errors, and
 * successfully validated arguments.
 */
export class ArgumentValidationResultDTO implements ILLMDataDTO {
  private static readonly Keys = ARGUMENT_DATA_KEYS

  constructor(
    public readonly isValid: boolean,
    public readonly missingRequired: string[],
    public readonly formatErrors: ArgumentFormatError[],
    public readonly validationResults: ArgumentValidationResult[],
    public readonly validatedArguments: Record<string, string>,
    public readonly validationTimestamp: Date
  ) {}

  /**
   * Create failed validation result
   * 
   * @param missingRequired - Missing required arguments
   * @param formatErrors - Format validation errors
   * @param validationResults - Detailed validation results
   * @param partiallyValidated - Any arguments that were successfully validated
   * @returns ArgumentValidationResultDTO indicating failure
   */
  static failure(
    missingRequired: string[],
    formatErrors: ArgumentFormatError[],
    validationResults: ArgumentValidationResult[] = [],
    partiallyValidated: Record<string, string> = {}
  ): ArgumentValidationResultDTO {
    return ArgumentValidationResultDTO.fromValidationResults(
      false,
      missingRequired,
      formatErrors,
      validationResults,
      partiallyValidated
    )
  }

  /**
   * Create ArgumentValidationResultDTO from validation results
   * 
   * @param isValid - Overall validation status
   * @param missingRequired - Array of missing required argument names
   * @param formatErrors - Array of format validation errors
   * @param validationResults - Detailed validation results for each argument
   * @param validatedArguments - Successfully validated arguments
   * @returns New ArgumentValidationResultDTO instance
   */
  static fromValidationResults(
    isValid: boolean,
    missingRequired: string[],
    formatErrors: ArgumentFormatError[],
    validationResults: ArgumentValidationResult[],
    validatedArguments: Record<string, string>
  ): ArgumentValidationResultDTO {
    return new ArgumentValidationResultDTO(
      isValid,
      missingRequired,
      formatErrors,
      validationResults,
      validatedArguments,
      new Date()
    )
  }

  /**
   * Create successful validation result
   * 
   * @param validatedArguments - All successfully validated arguments
   * @param validationResults - Detailed validation results
   * @returns ArgumentValidationResultDTO indicating success
   */
  static success(
    validatedArguments: Record<string, string>,
    validationResults: ArgumentValidationResult[] = []
  ): ArgumentValidationResultDTO {
    return ArgumentValidationResultDTO.fromValidationResults(
      true,
      [],
      [],
      validationResults,
      validatedArguments
    )
  }

  /**
   * Get arguments that failed validation
   * 
   * @returns Array of argument names that failed validation
   */
  getFailedArguments(): string[] {
    const failed = new Set<string>()
    
    // Add missing required arguments
    for (const arg of this.missingRequired) failed.add(arg)
    
    // Add arguments with format errors
    for (const error of this.formatErrors) failed.add(error.argumentName)
    
    // Add arguments from validation results that failed
    for (const result of this.validationResults
      .filter(result => !result.isValid)) failed.add(result.argumentName)
    
    return [...failed]
  }

  /**
   * Get summary of validation issues
   * 
   * @returns Human-readable summary of validation problems
   */
  getIssuesSummary(): string {
    if (!this.hasIssues()) {
      return 'All arguments valid'
    }
    
    const issues: string[] = []
    
    if (this.missingRequired.length > 0) {
      issues.push(`${this.missingRequired.length} required arguments missing`)
    }
    
    if (this.formatErrors.length > 0) {
      issues.push(`${this.formatErrors.length} format errors`)
    }
    
    const failedValidations = this.validationResults.filter(r => !r.isValid).length
    if (failedValidations > 0) {
      issues.push(`${failedValidations} validation failures`)
    }
    
    return issues.join(', ')
  }

  /**
   * Get comprehensive jq query hints for validation data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Overall validation status
      {
        description: 'Overall validation success',
        query: '.raw.validation_result.is_valid',
        scope: 'single_item'
      },
      {
        description: 'Validation timestamp',
        query: '.raw.validation_result.validation_timestamp',
        scope: 'single_item'
      },
      
      // Missing arguments
      {
        description: 'Missing required arguments',
        query: '.raw.validation_result.missing_required',
        scope: 'all_items'
      },
      {
        description: 'Missing required arguments count',
        query: '.calculated.validation_summary.missing_required_count',
        scope: 'single_item'
      },
      
      // Format errors
      {
        description: 'Format validation errors',
        query: '.raw.validation_result.format_errors',
        scope: 'all_items'
      },
      {
        description: 'Format errors count',
        query: '.calculated.validation_summary.format_errors_count',
        scope: 'single_item'
      },
      {
        description: 'Arguments with format errors',
        query: '.raw.validation_result.format_errors | map(.argumentName)',
        scope: 'all_items'
      },
      
      // Successfully validated
      {
        description: 'Successfully validated arguments',
        query: '.raw.validation_result.validated_arguments',
        scope: 'single_item'
      },
      {
        description: 'Validated arguments count',
        query: '.calculated.validation_summary.validated_count',
        scope: 'single_item'
      },
      
      // Detailed validation results
      {
        description: 'All validation results',
        query: '.raw.validation_result.validation_results',
        scope: 'all_items'
      },
      {
        description: 'Failed validation results',
        query: '.raw.validation_result.validation_results | map(select(.isValid == false))',
        scope: 'all_items'
      },
      
      // Summary calculations
      {
        description: 'Validation success rate',
        query: '.calculated.validation_summary.success_rate',
        scope: 'single_item'
      },
      {
        description: 'Total validation issues',
        query: '.calculated.validation_summary.total_issues',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get validation success rate (0-1)
   * 
   * @returns Success rate as decimal
   */
  getSuccessRate(): number {
    const totalChecked = this.validationResults.length
    if (totalChecked === 0) return 1
    
    const successful = this.validationResults.filter(r => r.isValid).length
    return successful / totalChecked
  }

  /**
   * Get total number of validation issues
   * 
   * @returns Total count of all validation issues
   */
  getTotalIssues(): number {
    return this.missingRequired.length + this.formatErrors.length + 
           this.validationResults.filter(r => !r.isValid).length
  }

  /**
   * Check if validation has any issues
   * 
   * @returns True if there are any validation issues
   */
  hasIssues(): boolean {
    return !this.isValid || this.getTotalIssues() > 0
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete validation data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'validation_analysis': this.buildValidationAnalysis(),
        'validation_summary': this.buildValidationSummary()
      },
      raw: {
        'validation_result': this.buildRawValidationData()
      }
    }
  }

  /**
   * Convert validation result data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ArgumentValidationResultDTO.Keys.ARGUMENTS_VALID]: String(this.isValid),
      [ArgumentValidationResultDTO.Keys.INVALID_FORMATS]: String(this.formatErrors.length),
      [ArgumentValidationResultDTO.Keys.MISSING_REQUIRED]: this.missingRequired.join(', '),
      [ArgumentValidationResultDTO.Keys.VALIDATED_COUNT]: String(Object.keys(this.validatedArguments).length),
      'FAILED_ARGUMENTS': this.getFailedArguments().join(', '),
      'ISSUES_SUMMARY': this.getIssuesSummary(),
      'SUCCESS_RATE': (this.getSuccessRate() * 100).toFixed(1),
      'TOTAL_ISSUES': String(this.getTotalIssues()),
      // Additional validation details
      'VALIDATION_TIMESTAMP': this.validationTimestamp.toISOString()
    }
  }

  /**
   * Build raw validation data structure
   * 
   * @returns Raw validation data exactly as collected
   */
  private buildRawValidationData(): JsonObject {
    return {
      'format_errors': this.formatErrors.map(error => ({
        argument_name: error.argumentName,
        error: error.error,
        expected_format: error.expectedFormat,
        provided_value: error.providedValue
      })),
      'is_valid': this.isValid,
      'missing_required': this.missingRequired,
      'validated_arguments': this.validatedArguments,
      'validation_results': this.validationResults.map(result => ({
        argument_name: result.argumentName,
        error: result.error,
        expected_format: result.expectedFormat,
        is_valid: result.isValid,
        validated_value: result.validatedValue
      })),
      'validation_timestamp': this.validationTimestamp.toISOString()
    }
  }

  /**
   * Build validation analysis
   * 
   * @returns Analysis of validation characteristics
   */
  private buildValidationAnalysis(): JsonObject {
    return {
      'all_arguments_validated': this.isValid && this.getTotalIssues() === 0,
      'has_format_errors': this.formatErrors.length > 0,
      'has_missing_required': this.missingRequired.length > 0,
      'has_validation_failures': this.validationResults.some(r => !r.isValid),
      'issues_summary': this.getIssuesSummary()
    }
  }

  /**
   * Build validation summary with statistics
   * 
   * @returns Summary statistics for validation
   */
  private buildValidationSummary(): JsonObject {
    return {
      'failed_arguments_count': this.getFailedArguments().length,
      'format_errors_count': this.formatErrors.length,
      'missing_required_count': this.missingRequired.length,
      'success_rate': this.getSuccessRate(),
      'total_issues': this.getTotalIssues(),
      'validated_count': Object.keys(this.validatedArguments).length
    }
  }
}