/**
 * @file ParsedArgumentsDTO Tests
 * 
 * Tests for parsed arguments data transfer object functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_PARSING_CONFIG } from '../../../../src/orchestrator-services/argument-parsing/constants/ArgumentConstants.js'
import { ParsedArgumentsDTO } from '../../../../src/orchestrator-services/argument-parsing/dto/ParsedArgumentsDTO.js'
import { 
  ArgumentParsingConfig, 
  FlagResult, 
  KeyValuePair, 
  ParsedArgument,
  ParsingContext 
} from '../../../../src/orchestrator-services/argument-parsing/types/ArgumentTypes.js'

describe('ParsedArgumentsDTO', () => {
  let samplePositionalArgs: ParsedArgument[]
  let sampleFlags: FlagResult[]
  let sampleKeyValuePairs: KeyValuePair[]
  let sampleContext: ParsingContext
  let dto: ParsedArgumentsDTO

  beforeEach(() => {
    samplePositionalArgs = [
      { isQuoted: false, position: 0, rawValue: 'owner/repo', value: 'owner/repo' },
      { isQuoted: true, position: 1, rawValue: '"quoted arg"', value: 'quoted arg' }
    ]
    
    sampleFlags = [
      { enabled: true, name: 'force', originalFormat: '--force' },
      { enabled: true, name: 'verbose', originalFormat: '-v' }
    ]
    
    sampleKeyValuePairs = [
      { key: 'since', rawFormat: '--since=2024-01-01', value: '2024-01-01' },
      { key: 'output', rawFormat: '--output=/tmp/result.json', value: '/tmp/result.json' }
    ]
    
    sampleContext = {
      config: DEFAULT_PARSING_CONFIG,
      originalInput: 'owner/repo "quoted arg" --force -v --since=2024-01-01 --output=/tmp/result.json',
      parsedAt: new Date('2024-01-01T12:00:00Z'),
      warnings: ['Test warning']
    }
    
    dto = new ParsedArgumentsDTO(
      samplePositionalArgs,
      sampleFlags,
      sampleKeyValuePairs,
      'test input',
      sampleContext
    )
  })

  describe('construction', () => {
    it('should construct with all properties', () => {
      expect(dto.positionalArgs).toEqual(samplePositionalArgs)
      expect(dto.flags).toEqual(sampleFlags)
      expect(dto.keyValuePairs).toEqual(sampleKeyValuePairs)
      expect(dto.rawInput).toBe('test input')
      expect(dto.parsingContext).toEqual(sampleContext)
    })
  })

  describe('fromParsingResults', () => {
    it('should create DTO from parsing results', () => {
      const config: ArgumentParsingConfig = DEFAULT_PARSING_CONFIG
      const warnings = ['Test warning']
      const rawInput = 'test input'
      
      const result = ParsedArgumentsDTO.fromParsingResults(
        samplePositionalArgs,
        sampleFlags,
        sampleKeyValuePairs,
        rawInput,
        config,
        warnings
      )
      
      expect(result.positionalArgs).toEqual(samplePositionalArgs)
      expect(result.flags).toEqual(sampleFlags)
      expect(result.keyValuePairs).toEqual(sampleKeyValuePairs)
      expect(result.rawInput).toBe(rawInput)
      expect(result.parsingContext.warnings).toEqual(warnings)
      expect(result.parsingContext.config).toEqual(config)
    })

    it('should create with empty warnings by default', () => {
      const result = ParsedArgumentsDTO.fromParsingResults(
        [],
        [],
        [],
        'test',
        DEFAULT_PARSING_CONFIG
      )
      
      expect(result.parsingContext.warnings).toEqual([])
    })
  })

  describe('utility methods', () => {
    it('should get total argument count', () => {
      expect(dto.getTotalArgumentCount()).toBe(6) // 2 positional + 2 flags + 2 key-value
    })

    it('should get enabled flags', () => {
      expect(dto.getEnabledFlags()).toEqual(['force', 'verbose'])
    })

    it('should get positional values', () => {
      expect(dto.getPositionalValues()).toEqual(['owner/repo', 'quoted arg'])
    })

    it('should get key-value record', () => {
      expect(dto.getKeyValueRecord()).toEqual({
        'output': '/tmp/result.json',
        'since': '2024-01-01'
      })
    })

    it('should get flags record', () => {
      expect(dto.getFlagsRecord()).toEqual({
        'force': true,
        'verbose': true
      })
    })

    it('should check if has warnings', () => {
      expect(dto.hasWarnings()).toBe(true)
      
      const noWarningsContext = { ...sampleContext, warnings: [] }
      const noWarningsDto = new ParsedArgumentsDTO([], [], [], '', noWarningsContext)
      expect(noWarningsDto.hasWarnings()).toBe(false)
    })

    it('should check if has quoted arguments', () => {
      expect(dto.hasQuotedArguments()).toBe(true)
      
      const noQuotedArgs = [{ isQuoted: false, position: 0, rawValue: 'arg', value: 'arg' }]
      const noQuotedDto = new ParsedArgumentsDTO(noQuotedArgs, [], [], '', sampleContext)
      expect(noQuotedDto.hasQuotedArguments()).toBe(false)
    })

    it('should get specific key value', () => {
      expect(dto.getKeyValue('since')).toBe('2024-01-01')
      expect(dto.getKeyValue('nonexistent')).toBeUndefined()
    })

    it('should check if flag is enabled', () => {
      expect(dto.isFlagEnabled('force')).toBe(true)
      expect(dto.isFlagEnabled('nonexistent')).toBe(false)
    })
  })

  describe('pattern detection', () => {
    it('should detect GitHub repositories', () => {
      const githubDto = ParsedArgumentsDTO.fromParsingResults(
        [{ isQuoted: false, position: 0, rawValue: 'owner/repo', value: 'owner/repo' }],
        [],
        [],
        'owner/repo',
        DEFAULT_PARSING_CONFIG
      )
      
      const jsonData = githubDto.toJsonData()
      expect(jsonData.calculated['pattern_detection']['github_repos']).toContain('owner/repo')
    })

    it('should detect date arguments', () => {
      const dateDto = ParsedArgumentsDTO.fromParsingResults(
        [],
        [],
        [{ key: 'since', rawFormat: '--since=2024-01-01', value: '2024-01-01' }],
        '--since=2024-01-01',
        DEFAULT_PARSING_CONFIG
      )
      
      const jsonData = dateDto.toJsonData()
      expect(jsonData.calculated['pattern_detection']['date_args']).toContain('2024-01-01')
    })

    it('should detect URL arguments', () => {
      const urlDto = ParsedArgumentsDTO.fromParsingResults(
        [{ isQuoted: false, position: 0, rawValue: 'https://example.com', value: 'https://example.com' }],
        [],
        [],
        'https://example.com',
        DEFAULT_PARSING_CONFIG
      )
      
      const jsonData = urlDto.toJsonData()
      expect(jsonData.calculated['pattern_detection']['url_args']).toContain('https://example.com')
    })

    it('should detect path arguments', () => {
      const pathDto = ParsedArgumentsDTO.fromParsingResults(
        [{ isQuoted: false, position: 0, rawValue: '/path/to/file', value: '/path/to/file' }],
        [],
        [],
        '/path/to/file',
        DEFAULT_PARSING_CONFIG
      )
      
      const jsonData = pathDto.toJsonData()
      expect(jsonData.calculated['pattern_detection']['path_args']).toContain('/path/to/file')
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format', () => {
      const llmData = dto.toLLMData()
      
      expect(llmData.POSITIONAL_ARGS).toBe('owner/repo, quoted arg')
      expect(llmData.FLAGS).toBe('force, verbose')
      expect(llmData.KEY_VALUE_PAIRS).toBe('since, output')
      expect(llmData.RAW_INPUT).toBe('test input')
      expect(llmData.TOTAL_ARGUMENTS).toBe('6')
      expect(llmData.PARSING_TIMESTAMP).toBe('2024-01-01T12:00:00.000Z')
      expect(llmData.PARSING_WARNINGS).toBe('Test warning')
      expect(llmData.HAS_QUOTED_ARGS).toBe('true')
    })

    it('should handle empty arguments', () => {
      const emptyDto = ParsedArgumentsDTO.fromParsingResults(
        [],
        [],
        [],
        '',
        DEFAULT_PARSING_CONFIG,
        []
      )
      
      const llmData = emptyDto.toLLMData()
      
      expect(llmData.POSITIONAL_ARGS).toBe('')
      expect(llmData.FLAGS).toBe('')
      expect(llmData.KEY_VALUE_PAIRS).toBe('')
      expect(llmData.TOTAL_ARGUMENTS).toBe('0')
      expect(llmData.PARSING_WARNINGS).toBe('')
      expect(llmData.HAS_QUOTED_ARGS).toBe('false')
    })
  })

  describe('toJsonData', () => {
    it('should convert to structured JSON data', () => {
      const jsonData = dto.toJsonData()
      
      expect(jsonData).toHaveProperty('raw')
      expect(jsonData).toHaveProperty('calculated')
      
      // Check raw data structure
      expect(jsonData.raw).toHaveProperty('parsed_arguments')
      expect(jsonData.raw).toHaveProperty('parsing_context')
      
      // Check calculated data structure
      expect(jsonData.calculated).toHaveProperty('argument_summary')
      expect(jsonData.calculated).toHaveProperty('pattern_detection')
      expect(jsonData.calculated).toHaveProperty('parsing_analysis')
      
      // Verify argument summary
      const summary = jsonData.calculated['argument_summary']
      expect(summary['total_arguments']).toBe(6)
      expect(summary['positional_count']).toBe(2)
      expect(summary['flags_count']).toBe(2)
      expect(summary['key_value_count']).toBe(2)
    })

    it('should include parsing context correctly', () => {
      const jsonData = dto.toJsonData()
      const context = jsonData.raw['parsing_context']
      
      expect(context['original_input']).toBe(sampleContext.originalInput)
      expect(context['parsed_at']).toBe('2024-01-01T12:00:00.000Z')
      expect(context['warnings']).toEqual(['Test warning'])
      expect(context['config']).toMatchObject({
        normalize_flag_names: DEFAULT_PARSING_CONFIG.normalizeFlagNames,
        preserve_quotes: DEFAULT_PARSING_CONFIG.preserveQuotes,
        trim_values: DEFAULT_PARSING_CONFIG.trimValues
      })
    })
  })

  describe('getJqHints', () => {
    it('should provide comprehensive jq hints', () => {
      const hints = dto.getJqHints()
      
      expect(hints).toBeInstanceOf(Array)
      expect(hints.length).toBeGreaterThan(0)
      
      // Check for key hint categories
      const descriptions = hints.map(hint => hint.description)
      expect(descriptions).toContain('All positional arguments')
      expect(descriptions).toContain('All enabled flags')
      expect(descriptions).toContain('All key-value pairs')
      expect(descriptions).toContain('Total argument count')
    })

    it('should include valid jq queries', () => {
      const hints = dto.getJqHints()
      
      // All hints should have required properties
      for (const hint of hints) {
        expect(hint).toHaveProperty('query')
        expect(hint).toHaveProperty('description')
        expect(hint).toHaveProperty('scope')
        expect(typeof hint.query).toBe('string')
        expect(hint.query.length).toBeGreaterThan(0)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty arguments correctly', () => {
      const emptyDto = ParsedArgumentsDTO.fromParsingResults(
        [],
        [],
        [],
        '',
        DEFAULT_PARSING_CONFIG
      )
      
      expect(emptyDto.getTotalArgumentCount()).toBe(0)
      expect(emptyDto.getPositionalValues()).toEqual([])
      expect(emptyDto.getEnabledFlags()).toEqual([])
      expect(emptyDto.getKeyValueRecord()).toEqual({})
      expect(emptyDto.hasQuotedArguments()).toBe(false)
      expect(emptyDto.hasWarnings()).toBe(false)
    })

    it('should handle single argument types', () => {
      // Only positional arguments
      const positionalOnlyDto = ParsedArgumentsDTO.fromParsingResults(
        [{ isQuoted: false, position: 0, rawValue: 'arg1', value: 'arg1' }],
        [],
        [],
        'arg1',
        DEFAULT_PARSING_CONFIG
      )
      
      expect(positionalOnlyDto.getTotalArgumentCount()).toBe(1)
      expect(positionalOnlyDto.getPositionalValues()).toEqual(['arg1'])
      
      // Only flags
      const flagsOnlyDto = ParsedArgumentsDTO.fromParsingResults(
        [],
        [{ enabled: true, name: 'test', originalFormat: '--test' }],
        [],
        '--test',
        DEFAULT_PARSING_CONFIG
      )
      
      expect(flagsOnlyDto.getTotalArgumentCount()).toBe(1)
      expect(flagsOnlyDto.getEnabledFlags()).toEqual(['test'])
      
      // Only key-value pairs
      const kvOnlyDto = ParsedArgumentsDTO.fromParsingResults(
        [],
        [],
        [{ key: 'test', rawFormat: '--test=value', value: 'value' }],
        '--test=value',
        DEFAULT_PARSING_CONFIG
      )
      
      expect(kvOnlyDto.getTotalArgumentCount()).toBe(1)
      expect(kvOnlyDto.getKeyValueRecord()).toEqual({ 'test': 'value' })
    })
  })
})