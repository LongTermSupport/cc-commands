/**
 * @file File Discovery Service Implementation
 * 
 * Provides comprehensive file discovery capabilities including pattern matching,
 * extension filtering, metadata extraction, and directory structure analysis.
 * All operations are read-only.
 */

import * as glob from 'glob'
import { promises as fs } from 'node:fs'
import { join, parse, resolve } from 'node:path'

import { DirectoryStructureDTO } from '../dto/DirectoryStructureDTO.js'
import { FileDiscoveryResultDTO } from '../dto/FileDiscoveryResultDTO.js'
import { FileMetadataDTO } from '../dto/FileMetadataDTO.js'
import { FileOperationError } from '../errors/FileOperationError.js'
import { IFileDiscoveryService } from '../interfaces/IFileDiscoveryService.js'
import { IFileOperationsService } from '../interfaces/IFileOperationsService.js'
import { TDirectoryEntry, TDirectoryScanOptions, TFileSearchOptions } from '../types/FilesystemTypes.js'

/**
 * Implementation of file discovery service
 * 
 * Provides comprehensive file discovery capabilities with dependency injection.
 * Uses the file operations service for basic file access.
 */
export class FileDiscoveryService implements IFileDiscoveryService {
  
  constructor(
    private readonly fileOperations: IFileOperationsService
  ) {}

  /**
   * Count files and directories in a path
   */
  async countDirectoryContents(
    directory: string, 
    recursive = false
  ): Promise<{ directoryCount: number; fileCount: number; totalSize: number }> {
    
    try {
      if (!(await this.fileOperations.pathExists(directory))) {
        throw FileOperationError.directoryNotFound(directory)
      }
      
      if (!(await this.fileOperations.isDirectory(directory))) {
        throw FileOperationError.invalidPath(directory, 'not a directory')
      }
      
      let fileCount = 0
      let directoryCount = 0
      let totalSize = 0
      
      const entries = await fs.readdir(directory, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(directory, entry.name)
        
        if (entry.isFile()) {
          fileCount++
          const stat = await fs.stat(fullPath)
          totalSize += stat.size
        } else if (entry.isDirectory()) {
          directoryCount++
          
          if (recursive) {
            const subCounts = await this.countDirectoryContents(fullPath, true)
            fileCount += subCounts.fileCount
            directoryCount += subCounts.directoryCount
            totalSize += subCounts.totalSize
          }
        }
      }
      
      return { directoryCount, fileCount, totalSize }
    } catch (error) {
      if (error instanceof Error && error.message.includes('directory')) {
        throw error
      }

      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Find files matching a glob pattern
   */
  async findFiles(directory: string, pattern: string | string[], options?: TFileSearchOptions): Promise<FileDiscoveryResultDTO> {
    if (!directory) {
      throw new Error('Directory path is required')
    }

    if (!pattern || (Array.isArray(pattern) && pattern.length === 0)) {
      throw new Error('Search pattern is required')
    }
    
    const startTime = Date.now()
    const searchDirectory = resolve(directory)
    
    try {
      if (!(await this.fileOperations.pathExists(searchDirectory))) {
        throw FileOperationError.directoryNotFound(searchDirectory)
      }
      
      // Handle both string patterns and arrays of patterns
      let searchPattern: string
      if (Array.isArray(pattern)) {
        searchPattern = pattern.join(',')
        // Use glob pattern syntax for multiple patterns
        let globPattern: string
        if (pattern.length === 1) {
          const singlePattern = pattern[0] || '**/*'
          // Handle patterns that start with **/ (already recursive)
          globPattern = singlePattern.startsWith('**/') 
            ? singlePattern
            : `**/${singlePattern}`
        } else {
          // For multiple patterns, create a group pattern
          const cleanedPatterns = pattern.map(p => p.startsWith('**/') ? p.slice(3) : p)
          globPattern = `**/{${cleanedPatterns.join(',')}}`
        }
        
        let matches: string[]
        try {
          // Use glob.glob with callback converted to Promise
          matches = await new Promise<string[]>((resolve, reject) => {
            (glob as any)(globPattern, {
              absolute: true,  // Return absolute paths
              cwd: searchDirectory,  // Use cwd instead of joining paths
              dot: options?.includeHidden || false,
              ignore: ['**/node_modules/**', '**/.git/**', ...(options?.excludePatterns || [])],
              maxDepth: options?.maxDepth
            }, (err: any, files: string[]) => {
              if (err) reject(err)
              else resolve(files)
            })
          })
        } catch (error) {
          // Log the actual glob error for debugging
          console.error('Glob error:', error)
          throw FileOperationError.readError(searchDirectory, error as Error)
        }
        
        // Ensure matches is an array
        if (!Array.isArray(matches)) {
          console.error('Glob returned non-array:', typeof matches, matches)
          matches = []
        }
        
        const files: FileMetadataDTO[] = []
        
        for (const match of matches) {
          if (await this.fileOperations.isFile(match)) {
            const metadata = await this.getFileMetadata(match)
            files.push(metadata)
          }
        }
        
        const duration = Date.now() - startTime
        
        return FileDiscoveryResultDTO.fromSearchResults(
          files,
          searchPattern,
          searchDirectory,
          { searchDuration: duration }
        )
      }
 
        searchPattern = pattern
        let globPattern = pattern || '**/*'
        // Handle patterns that start with **/ (already recursive) 
        if (!globPattern.startsWith('**/') && !globPattern.startsWith('/')) {
          globPattern = `**/${globPattern}`
        }
        
        let matches: string[]
        try {
          // Use glob.glob with callback converted to Promise
          matches = await new Promise<string[]>((resolve, reject) => {
            (glob as any)(globPattern, {
              absolute: true,  // Return absolute paths
              cwd: searchDirectory,  // Use cwd instead of joining paths
              dot: options?.includeHidden || false,
              ignore: ['**/node_modules/**', '**/.git/**', ...(options?.excludePatterns || [])],
              maxDepth: options?.maxDepth
            }, (err: any, files: string[]) => {
              if (err) reject(err)
              else resolve(files)
            })
          })
        } catch (error) {
          // Log the actual glob error for debugging
          console.error('Glob error:', error)
          throw FileOperationError.readError(searchDirectory, error as Error)
        }
        
        // Ensure matches is an array
        if (!Array.isArray(matches)) {
          console.error('Glob returned non-array:', typeof matches, matches)
          matches = []
        }
        
        const files: FileMetadataDTO[] = []
        
        for (const match of matches) {
          if (await this.fileOperations.isFile(match)) {
            const metadata = await this.getFileMetadata(match)
            files.push(metadata)
          }
        }
        
        const duration = Date.now() - startTime
        
        return FileDiscoveryResultDTO.fromSearchResults(
          files,
          searchPattern,
          searchDirectory,
          { searchDuration: duration }
        )
      
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files by file extensions
   */
  async findFilesByExtension(extensions: string[], directory = '.'): Promise<FileDiscoveryResultDTO> {
    const searchDirectory = resolve(directory)
    
    try {
      // Create glob pattern for extensions
      const extensionPattern = extensions.length === 1 
        ? `**/*${extensions[0]}`
        : `**/*.{${extensions.map(ext => ext.replace('.', '')).join(',')}}`
      
      return await this.findFiles(directory, extensionPattern)
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files modified within a specific time range
   */
  async findFilesByModificationTime(
    directory: string, 
    since: Date, 
    until?: Date
  ): Promise<FileDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = resolve(directory)
    
    try {
      // First find all files
      const allFilesResult = await this.findFiles(directory, '**/*')
      
      // Filter by modification time
      const filteredFiles = allFilesResult.files.filter(file => {
        const modTime = file.modified
        const withinSince = modTime >= since
        const withinUntil = until ? modTime <= until : true
        return withinSince && withinUntil
      })
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        filteredFiles,
        `modified between ${since.toISOString()} and ${until?.toISOString() || 'now'}`,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files larger than specified size
   */
  async findLargeFiles(
    directory: string, 
    minSize: number, 
    pattern = '**/*'
  ): Promise<FileDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = resolve(directory)
    
    try {
      // First find all matching files
      const allFilesResult = await this.findFiles(directory, pattern)
      
      // Filter by size
      const largeFiles = allFilesResult.files.filter(file => file.size >= minSize)
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        largeFiles,
        `${pattern} (min size: ${minSize} bytes)`,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Get directory structure with optional depth limit
   */
  async getDirectoryStructure(
    dirPath: string, 
    options: TDirectoryScanOptions = {}
  ): Promise<DirectoryStructureDTO> {
    const startTime = Date.now()
    const rootPath = resolve(dirPath)
    
    try {
      if (!(await this.fileOperations.pathExists(rootPath))) {
        throw FileOperationError.directoryNotFound(rootPath)
      }
      
      if (!(await this.fileOperations.isDirectory(rootPath))) {
        throw FileOperationError.invalidPath(rootPath, 'not a directory')
      }
      
      const {
        followSymlinks = false,
        includeDirectories = true,
        includeFiles = true,
        maxDepth = 10,
        sortBy = 'name',
        sortOrder = 'asc'
      } = options
      
      const entries = await this.scanDirectoryRecursive(
        rootPath,
        0,
        maxDepth,
        { followSymlinks, includeDirectories, includeFiles, sortBy, sortOrder }
      )
      
      const duration = Date.now() - startTime
      const counts = await this.countDirectoryContents(rootPath, true)
      
      return DirectoryStructureDTO.fromDirectoryScan(
        rootPath,
        entries,
        {
          maxDepthScanned: maxDepth,
          scanDuration: duration,
          totalDirectories: counts.directoryCount,
          totalFiles: counts.fileCount,
          totalSize: counts.totalSize
        }
      )
    } catch (error) {
      throw FileOperationError.readError(rootPath, error as Error)
    }
  }

  /**
   * Get detailed metadata for a specific file
   */
  async getFileMetadata(filePath: string): Promise<FileMetadataDTO> {
    const resolvedPath = resolve(filePath)
    
    try {
      if (!(await this.fileOperations.pathExists(resolvedPath))) {
        throw FileOperationError.fileNotFound(resolvedPath)
      }
      
      const stat = await fs.stat(resolvedPath)
      const parsedPath = parse(resolvedPath)
      
      return new FileMetadataDTO(
        resolvedPath,
        parsedPath.name,
        stat.size,
        stat.birthtime,
        stat.mtime,
        this.formatPermissions(stat.mode),
        stat.isDirectory(),
        parsedPath.ext || undefined
      )
    } catch (error) {
      throw FileOperationError.readError(resolvedPath, error as Error)
    }
  }

  /**
   * Get file preview (required by tests)
   * 
   * @param filePath - Path to file to preview
   * @param options - Preview options
   * @returns Promise resolving to file preview data
   */
  async getFilePreview(
    filePath: string,
    options?: { encoding?: string; maxLines?: number }
  ): Promise<{
    content: string
    encoding: string
    filePath: string
    isBinary: boolean
    isComplete: boolean
    lineCount: number
    path: string
    size: number
  }> {
    if (!filePath) {
      throw new Error('File path is required')
    }

    if (!(await this.fileOperations.pathExists(filePath))) {
      throw FileOperationError.fileNotFound(filePath, 'preview')
    }

    if (await this.fileOperations.isDirectory(filePath)) {
      throw FileOperationError.invalidPath(filePath, 'path is a directory, not a file')
    }

    try {
      const encoding = (options?.encoding as BufferEncoding) ?? 'utf8'
      const maxLines = options?.maxLines ?? 100
      
      // Read file content
      let content: string
      try {
        content = await this.fileOperations.readFile(filePath, encoding)
      } catch {
        // Might be binary file, try reading as buffer
        const buffer = await this.fileOperations.readFileBuffer(filePath)
        const isBinary = this.isBinaryContent(buffer)
        
        if (isBinary) {
          return {
            content: `[Binary file - ${buffer.length} bytes]`,
            encoding,
            filePath,
            isBinary: true,
            isComplete: true,
            lineCount: 1,
        path: filePath,
            size: buffer.length
          }
        }
        
        content = buffer.toString(encoding)
      }

      const lines = content.split('\n')
      const isComplete = lines.length <= maxLines
      const previewContent = isComplete ? content : lines.slice(0, maxLines).join('\n')
      
      return {
        content: previewContent,
        encoding,
        filePath,
        isBinary: false,
        isComplete,
        lineCount: lines.length,
        path: filePath,
        size: Buffer.from(content, encoding).length
      }

    } catch (error) {
      throw FileOperationError.readError(filePath, error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get files by type (required by tests)
   * 
   * @param directory - Directory to search
   * @param fileType - Type of files to find
   * @returns Promise resolving to FileDiscoveryResultDTO
   */
  async getFilesByType(
    directory: string,
    fileType: 'configuration' | 'documentation' | 'source-code' | string
  ): Promise<FileDiscoveryResultDTO> {
    const extensions: Record<string, string[]> = {
      'configuration': ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config', '.env'],
      'documentation': ['.md', '.txt', '.rst', '.adoc', '.tex'],
      'source-code': ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.kt']
    }

    const typeExtensions = extensions[fileType]
    if (!typeExtensions) {
      throw FileOperationError.invalidPath(fileType, `Unknown file type. Use one of: ${Object.keys(extensions).join(', ')}`)
    }

    return await this.findFilesByExtension(typeExtensions, directory)
  }

  /**
   * Get metadata for multiple files
   */
  async getMultipleFileMetadata(paths: string[]): Promise<FileMetadataDTO[]> {
    const results: FileMetadataDTO[] = []
    
    for (const filePath of paths) {
      try {
        const metadata = await this.getFileMetadata(filePath)
        results.push(metadata)
      } catch (error) {
        // Continue with other files if one fails
        console.warn(`Warning: Could not get metadata for ${filePath}:`, error)
      }
    }
    
    return results
  }

  /**
   * Scan directory with options (required by tests)
   * 
   * @param directory - Directory to scan
   * @param options - Scan options
   * @returns Promise resolving to FileDiscoveryResultDTO
   */
  async scanDirectory(
    directory: string, 
    options?: TDirectoryScanOptions
  ): Promise<DirectoryStructureDTO> {
    if (!directory) {
      throw new Error('Directory path is required')
    }

    if (!(await this.fileOperations.pathExists(directory))) {
      throw FileOperationError.directoryNotFound(directory)
    }

    if (!(await this.fileOperations.isDirectory(directory))) {
      throw FileOperationError.invalidPath(directory, 'not a directory')
    }

    try {
      // Use existing getDirectoryStructure method to scan directory
      const result = await this.getDirectoryStructure(directory, options)
      return result

    } catch (error) {
      throw FileOperationError.readError(directory, error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Advanced file search with multiple criteria
   */
  async searchFiles(options: TFileSearchOptions): Promise<FileDiscoveryResultDTO> {
    const {
      directory = '.',
      excludePatterns = [],
      extensions,
      includeHidden = false,
      maxDepth,
      pattern = '**/*'
    } = options
    
    const startTime = Date.now()
    const searchDirectory = resolve(directory)
    
    try {
      let searchPattern = pattern
      
      // If extensions specified, modify pattern
      if (extensions && extensions.length > 0) {
        const extPattern = extensions.length === 1 
          ? `**/*${extensions[0]}`
          : `**/*.{${extensions.map(ext => ext.replace('.', '')).join(',')}}`
        searchPattern = extPattern
      }
      
      const fullPattern = join(searchDirectory, searchPattern)
      const ignorePatterns = [
        ...excludePatterns,
        '**/node_modules/**',
        '**/.git/**'
      ]
      
      const matches = await new Promise<string[]>((resolve, reject) => {
        (glob as any)(fullPattern, {
          dot: includeHidden,
          ignore: ignorePatterns,
          maxDepth
        }, (err: any, files: string[]) => {
          if (err) reject(err)
          else resolve(files)
        })
      })
      
      const files: FileMetadataDTO[] = []
      
      for (const match of matches) {
        if (await this.fileOperations.isFile(match)) {
          const metadata = await this.getFileMetadata(match)
          files.push(metadata)
        }
      }
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        files,
        searchPattern,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Check if a file exists and is accessible
   */
  async validateFileExists(path: string): Promise<boolean> {
    try {
      return await this.fileOperations.pathExists(path) && await this.fileOperations.isFile(path)
    } catch {
      return false
    }
  }

  /**
   * Format file permissions from mode number
   * 
   * @private
   * @param mode - File mode from fs.Stats
   * @returns Formatted permissions string (e.g., 'rwxr-xr-x')
   */
  private formatPermissions(mode: number): string {
    // eslint-disable-next-line no-bitwise
    const perms = mode & 0o777
    // eslint-disable-next-line no-bitwise
    const owner = (perms >> 6) & 7
    // eslint-disable-next-line no-bitwise
    const group = (perms >> 3) & 7
    // eslint-disable-next-line no-bitwise
    const other = perms & 7
    
    // eslint-disable-next-line no-bitwise
    const toRwx = (n: number): string => (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-')
    
    return toRwx(owner) + toRwx(group) + toRwx(other)
  }

  /**
   * Check if buffer content appears to be binary
   * 
   * @private
   * @param buffer - Buffer to check
   * @returns True if content appears binary
   */
  private isBinaryContent(buffer: Buffer): boolean {
    // Simple binary detection - look for null bytes in first 512 bytes
    const sampleSize = Math.min(buffer.length, 512)
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0) {
        return true
      }
    }

    return false
  }

  /**
   * Recursively scan directory structure
   * 
   * @private
   * @param dirPath - Directory to scan
   * @param currentDepth - Current recursion depth
   * @param maxDepth - Maximum depth to scan
   * @param options - Scan options
   * @returns Array of directory entries
   */
  private async scanDirectoryRecursive(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
    options: {
      followSymlinks: boolean
      includeDirectories: boolean
      includeFiles: boolean
      sortBy: 'modified' | 'name' | 'size'
      sortOrder: 'asc' | 'desc'
    }
  ): Promise<TDirectoryEntry[]> {
    if (currentDepth >= maxDepth) {
      return []
    }
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const results: TDirectoryEntry[] = []
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name)
        
        // Handle symlinks
        if (entry.isSymbolicLink() && !options.followSymlinks) {
          continue
        }
        
        let stat: Awaited<ReturnType<typeof fs.stat>>
        try {
          stat = await fs.stat(fullPath)
        } catch {
          continue // Skip inaccessible entries
        }
        
        const isDirectory = stat.isDirectory()
        const isFile = stat.isFile()
        
        // Filter by type
        if (isFile && !options.includeFiles) continue
        if (isDirectory && !options.includeDirectories) continue
        
        const directoryEntry: TDirectoryEntry = {
          modified: stat.mtime,
          name: entry.name,
          path: fullPath,
          size: isFile ? stat.size : undefined,
          type: isDirectory ? 'directory' : 'file'
        }
        
        // Recursively scan subdirectories
        if (isDirectory && currentDepth + 1 < maxDepth) {
          try {
            directoryEntry.children = await this.scanDirectoryRecursive(
              fullPath,
              currentDepth + 1,
              maxDepth,
              options
            )
          } catch {
            // Continue if subdirectory is inaccessible
            directoryEntry.children = []
          }
        }
        
        results.push(directoryEntry)
      }
      
      // Sort results
      return this.sortDirectoryEntries(results, options.sortBy, options.sortOrder)
    } catch (error) {
      throw FileOperationError.readError(dirPath, error as Error)
    }
  }

  /**
   * Sort directory entries by specified criteria
   * 
   * @private
   * @param entries - Entries to sort
   * @param sortBy - Sort criteria
   * @param sortOrder - Sort order
   * @returns Sorted entries
   */
  private sortDirectoryEntries(
    entries: TDirectoryEntry[],
    sortBy: 'modified' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ): TDirectoryEntry[] {
    return entries.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'modified': {
          comparison = (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0)
          break
        }

        case 'name': {
          comparison = a.name.localeCompare(b.name)
          break
        }

        case 'size': {
          comparison = (a.size || 0) - (b.size || 0)
          break
        }
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }
}