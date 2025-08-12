/**
 * @file Prerequisite Check Result Data Transfer Object
 * 
 * Represents the result of validating project prerequisites including
 * required files, directories, and project structure.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { ENVIRONMENT_DATA_KEYS } from '../constants/EnvironmentConstants.js'
import { DirectoryCheckResult, FileCheckResult } from '../types/EnvironmentTypes.js'

/**
 * Data Transfer Object for prerequisite check results
 * 
 * Encapsulates the results of validating project structure, required files,
 * and directories for environment readiness assessment.
 */
export class PrerequisiteCheckResultDTO implements ILLMDataDTO {
  private static readonly Keys = ENVIRONMENT_DATA_KEYS

  constructor(
    public readonly projectRoot: string,
    public readonly fileChecks: FileCheckResult[],
    public readonly directoryChecks: DirectoryCheckResult[],
    public readonly isValid: boolean,
    public readonly validationErrors: string[]
  ) {}

  /**
   * Create PrerequisiteCheckResultDTO from validation results
   * 
   * @param projectRoot - Project root directory
   * @param fileChecks - File existence check results
   * @param directoryChecks - Directory existence check results
   * @param validationErrors - Any validation errors encountered
   * @returns New PrerequisiteCheckResultDTO instance
   */
  static fromValidationResults(
    projectRoot: string,
    fileChecks: FileCheckResult[],
    directoryChecks: DirectoryCheckResult[],
    validationErrors: string[] = []
  ): PrerequisiteCheckResultDTO {
    const isValid = PrerequisiteCheckResultDTO.calculateValidity(
      fileChecks,
      directoryChecks,
      validationErrors
    )

    return new PrerequisiteCheckResultDTO(
      projectRoot,
      fileChecks,
      directoryChecks,
      isValid,
      validationErrors
    )
  }

  /**
   * Calculate overall validity from check results
   * 
   * @param fileChecks - File check results
   * @param directoryChecks - Directory check results
   * @param validationErrors - Validation errors
   * @returns True if all checks pass and no errors
   */
  private static calculateValidity(
    fileChecks: FileCheckResult[],
    directoryChecks: DirectoryCheckResult[],
    validationErrors: string[]
  ): boolean {
    if (validationErrors.length > 0) return false
    
    const allFilesExist = fileChecks.every(check => check.exists)
    const allDirectoriesExist = directoryChecks.every(check => check.exists)
    
    return allFilesExist && allDirectoriesExist
  }

  /**
   * Get comprehensive jq query hints for prerequisite data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw data queries
      {
        description: 'Project root directory',
        query: '.raw.prerequisite_check.project_root',
        scope: 'single_item'
      },
      {
        description: 'All file check results',
        query: '.raw.prerequisite_check.file_checks',
        scope: 'all_items'
      },
      {
        description: 'All directory check results',
        query: '.raw.prerequisite_check.directory_checks',
        scope: 'all_items'
      },
      {
        description: 'Validation errors',
        query: '.raw.prerequisite_check.validation_errors',
        scope: 'all_items'
      },
      
      // Calculated data queries
      {
        description: 'Overall prerequisites validity (calculated)',
        query: '.calculated.prerequisite_summary.is_valid',
        scope: 'single_item'
      },
      {
        description: 'Missing files count (calculated)',
        query: '.calculated.prerequisite_summary.missing_files_count',
        scope: 'single_item'
      },
      {
        description: 'Missing directories count (calculated)',
        query: '.calculated.prerequisite_summary.missing_directories_count',
        scope: 'single_item'
      },
      {
        description: 'Missing files list (calculated)',
        query: '.calculated.prerequisite_analysis.missing_files',
        scope: 'all_items'
      },
      {
        description: 'Missing directories list (calculated)',
        query: '.calculated.prerequisite_analysis.missing_directories',
        scope: 'all_items'
      },
      
      // Specific file queries
      {
        description: 'package.json existence',
        query: '.raw.prerequisite_check.file_checks[] | select(.file_path | endswith("package.json")) | .exists',
        scope: 'single_item'
      },
      {
        description: 'tsconfig.json existence',
        query: '.raw.prerequisite_check.file_checks[] | select(.file_path | endswith("tsconfig.json")) | .exists',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get directories that failed existence checks
   * 
   * @returns Array of directory check results for missing directories
   */
  getMissingDirectories(): DirectoryCheckResult[] {
    return this.directoryChecks.filter(check => !check.exists)
  }

  /**
   * Get files that failed existence checks
   * 
   * @returns Array of file check results for missing files
   */
  getMissingFiles(): FileCheckResult[] {
    return this.fileChecks.filter(check => !check.exists)
  }

  /**
   * Get a summary of the prerequisite validation
   * 
   * @returns Human-readable summary for logging/debugging
   */
  getSummary(): string {
    const missingFiles = this.getMissingFiles().length
    const missingDirs = this.getMissingDirectories().length
    const errorCount = this.validationErrors.length
    
    if (this.isValid) {
      return `Prerequisites: Valid (${this.fileChecks.length} files, ${this.directoryChecks.length} directories)`
    }
    
    const issues = []
    if (missingFiles > 0) issues.push(`${missingFiles} missing files`)
    if (missingDirs > 0) issues.push(`${missingDirs} missing directories`)
    if (errorCount > 0) issues.push(`${errorCount} validation errors`)
    
    return `Prerequisites: Invalid (${issues.join(', ')})`
  }

  /**
   * Check if specific directory exists
   * 
   * @param directoryName - Name of directory to check
   * @returns True if directory exists, false otherwise
   */
  hasDirectory(directoryName: string): boolean {
    return this.directoryChecks.some(check => 
      check.directoryPath.endsWith(directoryName) && check.exists
    )
  }

  /**
   * Check if specific file exists
   * 
   * @param fileName - Name of file to check
   * @returns True if file exists, false otherwise
   */
  hasFile(fileName: string): boolean {
    return this.fileChecks.some(check => 
      check.filePath.endsWith(fileName) && check.exists
    )
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete prerequisite data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'prerequisite_analysis': this.buildPrerequisiteAnalysis(),
        'prerequisite_summary': this.buildPrerequisiteSummary()
      },
      raw: {
        'prerequisite_check': this.buildRawPrerequisiteData()
      }
    }
  }

  /**
   * Convert prerequisite check data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    const missingFiles = this.getMissingFiles()
    const missingDirectories = this.getMissingDirectories()
    
    return {
      'MISSING_DIRECTORIES': missingDirectories.map(d => d.directoryPath).join(', '),
      'MISSING_DIRECTORIES_COUNT': String(missingDirectories.length),
      'MISSING_FILES': missingFiles.map(f => f.filePath).join(', '),
      // Include counts and lists for LLM analysis
      'MISSING_FILES_COUNT': String(missingFiles.length),
      [PrerequisiteCheckResultDTO.Keys.PROJECT_STRUCTURE_VALID]: String(this.isValid),
      [PrerequisiteCheckResultDTO.Keys.REQUIRED_FILES_PRESENT]: String(missingFiles.length === 0),
      'PROJECT_ROOT': this.projectRoot,
      'VALIDATION_ERRORS': this.validationErrors.join('; ')
    }
  }

  /**
   * Build prerequisite analysis with detailed breakdowns
   * 
   * @returns Analysis of missing files, directories, and issues
   */
  private buildPrerequisiteAnalysis(): JsonObject {
    return {
      'missing_directories': this.getMissingDirectories().map(check => ({
        error: check.error || null,
        path: check.directoryPath
      })),
      'missing_files': this.getMissingFiles().map(check => ({
        error: check.error || null,
        path: check.filePath
      })),
      'present_directories': this.directoryChecks
        .filter(check => check.exists)
        .map(check => check.directoryPath),
      'present_files': this.fileChecks
        .filter(check => check.exists)
        .map(check => check.filePath)
    }
  }

  /**
   * Build prerequisite summary with counts and status
   * 
   * @returns Summary statistics and overall status
   */
  private buildPrerequisiteSummary(): JsonObject {
    return {
      'is_valid': this.isValid,
      'missing_directories_count': this.getMissingDirectories().length,
      'missing_files_count': this.getMissingFiles().length,
      'summary': this.getSummary(),
      'total_directories_checked': this.directoryChecks.length,
      'total_files_checked': this.fileChecks.length,
      'validation_errors_count': this.validationErrors.length
    }
  }

  /**
   * Build raw prerequisite data structure
   * 
   * @returns Raw prerequisite data exactly as collected
   */
  private buildRawPrerequisiteData(): JsonObject {
    return {
      'directory_checks': this.directoryChecks.map(check => ({
        directoryPath: check.directoryPath,
        error: check.error,
        exists: check.exists,
        isAccessible: check.isAccessible
      })),
      'file_checks': this.fileChecks.map(check => ({
        error: check.error,
        exists: check.exists,
        filePath: check.filePath,
        isReadable: check.isReadable,
        size: check.size
      })),
      'is_valid': this.isValid,
      'project_root': this.projectRoot,
      'validation_errors': this.validationErrors
    }
  }
}