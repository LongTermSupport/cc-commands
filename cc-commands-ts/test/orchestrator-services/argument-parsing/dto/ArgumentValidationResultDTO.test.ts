/**
 * @file ArgumentValidationResultDTO Tests
 * 
 * Tests for argument validation result data transfer object functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ARGUMENT_FORMATS } from '../../../../src/orchestrator-services/argument-parsing/constants/ArgumentConstants.js'
import { ArgumentValidationResultDTO } from '../../../../src/orchestrator-services/argument-parsing/dto/ArgumentValidationResultDTO.js'
import { ArgumentFormatError, ArgumentValidationResult } from '../../../../src/orchestrator-services/argument-parsing/types/ArgumentTypes.js'

describe('ArgumentValidationResultDTO', () => {
  let sampleFormatErrors: ArgumentFormatError[]
  let sampleValidationResults: ArgumentValidationResult[]
  let validDto: ArgumentValidationResultDTO
  let invalidDto: ArgumentValidationResultDTO

  beforeEach(() => {
    sampleFormatErrors = [
      {
        argumentName: 'email',
        error: 'Invalid email format',
        expectedFormat: ARGUMENT_FORMATS.EMAIL,
        providedValue: 'invalid-email'
      },
      {
        argumentName: 'number',
        error: 'Invalid number format',
        expectedFormat: ARGUMENT_FORMATS.NUMBER,
        providedValue: 'not-a-number'
      }
    ]
    
    sampleValidationResults = [
      {
        argumentName: 'validArg',
        isValid: true,
        validatedValue: 'valid-value'
      },
      {
        argumentName: 'invalidArg',
        error: 'Validation failed',
        expectedFormat: ARGUMENT_FORMATS.STRING,
        isValid: false
      }
    ]
    
    validDto = ArgumentValidationResultDTO.success(
      { anotherValid: 'another-value', validArg: 'valid-value' },
      sampleValidationResults.filter(r => r.isValid)
    )
    
    invalidDto = ArgumentValidationResultDTO.failure(
      ['missingRequired1', 'missingRequired2'],
      sampleFormatErrors,
      sampleValidationResults,
      { partiallyValid: 'partial-value' }
    )
  })

  describe('construction', () => {
    it('should construct with all properties', () => {
      const dto = new ArgumentValidationResultDTO(
        true,
        [],
        [],
        sampleValidationResults,
        { test: 'value' },
        new Date()
      )
      
      expect(dto.isValid).toBe(true)
      expect(dto.missingRequired).toEqual([])
      expect(dto.formatErrors).toEqual([])
      expect(dto.validationResults).toEqual(sampleValidationResults)
      expect(dto.validatedArguments).toEqual({ test: 'value' })
      expect(dto.validationTimestamp).toBeInstanceOf(Date)
    })
  })

  describe('factory methods', () => {
    describe('fromValidationResults', () => {
      it('should create DTO from validation results', () => {
        const dto = ArgumentValidationResultDTO.fromValidationResults(
          true,
          [],
          [],
          sampleValidationResults,
          { test: 'value' }
        )
        
        expect(dto.isValid).toBe(true)
        expect(dto.validationResults).toEqual(sampleValidationResults)
        expect(dto.validatedArguments).toEqual({ test: 'value' })
        expect(dto.validationTimestamp).toBeInstanceOf(Date)
      })
    })

    describe('success', () => {
      it('should create successful validation result', () => {
        const validated = { arg1: 'value1', arg2: 'value2' }
        const results = [{ argumentName: 'arg1', isValid: true, validatedValue: 'value1' }]
        
        const dto = ArgumentValidationResultDTO.success(validated, results)
        
        expect(dto.isValid).toBe(true)
        expect(dto.missingRequired).toEqual([])
        expect(dto.formatErrors).toEqual([])
        expect(dto.validatedArguments).toEqual(validated)
        expect(dto.validationResults).toEqual(results)
      })

      it('should create success with default empty results', () => {
        const dto = ArgumentValidationResultDTO.success({ test: 'value' })
        
        expect(dto.isValid).toBe(true)
        expect(dto.validationResults).toEqual([])
      })
    })

    describe('failure', () => {
      it('should create failed validation result', () => {
        const missing = ['required1', 'required2']
        const errors = sampleFormatErrors
        const results = sampleValidationResults
        const partial = { partial: 'value' }
        
        const dto = ArgumentValidationResultDTO.failure(missing, errors, results, partial)
        
        expect(dto.isValid).toBe(false)
        expect(dto.missingRequired).toEqual(missing)
        expect(dto.formatErrors).toEqual(errors)
        expect(dto.validationResults).toEqual(results)
        expect(dto.validatedArguments).toEqual(partial)
      })

      it('should create failure with defaults', () => {
        const dto = ArgumentValidationResultDTO.failure(['missing'], [])
        
        expect(dto.isValid).toBe(false)
        expect(dto.validationResults).toEqual([])
        expect(dto.validatedArguments).toEqual({})
      })
    })
  })

  describe('utility methods', () => {
    describe('getFailedArguments', () => {
      it('should return all failed argument names', () => {
        const failed = invalidDto.getFailedArguments()
        
        expect(failed).toContain('missingRequired1')
        expect(failed).toContain('missingRequired2')
        expect(failed).toContain('email')
        expect(failed).toContain('number')
        expect(failed).toContain('invalidArg')
      })

      it('should return empty array for valid result', () => {
        const failed = validDto.getFailedArguments()
        
        expect(failed).toEqual([])
      })

      it('should not duplicate argument names', () => {
        const dto = ArgumentValidationResultDTO.failure(
          ['duplicate'],
          [{ argumentName: 'duplicate', error: 'test', expectedFormat: ARGUMENT_FORMATS.STRING, providedValue: 'test' }],
          [{ argumentName: 'duplicate', error: 'test', isValid: false }]
        )
        
        const failed = dto.getFailedArguments()
        const duplicateCount = failed.filter(name => name === 'duplicate').length
        expect(duplicateCount).toBe(1)
      })
    })

    describe('getSuccessRate', () => {
      it('should calculate success rate correctly', () => {
        // 1 valid out of 2 total = 0.5
        const rate = invalidDto.getSuccessRate()
        expect(rate).toBe(0.5)
      })

      it('should return 1.0 for no validation results', () => {
        const emptyDto = ArgumentValidationResultDTO.success({})
        const rate = emptyDto.getSuccessRate()
        expect(rate).toBe(1)
      })

      it('should return 1.0 for all successful validations', () => {
        const rate = validDto.getSuccessRate()
        expect(rate).toBe(1)
      })
    })

    describe('getTotalIssues', () => {
      it('should count all validation issues', () => {
        // 2 missing + 2 format errors + 1 failed validation = 5
        const issues = invalidDto.getTotalIssues()
        expect(issues).toBe(5)
      })

      it('should return 0 for valid result', () => {
        const issues = validDto.getTotalIssues()
        expect(issues).toBe(0)
      })
    })

    describe('hasIssues', () => {
      it('should return true for invalid result', () => {
        expect(invalidDto.hasIssues()).toBe(true)
      })

      it('should return false for valid result', () => {
        expect(validDto.hasIssues()).toBe(false)
      })
    })

    describe('getIssuesSummary', () => {
      it('should provide summary of validation issues', () => {
        const summary = invalidDto.getIssuesSummary()
        
        expect(summary).toContain('required arguments missing')
        expect(summary).toContain('format errors')
        expect(summary).toContain('validation failures')
      })

      it('should return success message for valid result', () => {
        const summary = validDto.getIssuesSummary()
        expect(summary).toBe('All arguments valid')
      })
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format', () => {
      const llmData = invalidDto.toLLMData()
      
      expect(llmData.ARGUMENTS_VALID).toBe('false')
      expect(llmData.MISSING_REQUIRED).toBe('missingRequired1, missingRequired2')
      expect(llmData.INVALID_FORMATS).toBe('2')
      expect(llmData.VALIDATED_COUNT).toBe('1') // only partiallyValid
      expect(llmData.VALIDATION_TIMESTAMP).toBeDefined()
      expect(llmData.FAILED_ARGUMENTS).toContain('missingRequired1')
      expect(llmData.SUCCESS_RATE).toBe('50.0') // 50%
      expect(llmData.TOTAL_ISSUES).toBe('5')
      expect(llmData.ISSUES_SUMMARY).toContain('format errors')
    })

    it('should handle valid result correctly', () => {
      const llmData = validDto.toLLMData()
      
      expect(llmData.ARGUMENTS_VALID).toBe('true')
      expect(llmData.MISSING_REQUIRED).toBe('')
      expect(llmData.INVALID_FORMATS).toBe('0')
      expect(llmData.FAILED_ARGUMENTS).toBe('')
      expect(llmData.SUCCESS_RATE).toBe('100.0')
      expect(llmData.TOTAL_ISSUES).toBe('0')
      expect(llmData.ISSUES_SUMMARY).toBe('All arguments valid')
    })
  })

  describe('toJsonData', () => {
    it('should convert to structured JSON data', () => {
      const jsonData = invalidDto.toJsonData()
      
      expect(jsonData).toHaveProperty('raw')
      expect(jsonData).toHaveProperty('calculated')
      
      // Check raw data structure
      expect(jsonData.raw).toHaveProperty('validation_result')
      const rawResult = jsonData.raw['validation_result']
      expect(rawResult['is_valid']).toBe(false)
      expect(rawResult['missing_required']).toEqual(['missingRequired1', 'missingRequired2'])
      expect(rawResult['format_errors']).toHaveLength(2)
      
      // Check calculated data structure
      expect(jsonData.calculated).toHaveProperty('validation_summary')
      expect(jsonData.calculated).toHaveProperty('validation_analysis')
      
      const summary = jsonData.calculated['validation_summary']
      expect(summary['missing_required_count']).toBe(2)
      expect(summary['format_errors_count']).toBe(2)
      expect(summary['success_rate']).toBe(0.5)
    })

    it('should handle valid result JSON correctly', () => {
      const jsonData = validDto.toJsonData()
      
      const rawResult = jsonData.raw['validation_result']
      expect(rawResult['is_valid']).toBe(true)
      expect(rawResult['missing_required']).toEqual([])
      expect(rawResult['format_errors']).toEqual([])
      
      const analysis = jsonData.calculated['validation_analysis']
      expect(analysis['has_missing_required']).toBe(false)
      expect(analysis['has_format_errors']).toBe(false)
      expect(analysis['all_arguments_validated']).toBe(true)
    })
  })

  describe('getJqHints', () => {
    it('should provide comprehensive jq hints', () => {
      const hints = invalidDto.getJqHints()
      
      expect(hints).toBeInstanceOf(Array)
      expect(hints.length).toBeGreaterThan(0)
      
      // Check for key hint categories
      const descriptions = hints.map(hint => hint.description)
      expect(descriptions).toContain('Overall validation success')
      expect(descriptions).toContain('Missing required arguments')
      expect(descriptions).toContain('Format validation errors')
      expect(descriptions).toContain('Validation success rate')
    })

    it('should include valid jq queries', () => {
      const hints = validDto.getJqHints()
      
      // All hints should have required properties
      for (const hint of hints) {
        expect(hint).toHaveProperty('query')
        expect(hint).toHaveProperty('description')
        expect(hint).toHaveProperty('scope')
        expect(typeof hint.query).toBe('string')
        expect(hint.query.length).toBeGreaterThan(0)
        expect(['single_item', 'all_items']).toContain(hint.scope)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty validation results', () => {
      const emptyDto = ArgumentValidationResultDTO.fromValidationResults(
        true,
        [],
        [],
        [],
        {}
      )
      
      expect(emptyDto.getSuccessRate()).toBe(1)
      expect(emptyDto.getTotalIssues()).toBe(0)
      expect(emptyDto.getFailedArguments()).toEqual([])
      expect(emptyDto.getIssuesSummary()).toBe('All arguments valid')
    })

    it('should handle mixed validation states', () => {
      const mixedResults = [
        { argumentName: 'valid1', isValid: true, validatedValue: 'value1' },
        { argumentName: 'valid2', isValid: true, validatedValue: 'value2' },
        { argumentName: 'invalid1', error: 'Error 1', isValid: false },
        { argumentName: 'invalid2', error: 'Error 2', isValid: false }
      ]
      
      const mixedDto = ArgumentValidationResultDTO.fromValidationResults(
        false,
        [],
        [],
        mixedResults,
        { valid1: 'value1', valid2: 'value2' }
      )
      
      expect(mixedDto.getSuccessRate()).toBe(0.5) // 2 out of 4
      expect(mixedDto.getTotalIssues()).toBe(2) // 2 failed validations
      expect(mixedDto.getFailedArguments()).toEqual(['invalid1', 'invalid2'])
    })

    it('should handle validation with no validated arguments', () => {
      const noValidatedDto = ArgumentValidationResultDTO.failure(['all'], [])
      
      expect(Object.keys(noValidatedDto.validatedArguments)).toHaveLength(0)
      expect(noValidatedDto.toLLMData().VALIDATED_COUNT).toBe('0')
    })
  })
})