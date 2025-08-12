/**
 * @file File Operations Service Implementation
 * 
 * Provides atomic filesystem operations including reading, writing, copying,
 * moving, and deleting files and directories. All operations include proper
 * error handling and operation result tracking.
 */

import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { FileOperationError } from '../errors/FileOperationError.js'
import { IFileOperationsService } from '../interfaces/IFileOperationsService.js'
import { TFileOperationResult } from '../types/FilesystemTypes.js'

/**
 * Implementation of file system operations service
 * 
 * Provides atomic file operations with consistent error handling
 * and operation tracking. Designed for dependency injection.
 */
export class FileOperationsService implements IFileOperationsService {

  /**
   * Append content to existing file
   */
  async appendFile(
    path: string, 
    content: string, 
    encoding: BufferEncoding = 'utf8'
  ): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      // Ensure parent directory exists
      await this.ensureDirectoryExists(path)
      
      await fs.appendFile(path, content, { encoding })
      
      const stat = await fs.stat(path)
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'append',
        path,
        size: stat.size,
        success: true
      }
    } catch (error) {
      throw FileOperationError.writeError(path, error as Error)
    }
  }

  /**
   * Copy a file to a new location
   */
  async copyFile(
    sourcePath: string, 
    destinationPath: string, 
    overwrite = false
  ): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      // Check source exists
      if (!(await this.pathExists(sourcePath))) {
        throw FileOperationError.fileNotFound(sourcePath, 'copy')
      }
      
      // Check if destination exists and overwrite policy
      if (await this.pathExists(destinationPath) && !overwrite) {
        throw new Error(`Destination exists and overwrite is disabled: ${destinationPath}`)
      }
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(destinationPath)
      
      await fs.copyFile(sourcePath, destinationPath)
      
      const stat = await fs.stat(destinationPath)
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'copy',
        path: destinationPath,
        size: stat.size,
        sourcePath,
        success: true
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Destination exists')) {
        throw error
      }

      throw FileOperationError.writeError(destinationPath, error as Error)
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string, mode = 0o755): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      await fs.mkdir(path, { mode, recursive: true })
      
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'create_directory',
        path,
        success: true
      }
    } catch (error) {
      throw FileOperationError.writeError(path, error as Error)
    }
  }

  /**
   * Create temporary directory
   */
  async createTempDirectory(prefix = 'tmp-'): Promise<{
    cleanup: () => Promise<void>
    path: string
  }> {
    try {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
      
      const cleanup = async (): Promise<void> => {
        try {
          await this.deleteDirectory(tempDir, true, true)
        } catch (error) {
          // Ignore cleanup errors - temp directory might already be gone
          console.warn(`Warning: Could not cleanup temp directory ${tempDir}:`, error)
        }
      }
      
      return { cleanup, path: tempDir }
    } catch (error) {
      throw FileOperationError.writeError(os.tmpdir(), error as Error)
    }
  }

  /**
   * Create temporary file
   */
  async createTempFile(prefix = 'tmp-', suffix = '.tmp'): Promise<{
    cleanup: () => Promise<void>
    path: string
  }> {
    try {
      // Create temp file in temp directory
      const tempDir = os.tmpdir()
      const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 11)}${suffix}`
      const tempPath = path.join(tempDir, fileName)
      
      // Create empty file
      await fs.writeFile(tempPath, '', 'utf8')
      
      const cleanup = async (): Promise<void> => {
        try {
          await this.deleteFile(tempPath, true)
        } catch (error) {
          // Ignore cleanup errors - temp file might already be gone
          console.warn(`Warning: Could not cleanup temp file ${tempPath}:`, error)
        }
      }
      
      return { cleanup, path: tempPath }
    } catch (error) {
      throw FileOperationError.writeError(os.tmpdir(), error as Error)
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(
    path: string, 
    recursive = false, 
    force = false
  ): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.directoryNotFound(path)
      }
      
      if (!(await this.isDirectory(path))) {
        throw new Error(`Path is not a directory: ${path}`)
      }
      
      await fs.rm(path, { force, recursive })
      
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'delete_directory',
        path,
        success: true
      }
    } catch (error) {
      throw FileOperationError.writeError(path, error as Error)
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, force = false): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'delete')
      }
      
      if (await this.isDirectory(path)) {
        throw new Error(`Path is a directory, not a file: ${path}`)
      }
      
      await fs.rm(path, { force })
      
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'delete_file',
        path,
        success: true
      }
    } catch (error) {
      throw FileOperationError.writeError(path, error as Error)
    }
  }

  /**
   * Get file or directory size
   */
  async getSize(path: string, recursive = true): Promise<number> {
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'get size')
      }
      
      const stat = await fs.stat(path)
      
      if (stat.isFile()) {
        return stat.size
      }
      
      if (stat.isDirectory() && recursive) {
        return await this.calculateDirectorySize(path)
      }
      
      return 0
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Check if path is a directory
   */
  async isDirectory(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path)
      return stat.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Check if path is a file
   */
  async isFile(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path)
      return stat.isFile()
    } catch {
      return false
    }
  }

  /**
   * Move/rename a file
   */
  async moveFile(
    sourcePath: string, 
    destinationPath: string, 
    overwrite = false
  ): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      // Check source exists
      if (!(await this.pathExists(sourcePath))) {
        throw FileOperationError.fileNotFound(sourcePath, 'move')
      }
      
      // Check if destination exists and overwrite policy
      if (await this.pathExists(destinationPath) && !overwrite) {
        throw new Error(`Destination exists and overwrite is disabled: ${destinationPath}`)
      }
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(destinationPath)
      
      await fs.rename(sourcePath, destinationPath)
      
      const stat = await fs.stat(destinationPath)
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'move',
        path: destinationPath,
        size: stat.size,
        sourcePath,
        success: true
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Destination exists')) {
        throw error
      }

      throw FileOperationError.writeError(destinationPath, error as Error)
    }
  }

  /**
   * Check if path exists
   */
  async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Read file contents as string
   */
  async readFile(path: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'read')
      }
      
      return await fs.readFile(path, { encoding })
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Read file contents as buffer
   */
  async readFileBuffer(path: string): Promise<Buffer> {
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'read')
      }
      
      return await fs.readFile(path)
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Set file permissions
   */
  async setPermissions(path: string, mode: number): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'set permissions')
      }
      
      await fs.chmod(path, mode)
      
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'set_permissions',
        path,
        success: true
      }
    } catch {
      throw FileOperationError.permissionDenied(path, 'set permissions')
    }
  }

  /**
   * Watch file or directory for changes
   */
  async watchPath(
    path: string,
    callback: (eventType: 'change' | 'rename', filename?: string) => void
  ): Promise<{
    close: () => void
  }> {
    try {
      if (!(await this.pathExists(path))) {
        throw FileOperationError.fileNotFound(path, 'watch')
      }
      
      // Use traditional fs.watch instead of fs.promises.watch
      const { watch } = await import('node:fs')
      const watcher = watch(path, (eventType: 'change' | 'rename', filename: null | string) => {
        callback(eventType, filename || undefined)
      })
      
      return {
        close: () => watcher.close()
      }
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Write content to file
   */
  async writeFile(
    path: string, 
    content: Buffer | string, 
    encoding: BufferEncoding = 'utf8'
  ): Promise<TFileOperationResult> {
    const startTime = Date.now()
    
    try {
      // Ensure parent directory exists
      await this.ensureDirectoryExists(path)
      
      const options = typeof content === 'string' ? { encoding } : {}
      await fs.writeFile(path, content, options)
      
      const stat = await fs.stat(path)
      const duration = Date.now() - startTime
      
      return {
        duration,
        operation: 'write',
        path,
        size: stat.size,
        success: true
      }
    } catch (error) {
      throw FileOperationError.writeError(path, error as Error)
    }
  }

  /**
   * Calculate total size of directory recursively
   * 
   * @private
   * @param dirPath - Directory to calculate
   * @returns Total size in bytes
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isFile()) {
          const stat = await fs.stat(fullPath)
          totalSize += stat.size
        } else if (entry.isDirectory()) {
          totalSize += await this.calculateDirectorySize(fullPath)
        }
      }
    } catch (error) {
      // If we can't read a subdirectory, continue with what we can read
      console.warn(`Warning: Could not read directory ${dirPath}:`, error)
    }
    
    return totalSize
  }

  /**
   * Ensure parent directory exists for a file path
   * 
   * @private
   * @param filePath - File path to ensure parent exists for
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dirPath = path.dirname(filePath)
    
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch {
      // If mkdir fails, it might be because directory already exists
      // Check if it exists and is a directory
      try {
        const stat = await fs.stat(dirPath)
        if (!stat.isDirectory()) {
          throw new Error(`Parent path exists but is not a directory: ${dirPath}`)
        }
      } catch {
        throw FileOperationError.directoryNotFound(dirPath)
      }
    }
  }
}