/**
 * @file Unit tests for FileMetadataDTO
 * 
 * Tests the FileMetadataDTO class including constructor validation,
 * toLLMData method, toJsonData method, and utility methods.
 */

/* eslint-disable max-nested-callbacks */

import { beforeEach, describe, expect, it } from 'vitest'

import { FileMetadataDTO } from '../../../../src/orchestrator-services/filesystem/dto/FileMetadataDTO.js'

describe('FileMetadataDTO', () => {
  const validMetadata = {
    created: new Date('2023-01-01T00:00:00Z'),
    extension: '.ts',
    isDirectory: false,
    modified: new Date('2025-01-15T12:00:00Z'),
    name: 'test-file.ts',
    path: '/home/user/project/test-file.ts',
    permissions: 'rw-r--r--',
    size: 1024
  }

  describe('constructor', () => {
    it('should create a valid FileMetadataDTO instance', () => {
      const dto = new FileMetadataDTO(
        validMetadata.path,
        validMetadata.name,
        validMetadata.size,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        validMetadata.isDirectory,
        validMetadata.extension
      )

      expect(dto.path).toBe(validMetadata.path)
      expect(dto.name).toBe(validMetadata.name)
      expect(dto.size).toBe(validMetadata.size)
      expect(dto.created).toBe(validMetadata.created)
      expect(dto.modified).toBe(validMetadata.modified)
      expect(dto.permissions).toBe(validMetadata.permissions)
      expect(dto.isDirectory).toBe(validMetadata.isDirectory)
      expect(dto.extension).toBe(validMetadata.extension)
    })

    it('should handle directories without extensions', () => {
      const dto = new FileMetadataDTO(
        '/home/user/project/src',
        'src',
        0,
        validMetadata.created,
        validMetadata.modified,
        'rwxr-xr-x',
        true, // isDirectory
        undefined // no extension
      )

      expect(dto.isDirectory).toBe(true)
      expect(dto.extension).toBeUndefined()
      expect(dto.size).toBe(0)
    })

    it('should handle files with no extension', () => {
      const dto = new FileMetadataDTO(
        '/home/user/project/README',
        'README',
        512,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        undefined
      )

      expect(dto.extension).toBeUndefined()
      expect(dto.isDirectory).toBe(false)
      expect(dto.name).toBe('README')
    })

    it('should handle large files', () => {
      const largeSize = 1024 * 1024 * 100 // 100MB
      const dto = new FileMetadataDTO(
        '/home/user/large-file.dat',
        'large-file.dat',
        largeSize,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        '.dat'
      )

      expect(dto.size).toBe(largeSize)
      expect(dto.getHumanReadableSize()).toBe('100 MB')
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new FileMetadataDTO(
        validMetadata.path,
        validMetadata.name,
        validMetadata.size,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        validMetadata.isDirectory,
        validMetadata.extension
      )

      const llmData = dto.toLLMData()

      expect(llmData.FILE_PATH).toBe('/home/user/project/test-file.ts')
      expect(llmData.FILE_NAME).toBe('test-file.ts')
      expect(llmData.FILE_SIZE_BYTES).toBe('1024')
      expect(llmData.FILE_CREATED_AT).toBe('2023-01-01T00:00:00.000Z')
      expect(llmData.FILE_MODIFIED_AT).toBe('2025-01-15T12:00:00.000Z')
      expect(llmData.FILE_PERMISSIONS).toBe('rw-r--r--')
      expect(llmData.FILE_IS_DIRECTORY).toBe('false')
      expect(llmData.FILE_EXTENSION).toBe('.ts')
    })

    it('should handle directories in LLM data format', () => {
      const dto = new FileMetadataDTO(
        '/home/user/project/src',
        'src',
        0,
        validMetadata.created,
        validMetadata.modified,
        'rwxr-xr-x',
        true,
        undefined
      )

      const llmData = dto.toLLMData()

      expect(llmData.FILE_IS_DIRECTORY).toBe('true')
      expect(llmData.FILE_EXTENSION).toBe('')
      expect(llmData.FILE_SIZE_BYTES).toBe('0')
    })

    it('should handle undefined extension in LLM data format', () => {
      const dto = new FileMetadataDTO(
        validMetadata.path,
        validMetadata.name,
        validMetadata.size,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        validMetadata.isDirectory,
        undefined // no extension
      )

      const llmData = dto.toLLMData()

      expect(llmData.FILE_EXTENSION).toBe('')
    })
  })

  describe('utility methods', () => {
    let dto: FileMetadataDTO

    beforeEach(() => {
      dto = new FileMetadataDTO(
        validMetadata.path,
        validMetadata.name,
        validMetadata.size,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        validMetadata.isDirectory,
        validMetadata.extension
      )
    })

    it('should calculate age in days', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const age = dto.getAgeInDays()
      
      // Age should be positive and reasonable (created on 2023-01-01)
      expect(age).toBeGreaterThan(700) // More than 2 years
      expect(age).toBeLessThan(1000)   // Less than 3 years
    })

    it('should calculate days since modification', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const daysSince = dto.getDaysSinceModification()
      
      // Days since modification should be reasonable (modified on 2025-01-15)
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365) // Less than a year
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('SOURCE-CODE: test-file.ts (1 KB)')
    })

    it('should generate summary for directory', () => {
      const dirDto = new FileMetadataDTO(
        '/home/user/project/src',
        'src',
        0,
        validMetadata.created,
        validMetadata.modified,
        'rwxr-xr-x',
        true,
        undefined
      )

      const summary = dirDto.getSummary()
      expect(summary).toBe('DIR: src')
    })

    it('should get human-readable file sizes', () => {
      const testCases = [
        { expected: '0 B', size: 0 },
        { expected: '512 B', size: 512 },
        { expected: '1 KB', size: 1024 },
        { expected: '1.5 KB', size: 1536 },
        { expected: '1 MB', size: 1024 * 1024 },
        { expected: '1 GB', size: 1024 * 1024 * 1024 },
        { expected: '1 TB', size: 1024 * 1024 * 1024 * 1024 }
      ]

      for (const testCase of testCases) {
        const testDto = new FileMetadataDTO(
          '/test/file',
          'file',
          testCase.size,
          validMetadata.created,
          validMetadata.modified,
          validMetadata.permissions,
          false,
          '.txt'
        )
        
        expect(testDto.getHumanReadableSize()).toBe(testCase.expected)
      }
    })

    it('should classify file types correctly', () => {
      const testCases = [
        { expectedType: 'source-code', ext: '.ts' },
        { expectedType: 'source-code', ext: '.js' },
        { expectedType: 'source-code', ext: '.py' },
        { expectedType: 'documentation', ext: '.txt' },
        { expectedType: 'documentation', ext: '.md' },
        { expectedType: 'image', ext: '.png' },
        { expectedType: 'image', ext: '.jpg' }
      ]

      for (const testCase of testCases) {
        const testDto = new FileMetadataDTO(
          `/test/file${testCase.ext}`,
          `file${testCase.ext}`,
          1024,
          validMetadata.created,
          validMetadata.modified,
          validMetadata.permissions,
          false,
          testCase.ext
        )
        
        expect(testDto.getFileType()).toBe(testCase.expectedType)
      }
    })

    it('should handle files with no extension', () => {
      const noExtDto = new FileMetadataDTO(
        '/test/README',
        'README',
        1024,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        undefined
      )

      expect(noExtDto.getFileType()).toBe('no-extension')
    })
  })

  describe('JSON methods for result files', () => {
    let dto: FileMetadataDTO
    
    beforeEach(() => {
      dto = new FileMetadataDTO(
        validMetadata.path,
        validMetadata.name,
        validMetadata.size,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        validMetadata.isDirectory,
        validMetadata.extension
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured data with raw and calculated namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('filesystem_metadata')
        expect(jsonData.calculated).toHaveProperty('time_calculations')
        expect(jsonData.calculated).toHaveProperty('file_characteristics')
      })
      
      it('should preserve raw file metadata unchanged', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData.raw.filesystem_metadata.path).toBe('/home/user/project/test-file.ts')
        expect(jsonData.raw.filesystem_metadata.name).toBe('test-file.ts')
        expect(jsonData.raw.filesystem_metadata.size).toBe(1024)
        expect(jsonData.raw.filesystem_metadata.extension).toBe('.ts')
        expect(jsonData.raw.filesystem_metadata.is_directory).toBe(false)
      })
      
      it('should calculate time metrics correctly', () => {
        const jsonData = dto.toJsonData()
        const timeCalcs = jsonData.calculated.time_calculations
        
        expect(timeCalcs.age_days).toBeGreaterThan(0)
        expect(timeCalcs.days_since_modified).toBeGreaterThanOrEqual(0)
        expect(timeCalcs.created_timestamp).toBeGreaterThan(0)
        expect(timeCalcs.modified_timestamp).toBeGreaterThan(0)
        expect(timeCalcs.modification_to_creation_days).toBeGreaterThan(0)
      })
      
      it('should calculate file characteristics', () => {
        const jsonData = dto.toJsonData()
        const fileChars = jsonData.calculated.file_characteristics
        
        expect(fileChars.human_readable_size).toBe('1 KB')
        expect(fileChars.file_type).toBe('source-code')
        expect(fileChars.has_extension).toBe(true)
        expect(fileChars.is_empty).toBe(false)
        expect(typeof fileChars.is_recently_modified).toBe('boolean')
        expect(typeof fileChars.is_recently_created).toBe('boolean')
        expect(typeof fileChars.is_readable).toBe('boolean')
        expect(typeof fileChars.is_writable).toBe('boolean')
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(5)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('path'),
          query: '.raw.filesystem_metadata.path',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all analysis categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('time_calculations'))).toBe(true)
        expect(queries.some(q => q.includes('file_characteristics'))).toBe(true)
        expect(queries.some(q => q.includes('filesystem_metadata'))).toBe(true)
      })
      
      it('should provide helpful descriptions and scopes', () => {
        const hints = dto.getJqHints()
        
        for (const hint of hints) {
          expect(hint.query).toBeTruthy()
          expect(hint.description).toBeTruthy()
          expect(['single_item', 'parent_level', 'all_items']).toContain(hint.scope)
        }
      })
    })
  })

  describe('edge cases and validation', () => {
    it('should handle zero-size files', () => {
      const zeroDto = new FileMetadataDTO(
        '/test/empty.txt',
        'empty.txt',
        0, // zero size
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        '.txt'
      )

      expect(zeroDto.size).toBe(0)
      expect(zeroDto.getHumanReadableSize()).toBe('0 B')
      
      const llmData = zeroDto.toLLMData()
      expect(llmData.FILE_SIZE_BYTES).toBe('0')
    })

    it('should handle files with very long paths', () => {
      const longPath = '/very/deep/nested/directory/structure/with/many/levels/file.txt'
      const dto = new FileMetadataDTO(
        longPath,
        'file.txt',
        1024,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        '.txt'
      )

      expect(dto.path).toBe(longPath)
      expect(dto.name).toBe('file.txt')
    })

    it('should handle unicode and special characters in file names', () => {
      const unicodeDto = new FileMetadataDTO(
        '/home/user/测试文件-🚀.ts',
        '测试文件-🚀.ts',
        1024,
        validMetadata.created,
        validMetadata.modified,
        validMetadata.permissions,
        false,
        '.ts'
      )

      const llmData = unicodeDto.toLLMData()
      expect(llmData.FILE_NAME).toBe('测试文件-🚀.ts')
      expect(llmData.FILE_PATH).toBe('/home/user/测试文件-🚀.ts')
    })

    it('should handle different permission formats', () => {
      const permissionCases = [
        'rwxrwxrwx',
        'rw-r--r--',
        'rwxr-xr-x',
        'r--------',
        '---------'
      ]

      for (const permissions of permissionCases) {
        const dto = new FileMetadataDTO(
          '/test/file.txt',
          'file.txt',
          1024,
          validMetadata.created,
          validMetadata.modified,
          permissions,
          false,
          '.txt'
        )

        expect(dto.permissions).toBe(permissions)
        
        const llmData = dto.toLLMData()
        expect(llmData.FILE_PERMISSIONS).toBe(permissions)
      }
    })
  })
})