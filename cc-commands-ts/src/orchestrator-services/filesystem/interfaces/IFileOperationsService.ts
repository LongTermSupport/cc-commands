/**
 * @file File operations service interface
 *
 * Defines the contract for basic file system operations including
 * reading, writing, copying, moving, and deleting files and directories.
 * All operations are atomic and include proper error handling.
 */

/// <reference types="node" />
import type { TFileOperationResult } from '../types/FilesystemTypes.js'

/**
 * Service interface for file system operations
 * 
 * Provides atomic file operations with consistent error handling
 * and operation tracking. All methods return structured results
 * indicating success/failure and operation details.
 */
export interface IFileOperationsService {
  /**
   * Append content to existing file
   * 
   * Creates the file if it doesn't exist.
   * Creates parent directories if they don't exist.
   * 
   * @param path - Path to the file to append to
   * @param content - Content to append
   * @param encoding - Text encoding (default: 'utf8')
   * @returns Promise resolving to operation result
   */
  appendFile(
    path: string, 
    content: string, 
    encoding?: BufferEncoding
  ): Promise<TFileOperationResult>

  /**
   * Copy a file to a new location
   * 
   * Creates parent directories of destination if they don't exist.
   * Preserves file permissions and timestamps.
   * 
   * @param sourcePath - Path to the source file
   * @param destinationPath - Path for the copied file
   * @param overwrite - Whether to overwrite existing destination (default: false)
   * @returns Promise resolving to operation result
   */
  copyFile(
    sourcePath: string, 
    destinationPath: string, 
    overwrite?: boolean
  ): Promise<TFileOperationResult>

  /**
   * Create a directory
   * 
   * Creates parent directories recursively if they don't exist.
   * No error if directory already exists.
   * 
   * @param path - Path to the directory to create
   * @param mode - Directory permissions (default: 0o755)
   * @returns Promise resolving to operation result
   */
  createDirectory(path: string, mode?: number): Promise<TFileOperationResult>

  /**
   * Create temporary directory
   * 
   * Creates a temporary directory with unique name in system temp directory.
   * 
   * @param prefix - Directory name prefix (default: 'tmp-')
   * @returns Promise resolving to object with temp directory path and cleanup function
   */
  createTempDirectory(prefix?: string): Promise<{
    cleanup: () => Promise<void>
    path: string
  }>

  /**
   * Create temporary file
   * 
   * Creates a temporary file with unique name in system temp directory.
   * 
   * @param prefix - Filename prefix (default: 'tmp-')
   * @param suffix - Filename suffix (default: '.tmp')
   * @returns Promise resolving to object with temp file path and cleanup function
   */
  createTempFile(prefix?: string, suffix?: string): Promise<{
    cleanup: () => Promise<void>
    path: string
  }>

  /**
   * Delete a directory
   * 
   * @param path - Path to the directory to delete
   * @param recursive - Whether to delete contents recursively (default: false)
   * @param force - Whether to force deletion of read-only items (default: false)
   * @returns Promise resolving to operation result
   */
  deleteDirectory(
    path: string, 
    recursive?: boolean, 
    force?: boolean
  ): Promise<TFileOperationResult>

  /**
   * Delete a file
   * 
   * @param path - Path to the file to delete
   * @param force - Whether to force deletion of read-only files (default: false)
   * @returns Promise resolving to operation result
   */
  deleteFile(path: string, force?: boolean): Promise<TFileOperationResult>

  /**
   * Get file or directory size
   * 
   * For directories, calculates total size of all contents.
   * 
   * @param path - Path to measure
   * @param recursive - For directories, whether to include subdirectories (default: true)
   * @returns Promise resolving to size in bytes
   */
  getSize(path: string, recursive?: boolean): Promise<number>

  /**
   * Check if path is a directory
   * 
   * @param path - Path to check
   * @returns Promise resolving to true if path is a directory
   */
  isDirectory(path: string): Promise<boolean>

  /**
   * Check if path is a file
   * 
   * @param path - Path to check
   * @returns Promise resolving to true if path is a file
   */
  isFile(path: string): Promise<boolean>

  /**
   * Move/rename a file
   * 
   * Creates parent directories of destination if they don't exist.
   * Atomic operation when possible.
   * 
   * @param sourcePath - Current path of the file
   * @param destinationPath - New path for the file
   * @param overwrite - Whether to overwrite existing destination (default: false)
   * @returns Promise resolving to operation result
   */
  moveFile(
    sourcePath: string, 
    destinationPath: string, 
    overwrite?: boolean
  ): Promise<TFileOperationResult>

  /**
   * Check if path exists
   * 
   * @param path - Path to check
   * @returns Promise resolving to true if path exists
   */
  pathExists(path: string): Promise<boolean>

  /**
   * Read file contents as string
   * 
   * @param path - Path to the file to read
   * @param encoding - Text encoding (default: 'utf8')
   * @returns Promise resolving to file contents as string
   * @throws FileOperationError if file can't be read
   */
  readFile(path: string, encoding?: BufferEncoding): Promise<string>

  /**
   * Read file contents as buffer
   * 
   * @param path - Path to the file to read
   * @returns Promise resolving to file contents as Buffer
   * @throws FileOperationError if file can't be read
   */
  readFileBuffer(path: string): Promise<Buffer>

  /**
   * Set file permissions
   * 
   * @param path - Path to the file or directory
   * @param mode - Permission mode (e.g., 0o644, 0o755)
   * @returns Promise resolving to operation result
   */
  setPermissions(path: string, mode: number): Promise<TFileOperationResult>

  /**
   * Watch file or directory for changes
   * 
   * @param path - Path to watch
   * @param callback - Callback function for change events
   * @returns Promise resolving to watcher object with close method
   */
  watchPath(
    path: string,
    callback: (eventType: 'change' | 'rename', filename?: string) => void
  ): Promise<{
    close: () => void
  }>

  /**
   * Write content to file
   * 
   * Creates parent directories if they don't exist.
   * Overwrites existing files.
   * 
   * @param path - Path to the file to write
   * @param content - Content to write (string or Buffer)
   * @param encoding - Text encoding for string content (default: 'utf8')
   * @returns Promise resolving to operation result
   */
  writeFile(
    path: string, 
    content: Buffer | string, 
    encoding?: BufferEncoding
  ): Promise<TFileOperationResult>
}