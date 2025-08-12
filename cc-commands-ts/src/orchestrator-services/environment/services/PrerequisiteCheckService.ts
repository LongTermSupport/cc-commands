/**
 * @file Prerequisite Check Service Implementation
 * 
 * Implementation of project prerequisite validation using filesystem operations.
 * Handles file existence, directory validation, and project structure checking.
 */

import { access, constants, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { REQUIRED_PROJECT_DIRECTORIES, REQUIRED_PROJECT_FILES } from '../constants/EnvironmentConstants.js'
import { PrerequisiteCheckResultDTO } from '../dto/PrerequisiteCheckResultDTO.js'
import { IPrerequisiteCheckService } from '../interfaces/IPrerequisiteCheckService.js'
import { DirectoryCheckResult, FileCheckResult, ProjectStructureConfig } from '../types/EnvironmentTypes.js'

/**
 * Prerequisite Check Service for environment validation
 * 
 * Provides file system validation capabilities for project structure,
 * required files, and directory validation.
 */
export class PrerequisiteCheckService implements IPrerequisiteCheckService {
  /**
   * Check if a specific directory exists and is accessible
   * 
   * @param directoryPath - Absolute or relative path to directory
   * @returns Directory check result with existence and accessibility info
   */
  async checkDirectory(directoryPath: string): Promise<DirectoryCheckResult> {
    try {
      const resolvedPath = resolve(directoryPath)
      
      // Check if directory exists
      await access(resolvedPath, constants.F_OK)
      
      // Verify it's actually a directory
      const stats = await stat(resolvedPath)
      if (!stats.isDirectory()) {
        return {
          directoryPath: resolvedPath,
          error: 'Path exists but is not a directory',
          exists: false,
          isAccessible: false
        }
      }
      
      // Check if directory is accessible
      let isAccessible = true
      try {
        await access(resolvedPath, constants.R_OK)
      } catch {
        isAccessible = false
      }
      
      return {
        directoryPath: resolvedPath,
        error: undefined,
        exists: true,
        isAccessible
      }

    } catch (error) {
      return {
        directoryPath: resolve(directoryPath),
        error: error instanceof Error ? error.message : String(error),
        exists: false,
        isAccessible: false
      }
    }
  }

  /**
   * Check if a specific file exists and is accessible
   * 
   * @param filePath - Absolute or relative path to file
   * @returns File check result with existence and accessibility info
   */
  async checkFile(filePath: string): Promise<FileCheckResult> {
    try {
      const resolvedPath = resolve(filePath)
      
      // Check if file exists and is readable
      await access(resolvedPath, constants.F_OK)
      
      let isReadable = true
      let size: number | undefined
      
      try {
        await access(resolvedPath, constants.R_OK)
        const stats = await stat(resolvedPath)
        size = stats.size
      } catch {
        isReadable = false
      }
      
      return {
        error: undefined,
        exists: true,
        filePath: resolvedPath,
        isReadable,
        size
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        exists: false,
        filePath: resolve(filePath),
        isReadable: false,
        size: undefined
      }
    }
  }

  /**
   * Check multiple directories for existence
   * 
   * @param directoryPaths - Array of directory paths to check
   * @param basePath - Optional base path for relative directory paths
   * @returns Array of directory check results
   */
  async checkMultipleDirectories(directoryPaths: string[], basePath?: string): Promise<DirectoryCheckResult[]> {
    try {
      const checks = directoryPaths.map(async (directoryPath) => {
        const fullPath = basePath ? join(basePath, directoryPath) : directoryPath
        return this.checkDirectory(fullPath)
      })
      
      return await Promise.all(checks)

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify all directory paths are valid',
          'Check file system permissions',
          'Ensure base path exists if specified',
          'Try checking directories individually to isolate issues'
        ],
        { basePath: basePath || null, directoryCount: directoryPaths.length, directoryPaths }
      )
    }
  }

  /**
   * Check multiple files for existence
   * 
   * @param filePaths - Array of file paths to check
   * @param basePath - Optional base path for relative file paths
   * @returns Array of file check results
   */
  async checkMultipleFiles(filePaths: string[], basePath?: string): Promise<FileCheckResult[]> {
    try {
      const checks = filePaths.map(async (filePath) => {
        const fullPath = basePath ? join(basePath, filePath) : filePath
        return this.checkFile(fullPath)
      })
      
      return await Promise.all(checks)

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify all file paths are valid',
          'Check file system permissions',
          'Ensure base path exists if specified',
          'Try checking files individually to isolate issues'
        ],
        { basePath: basePath || null, fileCount: filePaths.length, filePaths }
      )
    }
  }

  /**
   * Get file metadata without full validation
   * 
   * @param filePath - Path to file
   * @returns Basic file metadata or null if file doesn't exist
   */
  async getFileMetadata(filePath: string): Promise<null | { modified: Date; size: number; }> {
    try {
      const resolvedPath = resolve(filePath)
      const stats = await stat(resolvedPath)
      
      return {
        modified: stats.mtime,
        size: stats.size
      }

    } catch {
      // File doesn't exist or can't be accessed
      return null
    }
  }

  /**
   * Validate complete project structure
   * 
   * @param config - Project structure validation configuration
   * @returns Complete prerequisite check result
   */
  async validateProjectStructure(config: ProjectStructureConfig): Promise<PrerequisiteCheckResultDTO> {
    try {
      const validationErrors: string[] = []
      
      // Validate project root exists
      const rootCheck = await this.checkDirectory(config.projectRoot)
      if (!rootCheck.exists) {
        validationErrors.push(`Project root directory does not exist: ${config.projectRoot}`)
      }
      
      // Check all required files
      const fileChecks = await this.checkMultipleFiles(
        config.requiredFiles, 
        config.projectRoot
      )
      
      // Check all required directories
      const directoryChecks = await this.checkMultipleDirectories(
        config.requiredDirectories,
        config.projectRoot
      )
      
      return PrerequisiteCheckResultDTO.fromValidationResults(
        config.projectRoot,
        fileChecks,
        directoryChecks,
        validationErrors
      )

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          `Verify the project root directory exists: ${config.projectRoot}`,
          'Check file system permissions for project directory',
          'Ensure all required files are present in project',
          'Validate project structure matches expected layout'
        ],
        { projectRoot: config.projectRoot, requiredDirectories: config.requiredDirectories, requiredFiles: config.requiredFiles }
      )
    }
  }

  /**
   * Validate TypeScript project prerequisites
   * 
   * @param projectRoot - Root directory of the TypeScript project
   * @returns Prerequisite check result for TypeScript project
   */
  async validateTypeScriptProject(projectRoot: string): Promise<PrerequisiteCheckResultDTO> {
    try {
      const config: ProjectStructureConfig = {
        projectRoot,
        requiredDirectories: [...REQUIRED_PROJECT_DIRECTORIES],
        requiredFiles: [...REQUIRED_PROJECT_FILES]
      }
      
      return await this.validateProjectStructure(config)

    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          `Verify TypeScript project exists at: ${projectRoot}`,
          'Ensure package.json and tsconfig.json are present',
          'Check that src directory exists',
          'Run npm install to create node_modules directory',
          'Verify file system permissions for project directory'
        ],
        { projectRoot, requiredDirectories: [...REQUIRED_PROJECT_DIRECTORIES], requiredFiles: [...REQUIRED_PROJECT_FILES] }
      )
    }
  }
}