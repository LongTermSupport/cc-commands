/**
 * @file Unit tests for FileDiscoveryResultDTO
 * 
 * Tests the FileDiscoveryResultDTO class including constructor validation,
 * toLLMData method, toJsonData method, factory methods, and utility methods.
 */

/* eslint-disable max-nested-callbacks */

import { beforeEach, describe, expect, it } from 'vitest'

import { FileDiscoveryResultDTO } from '../../../../src/orchestrator-services/filesystem/dto/FileDiscoveryResultDTO.js'
import { FileMetadataDTO } from '../../../../src/orchestrator-services/filesystem/dto/FileMetadataDTO.js'

describe('FileDiscoveryResultDTO', () => {
  const mockFiles: FileMetadataDTO[] = [
    new FileMetadataDTO(
      '/home/user/project/src/index.ts',
      'index.ts',
      1024,
      new Date('2023-01-01T00:00:00Z'),
      new Date('2025-01-15T12:00:00Z'),
      'rw-r--r--',
      false,
      '.ts'
    ),
    new FileMetadataDTO(
      '/home/user/project/src/utils/helper.ts',
      'helper.ts',
      512,
      new Date('2023-02-01T00:00:00Z'),
      new Date('2025-01-14T10:30:00Z'),
      'rw-r--r--',
      false,
      '.ts'
    ),
    new FileMetadataDTO(
      '/home/user/project/package.json',
      'package.json',
      256,
      new Date('2023-01-15T00:00:00Z'),
      new Date('2025-01-10T16:00:00Z'),
      'rw-r--r--',
      false,
      '.json'
    )
  ]

  const validDiscoveryData = {
    createdAt: new Date('2025-01-15T14:00:00Z'),
    files: mockFiles,
    pattern: '**/*.{ts,json}',
    searchDirectory: '/home/user/project',
    searchDuration: 85
  }

  describe('constructor', () => {
    it('should create a valid FileDiscoveryResultDTO instance', () => {
      const dto = new FileDiscoveryResultDTO(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        validDiscoveryData.searchDuration,
        validDiscoveryData.createdAt
      )

      expect(dto.files).toEqual(validDiscoveryData.files)
      expect(dto.pattern).toBe(validDiscoveryData.pattern)
      expect(dto.searchDirectory).toBe(validDiscoveryData.searchDirectory)
      expect(dto.searchDuration).toBe(validDiscoveryData.searchDuration)
      expect(dto.createdAt).toBe(validDiscoveryData.createdAt)
    })

    it('should use current date when createdAt not provided', () => {
      const beforeCreate = Date.now()
      const dto = new FileDiscoveryResultDTO(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        validDiscoveryData.searchDuration
        // createdAt not provided
      )
      const afterCreate = Date.now()

      expect(dto.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate)
      expect(dto.createdAt.getTime()).toBeLessThanOrEqual(afterCreate)
    })

    it('should handle empty file results', () => {
      const dto = new FileDiscoveryResultDTO(
        [],
        '**/*.nonexistent',
        '/home/user/project',
        25
      )

      expect(dto.files).toEqual([])
      expect(dto.getFileCount()).toBe(0)
      expect(dto.getTotalSize()).toBe(0)
    })
  })

  describe('fromSearchResults factory method', () => {
    it('should create DTO from search results with all provided options', () => {
      const dto = FileDiscoveryResultDTO.fromSearchResults(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        { searchDuration: validDiscoveryData.searchDuration }
      )

      expect(dto.files).toEqual(validDiscoveryData.files)
      expect(dto.pattern).toBe(validDiscoveryData.pattern)
      expect(dto.searchDirectory).toBe(validDiscoveryData.searchDirectory)
      expect(dto.searchDuration).toBe(validDiscoveryData.searchDuration)
    })

    it('should use default duration when not provided', () => {
      const dto = FileDiscoveryResultDTO.fromSearchResults(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory
        // no options provided
      )

      expect(dto.searchDuration).toBe(0)
    })

    it('should handle additional options', () => {
      const dto = FileDiscoveryResultDTO.fromSearchResults(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        {
          maxDepth: 5,
          searchDuration: validDiscoveryData.searchDuration
        }
      )

      expect(dto.searchDuration).toBe(validDiscoveryData.searchDuration)
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new FileDiscoveryResultDTO(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        validDiscoveryData.searchDuration,
        validDiscoveryData.createdAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.DISCOVERY_FILE_COUNT).toBe('3')
      expect(llmData.DISCOVERY_PATTERN).toBe('**/*.{ts,json}')
      expect(llmData.DISCOVERY_SEARCH_DIRECTORY).toBe('/home/user/project')
      expect(llmData.DISCOVERY_SEARCH_DURATION).toBe('85')
      expect(llmData.DISCOVERY_TOTAL_SIZE).toBe('1792') // 1024 + 512 + 256
      expect(llmData.DISCOVERY_CREATED_AT).toBe('2025-01-15T14:00:00.000Z')
    })

    it('should handle empty results in LLM data format', () => {
      const dto = new FileDiscoveryResultDTO(
        [],
        '**/*.nonexistent',
        '/home/user/project',
        25
      )

      const llmData = dto.toLLMData()

      expect(llmData.DISCOVERY_FILE_COUNT).toBe('0')
      expect(llmData.DISCOVERY_TOTAL_SIZE).toBe('0')
      expect(llmData.DISCOVERY_SEARCH_DURATION).toBe('25')
    })
  })

  describe('utility methods', () => {
    let dto: FileDiscoveryResultDTO

    beforeEach(() => {
      dto = new FileDiscoveryResultDTO(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        validDiscoveryData.searchDuration,
        validDiscoveryData.createdAt
      )
    })

    it('should get file count', () => {
      expect(dto.getFileCount()).toBe(3)
    })

    it('should get total size', () => {
      expect(dto.getTotalSize()).toBe(1792) // 1024 + 512 + 256
    })

    it('should get average file size', () => {
      expect(dto.getAverageFileSize()).toBe(597) // Math.round(1792 / 3)
    })

    it('should handle zero files for average size', () => {
      const emptyDto = new FileDiscoveryResultDTO(
        [],
        '**/*.none',
        '/test',
        10
      )

      expect(emptyDto.getAverageFileSize()).toBe(0)
    })

    it('should get files by extension', () => {
      const tsFiles = dto.getFilesByExtension('.ts')
      expect(tsFiles).toHaveLength(2)
      expect(tsFiles.every(f => f.extension === '.ts')).toBe(true)

      const jsonFiles = dto.getFilesByExtension('.json')
      expect(jsonFiles).toHaveLength(1)
      expect(jsonFiles[0]?.name).toBe('package.json')

      const nonexistentFiles = dto.getFilesByExtension('.py')
      expect(nonexistentFiles).toHaveLength(0)
    })

    it('should get files modified since date', () => {
      const since = new Date('2025-01-12T00:00:00Z')
      const recentFiles = dto.getFilesModifiedSince(since)
      
      expect(recentFiles).toHaveLength(2) // index.ts and helper.ts modified after 2025-01-12
      expect(recentFiles.every(f => f.modified >= since)).toBe(true)
    })

    it('should get largest files', () => {
      const largestFiles = dto.getLargestFiles(2)
      
      expect(largestFiles).toHaveLength(2)
      expect(largestFiles[0]?.size).toBe(1024) // index.ts
      expect(largestFiles[1]?.size).toBe(512)  // helper.ts
    })

    it('should handle request for more files than available', () => {
      const largestFiles = dto.getLargestFiles(10)
      expect(largestFiles).toHaveLength(3) // Only 3 files available
    })

    it('should get unique file extensions', () => {
      const extensions = dto.getUniqueExtensions()
      expect(extensions.sort()).toEqual(['.json', '.ts'])
    })

    it('should handle files without extensions', () => {
      const filesWithoutExt = [
        new FileMetadataDTO(
          '/home/user/README',
          'README',
          100,
          new Date(),
          new Date(),
          'rw-r--r--',
          false
          // no extension
        )
      ]

      const dtoWithoutExt = new FileDiscoveryResultDTO(
        filesWithoutExt,
        '**/README',
        '/home/user',
        10
      )

      const extensions = dtoWithoutExt.getUniqueExtensions()
      expect(extensions).toEqual([])
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('Found 3 files (1.75 KB) in 85ms using pattern: **/*.{ts,json}')
    })

    it('should generate summary for empty results', () => {
      const emptyDto = new FileDiscoveryResultDTO(
        [],
        '**/*.none',
        '/test',
        10
      )

      const summary = emptyDto.getSummary()
      expect(summary).toBe('Found 0 files (0 B) in 10ms using pattern: **/*.none')
    })

    it('should calculate human-readable size', () => {
      expect(dto.getHumanReadableSize()).toBe('1.75 KB')
    })
  })

  describe('JSON methods for result files', () => {
    let dto: FileDiscoveryResultDTO
    
    beforeEach(() => {
      dto = new FileDiscoveryResultDTO(
        validDiscoveryData.files,
        validDiscoveryData.pattern,
        validDiscoveryData.searchDirectory,
        validDiscoveryData.searchDuration,
        validDiscoveryData.createdAt
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured data with raw and calculated namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('file_discovery')
        expect(jsonData.calculated).toHaveProperty('discovery_analysis')
        expect(jsonData.calculated).toHaveProperty('file_statistics')
        expect(jsonData.calculated).toHaveProperty('search_performance')
      })
      
      it('should preserve raw discovery data unchanged', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData.raw.file_discovery.pattern).toBe('**/*.{ts,json}')
        expect(jsonData.raw.file_discovery.search_directory).toBe('/home/user/project')
        expect(jsonData.raw.file_discovery.search_duration_ms).toBe(85)
        expect(jsonData.raw.file_discovery.file_count).toBe(3)
        expect(jsonData.raw.file_discovery.created_at).toBe('2025-01-15T14:00:00.000Z')
        expect(jsonData.raw.file_discovery.files).toEqual(expect.any(Array))
        expect(jsonData.raw.file_discovery.files).toHaveLength(3)
      })
      
      it('should calculate discovery analysis metrics', () => {
        const jsonData = dto.toJsonData()
        const discoveryAnalysis = jsonData.calculated.discovery_analysis
        
        expect(discoveryAnalysis.total_files_found).toBe(3)
        expect(discoveryAnalysis.total_size_bytes).toBe(1792)
        expect(discoveryAnalysis.human_readable_size).toBe('1.75 KB')
        expect(discoveryAnalysis.unique_extensions).toEqual(['.json', '.ts'])
        expect(discoveryAnalysis.files_by_extension).toEqual({
          '.json': 1,
          '.ts': 2
        })
      })
      
      it('should calculate file statistics', () => {
        const jsonData = dto.toJsonData()
        const fileStats = jsonData.calculated.file_statistics
        
        expect(fileStats.average_file_size_bytes).toBe(597)
        expect(fileStats.largest_file_size).toBe(1024)
        expect(fileStats.smallest_file_size).toBe(256)
        expect(fileStats.median_file_size).toBe(512)
        expect(fileStats.size_distribution).toEqual({
          'large_files_1mb_plus': 0,
          'medium_files_100kb_1mb': 0,
          'small_files_10kb_100kb': 0,
          'tiny_files_under_10kb': 3
        })
      })
      
      it('should calculate search performance metrics', () => {
        const jsonData = dto.toJsonData()
        const searchPerf = jsonData.calculated.search_performance
        
        expect(searchPerf.search_duration_ms).toBe(85)
        expect(searchPerf.files_per_second).toBe(35.29) // (3/85) * 1000
        expect(searchPerf.bytes_per_second).toBe(21_082.35) // (1792/85) * 1000
        expect(searchPerf.search_efficiency_score).toBe(0.35) // min(35.29/100, 1)
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(8)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('Search pattern used'),
          query: '.raw.file_discovery.pattern',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all analysis categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('file_discovery'))).toBe(true)
        expect(queries.some(q => q.includes('discovery_analysis'))).toBe(true)
        expect(queries.some(q => q.includes('file_statistics'))).toBe(true)
        expect(queries.some(q => q.includes('search_performance'))).toBe(true)
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
    it('should handle very large file sets', () => {
      const largeFileSet = Array.from({ length: 1000 }, (_, i) => 
        new FileMetadataDTO(
          `/large/file${i}.ts`,
          `file${i}.ts`,
          1024 + i,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2025-01-15T12:00:00Z'),
          'rw-r--r--',
          false,
          '.ts'
        )
      )

      const largeDto = new FileDiscoveryResultDTO(
        largeFileSet,
        '**/*.ts',
        '/large',
        5000 // 5 seconds
      )

      expect(largeDto.getFileCount()).toBe(1000)
      expect(largeDto.getAverageFileSize()).toBe(1523) // Math.round((1024 + ... + 2023) / 1000)
      expect(largeDto.getLargestFiles(5)).toHaveLength(5)
      expect(largeDto.getUniqueExtensions()).toEqual(['.ts'])
    })

    it('should handle mixed file types and sizes', () => {
      const mixedFiles = [
        new FileMetadataDTO('/test/tiny.txt', 'tiny.txt', 10, new Date(), new Date(), 'rw-r--r--', false, '.txt'),
        new FileMetadataDTO('/test/small.js', 'small.js', 5000, new Date(), new Date(), 'rw-r--r--', false, '.js'),
        new FileMetadataDTO('/test/medium.py', 'medium.py', 50_000, new Date(), new Date(), 'rw-r--r--', false, '.py'),
        new FileMetadataDTO('/test/large.data', 'large.data', 1_500_000, new Date(), new Date(), 'rw-r--r--', false, '.data'),
        new FileMetadataDTO('/test/huge.bin', 'huge.bin', 50_000_000, new Date(), new Date(), 'rw-r--r--', false, '.bin')
      ]

      const mixedDto = new FileDiscoveryResultDTO(
        mixedFiles,
        '**/*',
        '/test',
        200
      )

      const jsonData = mixedDto.toJsonData()
      const sizeDistribution = jsonData.calculated.file_statistics.size_distribution

      expect(sizeDistribution.tiny_files_under_10kb).toBe(2) // tiny.txt, small.js
      expect(sizeDistribution.small_files_10kb_100kb).toBe(1) // medium.py
      expect(sizeDistribution.medium_files_100kb_1mb).toBe(1) // large.data
      expect(sizeDistribution.large_files_1mb_plus).toBe(1)   // huge.bin
    })

    it('should handle files with unicode names and paths', () => {
      const unicodeFiles = [
        new FileMetadataDTO('/测试/文件-🚀.ts', '文件-🚀.ts', 1024, new Date(), new Date(), 'rw-r--r--', false, '.ts'),
        new FileMetadataDTO('/тест/файл.js', 'файл.js', 512, new Date(), new Date(), 'rw-r--r--', false, '.js')
      ]

      const unicodeDto = new FileDiscoveryResultDTO(
        unicodeFiles,
        '**/*',
        '/unicode-test',
        50
      )

      expect(unicodeDto.getFileCount()).toBe(2)
      expect(unicodeDto.getUniqueExtensions().sort()).toEqual(['.js', '.ts'])
      
      const llmData = unicodeDto.toLLMData()
      expect(llmData.DISCOVERY_FILE_COUNT).toBe('2')
      expect(llmData.DISCOVERY_SEARCH_DIRECTORY).toBe('/unicode-test')
    })

    it('should handle long search patterns', () => {
      const longPattern = '**/*.{js,ts,jsx,tsx,vue,svelte,py,rb,go,rs,c,cpp,h,hpp,java,kt,swift,php,cs,vb,fs,scala,clj,hs,elm,ml,ocaml,purs,hs,agda,coq,lean}'
      
      const dto = new FileDiscoveryResultDTO(
        mockFiles,
        longPattern,
        '/complex/project',
        1200
      )

      expect(dto.pattern).toBe(longPattern)
      
      const llmData = dto.toLLMData()
      expect(llmData.DISCOVERY_PATTERN).toBe(longPattern)
    })
  })
})