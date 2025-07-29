/**
 * @file Comprehensive unit tests for OrchestratorError class
 * 
 * Tests the mandatory error handling class for all cc-commands including:
 * - Constructor validation and final class pattern
 * - Recovery instructions enforcement
 * - Factory method with smart recovery suggestions
 * - Error type detection and classification
 * - Context and debug information management
 * - Property accessors (message, stack, type)
 * - Integration with various error types
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../src/core/error/OrchestratorError'

// Mock process properties for consistent testing
const mockProcess = {
  cwd: vi.fn(() => '/test/working/directory'),
  platform: 'linux',
  version: 'v18.0.0'
}

vi.mock('process', () => mockProcess)

describe('OrchestratorError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Constructor and final class pattern', () => {
    it('should create error with required recovery instructions', () => {
      const originalError = new Error('Test error')
      const recoveryInstructions = ['Check configuration', 'Retry operation']
      const debugInfo = { context: 'test' }

      const error = new OrchestratorError(originalError, recoveryInstructions, debugInfo)

      expect(error.originalError).toBe(originalError)
      expect(error.recoveryInstructions).toEqual(recoveryInstructions)
      expect(error.debugInfo).toEqual(debugInfo)
      expect(error.timestamp).toEqual(new Date('2025-01-15T10:30:00Z'))
    })

    it('should create error with minimal required parameters', () => {
      const originalError = new Error('Test error')
      const recoveryInstructions = ['Fix the issue']

      const error = new OrchestratorError(originalError, recoveryInstructions)

      expect(error.originalError).toBe(originalError)
      expect(error.recoveryInstructions).toEqual(recoveryInstructions)
      expect(error.debugInfo).toEqual({})
      expect(error.context).toEqual({})
    })

    it('should handle non-Error original errors', () => {
      const originalError = 'String error message'
      const recoveryInstructions = ['Handle string error']

      const error = new OrchestratorError(originalError, recoveryInstructions)

      expect(error.originalError).toBe(originalError)
      expect(error.message).toBe('String error message')
      expect(error.type).toBe('UnknownError')
      expect(error.stack).toBeUndefined()
    })

    it('should prevent class extension', () => {
      // Test the final class prevention by attempting extension
      let thrownError: Error | undefined
      try {
        class ExtendedOrchestratorError extends OrchestratorError {
          constructor() {
            super(new Error('test'), ['fix it'])
          }
        }
        // eslint-disable-next-line no-new
        new ExtendedOrchestratorError()
      } catch (error) {
        thrownError = error as Error
      }
      
      expect(thrownError?.message).toContain(
        'OrchestratorError is a final class and cannot be extended.'
      )
    })

    it('should enforce recovery instructions requirement', () => {
      const originalError = new Error('Test error')

      let error1: Error | undefined
      let error2: Error | undefined
      
      try {
        // eslint-disable-next-line no-new
        new OrchestratorError(originalError, [])
      } catch (error) {
        error1 = error as Error
      }
      
      try {
        // @ts-expect-error - Testing null recovery instructions
        // eslint-disable-next-line no-new
        new OrchestratorError(originalError, null)
      } catch (error) {
        error2 = error as Error
      }
      
      expect(error1?.message).toContain(
        'OrchestratorError must include at least one recovery instruction.'
      )
      expect(error2?.message).toContain(
        'OrchestratorError must include at least one recovery instruction.'
      )
    })

    it('should validate recovery instructions are not empty strings', () => {
      const originalError = new Error('Test error')

      let error1: Error | undefined
      let error2: Error | undefined
      
      try {
        // eslint-disable-next-line no-new
        new OrchestratorError(originalError, ['Valid instruction', '', 'Another valid'])
      } catch (error) {
        error1 = error as Error
      }
      
      try {
        // eslint-disable-next-line no-new
        new OrchestratorError(originalError, ['   ', 'Valid instruction'])
      } catch (error) {
        error2 = error as Error
      }
      
      expect(error1?.message).toBe('Recovery instructions cannot be empty strings')
      expect(error2?.message).toBe('Recovery instructions cannot be empty strings')
    })
  })

  describe('Property accessors', () => {
    it('should extract message from Error objects', () => {
      const originalError = new Error('Database connection failed')
      const error = new OrchestratorError(originalError, ['Check database'])

      expect(error.message).toBe('Database connection failed')
    })

    it('should extract stack trace from Error objects', () => {
      const originalError = new Error('Test error')
      const error = new OrchestratorError(originalError, ['Fix it'])

      expect(error.stack).toBe(originalError.stack)
    })

    it('should extract type from Error objects', () => {
      const originalError = new TypeError('Type mismatch')
      const error = new OrchestratorError(originalError, ['Check types'])

      expect(error.type).toBe('TypeError')
    })

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const originalError = new CustomError('Custom error occurred')
      const error = new OrchestratorError(originalError, ['Handle custom error'])

      expect(error.message).toBe('Custom error occurred')
      expect(error.type).toBe('CustomError')
      expect(error.stack).toBe(originalError.stack)
    })

    it('should handle non-Error original errors', () => {
      const stringError = 'Simple string error'
      const numberError = 404
      const objectError = { code: 500, error: 'Object error' }

      const error1 = new OrchestratorError(stringError, ['Fix string error'])
      const error2 = new OrchestratorError(numberError, ['Fix number error'])
      const error3 = new OrchestratorError(objectError, ['Fix object error'])

      expect(error1.message).toBe('Simple string error')
      expect(error1.type).toBe('UnknownError')
      expect(error1.stack).toBeUndefined()

      expect(error2.message).toBe('404')
      expect(error2.type).toBe('UnknownError')

      expect(error3.message).toBe('[object Object]')
      expect(error3.type).toBe('UnknownError')
    })
  })

  describe('Context management', () => {
    it('should allow adding context after creation', () => {
      const error = new OrchestratorError(
        new Error('Test error'),
        ['Fix it']
      )

      error.addContext('userId', 'user123')
      error.addContext('requestId', 'req456')
      error.addContext('isRetry', true)

      expect(error.context).toEqual({
        isRetry: true,
        requestId: 'req456',
        userId: 'user123'
      })
    })

    it('should handle various context value types', () => {
      const error = new OrchestratorError(
        new Error('Test error'),
        ['Fix it']
      )

      error.addContext('stringValue', 'test')
      error.addContext('numberValue', 42)
      error.addContext('booleanValue', false)
      error.addContext('arrayValue', ['item1', 'item2'])
      error.addContext('nullValue', null)

      expect(error.context).toEqual({
        arrayValue: ['item1', 'item2'],
        booleanValue: false,
        nullValue: null,
        numberValue: 42,
        stringValue: 'test'
      })
    })

    it('should ignore undefined context values', () => {
      const error = new OrchestratorError(
        new Error('Test error'),
        ['Fix it']
      )

      error.addContext('definedValue', 'defined')
      error.addContext('undefinedValue')

      expect(error.context).toEqual({
        definedValue: 'defined'
      })
    })
  })

  describe('Factory method - fromError', () => {
    beforeEach(() => {
      mockProcess.cwd.mockReturnValue('/test/working/directory')
    })

    it('should create error with system debug info', () => {
      const originalError = new Error('API call failed')
      const context = {
        action: 'calling external API',
        apiUrl: 'https://api.example.com',
        command: 'deploy'
      }

      const error = OrchestratorError.fromError(originalError, context)

      expect(error.debugInfo).toMatchObject({
        action: 'calling external API',
        apiUrl: 'https://api.example.com',
        command: 'deploy',
        platform: 'linux',
        timestamp: '2025-01-15T10:30:00.000Z'
      })
      
      // Check system properties separately since they vary by environment
      expect(error.debugInfo.cwd).toBeDefined()
      expect(error.debugInfo.nodeVersion).toBeDefined()

      expect(error.context).toMatchObject({
        apiUrl: 'https://api.example.com'
      })
    })

    it('should generate smart recovery instructions for file system errors', () => {
      const enoentError = new Error('ENOENT: no such file or directory, open \'/missing/file.txt\'')
      const context = { path: '/missing/file.txt' }

      const error = OrchestratorError.fromError(enoentError, context)

      expect(error.recoveryInstructions).toContain('Check if the file/directory exists: /missing/file.txt')
      expect(error.recoveryInstructions).toContain('Verify you are in the correct working directory')
      expect(error.recoveryInstructions).toContain('Check for typos in the path')
    })

    it('should generate smart recovery instructions for permission errors', () => {
      const eaccesError = new Error('EACCES: permission denied, open \'/protected/file.txt\'')
      const context = { path: '/protected/file.txt' }

      const error = OrchestratorError.fromError(eaccesError, context)

      expect(error.recoveryInstructions).toContain('Check permissions on: /protected/file.txt')
      expect(error.recoveryInstructions).toContain('You may need to run with elevated privileges (sudo)')
      expect(error.recoveryInstructions).toContain('Try: chmod 755 /protected/file.txt (adjust permissions as needed)')
    })

    it('should generate smart recovery instructions for network errors', () => {
      const connectionError = new Error('ECONNREFUSED: Connection refused')
      const context = { host: 'api.example.com', port: 8080 }

      const error = OrchestratorError.fromError(connectionError, context)

      expect(error.recoveryInstructions).toContain('Check if the service is running on: api.example.com:8080')
      expect(error.recoveryInstructions).toContain('Verify network connectivity')
      expect(error.recoveryInstructions).toContain('Check firewall settings')
    })

    it('should generate smart recovery instructions for timeout errors', () => {
      const timeoutError = new Error('Request timeout after 30000ms')

      const error = OrchestratorError.fromError(timeoutError)

      expect(error.recoveryInstructions).toContain('The operation timed out')
      expect(error.recoveryInstructions).toContain('Check network connectivity')
      expect(error.recoveryInstructions).toContain('Try increasing the timeout value')
    })

    it('should generate smart recovery instructions for JSON errors', () => {
      const jsonError = new Error('Unexpected token } in JSON at position 45')

      const error = OrchestratorError.fromError(jsonError)

      expect(error.recoveryInstructions).toContain('Check that the data is valid JSON format')
      expect(error.recoveryInstructions).toContain('Look for: trailing commas, unquoted keys, single quotes instead of double')
      expect(error.recoveryInstructions).toContain('Use a JSON validator to check the syntax')
    })

    it('should generate smart recovery instructions for module errors', () => {
      const moduleError = new Error('Cannot find module \'missing-package\'')

      const error = OrchestratorError.fromError(moduleError)

      expect(error.recoveryInstructions).toContain('Install missing dependency: npm install missing-package')
      expect(error.recoveryInstructions).toContain('Run: npm install (to install all dependencies)')
      expect(error.recoveryInstructions).toContain('Check that you are in the correct directory')
    })

    it('should add command-specific help when command is provided', () => {
      const genericError = new Error('Some error occurred')
      const context = { command: 'my-command' }

      const error = OrchestratorError.fromError(genericError, context)

      expect(error.recoveryInstructions).toContain('Run: my-command --help (for command usage)')
    })

    it('should handle errors without specific patterns', () => {
      const genericError = new Error('Unknown error occurred')

      const error = OrchestratorError.fromError(genericError)

      expect(error.recoveryInstructions).toContain('Check the error message above for specific details')
      expect(error.recoveryInstructions).toContain('Verify all prerequisites are installed and configured')
      expect(error.recoveryInstructions).toContain('Review the debug log for full error context')
    })

    it('should handle non-Error objects in factory method', () => {
      const stringError = 'Simple error message'
      const context = { action: 'processing data' }

      const error = OrchestratorError.fromError(stringError, context)

      expect(error.originalError).toBe(stringError)
      expect(error.message).toBe('Simple error message')
      expect(error.debugInfo.action).toBe('processing data')
      expect(error.recoveryInstructions.length).toBeGreaterThan(0)
    })

    it('should filter out undefined context values', () => {
      const originalError = new Error('Test error')
      const context = {
        definedValue: 'defined',
        emptyString: '',
        nullValue: null,
        undefinedValue: undefined
      }

      const error = OrchestratorError.fromError(originalError, context)

      expect(error.debugInfo).toMatchObject({
        definedValue: 'defined',
        emptyString: '',
        nullValue: null
      })
      expect(error.debugInfo).not.toHaveProperty('undefinedValue')
    })

    it('should handle empty context object', () => {
      const originalError = new Error('Test error')

      const error = OrchestratorError.fromError(originalError, {})

      expect(error.debugInfo).toMatchObject({
        platform: 'linux',
        timestamp: '2025-01-15T10:30:00.000Z'
      })
      
      // Check system properties separately
      expect(error.debugInfo.cwd).toBeDefined()
      expect(error.debugInfo.nodeVersion).toBeDefined()
    })

    it('should handle missing context parameter', () => {
      const originalError = new Error('Test error')

      const error = OrchestratorError.fromError(originalError)

      expect(error.debugInfo).toMatchObject({
        platform: 'linux'
      })
      
      // Check system properties separately
      expect(error.debugInfo.cwd).toBeDefined()
      expect(error.debugInfo.nodeVersion).toBeDefined()
    })
  })

  describe('Error pattern recognition', () => {
    it('should recognize EEXIST errors', () => {
      const error = new Error('EEXIST: file already exists')
      const orchestratorError = OrchestratorError.fromError(error)

      expect(orchestratorError.recoveryInstructions).toContain('The file or directory already exists')
      expect(orchestratorError.recoveryInstructions).toContain('Use --force flag if available to overwrite')
    })

    it('should handle errors with stack traces', () => {
      const errorWithStack = new Error('Error with stack')
      const orchestratorError = OrchestratorError.fromError(errorWithStack)

      expect(orchestratorError.recoveryInstructions).toContain('Check the stack trace to identify where the error occurred')
    })

    it('should handle case-insensitive error message matching', () => {
      const uppercaseError = new Error('PERMISSION DENIED')
      const orchestratorError = OrchestratorError.fromError(uppercaseError)

      expect(orchestratorError.recoveryInstructions.some(instruction => 
        instruction.includes('permission')
      )).toBe(true)
    })

    it('should prioritize more specific error patterns', () => {
      const specificError = new Error('ENOENT: no such file or directory')
      const orchestratorError = OrchestratorError.fromError(specificError)

      // Should get ENOENT-specific instructions, not generic ones
      expect(orchestratorError.recoveryInstructions.at(0)).toContain('Check if the file/directory exists')
    })
  })

  describe('Integration scenarios', () => {
    it('should maintain error chain information', () => {
      const rootCause = new Error('Database connection lost')
      const wrappedError = new Error('Query execution failed')
      wrappedError.cause = rootCause

      const orchestratorError = new OrchestratorError(
        wrappedError,
        ['Reconnect to database', 'Retry query']
      )

      expect(orchestratorError.originalError).toBe(wrappedError)
      expect(orchestratorError.message).toBe('Query execution failed')
    })

    it('should handle complex debugging scenarios', () => {
      const error = new OrchestratorError(
        new Error('Complex operation failed'),
        ['Step 1: Check prerequisites', 'Step 2: Validate configuration', 'Step 3: Retry operation'],
        {
          attempts: 3,
          lastSuccess: '2025-01-14T15:00:00Z',
          operation: 'complex_deployment',
          phase: 'validation'
        }
      )

      error.addContext('userId', 'admin')
      error.addContext('sessionId', 'sess_123')

      expect(error.recoveryInstructions).toHaveLength(3)
      expect(error.debugInfo.operation).toBe('complex_deployment')
      expect(error.context.userId).toBe('admin')
    })

    it('should be suitable for LLMInfo integration', () => {
      const error = new OrchestratorError(
        new Error('Service unavailable'),
        ['Check service status', 'Wait and retry'],
        { region: 'us-east-1', service: 'payment-api' }
      )

      // These properties would be used by LLMInfo.setError()
      expect(error.message).toBe('Service unavailable')
      expect(error.type).toBe('Error')
      expect(error.recoveryInstructions).toEqual(['Check service status', 'Wait and retry'])
      expect(error.debugInfo.service).toBe('payment-api')
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000) + ' - this is a very long error message'
      const longError = new Error(longMessage)
      const orchestratorError = new OrchestratorError(longError, ['Handle long error'])

      expect(orchestratorError.message).toBe(longMessage)
    })

    it('should handle unicode characters in error messages', () => {
      const unicodeError = new Error('Error with unicode: 🚨 问题 occurred')
      const orchestratorError = new OrchestratorError(unicodeError, ['Fix unicode error'])

      expect(orchestratorError.message).toBe('Error with unicode: 🚨 问题 occurred')
    })

    it('should handle circular references in debug info safely', () => {
      const circularObj: Record<string, unknown> = { name: 'circular' }
      circularObj.self = circularObj

      const error = new OrchestratorError(
        new Error('Circular reference test'),
        ['Handle circular reference'],
        { circular: circularObj }
      )

      // Should not throw when creating the error
      expect(error.debugInfo.circular).toBe(circularObj)
    })

    it('should handle null and undefined in various contexts', () => {
      const error = new OrchestratorError(
        null,
        ['Handle null error'],
        { nullValue: null }  // Don't pass undefined values to debugInfo
      )

      expect(error.originalError).toBeNull()
      expect(error.message).toBe('null')
      expect(error.debugInfo.nullValue).toBeNull()
      expect(Object.hasOwn(error.debugInfo, 'undefinedValue')).toBe(false)
      
      // Also test that context handles undefined values properly
      error.addContext('definedValue', 'test')
      error.addContext('undefinedValue')
      
      expect(error.context.definedValue).toBe('test')
      expect(Object.hasOwn(error.context, 'undefinedValue')).toBe(false)
    })
  })
})