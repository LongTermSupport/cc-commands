import { existsSync, mkdirSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { JqHint } from '../../../src/core/interfaces/JqHint.js'

import { 
  ensureResultsDirectory, 
  generateJqExamples, 
  generateResultFilePath
} from '../../../src/core/utils/ResultFileUtils.js'

vi.mock('fs')

describe('ResultFileUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(true)
  })
  
  describe('generateResultFilePath', () => {
    it('should generate timestamped file path', () => {
      const testDate = new Date('2025-01-29T10:30:45Z')
      const path = generateResultFilePath('project_summary', testDate)
      
      expect(path).toMatch(/var\/results\/project_summary_2025-01-29_10-30-45\.json\.xz$/)
    })
    
    it('should use current date when no date provided', () => {
      const path = generateResultFilePath('test_command')
      
      expect(path).toMatch(/var\/results\/test_command_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json\.xz$/)
    })
    
    it('should handle command names with special characters', () => {
      const testDate = new Date('2025-01-29T10:30:45Z')
      const path = generateResultFilePath('g-gh-project-summary', testDate)
      
      expect(path).toMatch(/var\/results\/g-gh-project-summary_2025-01-29_10-30-45\.json\.xz$/)
    })
  })
  
  describe('ensureResultsDirectory', () => {
    it('should create directory when it does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(mkdirSync).mockReturnValue()
      
      ensureResultsDirectory()
      
      expect(mkdirSync).toHaveBeenCalledWith(
        expect.stringMatching(/.*\/var\/results$/), 
        { recursive: true }
      )
    })
    
    it('should not create directory when it already exists', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      
      ensureResultsDirectory()
      
      expect(mkdirSync).not.toHaveBeenCalled()
    })
    
    it('should handle directory creation errors gracefully', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(mkdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })
      
      expect(() => ensureResultsDirectory()).toThrow('Failed to create results directory')
    })
  })
  
  describe('generateJqExamples', () => {
    it('should generate formatted jq examples from hints', () => {
      const hints: JqHint[] = [
        { description: 'Repository name', query: '.raw.github_api.name', scope: 'single_item' },
        { description: 'Days old', query: '.calculated.time_calculations.age_days', scope: 'single_item' },
        { description: 'Generation timestamp', query: '.metadata.generated_at', scope: 'single_item' }
      ]
      const filePath = '/tmp/result.json.xz'
      
      const examples = generateJqExamples(hints, filePath)
      
      expect(examples).toHaveLength(3)
      expect(examples[0]?.trim()).toBe(`xzcat ${filePath} | jq '.raw.github_api.name'  # Repository name`) // eslint-disable-line cc-commands/require-typed-data-access
      expect(examples[1]?.trim()).toBe(`xzcat ${filePath} | jq '.calculated.time_calculations.age_days'  # Days old`) // eslint-disable-line cc-commands/require-typed-data-access
      expect(examples[2]?.trim()).toBe(`xzcat ${filePath} | jq '.metadata.generated_at'  # Generation timestamp`) // eslint-disable-line cc-commands/require-typed-data-access
    })
    
    it('should handle empty hints array', () => {
      const hints: JqHint[] = []
      const filePath = '/tmp/result.json.xz'
      
      const examples = generateJqExamples(hints, filePath)
      
      expect(examples).toHaveLength(0)
      expect(examples).toEqual([])
    })
    
    it('should properly escape file path in commands', () => {
      const hints: JqHint[] = [
        { description: 'Basic metadata', query: '.metadata', scope: 'single_item' }
      ]
      const filePath = '/tmp/path with spaces/result.json.xz'
      
      const examples = generateJqExamples(hints, filePath)
      
      expect(examples[0]).toContain('xzcat /tmp/path with spaces/result.json.xz') // eslint-disable-line cc-commands/require-typed-data-access
      expect(examples[0]).toContain("jq '.metadata'") // eslint-disable-line cc-commands/require-typed-data-access
      expect(examples[0]).toContain('# Basic metadata') // eslint-disable-line cc-commands/require-typed-data-access
    })
  })
})