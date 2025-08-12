/**
 * @file Unit tests for DirectoryStructureDTO
 * 
 * Tests the DirectoryStructureDTO class including constructor validation,
 * toLLMData method, toJsonData method, factory methods, and utility methods.
 */

/* eslint-disable max-nested-callbacks */

import { beforeEach, describe, expect, it } from 'vitest'

import { DirectoryStructureDTO } from '../../../../src/orchestrator-services/filesystem/dto/DirectoryStructureDTO.js'
import { TDirectoryEntry } from '../../../../src/orchestrator-services/filesystem/types/FilesystemTypes.js'

describe('DirectoryStructureDTO', () => {
  const mockEntries: TDirectoryEntry[] = [
    {
      children: [
        {
          modified: new Date('2025-01-14T10:00:00Z'),
          name: 'index.ts',
          path: '/home/user/project/src/index.ts',
          size: 1024,
          type: 'file'
        },
        {
          children: [
            {
              modified: new Date('2025-01-12T09:15:00Z'),
              name: 'helper.ts',
              path: '/home/user/project/src/utils/helper.ts',
              size: 512,
              type: 'file'
            }
          ],
          modified: new Date('2025-01-13T14:30:00Z'),
          name: 'utils',
          path: '/home/user/project/src/utils',
          type: 'directory'
        }
      ],
      modified: new Date('2025-01-15T12:00:00Z'),
      name: 'src',
      path: '/home/user/project/src',
      type: 'directory'
    },
    {
      modified: new Date('2025-01-10T16:00:00Z'),
      name: 'package.json',
      path: '/home/user/project/package.json',
      size: 256,
      type: 'file'
    },
    {
      modified: new Date('2025-01-09T11:30:00Z'),
      name: 'README.md',
      path: '/home/user/project/README.md',
      size: 128,
      type: 'file'
    }
  ]

  const validStructureData = {
    createdAt: new Date('2025-01-15T14:00:00Z'),
    entries: mockEntries,
    maxDepthScanned: 3,
    rootPath: '/home/user/project',
    scanDuration: 150,
    totalDirectories: 2,
    totalFiles: 4,
    totalSize: 1920
  }

  describe('constructor', () => {
    it('should create a valid DirectoryStructureDTO instance', () => {
      const dto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        validStructureData.scanDuration,
        validStructureData.createdAt
      )

      expect(dto.rootPath).toBe(validStructureData.rootPath)
      expect(dto.entries).toEqual(validStructureData.entries)
      expect(dto.maxDepthScanned).toBe(validStructureData.maxDepthScanned)
      expect(dto.totalFiles).toBe(validStructureData.totalFiles)
      expect(dto.totalDirectories).toBe(validStructureData.totalDirectories)
      expect(dto.totalSize).toBe(validStructureData.totalSize)
      expect(dto.scanDuration).toBe(validStructureData.scanDuration)
      expect(dto.createdAt).toBe(validStructureData.createdAt)
    })

    it('should use current date when createdAt not provided', () => {
      const beforeCreate = Date.now()
      const dto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        validStructureData.scanDuration
        // createdAt not provided
      )
      const afterCreate = Date.now()

      expect(dto.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate)
      expect(dto.createdAt.getTime()).toBeLessThanOrEqual(afterCreate)
    })

    it('should handle empty directory structure', () => {
      const dto = new DirectoryStructureDTO(
        '/empty/directory',
        [],
        1,
        0,
        0,
        0,
        50
      )

      expect(dto.entries).toEqual([])
      expect(dto.totalFiles).toBe(0)
      expect(dto.totalDirectories).toBe(0)
      expect(dto.totalSize).toBe(0)
    })
  })

  describe('fromDirectoryScan factory method', () => {
    it('should create DTO from scan results with all provided options', () => {
      const dto = DirectoryStructureDTO.fromDirectoryScan(
        validStructureData.rootPath,
        validStructureData.entries,
        {
          maxDepthScanned: validStructureData.maxDepthScanned,
          scanDuration: validStructureData.scanDuration,
          totalDirectories: validStructureData.totalDirectories,
          totalFiles: validStructureData.totalFiles,
          totalSize: validStructureData.totalSize
        }
      )

      expect(dto.rootPath).toBe(validStructureData.rootPath)
      expect(dto.entries).toEqual(validStructureData.entries)
      expect(dto.maxDepthScanned).toBe(validStructureData.maxDepthScanned)
      expect(dto.totalFiles).toBe(validStructureData.totalFiles)
      expect(dto.totalDirectories).toBe(validStructureData.totalDirectories)
      expect(dto.totalSize).toBe(validStructureData.totalSize)
      expect(dto.scanDuration).toBe(validStructureData.scanDuration)
    })

    it('should calculate totals when not provided', () => {
      const dto = DirectoryStructureDTO.fromDirectoryScan(
        validStructureData.rootPath,
        validStructureData.entries,
        {
          maxDepthScanned: validStructureData.maxDepthScanned,
          scanDuration: validStructureData.scanDuration
          // totals not provided - should be calculated
        }
      )

      expect(dto.totalFiles).toBe(4) // index.ts, helper.ts, package.json, README.md
      expect(dto.totalDirectories).toBe(2) // src, utils
      expect(dto.totalSize).toBe(1920) // 1024 + 512 + 256 + 128
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        validStructureData.scanDuration,
        validStructureData.createdAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.DIRECTORY_PATH).toBe('/home/user/project')
      expect(llmData.DIRECTORY_FILE_COUNT).toBe('4')
      expect(llmData.DIRECTORY_SUBDIRECTORY_COUNT).toBe('2')
      expect(llmData.DIRECTORY_TOTAL_SIZE).toBe('1920')
      expect(llmData.DIRECTORY_DEPTH).toBe('2') // Calculated actual depth
      expect(llmData.DIRECTORY_TREE_CREATED).toBe('2025-01-15T14:00:00.000Z')
    })

    it('should handle empty directory in LLM data format', () => {
      const dto = new DirectoryStructureDTO(
        '/empty/directory',
        [],
        1,
        0,
        0,
        0,
        50
      )

      const llmData = dto.toLLMData()

      expect(llmData.DIRECTORY_FILE_COUNT).toBe('0')
      expect(llmData.DIRECTORY_SUBDIRECTORY_COUNT).toBe('0')
      expect(llmData.DIRECTORY_TOTAL_SIZE).toBe('0')
      expect(llmData.DIRECTORY_DEPTH).toBe('0')
    })
  })

  describe('utility methods', () => {
    let dto: DirectoryStructureDTO

    beforeEach(() => {
      dto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        validStructureData.scanDuration,
        validStructureData.createdAt
      )
    })

    it('should calculate actual depth correctly', () => {
      const actualDepth = dto.getActualDepth()
      expect(actualDepth).toBe(2) // src/utils/helper.ts is depth 2
    })

    it('should get all directory paths', () => {
      const dirPaths = dto.getAllDirectoryPaths()
      expect(dirPaths).toEqual([
        '/home/user/project/src',
        '/home/user/project/src/utils'
      ])
    })

    it('should get all file paths', () => {
      const filePaths = dto.getAllFilePaths()
      expect(filePaths).toEqual([
        '/home/user/project/src/index.ts',
        '/home/user/project/src/utils/helper.ts',
        '/home/user/project/package.json',
        '/home/user/project/README.md'
      ])
    })

    it('should calculate average files per directory', () => {
      const avgFiles = dto.getAverageFilesPerDirectory()
      expect(avgFiles).toBe(2) // 4 files / 2 directories = 2
    })

    it('should handle division by zero for average files', () => {
      const emptyDto = new DirectoryStructureDTO(
        '/empty',
        [],
        1,
        0,
        0, // zero directories
        0,
        50
      )

      const avgFiles = emptyDto.getAverageFilesPerDirectory()
      expect(avgFiles).toBe(0)
    })

    it('should generate human-readable size', () => {
      const size = dto.getHumanReadableSize()
      expect(size).toBe('1.88 KB') // 1920 bytes
    })

    it('should generate human-readable size for different units', () => {
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
        const testDto = new DirectoryStructureDTO(
          '/test',
          [],
          1,
          0,
          0,
          testCase.size,
          50
        )
        
        expect(testDto.getHumanReadableSize()).toBe(testCase.expected)
      }
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('/home/user/project: 4 files, 2 dirs (150ms)')
    })

    it('should generate summary with seconds for long operations', () => {
      const slowDto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        2500, // 2.5 seconds
        validStructureData.createdAt
      )

      const summary = slowDto.getSummary()
      expect(summary).toBe('/home/user/project: 4 files, 2 dirs (3s)')
    })
  })

  describe('JSON methods for result files', () => {
    let dto: DirectoryStructureDTO
    
    beforeEach(() => {
      dto = new DirectoryStructureDTO(
        validStructureData.rootPath,
        validStructureData.entries,
        validStructureData.maxDepthScanned,
        validStructureData.totalFiles,
        validStructureData.totalDirectories,
        validStructureData.totalSize,
        validStructureData.scanDuration,
        validStructureData.createdAt
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured data with raw and calculated namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('directory_scan')
        expect(jsonData.calculated).toHaveProperty('structure_analysis')
        expect(jsonData.calculated).toHaveProperty('organization_analysis')
        expect(jsonData.calculated).toHaveProperty('scan_performance')
      })
      
      it('should preserve raw directory scan data unchanged', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData.raw.directory_scan.root_path).toBe('/home/user/project')
        expect(jsonData.raw.directory_scan.total_files).toBe(4)
        expect(jsonData.raw.directory_scan.total_directories).toBe(2)
        expect(jsonData.raw.directory_scan.total_size_bytes).toBe(1920)
        expect(jsonData.raw.directory_scan.max_depth_scanned).toBe(3)
        expect(jsonData.raw.directory_scan.scan_duration_ms).toBe(150)
        expect(jsonData.raw.directory_scan.entries).toEqual(expect.any(Array))
      })
      
      it('should calculate structure analysis metrics', () => {
        const jsonData = dto.toJsonData()
        const structureAnalysis = jsonData.calculated.structure_analysis
        
        expect(structureAnalysis.actual_depth).toBe(2)
        expect(structureAnalysis.total_files).toBe(4)
        expect(structureAnalysis.total_directories).toBe(2)
        expect(structureAnalysis.total_size_bytes).toBe(1920)
        expect(structureAnalysis.avg_files_per_directory).toBe(2)
        expect(structureAnalysis.human_readable_size).toBe('1.88 KB')
        expect(structureAnalysis.size_per_file_avg).toBe(480) // 1920 / 4
      })
      
      it('should calculate organization analysis metrics', () => {
        const jsonData = dto.toJsonData()
        const orgAnalysis = jsonData.calculated.organization_analysis
        
        expect(orgAnalysis.avg_files_per_directory).toBe(2)
        expect(orgAnalysis.structure_balance).toBe(2) // files/directories ratio
        expect(orgAnalysis.directory_to_file_ratio).toBe(0.5) // 2/4
        expect(orgAnalysis.is_flat_structure).toBe(true) // depth <= 2
        expect(orgAnalysis.is_deep_structure).toBe(false) // depth <= 5
        expect(typeof orgAnalysis.complexity_score).toBe('number')
      })
      
      it('should calculate scan performance metrics', () => {
        const jsonData = dto.toJsonData()
        const scanPerf = jsonData.calculated.scan_performance
        
        expect(scanPerf.scan_duration_ms).toBe(150)
        expect(scanPerf.total_entries_scanned).toBe(6) // 4 files + 2 dirs
        expect(scanPerf.entries_per_second).toBe(40) // (6/150) * 1000
        expect(scanPerf.scan_efficiency_score).toBe(0.4) // min(40/100, 1)
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(10)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('Root directory path'),
          query: '.raw.directory_scan.root_path',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all analysis categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('directory_scan'))).toBe(true)
        expect(queries.some(q => q.includes('structure_analysis'))).toBe(true)
        expect(queries.some(q => q.includes('organization_analysis'))).toBe(true)
        expect(queries.some(q => q.includes('scan_performance'))).toBe(true)
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

  describe('static calculation methods via factory method', () => {
    it('should calculate counts correctly when not provided to factory', () => {
      // Test the static calculation methods indirectly through the factory method
      const dto = DirectoryStructureDTO.fromDirectoryScan(
        '/test/path',
        mockEntries,
        {
          maxDepthScanned: 3,
          scanDuration: 100
          // Don't provide totals - they should be calculated
        }
      )
      
      expect(dto.totalFiles).toBe(4) // index.ts, helper.ts, package.json, README.md (from mockEntries)
      expect(dto.totalDirectories).toBe(2) // src, utils
      expect(dto.totalSize).toBe(1920) // 1024 + 512 + 256 + 128
    })

    it('should handle empty entries in factory method', () => {
      const dto = DirectoryStructureDTO.fromDirectoryScan(
        '/empty/path',
        [],
        {
          maxDepthScanned: 1,
          scanDuration: 50
          // Don't provide totals - they should be calculated as 0
        }
      )

      expect(dto.totalFiles).toBe(0)
      expect(dto.totalDirectories).toBe(0)
      expect(dto.totalSize).toBe(0)
    })
  })

  describe('edge cases and validation', () => {
    it('should handle very large directories', () => {
      const largeDto = new DirectoryStructureDTO(
        '/large/project',
        [],
        10,
        10_000, // 10k files
        1000,  // 1k directories
        1024 * 1024 * 1024, // 1GB
        30_000  // 30 seconds
      )

      expect(largeDto.getHumanReadableSize()).toBe('1 GB')
      expect(largeDto.getAverageFilesPerDirectory()).toBe(10)
      expect(largeDto.getSummary()).toBe('/large/project: 10000 files, 1000 dirs (30s)')
    })

    it('should handle deeply nested structures', () => {
      const deepEntries: TDirectoryEntry[] = [
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      modified: new Date(),
                      name: 'deep-file.txt',
                      path: '/deep/level1/level2/level3/deep-file.txt',
                      size: 100,
                      type: 'file'
                    }
                  ],
                  modified: new Date(),
                  name: 'level3',
                  path: '/deep/level1/level2/level3',
                  type: 'directory'
                }
              ],
              modified: new Date(),
              name: 'level2',
              path: '/deep/level1/level2',
              type: 'directory'
            }
          ],
          modified: new Date(),
          name: 'level1',
          path: '/deep/level1',
          type: 'directory'
        }
      ]

      const deepDto = new DirectoryStructureDTO(
        '/deep',
        deepEntries,
        10,
        1,
        3,
        100,
        100
      )

      expect(deepDto.getActualDepth()).toBe(3)
      
      const jsonData = deepDto.toJsonData()
      expect(jsonData.calculated.organization_analysis.is_deep_structure).toBe(false) // 3 <= 5
      expect(jsonData.calculated.organization_analysis.is_flat_structure).toBe(false) // 3 > 2
    })

    it('should handle structure with no files', () => {
      const dirOnlyEntries: TDirectoryEntry[] = [
        {
          modified: new Date(),
          name: 'empty-dir1',
          path: '/project/empty-dir1',
          type: 'directory'
        },
        {
          modified: new Date(),
          name: 'empty-dir2',
          path: '/project/empty-dir2',
          type: 'directory'
        }
      ]

      const dirOnlyDto = new DirectoryStructureDTO(
        '/project',
        dirOnlyEntries,
        2,
        0, // no files
        2,
        0,
        75
      )

      expect(dirOnlyDto.getAverageFilesPerDirectory()).toBe(0)
      expect(dirOnlyDto.getAllFilePaths()).toEqual([])
      expect(dirOnlyDto.getAllDirectoryPaths()).toEqual([
        '/project/empty-dir1',
        '/project/empty-dir2'
      ])
    })
  })
})