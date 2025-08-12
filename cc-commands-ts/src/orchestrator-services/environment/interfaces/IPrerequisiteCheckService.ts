/**
 * @file Prerequisite Check Service Interface
 * 
 * Interface contract for project prerequisite validation operations.
 * Provides file existence, directory structure, and project readiness checking.
 */

import { PrerequisiteCheckResultDTO } from '../dto/PrerequisiteCheckResultDTO.js'
import { DirectoryCheckResult, FileCheckResult, ProjectStructureConfig } from '../types/EnvironmentTypes.js'

/**
 * Interface for prerequisite validation operations
 * 
 * This interface defines the contract for project structure validation
 * including file existence checks, directory validation, and overall
 * project readiness assessment.
 */
export interface IPrerequisiteCheckService {
  /**
   * Check if a specific directory exists and is accessible
   * 
   * Validates directory existence and accessibility for the current process.
   * 
   * @param directoryPath - Absolute or relative path to directory
   * @returns Directory check result with existence and accessibility info
   * @throws {OrchestratorError} When directory access fails
   */
  checkDirectory(directoryPath: string): Promise<DirectoryCheckResult>

  /**
   * Check if a specific file exists and is accessible
   * 
   * Validates file existence, readability, and basic metadata.
   * Provides detailed information about file accessibility.
   * 
   * @param filePath - Absolute or relative path to file
   * @returns File check result with existence and accessibility info
   * @throws {OrchestratorError} When file system access fails
   */
  checkFile(filePath: string): Promise<FileCheckResult>

  /**
   * Check multiple directories for existence
   * 
   * Efficiently validates multiple directories and returns all results.
   * Useful for batch validation of required project directories.
   * 
   * @param directoryPaths - Array of directory paths to check
   * @param basePath - Optional base path for relative directory paths
   * @returns Array of directory check results
   * @throws {OrchestratorError} When batch directory checking fails
   */
  checkMultipleDirectories(directoryPaths: string[], basePath?: string): Promise<DirectoryCheckResult[]>

  /**
   * Check multiple files for existence
   * 
   * Efficiently validates multiple files and returns all results.
   * Useful for batch validation of required project files.
   * 
   * @param filePaths - Array of file paths to check
   * @param basePath - Optional base path for relative file paths
   * @returns Array of file check results
   * @throws {OrchestratorError} When batch file checking fails
   */
  checkMultipleFiles(filePaths: string[], basePath?: string): Promise<FileCheckResult[]>

  /**
   * Get file metadata without full validation
   * 
   * Returns basic file information (size, modified time) without
   * performing comprehensive validation checks.
   * 
   * @param filePath - Path to file
   * @returns Basic file metadata or null if file doesn't exist
   * @throws {OrchestratorError} When metadata retrieval fails
   */
  getFileMetadata(filePath: string): Promise<null | { modified: Date; size: number; }>

  /**
   * Validate complete project structure
   * 
   * Checks all required files and directories for a project based on
   * configuration. Provides comprehensive validation results.
   * 
   * @param config - Project structure validation configuration
   * @returns Complete prerequisite check result
   * @throws {OrchestratorError} When project validation process fails
   */
  validateProjectStructure(config: ProjectStructureConfig): Promise<PrerequisiteCheckResultDTO>

  /**
   * Validate TypeScript project prerequisites
   * 
   * Convenience method that validates standard TypeScript project structure
   * including package.json, tsconfig.json, src directory, and node_modules.
   * 
   * @param projectRoot - Root directory of the TypeScript project
   * @returns Prerequisite check result for TypeScript project
   * @throws {OrchestratorError} When TypeScript project validation fails
   */
  validateTypeScriptProject(projectRoot: string): Promise<PrerequisiteCheckResultDTO>
}