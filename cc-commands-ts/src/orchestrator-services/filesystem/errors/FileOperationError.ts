/**
 * @file Filesystem operation error handling
 *
 * Provides specialized error handling for filesystem operations including
 * file access, path resolution, plan parsing, and documentation processing.
 */

import { existsSync } from 'node:fs'
import { isAbsolute } from 'node:path'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * Factory class for creating filesystem-related OrchestratorError instances
 * 
 * Since OrchestratorError is final and cannot be extended, this factory provides
 * domain-specific error creation with appropriate recovery instructions.
 */
export const FileOperationError = {

  /**
   * Create error for content parsing failures
   */
  contentParseError(
    filePath: string,
    contentType: string,
    originalError: Error
  ): OrchestratorError {
    const error = new Error(`Failed to parse ${contentType} content in: ${filePath}`)
    const recoveryInstructions = [
      `Check ${contentType} syntax and format`,
      'Verify the file encoding is correct',
      'Ensure the content is not corrupted',
      'Try opening the file manually to verify it is readable'
    ]
    const debugInfo = {
      contentType,
      errorName: originalError.name,
      errorStack: originalError.stack || 'No stack trace available',
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('filePath', filePath)
    orchestratorError.addContext('contentType', contentType)
    orchestratorError.addContext('originalError', originalError.message)
    return orchestratorError
  },

  /**
   * Create error for directory not found scenarios
   */
  directoryNotFound(
    directoryPath: string,
    searchPaths?: string[]
  ): OrchestratorError {
    const error = new Error(`Directory not found: ${directoryPath}`)
    const recoveryInstructions = [
      'Verify the directory path is correct',
      'Check if the directory exists',
      'Ensure parent directories exist',
      searchPaths ? 'Check alternate search paths provided in debug info' : 'Try searching in common locations'
    ]
    const debugInfo = {
      searchedPaths: searchPaths || [directoryPath],
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('directoryPath', directoryPath)
    if (searchPaths) {
      orchestratorError.addContext('searchPaths', searchPaths)
    }

    return orchestratorError
  },

  /**
   * Create error for file not found scenarios
   */
  fileNotFound(
    filePath: string,
    operation?: string
  ): OrchestratorError {
    const error = new Error(`File not found: ${filePath}`)
    const recoveryInstructions = [
      'Verify the file path is correct',
      'Check if the file exists in the expected location',
      'Ensure you have read permissions for the file',
      operation ? `Retry the ${operation} operation after fixing the path` : 'Retry after fixing the path'
    ]
    const debugInfo = { 
      operation: operation || 'file access',
      searchedPath: filePath,
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('filePath', filePath)
    if (operation) {
      orchestratorError.addContext('operation', operation)
    }

    return orchestratorError
  },

  /**
   * Create error for file too large scenarios
   */
  fileTooLarge(
    filePath: string,
    actualSize: number,
    maxSize: number
  ): OrchestratorError {
    const error = new Error(`File too large: ${filePath} (${actualSize} bytes, max: ${maxSize})`)
    const recoveryInstructions = [
      'Try reading the file in chunks',
      'Increase the maximum file size limit if appropriate',
      'Use file streaming instead of loading entire file',
      'Consider using a different approach for large files'
    ]
    const debugInfo = {
      fileSizeMB: Math.round(actualSize / (1024 * 1024)),
      maxSizeMB: Math.round(maxSize / (1024 * 1024)),
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('filePath', filePath)
    orchestratorError.addContext('actualSize', actualSize)
    orchestratorError.addContext('maxSize', maxSize)
    return orchestratorError
  },

  /**
   * Create error for invalid path scenarios
   */
  invalidPath(
    path: string,
    reason?: string
  ): OrchestratorError {
    const error = new Error(`Invalid file path: ${path}${reason ? ` (${reason})` : ''}`)
    const recoveryInstructions = [
      'Check the path syntax',
      'Ensure the path uses correct separators for the OS',
      'Verify the path does not contain invalid characters',
      'Try using an absolute path instead of relative'
    ]
    const debugInfo = {
      hasInvalidChars: /[<>:"|?*]/.test(path),
      isRelative: !isAbsolute(path),
      pathLength: path.length,
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('path', path)
    if (reason) {
      orchestratorError.addContext('reason', reason)
    }

    return orchestratorError
  },

  /**
   * Create error for permission denied scenarios
   */
  permissionDenied(
    path: string,
    operation: string
  ): OrchestratorError {
    const error = new Error(`Permission denied for ${operation}: ${path}`)
    const recoveryInstructions = [
      'Check file/directory permissions',
      'Ensure you have the required access rights',
      'Try running with appropriate permissions',
      'Check if the file is locked by another process'
    ]
    const debugInfo = {
      currentUser: process.env['USER'] || 'unknown',
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('path', path)
    orchestratorError.addContext('operation', operation)
    return orchestratorError
  },

  /**
   * Create error for plan parsing failures
   */
  planParseError(
    planPath: string,
    parseError: string
  ): OrchestratorError {
    const error = new Error(`Failed to parse plan file: ${planPath}`)
    const recoveryInstructions = [
      'Check plan file format and syntax',
      'Ensure the file contains valid markdown',
      'Verify task markers are properly formatted',
      'Check for invalid characters or encoding issues'
    ]
    const debugInfo = {
      fileExists: existsSync(planPath),
      parseError,
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('planPath', planPath)
    orchestratorError.addContext('parseError', parseError)
    return orchestratorError
  },

  /**
   * Create error for read operation failures
   */
  readError(
    filePath: string,
    originalError: Error
  ): OrchestratorError {
    const error = new Error(`Failed to read file: ${filePath}`)
    const recoveryInstructions = [
      'Check read permissions for the file',
      'Verify the file exists and is not corrupted',
      'Ensure the file is not locked by another process',
      'Try accessing the file with a different method'
    ]
    const debugInfo = {
      errorCode: (originalError as NodeJS.ErrnoException).code || 'UNKNOWN',
      errorName: originalError.name,
      fileExists: existsSync(filePath),
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('filePath', filePath)
    orchestratorError.addContext('originalError', originalError.message)
    return orchestratorError
  },

  /**
   * Create error for write operation failures
   */
  writeError(
    filePath: string,
    originalError: Error
  ): OrchestratorError {
    const error = new Error(`Failed to write file: ${filePath}`)
    const recoveryInstructions = [
      'Check write permissions for the target directory',
      'Ensure sufficient disk space is available',
      'Verify the parent directory exists',
      'Check if the file is locked by another process'
    ]
    const debugInfo = {
      diskSpace: 'unknown', // Could be enhanced with actual disk space check
      errorCode: (originalError as NodeJS.ErrnoException).code || 'UNKNOWN',
      errorName: originalError.name,
      timestamp: new Date().toISOString()
    }
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    orchestratorError.addContext('filePath', filePath)
    orchestratorError.addContext('originalError', originalError.message)
    return orchestratorError
  },
};