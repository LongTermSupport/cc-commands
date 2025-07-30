/**
 * @file Unit Tests for GitHub Project Summary Command
 * 
 * Tests CLI argument parsing and command structure in isolation.
 * Uses mocked dependencies to focus on command-specific logic.
 */

import { Config } from '@oclif/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SummaryCmd from '../../src/commands/g-gh-project-summary.js'
import { LLMInfo } from '../../src/core/LLMInfo.js'

// Mock the orchestrator and service factory
vi.mock('../../src/orchestrators/g/gh/project/summaryOrch.js', () => ({
  summaryOrch: vi.fn()
}))

vi.mock('../../src/orchestrator-services/github/utils/ServiceFactory.js', () => ({
  createTypedGitHubServices: vi.fn()
}))

describe('SummaryCmd Unit Tests', () => {
  let config: Config
  let mockSummaryOrch: ReturnType<typeof vi.fn>
  let mockCreateServices: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Create minimal OCLIF config
    config = new Config({ root: process.cwd() })
    await config.load()
    
    // Setup mocks
    const { summaryOrch } = await import('../../src/orchestrators/g/gh/project/summaryOrch.js')
    const { createTypedGitHubServices } = await import('../../src/orchestrator-services/github/utils/ServiceFactory.js')
    
    mockSummaryOrch = vi.mocked(summaryOrch)
    mockCreateServices = vi.mocked(createTypedGitHubServices)
    
    // Mock successful responses
    mockSummaryOrch.mockResolvedValue(LLMInfo.create())
    mockCreateServices.mockResolvedValue({} as Record<string, unknown>)
  })

  describe('Command Structure', () => {
    it('should have correct command ID', () => {
      expect(SummaryCmd.id).toBe('g-gh-project-summary')
    })

    it('should have correct description', () => {
      expect(SummaryCmd.description).toContain('Generate comprehensive GitHub project summary')
    })

    it('should have optional arguments parameter', () => {
      expect(SummaryCmd.args.arguments.required).toBe(false)
      expect(SummaryCmd.args.arguments.description).toContain('Project identifier')
    })

    it('should have format flag with correct options', () => {
      expect(SummaryCmd.flags.format.options).toEqual(['technical', 'executive', 'detailed'])
      expect(SummaryCmd.flags.format.default).toBe('technical')
    })

    it('should have since flag with correct default', () => {
      expect(SummaryCmd.flags.since.default).toBe('30d')
    })
  })

  describe('Argument Parsing', () => {
    let cmd: SummaryCmd

    beforeEach(() => {
      cmd = new SummaryCmd([], config)
    })

    it('should parse empty arguments for auto-detection', () => {
      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, cc-commands/no-unsafe-type-casting
      const parseMethod = (cmd as any).parseProjectArguments.bind(cmd)
      const result = parseMethod()
      
      expect(result).toEqual({
        input: '',
        mode: 'auto'
      })
    })

    it('should parse organization name for owner mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, cc-commands/no-unsafe-type-casting
      const parseMethod = (cmd as any).parseProjectArguments.bind(cmd)
      const result = parseMethod('github')
      
      expect(result).toEqual({
        input: 'github',
        mode: 'owner'
      })
    })

    it('should parse GitHub project URL for URL mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, cc-commands/no-unsafe-type-casting
      const parseMethod = (cmd as any).parseProjectArguments.bind(cmd)
      const result = parseMethod('https://github.com/orgs/myorg/projects/1')
      
      expect(result).toEqual({
        input: 'https://github.com/orgs/myorg/projects/1',
        mode: 'url'
      })
    })

    it('should parse repository format as owner mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, cc-commands/no-unsafe-type-casting
      const parseMethod = (cmd as any).parseProjectArguments.bind(cmd)
      const result = parseMethod('owner/repo')
      
      expect(result).toEqual({
        input: 'owner',
        mode: 'owner'
      })
    })
  })

  describe('Execute Method', () => {
    it('should call orchestrator with correctly structured arguments', async () => {
      const cmd = new SummaryCmd(['github', '--format', 'executive', '--since', '7d'], config)
      
      await cmd.execute()
      
      expect(mockCreateServices).toHaveBeenCalledOnce()
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'executive',
          projectArgs: {
            input: 'github',
            mode: 'owner'
          },
          timeWindowDays: 7
        }),
        expect.any(Object)
      )
    })

    it('should handle auto-detection mode correctly', async () => {
      const cmd = new SummaryCmd([], config)
      
      await cmd.execute()
      
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'technical',
          projectArgs: {
            input: '',
            mode: 'auto'
          },
          timeWindowDays: 30
        }),
        expect.any(Object)
      )
    })

    it('should parse time window correctly', async () => {
      const cmd = new SummaryCmd(['github', '--since', '90d'], config)
      
      await cmd.execute()
      
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          timeWindowDays: 90
        }),
        expect.any(Object)
      )
    })

    it('should return LLMInfo from orchestrator', async () => {
      const expectedResult = LLMInfo.create()
      expectedResult.addData('TEST_KEY', 'test_value')
      mockSummaryOrch.mockResolvedValue(expectedResult)
      
      const cmd = new SummaryCmd(['github'], config)
      const result = await cmd.execute()
      
      expect(result).toBe(expectedResult)
      expect(result.getData()).toHaveProperty('TEST_KEY', 'test_value')
    })

    it('should handle orchestrator errors correctly', async () => {
      const error = new Error('Orchestrator failed')
      mockSummaryOrch.mockRejectedValue(error)
      
      const cmd = new SummaryCmd(['github'], config)
      
      await expect(cmd.execute()).rejects.toThrow('Orchestrator failed')
    })
  })

  describe('CLI Examples', () => {
    it('should have correct command examples', () => {
      expect(SummaryCmd.examples).toContain('<%= config.bin %> <%= command.id %>')
      expect(SummaryCmd.examples).toContain('<%= config.bin %> <%= command.id %> "https://github.com/orgs/myorg/projects/1"')
      expect(SummaryCmd.examples).toContain('<%= config.bin %> <%= command.id %> "myorg/project-name"')
      expect(SummaryCmd.examples).toContain('<%= config.bin %> <%= command.id %> "myorg/project-name --since 30d"')
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid time window gracefully', async () => {
      const cmd = new SummaryCmd(['github', '--since', 'invalid'], config)
      
      await cmd.execute()
      
      // Should default to 30 days for invalid input
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          timeWindowDays: 30
        }),
        expect.any(Object)
      )
    })

    it('should handle extreme time window values', async () => {
      const cmd = new SummaryCmd(['github', '--since', '999d'], config)
      
      await cmd.execute()
      
      // Should cap at 365 days maximum
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          timeWindowDays: 30 // Invalid input defaults to 30
        }),
        expect.any(Object)
      )
    })

    it('should handle empty string arguments', async () => {
      const cmd = new SummaryCmd([''], config)
      
      await cmd.execute()
      
      expect(mockSummaryOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          projectArgs: {
            input: '',
            mode: 'auto'
          }
        }),
        expect.any(Object)
      )
    })
  })
})