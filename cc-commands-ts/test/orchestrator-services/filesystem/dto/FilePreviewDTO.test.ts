/**
 * @file Unit tests for FilePreviewDTO
 * 
 * Tests the FilePreviewDTO class including constructor validation,
 * toLLMData method, toJsonData method, and utility methods.
 */

/* eslint-disable max-nested-callbacks */

import { beforeEach, describe, expect, it } from 'vitest'

import { FilePreviewDTO } from '../../../../src/orchestrator-services/filesystem/dto/FilePreviewDTO.js'

describe('FilePreviewDTO', () => {
  const validPreviewData = {
    encoding: 'utf8',
    firstLines: [
      'export const exampleFunction = () => {',
      '  return "Hello, World!"',
      '}'
    ],
    isEmpty: false,
    isReadable: true,
    path: '/home/user/project/src/example.ts',
    totalLines: 3
  }

  describe('constructor', () => {
    it('should create a valid FilePreviewDTO instance', () => {
      const dto = new FilePreviewDTO(
        validPreviewData.path,
        validPreviewData.firstLines,
        validPreviewData.isEmpty,
        validPreviewData.isReadable,
        validPreviewData.encoding,
        validPreviewData.totalLines
      )

      expect(dto.path).toBe(validPreviewData.path)
      expect(dto.firstLines).toEqual(validPreviewData.firstLines)
      expect(dto.isEmpty).toBe(validPreviewData.isEmpty)
      expect(dto.isReadable).toBe(validPreviewData.isReadable)
      expect(dto.encoding).toBe(validPreviewData.encoding)
      expect(dto.totalLines).toBe(validPreviewData.totalLines)
    })

    it('should handle empty files', () => {
      const dto = new FilePreviewDTO(
        '/empty/file.txt',
        [],
        true,  // isEmpty
        true,  // isReadable (empty files are readable)
        'utf8',
        0
      )

      expect(dto.isEmpty).toBe(true)
      expect(dto.firstLines).toEqual([])
      expect(dto.totalLines).toBe(0)
      expect(dto.previewLineCount).toBe(0)
    })

    it('should handle binary files', () => {
      const dto = new FilePreviewDTO(
        '/project/image.png',
        [],
        false, // not empty but binary
        false, // not readable
        'binary',
        0
      )

      expect(dto.isReadable).toBe(false)
      expect(dto.encoding).toBe('binary')
    })

    it('should handle partial previews', () => {
      const dto = new FilePreviewDTO(
        '/large/file.txt',
        ['Line 1', 'Line 2', 'Line 3'],
        false, // not empty
        true,  // readable
        'utf8',
        1000   // many more lines than preview
      )

      expect(dto.previewLineCount).toBe(3)
      expect(dto.totalLines).toBe(1000)
      expect(dto.getPreviewCompleteness()).toBeLessThan(1)
    })
  })

  describe('fromPreviewOperation factory method', () => {
    it('should create DTO from preview operation results', () => {
      const dto = FilePreviewDTO.fromPreviewOperation('/test/file.js', {
        encoding: 'utf8',
        firstLines: ['console.log("hello")', '// end of file'],
        isEmpty: false,
        isReadable: true,
        totalLines: 2
      })

      expect(dto.path).toBe('/test/file.js')
      expect(dto.firstLines).toEqual(['console.log("hello")', '// end of file'])
      expect(dto.isEmpty).toBe(false)
      expect(dto.isReadable).toBe(true)
      expect(dto.encoding).toBe('utf8')
      expect(dto.totalLines).toBe(2)
    })

    it('should handle missing optional parameters', () => {
      const dto = FilePreviewDTO.fromPreviewOperation('/test/file.txt', {
        firstLines: ['Hello world'],
        isEmpty: false,
        isReadable: true
        // encoding and totalLines missing
      })

      expect(dto.encoding).toBe('unknown')
      expect(dto.totalLines).toBe(1) // defaults to firstLines.length
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new FilePreviewDTO(
        validPreviewData.path,
        validPreviewData.firstLines,
        validPreviewData.isEmpty,
        validPreviewData.isReadable,
        validPreviewData.encoding,
        validPreviewData.totalLines
      )

      const llmData = dto.toLLMData()

      expect(llmData.PREVIEW_FILE_PATH).toBe('/home/user/project/src/example.ts')
      expect(llmData.PREVIEW_FIRST_LINES).toBe(validPreviewData.firstLines.join('\n'))
      expect(llmData.PREVIEW_IS_EMPTY).toBe('false')
      expect(llmData.PREVIEW_IS_READABLE).toBe('true')
      expect(llmData.PREVIEW_ENCODING).toBe('utf8')
      expect(llmData.PREVIEW_LINES_COUNT).toBe('3')
    })

    it('should handle empty files in LLM data format', () => {
      const dto = new FilePreviewDTO(
        '/test/empty.txt',
        [],
        true,
        true,
        'utf8',
        0
      )

      const llmData = dto.toLLMData()

      expect(llmData.PREVIEW_IS_EMPTY).toBe('true')
      expect(llmData.PREVIEW_FIRST_LINES).toBe('')
      expect(llmData.PREVIEW_LINES_COUNT).toBe('0')
    })

    it('should handle binary files in LLM data format', () => {
      const dto = new FilePreviewDTO(
        '/project/binary.dat',
        [],
        false,
        false,
        'binary',
        0
      )

      const llmData = dto.toLLMData()

      expect(llmData.PREVIEW_IS_READABLE).toBe('false')
      expect(llmData.PREVIEW_ENCODING).toBe('binary')
    })
  })

  describe('utility methods', () => {
    let dto: FilePreviewDTO

    beforeEach(() => {
      dto = new FilePreviewDTO(
        validPreviewData.path,
        validPreviewData.firstLines,
        validPreviewData.isEmpty,
        validPreviewData.isReadable,
        validPreviewData.encoding,
        validPreviewData.totalLines
      )
    })

    it('should calculate preview line count', () => {
      expect(dto.previewLineCount).toBe(3)
    })

    it('should detect content type correctly', () => {
      expect(dto.getContentType()).toBe('javascript') // Contains 'const'
    })

    it('should detect content types for different files', () => {
      const testCases = [
        {
          contentType: 'html',
          firstLines: ['<!doctype html>', '<html>']
        },
        {
          contentType: 'json',
          firstLines: ['{', '  "name": "test"', '}']
        },
        {
          contentType: 'python',
          firstLines: ['def main():', '    pass']
        },
        {
          contentType: 'empty',
          firstLines: [],
          isEmpty: true
        },
        {
          contentType: 'binary',
          firstLines: [],
          isReadable: false
        }
      ]

      for (const testCase of testCases) {
        const testDto = new FilePreviewDTO(
          '/test/file',
          testCase.firstLines,
          testCase.isEmpty || false,
          testCase.isReadable !== false,
          'utf8',
          testCase.firstLines.length
        )
        
        expect(testDto.getContentType()).toBe(testCase.contentType)
      }
    })

    it('should estimate file size based on preview', () => {
      const estimatedSize = dto.getEstimatedSize()
      expect(estimatedSize).toBeGreaterThan(0)
      
      // Should be reasonable estimate based on average line length
      const avgLineLength = validPreviewData.firstLines.reduce((sum, line) => sum + line.length, 0) / validPreviewData.firstLines.length
      const expectedSize = Math.round(avgLineLength * validPreviewData.totalLines)
      expect(estimatedSize).toBe(expectedSize)
    })

    it('should handle empty file size estimation', () => {
      const emptyDto = new FilePreviewDTO('/empty.txt', [], true, true, 'utf8', 0)
      expect(emptyDto.getEstimatedSize()).toBe(0)
    })

    it('should calculate preview completeness', () => {
      expect(dto.getPreviewCompleteness()).toBe(1) // 3/3 lines
      
      const partialDto = new FilePreviewDTO(
        '/large.txt', 
        ['Line 1', 'Line 2'], 
        false, 
        true, 
        'utf8', 
        10
      )
      expect(partialDto.getPreviewCompleteness()).toBe(0.2) // 2/10 lines
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('/home/user/project/src/example.ts: javascript (3/3 lines, 100% preview)')
    })

    it('should generate summary for different file states', () => {
      const emptyDto = new FilePreviewDTO('/empty.txt', [], true, true, 'utf8', 0)
      expect(emptyDto.getSummary()).toBe('/empty.txt: empty file')

      const binaryDto = new FilePreviewDTO('/binary.dat', [], false, false, 'binary', 0)
      expect(binaryDto.getSummary()).toBe('/binary.dat: binary/unreadable file')
    })

    it('should detect configuration files', () => {
      const testCases = [
        {
          expected: true,
          firstLines: ['DEBUG=true', 'PORT=3000'],
          path: '/project/.env'
        },
        {
          expected: true,
          firstLines: ['[database]', 'host=localhost'],
          path: '/config/app.ini'
        },
        {
          expected: true,
          firstLines: ['debug: true', 'port: 3000'],
          path: '/config.yaml'
        },
        {
          expected: false,
          firstLines: ['export const config = {}'],
          path: '/src/config.ts'
        }
      ]

      for (const testCase of testCases) {
        const testDto = new FilePreviewDTO(
          testCase.path,
          testCase.firstLines,
          false,
          true,
          'utf8',
          testCase.firstLines.length
        )
        
        expect(testDto.isConfigurationFile()).toBe(testCase.expected)
      }
    })

    it('should detect documentation files', () => {
      const testCases = [
        {
          expected: true,
          firstLines: ['# My Project', 'This is a readme'],
          path: '/README.md'
        },
        {
          expected: true,
          firstLines: ['User Manual', '==========='],
          path: '/docs/manual.txt'
        },
        {
          expected: false,
          firstLines: ['console.log("hello")'],
          path: '/src/index.js'
        }
      ]

      for (const testCase of testCases) {
        const testDto = new FilePreviewDTO(
          testCase.path,
          testCase.firstLines,
          false,
          true,
          'utf8',
          testCase.firstLines.length
        )
        
        expect(testDto.isDocumentationFile()).toBe(testCase.expected)
      }
    })

    it('should detect source code files', () => {
      const testCases = [
        {
          expected: true,
          firstLines: ['function hello() {', '  return "world"', '}'],
          path: '/src/hello.js'
        },
        {
          expected: true,
          firstLines: ['def main():', '    pass'],
          path: '/app.py'
        },
        {
          expected: true,
          firstLines: ['class MyClass {', '  constructor() {}'],
          path: '/lib/MyClass.ts'
        },
        {
          expected: false,
          firstLines: ['# Documentation', 'This is a guide'],
          path: '/README.md'
        }
      ]

      for (const testCase of testCases) {
        const testDto = new FilePreviewDTO(
          testCase.path,
          testCase.firstLines,
          false,
          true,
          'utf8',
          testCase.firstLines.length
        )
        
        expect(testDto.isSourceCodeFile()).toBe(testCase.expected)
      }
    })
  })

  describe('JSON methods for result files', () => {
    let dto: FilePreviewDTO
    
    beforeEach(() => {
      dto = new FilePreviewDTO(
        validPreviewData.path,
        validPreviewData.firstLines,
        validPreviewData.isEmpty,
        validPreviewData.isReadable,
        validPreviewData.encoding,
        validPreviewData.totalLines
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured data with raw and calculated namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('file_preview')
        expect(jsonData.calculated).toHaveProperty('preview_analysis')
      })
      
      it('should preserve raw preview data unchanged', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData.raw.file_preview.path).toBe('/home/user/project/src/example.ts')
        expect(jsonData.raw.file_preview.first_lines).toEqual(validPreviewData.firstLines)
        expect(jsonData.raw.file_preview.is_empty).toBe(false)
        expect(jsonData.raw.file_preview.is_readable).toBe(true)
        expect(jsonData.raw.file_preview.encoding).toBe('utf8')
        expect(jsonData.raw.file_preview.total_lines).toBe(3)
      })
      
      it('should calculate preview analysis metrics', () => {
        const jsonData = dto.toJsonData()
        const analysis = jsonData.calculated.preview_analysis
        
        expect(analysis.content_type).toBe('javascript')
        expect(analysis.completeness_ratio).toBe(1)
        expect(analysis.preview_lines_count).toBe(3)
        expect(analysis.content_characteristics.appears_to_be_source_code).toBe(true)
        expect(analysis.content_characteristics.has_content).toBe(true)
        expect(analysis.size_estimation.estimated_size_bytes).toBeGreaterThan(0)
        expect(analysis.reading_metrics.estimated_words).toBeGreaterThan(0)
      })
      
      it('should calculate content characteristics', () => {
        const jsonData = dto.toJsonData()
        const characteristics = jsonData.calculated.preview_analysis.content_characteristics
        
        expect(typeof characteristics.appears_to_be_config).toBe('boolean')
        expect(typeof characteristics.appears_to_be_documentation).toBe('boolean')
        expect(typeof characteristics.appears_to_be_source_code).toBe('boolean')
        expect(typeof characteristics.has_content).toBe('boolean')
        expect(typeof characteristics.has_long_lines).toBe('boolean')
        expect(typeof characteristics.has_shebang).toBe('boolean')
        expect(typeof characteristics.is_small_file).toBe('boolean')
        expect(typeof characteristics.uses_common_encoding).toBe('boolean')
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(10)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('File path'),
          query: '.raw.file_preview.path',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all analysis categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('file_preview'))).toBe(true)
        expect(queries.some(q => q.includes('preview_analysis'))).toBe(true)
        expect(queries.some(q => q.includes('content_characteristics'))).toBe(true)
        expect(queries.some(q => q.includes('reading_metrics'))).toBe(true)
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
    it('should handle files with shebang', () => {
      const dto = new FilePreviewDTO(
        '/usr/local/bin/script',
        ['#!/bin/bash', 'echo "hello"'],
        false,
        true,
        'utf8',
        2
      )

      expect(dto.getContentType()).toBe('script')
      
      const jsonData = dto.toJsonData()
      expect(jsonData.calculated.preview_analysis.content_characteristics.has_shebang).toBe(true)
    })

    it('should handle files with very long lines', () => {
      const longLine = 'a'.repeat(200)
      const dto = new FilePreviewDTO(
        '/test/long-lines.txt',
        [longLine, 'short line'],
        false,
        true,
        'utf8',
        2
      )

      const jsonData = dto.toJsonData()
      expect(jsonData.calculated.preview_analysis.content_characteristics.has_long_lines).toBe(true)
    })

    it('should handle files with unknown encoding', () => {
      const dto = FilePreviewDTO.fromPreviewOperation('/test/file.dat', {
        firstLines: ['some content'],
        isEmpty: false,
        isReadable: true
        // no encoding provided
      })

      expect(dto.encoding).toBe('unknown')
      
      const jsonData = dto.toJsonData()
      expect(jsonData.calculated.preview_analysis.content_characteristics.uses_common_encoding).toBe(false)
    })

    it('should classify small vs large files', () => {
      const smallDto = new FilePreviewDTO('/small.txt', ['line1'], false, true, 'utf8', 10)
      const largeDto = new FilePreviewDTO('/large.txt', ['line1'], false, true, 'utf8', 1000)

      const smallJson = smallDto.toJsonData()
      const largeJson = largeDto.toJsonData()

      expect(smallJson.calculated.preview_analysis.content_characteristics.is_small_file).toBe(true)
      expect(largeJson.calculated.preview_analysis.content_characteristics.is_small_file).toBe(false)
    })

    it('should handle zero-length total lines gracefully', () => {
      const dto = new FilePreviewDTO('/test.txt', ['content'], false, true, 'utf8', 0)
      
      // Should not crash on division by zero
      expect(dto.getPreviewCompleteness()).toBe(1)
    })

    it('should handle different date formats for previewedAt', () => {
      const customDate = new Date('2025-01-15T10:00:00Z')
      const dto = new FilePreviewDTO(
        '/test.txt',
        ['content'],
        false,
        true,
        'utf8',
        1,
        customDate
      )

      expect(dto.previewedAt).toBe(customDate)
      
      const jsonData = dto.toJsonData()
      expect(jsonData.raw.file_preview.previewed_at).toBe('2025-01-15T10:00:00.000Z')
    })
  })
})