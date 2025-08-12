/**
 * @file ArgumentValidationService Tests
 * 
 * Tests for command-line argument validation service functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError.js'
import { ARGUMENT_FORMATS } from '../../../../src/orchestrator-services/argument-parsing/constants/ArgumentConstants.js'
import { ArgumentValidationResultDTO } from '../../../../src/orchestrator-services/argument-parsing/dto/ArgumentValidationResultDTO.js'
import { ArgumentParsingService } from '../../../../src/orchestrator-services/argument-parsing/services/ArgumentParsingService.js'
import { ArgumentValidationService } from '../../../../src/orchestrator-services/argument-parsing/services/ArgumentValidationService.js'
import { ArgumentDefinition } from '../../../../src/orchestrator-services/argument-parsing/types/ArgumentTypes.js'

describe('ArgumentValidationService', () => {
  let service: ArgumentValidationService
  let parsingService: ArgumentParsingService

  beforeEach(() => {
    service = new ArgumentValidationService()
    parsingService = new ArgumentParsingService()
  })

  describe('validateArguments', () => {
    it('should validate successfully when all requirements met', async () => {
      const args = await parsingService.parseArguments('--since=2024-01-01')
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Since date', format: ARGUMENT_FORMATS.DATE, name: 'since', required: false }
      ]
      
      const result = await service.validateArguments(args, definitions)
      
      expect(result).toBeInstanceOf(ArgumentValidationResultDTO)
      expect(result.isValid).toBe(true)
      expect(result.missingRequired).toEqual([])
      expect(result.formatErrors).toEqual([])
    })

    it('should detect missing required arguments', async () => {
      const args = await parsingService.parseArguments('--optional=value')
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Required argument', name: 'required-arg', required: true },
        { description: 'Optional argument', name: 'optional', required: false }
      ]
      
      const result = await service.validateArguments(args, definitions)
      
      expect(result.isValid).toBe(false)
      expect(result.missingRequired).toContain('required-arg')
    })

    it('should detect format errors', async () => {
      const args = await parsingService.parseArguments('--email=invalid-email --number=not-a-number')
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Email address', format: ARGUMENT_FORMATS.EMAIL, name: 'email', required: false },
        { description: 'Numeric value', format: ARGUMENT_FORMATS.NUMBER, name: 'number', required: false }
      ]
      
      const result = await service.validateArguments(args, definitions)
      
      expect(result.isValid).toBe(false)
      expect(result.formatErrors).toHaveLength(2)
      expect(result.formatErrors[0]?.argumentName).toBe('email')
      expect(result.formatErrors[1]?.argumentName).toBe('number')
    })

    it('should validate mixed success and failure scenarios', async () => {
      const args = await parsingService.parseArguments('owner/repo --email=user@example.com --number=not-a-number')
      
      const definitions: ArgumentDefinition[] = [
        { description: 'GitHub repository', format: ARGUMENT_FORMATS.GITHUB_REPO, name: 'repository', required: true },
        { description: 'Email address', format: ARGUMENT_FORMATS.EMAIL, name: 'email', required: false },
        { description: 'Numeric value', format: ARGUMENT_FORMATS.NUMBER, name: 'number', required: false }
      ]
      
      const result = await service.validateArguments(args, definitions)
      
      expect(result.isValid).toBe(false) // Due to number format error
      expect(result.formatErrors).toHaveLength(1)
      expect(result.formatErrors[0]?.argumentName).toBe('number')
      expect(result.validatedArguments.email).toBe('user@example.com')
    })
  })

  describe('validateRequiredArguments', () => {
    it('should pass when all required arguments present', async () => {
      const args = await parsingService.parseArguments('arg1 arg2 --key=value')
      const required = ['arg1', 'arg2', 'key']
      
      const result = await service.validateRequiredArguments(args, required)
      
      expect(result.isValid).toBe(true)
      expect(result.missingRequired).toEqual([])
    })

    it('should fail when required arguments missing', async () => {
      const args = await parsingService.parseArguments('arg1 --key=value')
      const required = ['arg1', 'arg2', 'key', 'missing']
      
      const result = await service.validateRequiredArguments(args, required)
      
      expect(result.isValid).toBe(false)
      expect(result.missingRequired).toContain('arg2')
      expect(result.missingRequired).toContain('missing')
    })
  })

  describe('validateArgumentFormat', () => {
    it('should validate URL format', async () => {
      const isValid = await service.validateArgumentFormat('url', 'https://example.com', ARGUMENT_FORMATS.URL)
      expect(isValid).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('url', 'not-a-url', ARGUMENT_FORMATS.URL)
      expect(isInvalid).toBe(false)
    })

    it('should validate email format', async () => {
      const isValid = await service.validateArgumentFormat('email', 'user@example.com', ARGUMENT_FORMATS.EMAIL)
      expect(isValid).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('email', 'invalid-email', ARGUMENT_FORMATS.EMAIL)
      expect(isInvalid).toBe(false)
    })

    it('should validate number format', async () => {
      const isValid = await service.validateArgumentFormat('number', '42', ARGUMENT_FORMATS.NUMBER)
      expect(isValid).toBe(true)
      
      const isValidFloat = await service.validateArgumentFormat('number', '3.14', ARGUMENT_FORMATS.NUMBER)
      expect(isValidFloat).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('number', 'not-a-number', ARGUMENT_FORMATS.NUMBER)
      expect(isInvalid).toBe(false)
    })

    it('should validate boolean format', async () => {
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'TRUE', 'FALSE']
      
      for (const value of validBooleans) {
         
        const isValid = await service.validateArgumentFormat('bool', value, ARGUMENT_FORMATS.BOOLEAN)
        expect(isValid).toBe(true)
      }
      
      const isInvalid = await service.validateArgumentFormat('bool', 'maybe', ARGUMENT_FORMATS.BOOLEAN)
      expect(isInvalid).toBe(false)
    })

    it('should validate GitHub repository format', async () => {
      const isValid = await service.validateArgumentFormat('repo', 'owner/repo', ARGUMENT_FORMATS.GITHUB_REPO)
      expect(isValid).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('repo', 'invalid-repo', ARGUMENT_FORMATS.GITHUB_REPO)
      expect(isInvalid).toBe(false)
    })

    it('should validate date format', async () => {
      const isValid = await service.validateArgumentFormat('date', '2024-01-01', ARGUMENT_FORMATS.DATE)
      expect(isValid).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('date', '01/01/2024', ARGUMENT_FORMATS.DATE)
      expect(isInvalid).toBe(false)
    })

    it('should validate JSON format', async () => {
      const isValid = await service.validateArgumentFormat('json', '{"key": "value"}', ARGUMENT_FORMATS.JSON)
      expect(isValid).toBe(true)
      
      const isValidArray = await service.validateArgumentFormat('json', '[1, 2, 3]', ARGUMENT_FORMATS.JSON)
      expect(isValidArray).toBe(true)
      
      const isInvalid = await service.validateArgumentFormat('json', 'invalid-json', ARGUMENT_FORMATS.JSON)
      expect(isInvalid).toBe(false)
    })

    it('should validate permission level format', async () => {
      const validLevels = ['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH']
      
      for (const level of validLevels) {
         
        const isValid = await service.validateArgumentFormat('perm', level, ARGUMENT_FORMATS.PERMISSION_LEVEL)
        expect(isValid).toBe(true)
      }
      
      const isInvalid = await service.validateArgumentFormat('perm', 'invalid', ARGUMENT_FORMATS.PERMISSION_LEVEL)
      expect(isInvalid).toBe(false)
    })

    it('should validate path format', async () => {
      const isValid = await service.validateArgumentFormat('path', '/path/to/file', ARGUMENT_FORMATS.PATH)
      expect(isValid).toBe(true)
      
      const isValidWindows = await service.validateArgumentFormat('path', String.raw`C:\path\to\file`, ARGUMENT_FORMATS.PATH)
      expect(isValidWindows).toBe(true)
      
      // Path format is very permissive, only null bytes are invalid
      const isInvalid = await service.validateArgumentFormat('path', 'path\0with\0nulls', ARGUMENT_FORMATS.PATH)
      expect(isInvalid).toBe(false)
    })

    it('should always validate string format', async () => {
      const isValid = await service.validateArgumentFormat('str', 'any string value', ARGUMENT_FORMATS.STRING)
      expect(isValid).toBe(true)
    })
  })

  describe('validateArgumentCount', () => {
    it('should validate count within bounds', async () => {
      const args = await parsingService.parseArguments('arg1 arg2 --flag')
      
      const result = await service.validateArgumentCount(args, 2, 5)
      
      expect(result.isValid).toBe(true)
    })

    it('should fail when count below minimum', async () => {
      const args = await parsingService.parseArguments('arg1')
      
      await expect(service.validateArgumentCount(args, 3, 5))
        .rejects.toThrow(OrchestratorError)
    })

    it('should fail when count above maximum', async () => {
      const args = await parsingService.parseArguments('arg1 arg2 arg3 --flag --key=value')
      
      await expect(service.validateArgumentCount(args, 1, 3))
        .rejects.toThrow(OrchestratorError)
    })

    it('should validate with only minimum bound', async () => {
      const args = await parsingService.parseArguments('arg1 arg2 arg3')
      
      const result = await service.validateArgumentCount(args, 2)
      
      expect(result.isValid).toBe(true)
    })

    it('should validate with only maximum bound', async () => {
      const args = await parsingService.parseArguments('arg1 arg2')
      
      const result = await service.validateArgumentCount(args, undefined, 5)
      
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateFlagCombinations', () => {
    it('should allow valid flag combinations', async () => {
      const flags = { force: true, verbose: true }
      const mutuallyExclusive = [['quiet', 'verbose']]
      
      const isValid = await service.validateFlagCombinations(flags, mutuallyExclusive)
      
      expect(isValid).toBe(true)
    })

    it('should reject mutually exclusive flags', async () => {
      const flags = { quiet: true, verbose: true }
      const mutuallyExclusive = [['quiet', 'verbose']]
      
      await expect(service.validateFlagCombinations(flags, mutuallyExclusive))
        .rejects.toThrow(OrchestratorError)
    })

    it('should handle multiple exclusive groups', async () => {
      const flags = { format1: true, format2: true }
      const mutuallyExclusive = [
        ['quiet', 'verbose'],
        ['format1', 'format2', 'format3']
      ]
      
      await expect(service.validateFlagCombinations(flags, mutuallyExclusive))
        .rejects.toThrow(OrchestratorError)
    })
  })

  describe('validateKeyValuePairs', () => {
    it('should validate key-value pairs with formats', async () => {
      const keyValuePairs = {
        count: '42',
        email: 'user@example.com',
        enabled: 'true'
      }
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Email', format: ARGUMENT_FORMATS.EMAIL, name: 'email', required: false },
        { description: 'Count', format: ARGUMENT_FORMATS.NUMBER, name: 'count', required: false },
        { description: 'Enabled', format: ARGUMENT_FORMATS.BOOLEAN, name: 'enabled', required: false }
      ]
      
      const result = await service.validateKeyValuePairs(keyValuePairs, definitions)
      
      expect(result.isValid).toBe(true)
      expect(result.validatedArguments).toEqual(keyValuePairs)
    })

    it('should detect format errors in key-value pairs', async () => {
      const keyValuePairs = {
        count: 'not-a-number',
        email: 'invalid-email'
      }
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Email', format: ARGUMENT_FORMATS.EMAIL, name: 'email', required: false },
        { description: 'Count', format: ARGUMENT_FORMATS.NUMBER, name: 'count', required: false }
      ]
      
      const result = await service.validateKeyValuePairs(keyValuePairs, definitions)
      
      expect(result.isValid).toBe(false)
      expect(result.formatErrors).toHaveLength(2)
    })

    it('should handle undefined formats as valid', async () => {
      const keyValuePairs = {
        anyKey: 'any value'
      }
      
      const definitions: ArgumentDefinition[] = [
        { description: 'Any key', name: 'anyKey', required: false }
      ]
      
      const result = await service.validateKeyValuePairs(keyValuePairs, definitions)
      
      expect(result.isValid).toBe(true)
      expect(result.validatedArguments.anyKey).toBe('any value')
    })
  })

  describe('findUnknownArguments', () => {
    it('should find unknown flags and key-value pairs', async () => {
      const args = await parsingService.parseArguments('--known --unknown --valid=value --invalid=value')
      const allowedArguments = ['known', 'valid']
      
      const unknown = await service.findUnknownArguments(args, allowedArguments)
      
      expect(unknown).toEqual(expect.arrayContaining(['unknown', 'invalid']))
    })

    it('should return empty array when all arguments are known', async () => {
      const args = await parsingService.parseArguments('--known --valid=value')
      const allowedArguments = ['known', 'valid']
      
      const unknown = await service.findUnknownArguments(args, allowedArguments)
      
      expect(unknown).toEqual([])
    })
  })

  describe('validateStandardPatterns', () => {
    it('should validate presence of required patterns', async () => {
      const args = await parsingService.parseArguments('owner/repo --since=2024-01-01')
      const requiredPatterns = ['github_repo', 'date']
      
      const result = await service.validateStandardPatterns(args, requiredPatterns)
      
      expect(result.isValid).toBe(true)
      expect(result.validatedArguments['pattern_github_repo']).toBe('owner/repo')
      expect(result.validatedArguments['pattern_date']).toBe('2024-01-01')
    })

    it('should detect missing required patterns', async () => {
      const args = await parsingService.parseArguments('some-argument')
      const requiredPatterns = ['github_repo', 'date']
      
      const result = await service.validateStandardPatterns(args, requiredPatterns)
      
      expect(result.isValid).toBe(false)
      expect(result.formatErrors).toHaveLength(2)
      expect(result.formatErrors[0]?.argumentName).toBe('pattern_github_repo')
      expect(result.formatErrors[1]?.argumentName).toBe('pattern_date')
    })

    it('should handle multiple matches for same pattern', async () => {
      const args = await parsingService.parseArguments('owner/repo1 owner/repo2')
      const requiredPatterns = ['github_repo']
      
      const result = await service.validateStandardPatterns(args, requiredPatterns)
      
      expect(result.isValid).toBe(true)
      expect(result.validatedArguments['pattern_github_repo']).toBe('owner/repo1, owner/repo2')
    })
  })

  describe('error scenarios', () => {
    it('should handle validation process errors', async () => {
      // This tests internal error handling
      const args = await parsingService.parseArguments('valid-args')
      const definitions: ArgumentDefinition[] = []
      
      const result = await service.validateArguments(args, definitions)
      
      // Should not throw, but return valid result for empty definitions
      expect(result).toBeInstanceOf(ArgumentValidationResultDTO)
    })
  })
})