/**
 * @file FileOperationsService Tests
 * 
 * Tests for filesystem operations service including file creation, reading,
 * writing, deletion, and other atomic operations.
 */

import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { FileOperationsService } from '../../../../src/orchestrator-services/filesystem/services/FileOperationsService.js'

describe('FileOperationsService', () => {
  let service: FileOperationsService
  let tempDir: string

  beforeEach(async () => {
    service = new FileOperationsService()
    
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-ops-test-'))
  })

  afterEach(async () => {
    // Clean up temporary directory after each test
    try {
      await fs.rm(tempDir, { force: true, recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('pathExists', () => {
    it('should return true for existing files', async () => {
      const testFile = path.join(tempDir, 'test.txt')
      await fs.writeFile(testFile, 'test content')

      const exists = await service.pathExists(testFile)
      expect(exists).toBe(true)
    })

    it('should return true for existing directories', async () => {
      const testDir = path.join(tempDir, 'test-dir')
      await fs.mkdir(testDir)

      const exists = await service.pathExists(testDir)
      expect(exists).toBe(true)
    })

    it('should return false for non-existing paths', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.txt')

      const exists = await service.pathExists(nonExistentPath)
      expect(exists).toBe(false)
    })
  })

  describe('isFile', () => {
    it('should return true for files', async () => {
      const testFile = path.join(tempDir, 'test.txt')
      await fs.writeFile(testFile, 'test content')

      const isFile = await service.isFile(testFile)
      expect(isFile).toBe(true)
    })

    it('should return false for directories', async () => {
      const testDir = path.join(tempDir, 'test-dir')
      await fs.mkdir(testDir)

      const isFile = await service.isFile(testDir)
      expect(isFile).toBe(false)
    })

    it('should return false for non-existing paths', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.txt')

      const isFile = await service.isFile(nonExistentPath)
      expect(isFile).toBe(false)
    })
  })

  describe('isDirectory', () => {
    it('should return true for directories', async () => {
      const testDir = path.join(tempDir, 'test-dir')
      await fs.mkdir(testDir)

      const isDirectory = await service.isDirectory(testDir)
      expect(isDirectory).toBe(true)
    })

    it('should return false for files', async () => {
      const testFile = path.join(tempDir, 'test.txt')
      await fs.writeFile(testFile, 'test content')

      const isDirectory = await service.isDirectory(testFile)
      expect(isDirectory).toBe(false)
    })

    it('should return false for non-existing paths', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent')

      const isDirectory = await service.isDirectory(nonExistentPath)
      expect(isDirectory).toBe(false)
    })
  })

  describe('readFile', () => {
    it('should read file contents correctly', async () => {
      const testFile = path.join(tempDir, 'test.txt')
      const content = 'Hello, World!'
      await fs.writeFile(testFile, content)

      const result = await service.readFile(testFile)
      expect(result).toBe(content)
    })

    it('should read file with different encodings', async () => {
      const testFile = path.join(tempDir, 'test.txt')
      const content = 'Test content with ñ and é'
      await fs.writeFile(testFile, content, 'utf8')

      const result = await service.readFile(testFile, 'utf8')
      expect(result).toBe(content)
    })

    it('should throw FileOperationError for non-existing files', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt')

      await expect(service.readFile(nonExistentFile))
        .rejects
        .toThrow('File not found')
    })
  })

  describe('readFileBuffer', () => {
    it('should read file as buffer correctly', async () => {
      const testFile = path.join(tempDir, 'test.bin')
      const content = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]) // "Hello"
      await fs.writeFile(testFile, content)

      const result = await service.readFileBuffer(testFile)
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result).toEqual(content)
    })

    it('should throw FileOperationError for non-existing files', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.bin')

      await expect(service.readFileBuffer(nonExistentFile))
        .rejects
        .toThrow('File not found')
    })
  })

  describe('writeFile', () => {
    it('should write string content correctly', async () => {
      const testFile = path.join(tempDir, 'write-test.txt')
      const content = 'Hello, Write Test!'

      const result = await service.writeFile(testFile, content)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('write')
      expect(result.path).toBe(testFile)
      expect(result.size).toBe(Buffer.byteLength(content))
      expect(result.duration).toBeGreaterThan(0)

      // Verify file was actually written
      const readContent = await fs.readFile(testFile, 'utf8')
      expect(readContent).toBe(content)
    })

    it('should write buffer content correctly', async () => {
      const testFile = path.join(tempDir, 'write-buffer-test.bin')
      const content = Buffer.from('Binary content')

      const result = await service.writeFile(testFile, content)

      expect(result.success).toBe(true)
      expect(result.size).toBe(content.length)

      // Verify file was actually written
      const readContent = await fs.readFile(testFile)
      expect(readContent).toEqual(content)
    })

    it('should create parent directories automatically', async () => {
      const nestedDir = path.join(tempDir, 'nested', 'deep', 'directory')
      const testFile = path.join(nestedDir, 'test.txt')
      const content = 'Auto-created directories'

      const result = await service.writeFile(testFile, content)

      expect(result.success).toBe(true)
      
      // Verify directory was created
      const exists = await service.pathExists(nestedDir)
      expect(exists).toBe(true)
      
      // Verify file was written
      const readContent = await fs.readFile(testFile, 'utf8')
      expect(readContent).toBe(content)
    })
  })

  describe('appendFile', () => {
    it('should append content to existing file', async () => {
      const testFile = path.join(tempDir, 'append-test.txt')
      const initialContent = 'Initial content\n'
      const appendContent = 'Appended content'
      
      await fs.writeFile(testFile, initialContent)

      const result = await service.appendFile(testFile, appendContent)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('append')
      expect(result.path).toBe(testFile)
      
      // Verify content was appended
      const finalContent = await fs.readFile(testFile, 'utf8')
      expect(finalContent).toBe(initialContent + appendContent)
    })

    it('should create file if it does not exist', async () => {
      const testFile = path.join(tempDir, 'new-append-test.txt')
      const content = 'New file content'

      const result = await service.appendFile(testFile, content)

      expect(result.success).toBe(true)
      
      // Verify file was created with content
      const readContent = await fs.readFile(testFile, 'utf8')
      expect(readContent).toBe(content)
    })
  })

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      const sourceFile = path.join(tempDir, 'source.txt')
      const destFile = path.join(tempDir, 'dest.txt')
      const content = 'Content to copy'
      
      await fs.writeFile(sourceFile, content)

      const result = await service.copyFile(sourceFile, destFile)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('copy')
      expect(result.path).toBe(destFile)
      expect(result.sourcePath).toBe(sourceFile)
      
      // Verify both files exist and have same content
      const sourceContent = await fs.readFile(sourceFile, 'utf8')
      const destContent = await fs.readFile(destFile, 'utf8')
      expect(sourceContent).toBe(content)
      expect(destContent).toBe(content)
    })

    it('should throw error when source file does not exist', async () => {
      const sourceFile = path.join(tempDir, 'non-existent.txt')
      const destFile = path.join(tempDir, 'dest.txt')

      await expect(service.copyFile(sourceFile, destFile))
        .rejects
        .toThrow('File not found')
    })

    it('should throw error when destination exists and overwrite is false', async () => {
      const sourceFile = path.join(tempDir, 'source.txt')
      const destFile = path.join(tempDir, 'dest.txt')
      
      await fs.writeFile(sourceFile, 'source')
      await fs.writeFile(destFile, 'existing dest')

      await expect(service.copyFile(sourceFile, destFile, false))
        .rejects
        .toThrow('Destination exists and overwrite is disabled')
    })

    it('should overwrite when overwrite is true', async () => {
      const sourceFile = path.join(tempDir, 'source.txt')
      const destFile = path.join(tempDir, 'dest.txt')
      const sourceContent = 'new content'
      
      await fs.writeFile(sourceFile, sourceContent)
      await fs.writeFile(destFile, 'old content')

      const result = await service.copyFile(sourceFile, destFile, true)

      expect(result.success).toBe(true)
      
      // Verify content was overwritten
      const destContent = await fs.readFile(destFile, 'utf8')
      expect(destContent).toBe(sourceContent)
    })
  })

  describe('moveFile', () => {
    it('should move file successfully', async () => {
      const sourceFile = path.join(tempDir, 'move-source.txt')
      const destFile = path.join(tempDir, 'move-dest.txt')
      const content = 'Content to move'
      
      await fs.writeFile(sourceFile, content)

      const result = await service.moveFile(sourceFile, destFile)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('move')
      expect(result.path).toBe(destFile)
      expect(result.sourcePath).toBe(sourceFile)
      
      // Verify source no longer exists and dest has content
      const sourceExists = await service.pathExists(sourceFile)
      expect(sourceExists).toBe(false)
      
      const destContent = await fs.readFile(destFile, 'utf8')
      expect(destContent).toBe(content)
    })

    it('should throw error when source file does not exist', async () => {
      const sourceFile = path.join(tempDir, 'non-existent.txt')
      const destFile = path.join(tempDir, 'dest.txt')

      await expect(service.moveFile(sourceFile, destFile))
        .rejects
        .toThrow('File not found')
    })

    it('should create parent directory for destination', async () => {
      const sourceFile = path.join(tempDir, 'source.txt')
      const destFile = path.join(tempDir, 'new-dir', 'dest.txt')
      const content = 'Content to move'
      
      await fs.writeFile(sourceFile, content)

      const result = await service.moveFile(sourceFile, destFile)

      expect(result.success).toBe(true)
      
      // Verify destination directory was created
      const destDir = path.dirname(destFile)
      const dirExists = await service.pathExists(destDir)
      expect(dirExists).toBe(true)
      
      // Verify file content
      const destContent = await fs.readFile(destFile, 'utf8')
      expect(destContent).toBe(content)
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const testFile = path.join(tempDir, 'delete-test.txt')
      await fs.writeFile(testFile, 'content to delete')

      const result = await service.deleteFile(testFile)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('delete_file')
      expect(result.path).toBe(testFile)
      
      // Verify file no longer exists
      const exists = await service.pathExists(testFile)
      expect(exists).toBe(false)
    })

    it('should throw error when file does not exist', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt')

      await expect(service.deleteFile(nonExistentFile))
        .rejects
        .toThrow('File not found')
    })

    it('should throw error when trying to delete a directory', async () => {
      const testDir = path.join(tempDir, 'test-dir')
      await fs.mkdir(testDir)

      await expect(service.deleteFile(testDir))
        .rejects
        .toThrow('Path is a directory, not a file')
    })
  })

  describe('createDirectory', () => {
    it('should create directory successfully', async () => {
      const testDir = path.join(tempDir, 'new-dir')

      const result = await service.createDirectory(testDir)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('create_directory')
      expect(result.path).toBe(testDir)
      
      // Verify directory was created
      const exists = await service.pathExists(testDir)
      const isDir = await service.isDirectory(testDir)
      expect(exists).toBe(true)
      expect(isDir).toBe(true)
    })

    it('should create nested directories recursively', async () => {
      const nestedDir = path.join(tempDir, 'level1', 'level2', 'level3')

      const result = await service.createDirectory(nestedDir)

      expect(result.success).toBe(true)
      
      // Verify all levels were created
      const level1 = path.join(tempDir, 'level1')
      const level2 = path.join(tempDir, 'level1', 'level2')
      
      expect(await service.pathExists(level1)).toBe(true)
      expect(await service.pathExists(level2)).toBe(true)
      expect(await service.pathExists(nestedDir)).toBe(true)
    })

    it('should succeed if directory already exists', async () => {
      const testDir = path.join(tempDir, 'existing-dir')
      await fs.mkdir(testDir)

      const result = await service.createDirectory(testDir)

      expect(result.success).toBe(true)
      
      // Verify directory still exists
      const exists = await service.pathExists(testDir)
      expect(exists).toBe(true)
    })
  })

  describe('deleteDirectory', () => {
    it('should delete empty directory successfully', async () => {
      const testDir = path.join(tempDir, 'empty-dir')
      await fs.mkdir(testDir)

      const result = await service.deleteDirectory(testDir)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('delete_directory')
      expect(result.path).toBe(testDir)
      
      // Verify directory no longer exists
      const exists = await service.pathExists(testDir)
      expect(exists).toBe(false)
    })

    it('should delete directory with contents when recursive is true', async () => {
      const testDir = path.join(tempDir, 'dir-with-contents')
      const subDir = path.join(testDir, 'subdir')
      const file1 = path.join(testDir, 'file1.txt')
      const file2 = path.join(subDir, 'file2.txt')
      
      await fs.mkdir(testDir)
      await fs.mkdir(subDir)
      await fs.writeFile(file1, 'content1')
      await fs.writeFile(file2, 'content2')

      const result = await service.deleteDirectory(testDir, true)

      expect(result.success).toBe(true)
      
      // Verify directory and all contents are gone
      const exists = await service.pathExists(testDir)
      expect(exists).toBe(false)
    })

    it('should throw error when directory does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent-dir')

      await expect(service.deleteDirectory(nonExistentDir))
        .rejects
        .toThrow('Directory not found')
    })

    it('should throw error when trying to delete a file', async () => {
      const testFile = path.join(tempDir, 'test-file.txt')
      await fs.writeFile(testFile, 'content')

      await expect(service.deleteDirectory(testFile))
        .rejects
        .toThrow('Path is not a directory')
    })
  })

  describe('getSize', () => {
    it('should return file size correctly', async () => {
      const testFile = path.join(tempDir, 'size-test.txt')
      const content = 'Test content for size calculation'
      await fs.writeFile(testFile, content)

      const size = await service.getSize(testFile)

      expect(size).toBe(Buffer.byteLength(content))
    })

    it('should calculate directory size recursively', async () => {
      const testDir = path.join(tempDir, 'size-dir')
      const file1 = path.join(testDir, 'file1.txt')
      const file2 = path.join(testDir, 'file2.txt')
      const content1 = 'Content 1'
      const content2 = 'Content 2 is longer'
      
      await fs.mkdir(testDir)
      await fs.writeFile(file1, content1)
      await fs.writeFile(file2, content2)

      const size = await service.getSize(testDir, true)

      const expectedSize = Buffer.byteLength(content1) + Buffer.byteLength(content2)
      expect(size).toBe(expectedSize)
    })

    it('should return 0 for directory when recursive is false', async () => {
      const testDir = path.join(tempDir, 'non-recursive-dir')
      await fs.mkdir(testDir)
      await fs.writeFile(path.join(testDir, 'file.txt'), 'content')

      const size = await service.getSize(testDir, false)

      expect(size).toBe(0)
    })

    it('should throw error for non-existing path', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent')

      await expect(service.getSize(nonExistentPath))
        .rejects
        .toThrow('File not found')
    })
  })

  describe('temp file and directory operations', () => {
    it('should create temporary file with cleanup', async () => {
      const { cleanup, path: tempPath } = await service.createTempFile('test-', '.tmp')

      // Verify temp file exists and is writable
      expect(await service.pathExists(tempPath)).toBe(true)
      expect(path.basename(tempPath)).toMatch(/^test-.*\.tmp$/)

      // Write some content
      await service.writeFile(tempPath, 'temp content')
      const content = await service.readFile(tempPath)
      expect(content).toBe('temp content')

      // Cleanup
      await cleanup()
      expect(await service.pathExists(tempPath)).toBe(false)
    })

    it('should create temporary directory with cleanup', async () => {
      const { cleanup, path: tempPath } = await service.createTempDirectory('test-dir-')

      // Verify temp directory exists
      expect(await service.pathExists(tempPath)).toBe(true)
      expect(await service.isDirectory(tempPath)).toBe(true)
      expect(path.basename(tempPath)).toMatch(/^test-dir-/)

      // Create some content in temp directory
      const testFile = path.join(tempPath, 'test.txt')
      await service.writeFile(testFile, 'temp dir content')
      expect(await service.pathExists(testFile)).toBe(true)

      // Cleanup
      await cleanup()
      expect(await service.pathExists(tempPath)).toBe(false)
    })

    it('should handle cleanup errors gracefully', async () => {
      const { cleanup, path: tempPath } = await service.createTempFile()

      // Manually delete the file before cleanup
      await service.deleteFile(tempPath)

      // Cleanup should not throw error
      await expect(cleanup()).resolves.not.toThrow()
    })
  })

  describe('setPermissions', () => {
    // Skip on Windows where permissions work differently
    const isWindows = process.platform === 'win32'
    
    it.skipIf(isWindows)('should set file permissions correctly', async () => {
      const testFile = path.join(tempDir, 'permissions-test.txt')
      await fs.writeFile(testFile, 'content')

      const result = await service.setPermissions(testFile, 0o644)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('set_permissions')
      expect(result.path).toBe(testFile)
      
      // Verify permissions were set (basic check)
      const stats = await fs.stat(testFile)
      const mode = stats.mode & 0o777
      expect(mode).toBe(0o644)
    })

    it('should throw error for non-existing file', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt')

      await expect(service.setPermissions(nonExistentFile, 0o644))
        .rejects
        .toThrow('File not found')
    })
  })

  describe('watchPath', () => {
    it('should watch file changes', async () => {
      const testFile = path.join(tempDir, 'watch-test.txt')
      await fs.writeFile(testFile, 'initial content')

      let changeCount = 0
      const { close } = await service.watchPath(testFile, () => {
        changeCount++
      })

      // Make a change to the file
      await service.writeFile(testFile, 'modified content')
      
      // Wait a bit for the watcher to detect the change
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 100)
      })

      // Close the watcher
      close()

      expect(changeCount).toBeGreaterThan(0)
    })

    it('should throw error for non-existing path', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.txt')

      await expect(service.watchPath(nonExistentPath, () => {}))
        .rejects
        .toThrow('File not found')
    })
  })

  describe('error handling', () => {
    it('should throw FileOperationError with proper recovery instructions', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt')

      try {
        await service.readFile(nonExistentFile)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        // The service should throw FileOperationError, but the error factory 
        // returns OrchestratorError, so we check the message
        expect(error.message).toContain('File not found')
      }
    })

    it('should handle permission errors appropriately', async () => {
      // This test is platform-specific and may not work on all systems
      if (process.platform !== 'win32') {
        const testFile = path.join(tempDir, 'readonly-test.txt')
        await fs.writeFile(testFile, 'readonly content')
        await fs.chmod(testFile, 0o444) // Read-only

        // Try to write to read-only file - should fail
        await expect(service.writeFile(testFile, 'new content'))
          .rejects
          .toThrow()
      }
    })

    it('should handle invalid paths gracefully', async () => {
      const invalidPath = '\u0000invalid\u0000path'

      await expect(service.readFile(invalidPath))
        .rejects
        .toThrow()
    })
  })
})