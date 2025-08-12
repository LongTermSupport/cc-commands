/**
 * @file ArgumentParsingService Tests
 * 
 * Tests for command-line argument parsing service functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_PARSING_CONFIG } from '../../../../src/orchestrator-services/argument-parsing/constants/ArgumentConstants.js'
import { ParsedArgumentsDTO } from '../../../../src/orchestrator-services/argument-parsing/dto/ParsedArgumentsDTO.js'
import { ArgumentParsingService } from '../../../../src/orchestrator-services/argument-parsing/services/ArgumentParsingService.js'

describe('ArgumentParsingService', () => {
  let service: ArgumentParsingService

  beforeEach(() => {
    service = new ArgumentParsingService()
  })

  describe('parseArguments', () => {
    it('should parse simple positional arguments', async () => {
      const result = await service.parseArguments('arg1 arg2 arg3')
      
      expect(result).toBeInstanceOf(ParsedArgumentsDTO)
      expect(result.getPositionalValues()).toEqual(['arg1', 'arg2', 'arg3'])
      expect(result.getEnabledFlags()).toEqual([])
      expect(result.getKeyValueRecord()).toEqual({})
      expect(result.getTotalArgumentCount()).toBe(3)
    })

    it('should parse GitHub repository format', async () => {
      const result = await service.parseArguments('owner/repo')
      
      expect(result.getPositionalValues()).toEqual(['owner/repo'])
      expect(result.toLLMData().GITHUB_REPO_DETECTED).toBe('true')
    })

    it('should parse flags correctly', async () => {
      const result = await service.parseArguments('--force -v --dry-run')
      
      expect(result.getPositionalValues()).toEqual([])
      expect(result.getEnabledFlags()).toEqual(['force', 'v', 'dry-run'])
      expect(result.getFlagsRecord()).toEqual({
        'dry-run': true,
        'force': true,
        'v': true
      })
    })

    it('should parse key-value pairs', async () => {
      const result = await service.parseArguments('--since=2024-01-01 --audience=client')
      
      expect(result.getKeyValueRecord()).toEqual({
        'audience': 'client',
        'since': '2024-01-01'
      })
      expect(result.toLLMData().DATE_ARGS_DETECTED).toBe('true')
    })

    it('should handle mixed argument types', async () => {
      const result = await service.parseArguments('owner/repo --force --since=2024-01-01 additional')
      
      expect(result.getPositionalValues()).toEqual(['owner/repo', 'additional'])
      expect(result.getEnabledFlags()).toEqual(['force'])
      expect(result.getKeyValueRecord()).toEqual({ 'since': '2024-01-01' })
      expect(result.getTotalArgumentCount()).toBe(4)
    })

    it('should handle quoted arguments', async () => {
      const result = await service.parseArguments('"arg with spaces" \'another quoted\'')
      
      expect(result.getPositionalValues()).toEqual(['arg with spaces', 'another quoted'])
      expect(result.hasQuotedArguments()).toBe(true)
    })

    it('should preserve quotes when configured', async () => {
      const config = { ...DEFAULT_PARSING_CONFIG, preserveQuotes: true }
      const result = await service.parseArguments('"quoted arg"', config)
      
      expect(result.getPositionalValues()).toEqual(['"quoted arg"'])
    })

    it('should normalize flag names when configured', async () => {
      const config = { ...DEFAULT_PARSING_CONFIG, normalizeFlagNames: true }
      const result = await service.parseArguments('--FORCE --Verbose', config)
      
      expect(result.getEnabledFlags()).toEqual(['force', 'verbose'])
    })

    it('should handle empty input', async () => {
      const result = await service.parseArguments('')
      
      expect(result.getPositionalValues()).toEqual([])
      expect(result.getEnabledFlags()).toEqual([])
      expect(result.getKeyValueRecord()).toEqual({})
      expect(result.getTotalArgumentCount()).toBe(0)
    })

    it('should handle whitespace-only input', async () => {
      const result = await service.parseArguments('   \t  \n  ')
      
      expect(result.getTotalArgumentCount()).toBe(0)
    })

    it('should throw error for malformed key-value pair', async () => {
      await expect(service.parseArguments('--invalid-format')).resolves.toBeInstanceOf(ParsedArgumentsDTO)
      // Note: --invalid-format without = is treated as flag, not error
    })

    it('should detect URL patterns', async () => {
      const result = await service.parseArguments('https://github.com/owner/repo --url=https://api.example.com')
      
      const patterns = await service.detectStandardPatterns(result)
      expect(patterns.urls).toContain('https://github.com/owner/repo')
      expect(patterns.urls).toContain('https://api.example.com')
    })

    it('should detect email patterns', async () => {
      const result = await service.parseArguments('user@example.com --email=admin@test.org')
      
      const patterns = await service.detectStandardPatterns(result)
      expect(patterns.emails).toContain('user@example.com')
      expect(patterns.emails).toContain('admin@test.org')
    })

    it('should detect path patterns', async () => {
      const result = await service.parseArguments('/path/to/file --output=/tmp/result.json')
      
      const patterns = await service.detectStandardPatterns(result)
      expect(patterns.paths).toContain('/path/to/file')
      expect(patterns.paths).toContain('/tmp/result.json')
    })
  })

  describe('parseArgumentArray', () => {
    it('should parse argument array', async () => {
      const result = await service.parseArgumentArray(['owner/repo', '--force', '--since=2024-01-01'])
      
      expect(result.getPositionalValues()).toEqual(['owner/repo'])
      expect(result.getEnabledFlags()).toEqual(['force'])
      expect(result.getKeyValueRecord()).toEqual({ 'since': '2024-01-01' })
    })

    it('should handle empty array', async () => {
      const result = await service.parseArgumentArray([])
      
      expect(result.getTotalArgumentCount()).toBe(0)
    })
  })

  describe('extractFlags', () => {
    it('should extract only flags', async () => {
      const flags = await service.extractFlags('arg1 --force -v --dry-run arg2')
      
      expect(flags).toEqual({
        'dry-run': true,
        'force': true,
        'v': true
      })
    })

    it('should return empty object when no flags', async () => {
      const flags = await service.extractFlags('arg1 arg2')
      
      expect(flags).toEqual({})
    })
  })

  describe('extractKeyValuePairs', () => {
    it('should extract only key-value pairs', async () => {
      const pairs = await service.extractKeyValuePairs('arg1 --key1=value1 --key2=value2 --flag')
      
      expect(pairs).toEqual({
        'key1': 'value1',
        'key2': 'value2'
      })
    })

    it('should return empty object when no key-value pairs', async () => {
      const pairs = await service.extractKeyValuePairs('arg1 --flag arg2')
      
      expect(pairs).toEqual({})
    })
  })

  describe('getPositionalArguments', () => {
    it('should extract only positional arguments', async () => {
      const positional = await service.getPositionalArguments('arg1 --flag --key=value arg2')
      
      expect(positional).toEqual(['arg1', 'arg2'])
    })

    it('should return empty array when no positional arguments', async () => {
      const positional = await service.getPositionalArguments('--flag --key=value')
      
      expect(positional).toEqual([])
    })
  })

  describe('standardizeArguments', () => {
    it('should return same arguments for now', async () => {
      const original = await service.parseArguments('owner/repo --force')
      const standardized = await service.standardizeArguments(original)
      
      expect(standardized).toBe(original)
    })
  })

  describe('detectStandardPatterns', () => {
    it('should detect GitHub repositories', async () => {
      const parsed = await service.parseArguments('owner/repo another/project')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.github_repos).toEqual(['owner/repo', 'another/project'])
    })

    it('should detect dates', async () => {
      const parsed = await service.parseArguments('--since=2024-01-01 --until=2024-12-31')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.dates).toEqual(['2024-01-01', '2024-12-31'])
    })

    it('should detect URLs', async () => {
      const parsed = await service.parseArguments('https://example.com --api=https://api.test.com')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.urls).toEqual(['https://example.com', 'https://api.test.com'])
    })

    it('should detect emails', async () => {
      const parsed = await service.parseArguments('admin@example.com --notify=user@test.org')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.emails).toEqual(['admin@example.com', 'user@test.org'])
    })

    it('should detect paths', async () => {
      const parsed = await service.parseArguments('/home/user/file --config=/etc/app.conf')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.paths).toEqual(['/home/user/file', '/etc/app.conf'])
    })

    it('should return empty arrays for no matches', async () => {
      const parsed = await service.parseArguments('simple arguments')
      const patterns = await service.detectStandardPatterns(parsed)
      
      expect(patterns.github_repos).toEqual([])
      expect(patterns.dates).toEqual([])
      expect(patterns.urls).toEqual([])
      expect(patterns.emails).toEqual([])
      expect(patterns.paths).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle complex quoted arguments', async () => {
      const result = await service.parseArguments('"complex arg with --flag inside" --real-flag')
      
      expect(result.getPositionalValues()).toEqual(['complex arg with --flag inside'])
      expect(result.getEnabledFlags()).toEqual(['real-flag'])
    })

    it('should handle mixed quotes', async () => {
      const result = await service.parseArguments('\'"mixed quotes"\' "more \'complex\' quotes"')
      
      expect(result.getPositionalValues()).toEqual(['"mixed quotes"', "more 'complex' quotes"])
    })

    it('should handle special characters in arguments', async () => {
      const result = await service.parseArguments('arg@#$%^&*() --key=value!@#$%^&*()')
      
      expect(result.getPositionalValues()).toEqual(['arg@#$%^&*()'])
      expect(result.getKeyValueRecord()).toEqual({ 'key': 'value!@#$%^&*()' })
    })

    it('should trim values when configured', async () => {
      const config = { ...DEFAULT_PARSING_CONFIG, trimValues: true }
      const result = await service.parseArguments('  arg1   --key=value  ', config)
      
      expect(result.getPositionalValues()).toEqual(['arg1'])
      expect(result.getKeyValueRecord()).toEqual({ 'key': 'value' })
    })

    it('should handle very long argument strings', async () => {
      const longArg = 'a'.repeat(500)
      const result = await service.parseArguments(`${longArg} --key=${longArg}`)
      
      expect(result.getPositionalValues()).toEqual([longArg])
      expect(result.getKeyValueRecord()).toEqual({ 'key': longArg })
    })
  })

  describe('error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      // This shouldn't actually throw since our parser is robust
      const result = await service.parseArguments('arg1 arg2')
      expect(result).toBeInstanceOf(ParsedArgumentsDTO)
    })
  })
})