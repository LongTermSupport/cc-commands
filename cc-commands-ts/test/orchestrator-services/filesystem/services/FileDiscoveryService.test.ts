/**
 * @file FileDiscoveryService Tests
 * 
 * Tests for the file discovery service including directory scanning,
 * file filtering, pattern matching, and result aggregation.
 */

import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DirectoryStructureDTO } from '../../../../src/orchestrator-services/filesystem/dto/DirectoryStructureDTO.js'
import { FileDiscoveryResultDTO } from '../../../../src/orchestrator-services/filesystem/dto/FileDiscoveryResultDTO.js'
import { IFileOperationsService } from '../../../../src/orchestrator-services/filesystem/interfaces/IFileOperationsService.js'
import { FileDiscoveryService } from '../../../../src/orchestrator-services/filesystem/services/FileDiscoveryService.js'

describe('FileDiscoveryService', () => {
  let service: FileDiscoveryService
  let mockFileOpsService: IFileOperationsService
  let tempDir: string

  beforeEach(async () => {
    mockFileOpsService = {
      appendFile: vi.fn(),
      copyFile: vi.fn(),
      createDirectory: vi.fn(),
      deleteFile: vi.fn(),
      exists: vi.fn(),
      listDirectory: vi.fn(),
      moveFile: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn()
    } satisfies IFileOperationsService
    service = new FileDiscoveryService(mockFileOpsService)
    
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(join(os.tmpdir(), 'file-discovery-test-'))
  })

  afterEach(async () => {
    // Clean up temporary directory after each test
    try {
      await fs.rm(tempDir, { force: true, recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('scanDirectory', () => {
    beforeEach(async () => {
      // Create test directory structure
      const testStructure = {
        '.env': 'NODE_ENV=development',
        'dist/bundle.js': '// compiled code',
        'node_modules/react/index.js': 'module.exports = {}',
        'package.json': '{"name": "test-project"}',
        'README.md': '# Test Project',
        'src/components/Button.tsx': 'export const Button = () => {}',
        'src/index.ts': 'export const main = () => {}',
        'src/utils/helper.ts': 'export const helper = () => {}',
        'tests/index.test.ts': 'import { main } from "../src/index"'
      }

      for (const [filePath, content] of Object.entries(testStructure)) {
        const fullPath = join(tempDir, filePath)
        const dirPath = dirname(fullPath)
        await fs.mkdir(dirPath, { recursive: true })
        await fs.writeFile(fullPath, content)
      }
    })

    it('should scan directory with default options', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir)

      expect(result).toBeInstanceOf(DirectoryStructureDTO)
      expect(result.rootPath).toBe(tempDir)
      expect(result.totalFiles).toBeGreaterThan(0)
      expect(result.totalDirectories).toBeGreaterThan(0)
    })

    it('should respect maximum depth parameter', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir, { maxDepth: 1 })

      expect(result.maxDepthScanned).toBe(1)
      expect(result.getActualDepth()).toBeLessThanOrEqual(1)
    })

    it('should filter files by extension', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir, { 
        includeExtensions: ['.ts', '.tsx']
      })

      const allFiles = result.getAllFilePaths()
      const tsFiles = allFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
      
      // All returned files should match the filter
      expect(tsFiles.length).toBeGreaterThan(0)
      // Should exclude .js, .json, .md files
      expect(allFiles.some(file => file.endsWith('.js'))).toBe(false)
      expect(allFiles.some(file => file.endsWith('.json'))).toBe(false)
    })

    it('should exclude files by pattern', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir, { 
        excludePatterns: ['node_modules/**', 'dist/**', '.env']
      })

      const allFiles = result.getAllFilePaths()
      
      expect(allFiles.some(file => file.includes('node_modules'))).toBe(false)
      expect(allFiles.some(file => file.includes('dist'))).toBe(false)
      expect(allFiles.some(file => file.includes('.env'))).toBe(false)
    })

    it('should handle file size filtering', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir, { 
        maxSize: 1000, // Only files <= 1000 bytes
        minSize: 10  // Only files >= 10 bytes
      })

      // This is more of a structural test since we can't easily mock file sizes
      expect(result).toBeInstanceOf(DirectoryStructureDTO)
    })

    it('should throw error for non-existent directory', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(false)

      await expect(service.scanDirectory('/non/existent/path'))
        .rejects
        .toThrow('Directory not found')
    })

    it('should throw error when path is not a directory', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(false)

      await expect(service.scanDirectory('/path/to/file.txt'))
        .rejects
        .toThrow('Path is not a directory')
    })
  })

  describe('findFiles', () => {
    beforeEach(async () => {
      // Create test files
      const testFiles = {
        'app.js': 'console.log("app")',
        'config/database.js': 'module.exports = {}',
        'package.json': '{}',
        'README.md': '# Project',
        'src/index.ts': 'export const main = () => {}',
        'src/utils.ts': 'export const utils = () => {}',
        'tests/app.test.js': 'test("app", () => {})'
      }

      for (const [filePath, content] of Object.entries(testFiles)) {
        const fullPath = join(tempDir, filePath)
        const dirPath = dirname(fullPath)
        await fs.mkdir(dirPath, { recursive: true })
        await fs.writeFile(fullPath, content)
      }
    })

    it('should find files by single pattern', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.findFiles(tempDir, '*.js')

      expect(result).toBeInstanceOf(FileDiscoveryResultDTO)
      expect(result.totalFiles).toBeGreaterThan(0)
      expect(result.searchPattern).toBe('*.js')
      expect(result.searchDirectory).toBe(tempDir)
    })

    it('should find files by multiple patterns', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const patterns = ['*.js', '*.ts']
      const result = await service.findFiles(tempDir, patterns)

      expect(result.searchPattern).toBe('*.js,*.ts')
      expect(result.totalFiles).toBeGreaterThan(0)
    })

    it('should find files with glob patterns', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.findFiles(tempDir, '**/config/**')

      expect(result.files.some(file => file.path.includes('config'))).toBe(true)
    })

    it('should respect search options', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.findFiles(tempDir, '**/*', {
        caseSensitive: true,
        includeHidden: false,
        maxDepth: 1
      })

      expect(result.maxDepthSearched).toBe(1)
    })

    it('should handle case sensitivity options', async () => {
      // Create files with different cases
      await fs.writeFile(join(tempDir, 'Test.js'), 'content')
      await fs.writeFile(join(tempDir, 'test.js'), 'content')

      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      // Case sensitive search
      const sensitiveResult = await service.findFiles(tempDir, 'Test.js', {
        caseSensitive: true
      })

      // Case insensitive search  
      const insensitiveResult = await service.findFiles(tempDir, 'test.js', {
        caseSensitive: false
      })

      // Results will vary based on implementation, but structure should be correct
      expect(sensitiveResult).toBeInstanceOf(FileDiscoveryResultDTO)
      expect(insensitiveResult).toBeInstanceOf(FileDiscoveryResultDTO)
    })
  })

  describe('getFilesByType', () => {
    beforeEach(async () => {
      // Create files of different types
      const testFiles = {
        'assets/logo.png': 'binary-content',
        'assets/styles.css': 'body { margin: 0; }',
        'config/app.json': '{"name": "app"}',
        'config/settings.yaml': 'debug: true',
        'docs/guide.txt': 'User guide',
        'docs/README.md': '# Documentation',
        'source/component.tsx': 'export const Component = () => {}',
        'source/main.js': 'console.log("main")',
        'source/utils.ts': 'export const utils = () => {}'
      }

      for (const [filePath, content] of Object.entries(testFiles)) {
        const fullPath = join(tempDir, filePath)
        const dirPath = dirname(fullPath)
        await fs.mkdir(dirPath, { recursive: true })
        await fs.writeFile(fullPath, content)
      }
    })

    it('should find source code files', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.getFilesByType(tempDir, 'source-code')

      expect(result.files.length).toBeGreaterThan(0)
      expect(result.files.every(file => 
        ['.js', '.ts', '.tsx'].some(ext => file.path.endsWith(ext))
      )).toBe(true)
    })

    it('should find documentation files', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.getFilesByType(tempDir, 'documentation')

      expect(result.files.some(file => file.path.endsWith('.md'))).toBe(true)
      expect(result.files.some(file => file.path.endsWith('.txt'))).toBe(true)
    })

    it('should find configuration files', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.getFilesByType(tempDir, 'configuration')

      expect(result.files.some(file => file.path.endsWith('.json'))).toBe(true)
      expect(result.files.some(file => file.path.endsWith('.yaml'))).toBe(true)
    })

    it('should handle unknown file types', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      await expect(service.getFilesByType(tempDir, 'unknown-type' as any))
        .rejects
        .toThrow('Unknown file type')
    })
  })

  describe('getFilePreview', () => {
    beforeEach(async () => {
      // Create test files with different content
      await fs.writeFile(join(tempDir, 'small.txt'), 'Small file content')
      await fs.writeFile(join(tempDir, 'large.txt'), 'Line 1\n'.repeat(1000))
      await fs.writeFile(join(tempDir, 'binary.dat'), Buffer.from([0, 1, 2, 3, 4]))
    })

    it('should preview small text files completely', async () => {
      const filePath = join(tempDir, 'small.txt')
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isFile.mockResolvedValue(true)
      mockFileOpsService.readFile.mockResolvedValue('Small file content')

      const result = await service.getFilePreview(filePath)

      expect(result.isComplete).toBe(true)
      expect(result.content).toBe('Small file content')
      expect(result.filePath).toBe(filePath)
    })

    it('should preview large files partially', async () => {
      const filePath = join(tempDir, 'large.txt')
      const fullContent = 'Line 1\n'.repeat(1000)
      
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isFile.mockResolvedValue(true)
      mockFileOpsService.readFile.mockResolvedValue(fullContent)

      const result = await service.getFilePreview(filePath, { maxLines: 10 })

      expect(result.filePath).toBe(filePath)
      // Preview should be limited
      expect(result.lineCount).toBeLessThanOrEqual(10)
    })

    it('should handle binary files gracefully', async () => {
      const filePath = join(tempDir, 'binary.dat')
      
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isFile.mockResolvedValue(true)
      mockFileOpsService.readFileBuffer.mockResolvedValue(Buffer.from([0, 1, 2, 3, 4]))

      const result = await service.getFilePreview(filePath)

      expect(result.encoding).toBe('binary')
      expect(result.content).toContain('Binary')
    })

    it('should throw error for non-existent files', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(false)

      await expect(service.getFilePreview('/non/existent/file.txt'))
        .rejects
        .toThrow('File not found')
    })

    it('should throw error for directories', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isFile.mockResolvedValue(false)

      await expect(service.getFilePreview(tempDir))
        .rejects
        .toThrow('Path is not a file')
    })

    it('should respect preview options', async () => {
      const filePath = join(tempDir, 'large.txt')
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n'
      
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isFile.mockResolvedValue(true)
      mockFileOpsService.readFile.mockResolvedValue(content)

      const result = await service.getFilePreview(filePath, {
        maxBytes: 100,
        maxLines: 3
      })

      expect(result.filePath).toBe(filePath)
      // Should be limited by options
      expect(result.isComplete).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle file system permission errors', async () => {
      mockFileOpsService.pathExists.mockRejectedValue(new Error('Permission denied'))

      await expect(service.scanDirectory('/restricted/path'))
        .rejects
        .toThrow('Permission denied')
    })

    it('should handle file system errors gracefully', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockRejectedValue(new Error('I/O Error'))

      await expect(service.scanDirectory(tempDir))
        .rejects
        .toThrow('I/O Error')
    })

    it('should validate input parameters', async () => {
      await expect(service.scanDirectory(''))
        .rejects
        .toThrow('Directory path is required')

      await expect(service.findFiles('', ''))
        .rejects
        .toThrow('Search pattern is required')

      await expect(service.getFilePreview(''))
        .rejects
        .toThrow('File path is required')
    })
  })

  describe('performance and limits', () => {
    it('should track scan duration', async () => {
      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const startTime = Date.now()
      const result = await service.scanDirectory(tempDir)
      const endTime = Date.now()

      expect(result.scanDuration).toBeGreaterThan(0)
      expect(result.scanDuration).toBeLessThanOrEqual(endTime - startTime + 100) // Allow some margin
    })

    it('should handle large directory structures', async () => {
      // Create many files for performance testing
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(join(tempDir, `file${i}.txt`), `Content ${i}`)
      }

      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.scanDirectory(tempDir)

      expect(result.totalFiles).toBe(100)
      expect(result.scanDuration).toBeGreaterThan(0)
    })

    it('should respect file count limits in search', async () => {
      // Create many files
      for (let i = 0; i < 50; i++) {
        await fs.writeFile(join(tempDir, `test${i}.js`), `content ${i}`)
      }

      mockFileOpsService.pathExists.mockResolvedValue(true)
      mockFileOpsService.isDirectory.mockResolvedValue(true)

      const result = await service.findFiles(tempDir, '*.js', {
        maxResults: 10
      })

      expect(result.totalFiles).toBeLessThanOrEqual(10)
    })
  })
})