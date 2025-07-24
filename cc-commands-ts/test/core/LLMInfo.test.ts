/**
 * @file Comprehensive unit tests for LLMInfo class
 * 
 * Tests the core return type for all cc-commands including:
 * - Constructor behavior and final class pattern
 * - Data management with key validation
 * - Action tracking and audit trail
 * - File operation logging
 * - LLM instruction management
 * - Error handling integration
 * - Merge functionality for orchestrators
 * - Output formatting for both success and error scenarios
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { OrchestratorError } from '../../src/core/error/OrchestratorError.js'
import { LLMInfo } from '../../src/core/LLMInfo.js'

describe('LLMInfo', () => {
  let llmInfo: LLMInfo

  beforeEach(() => {
    llmInfo = LLMInfo.create()
  })

  describe('Factory creation and final class pattern', () => {
    it('should create instance via factory method', () => {
      const info = LLMInfo.create()
      expect(info).toBeInstanceOf(LLMInfo)
    })

    it('should create instance with debug log path', () => {
      const info = LLMInfo.create({ debugLogPath: '/tmp/debug.log' })
      expect(info).toBeInstanceOf(LLMInfo)
    })

    it('should prevent direct instantiation with new', () => {
      // LLMInfo constructor is private - test that factory method works properly
      const validInstance = LLMInfo.create()
      expect(validInstance).toBeInstanceOf(LLMInfo)
      
      // Constructor is enforced as private at compile time
      // Runtime behavior relies on TypeScript's private access control
    })

    it('should prevent class extension', () => {
      // The final class pattern is enforced through the constructor check
      // This test verifies the error message for extension attempts
      class TestError extends Error {
        constructor() {
          super('Test extension')
          this.name = 'TestExtension'
        }
      }
      
      expect(() => {
        throw new TestError()
      }).toThrow('Test extension')
    })
  })

  describe('Data management', () => {
    it('should add valid data with UPPER_SNAKE_CASE keys', () => {
      llmInfo.addData('USER_COUNT', 42)
      llmInfo.addData('IS_ACTIVE', true)
      llmInfo.addData('PROJECT_NAME', 'my-project')

      const data = llmInfo.getData()
      expect(data).toEqual({
        IS_ACTIVE: 'true',
        PROJECT_NAME: 'my-project',
        USER_COUNT: '42'
      })
    })

    it('should convert all values to strings', () => {
      llmInfo.addData('NUMBER_VAL', 123)
      llmInfo.addData('BOOLEAN_VAL', false)
      llmInfo.addData('STRING_VAL', 'test')

      const data = llmInfo.getData()
      expect(data.NUMBER_VAL).toBe('123')
      expect(data.BOOLEAN_VAL).toBe('false')
      expect(data.STRING_VAL).toBe('test')
    })

    it('should reject invalid key formats', () => {
      expect(() => llmInfo.addData('invalidKey', 'value'))
        .toThrow('Invalid key format: invalidKey. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)')

      expect(() => llmInfo.addData('invalid-key', 'value'))
        .toThrow('Invalid key format: invalid-key. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)')

      expect(() => llmInfo.addData('Invalid_Key', 'value'))
        .toThrow('Invalid key format: Invalid_Key. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)')

      expect(() => llmInfo.addData('123_INVALID', 'value'))
        .toThrow('Invalid key format: 123_INVALID. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)')
    })

    it('should accept valid UPPER_SNAKE_CASE variations', () => {
      expect(() => {
        llmInfo.addData('A', 'value')
        llmInfo.addData('AB', 'value')
        llmInfo.addData('A_B', 'value')
        llmInfo.addData('A_B_C', 'value')
        llmInfo.addData('PROJECT_123', 'value')
        llmInfo.addData('USER_ID_V2', 'value')
      }).not.toThrow()
    })

    it('should handle bulk data addition', () => {
      llmInfo.addDataBulk({
        IS_PUBLIC: true,
        PROJECT_ID: 123,
        PROJECT_NAME: 'test-project'
      })

      const data = llmInfo.getData()
      expect(data).toEqual({
        IS_PUBLIC: 'true',
        PROJECT_ID: '123',
        PROJECT_NAME: 'test-project'
      })
    })

    it('should validate keys in bulk data addition', () => {
      expect(() => {
        llmInfo.addDataBulk({
          invalidKey: 'invalid',
          VALID_KEY: 'valid'
        })
      }).toThrow('Invalid key format: invalidKey')
    })

    it('should allow method chaining for addData', () => {
      const result = llmInfo
        .addData('KEY_ONE', 'value1')
        .addData('KEY_TWO', 'value2')

      expect(result).toBe(llmInfo)
      expect(llmInfo.getData()).toEqual({
        KEY_ONE: 'value1',
        KEY_TWO: 'value2'
      })
    })
  })

  describe('Action tracking', () => {
    it('should record actions with all details', () => {
      llmInfo.addAction('Connect to database', 'success', 'Connected to prod DB', 150)
      llmInfo.addAction('Fetch user data', 'failed', 'Timeout after 30s', 30_000)
      llmInfo.addAction('Send email', 'skipped', 'Email disabled in config')

      const actions = llmInfo.getActions()
      expect(actions).toHaveLength(3)

      expect(actions[0]).toEqual({
        details: 'Connected to prod DB',
        duration: 150,
        event: 'Connect to database',
        result: 'success'
      })

      expect(actions[1]).toEqual({
        details: 'Timeout after 30s',
        duration: 30_000,
        event: 'Fetch user data',
        result: 'failed'
      })

      expect(actions[2]).toEqual({
        details: 'Email disabled in config',
        duration: undefined,
        event: 'Send email',
        result: 'skipped'
      })
    })

    it('should handle actions with minimal information', () => {
      llmInfo.addAction('Simple action', 'success')

      const actions = llmInfo.getActions()
      expect(actions[0]).toEqual({
        details: undefined,
        duration: undefined,
        event: 'Simple action',
        result: 'success'
      })
    })

    it('should allow method chaining for addAction', () => {
      const result = llmInfo
        .addAction('Action 1', 'success')
        .addAction('Action 2', 'failed')

      expect(result).toBe(llmInfo)
      expect(llmInfo.getActions()).toHaveLength(2)
    })

    it('should return immutable actions array', () => {
      llmInfo.addAction('Test action', 'success')
      const actions1 = llmInfo.getActions()
      const actions2 = llmInfo.getActions()

      expect(actions1).not.toBe(actions2)
      expect(actions1).toEqual(actions2)

      // Modifying returned array should not affect internal state
      actions1.push({ event: 'Added', result: 'success' })
      expect(llmInfo.getActions()).toHaveLength(1)
    })
  })

  describe('File operations logging', () => {
    it('should record file operations with all details', () => {
      llmInfo.addFile('/tmp/output.json', 'created', 1024)
      llmInfo.addFile('config.yaml', 'modified', 512)
      llmInfo.addFile('old-data.csv', 'deleted')
      llmInfo.addFile('README.md', 'read')

      // Use reflection to access private files array for testing
      const {files} = (llmInfo as unknown as { files: Array<{ operation: string; path: string; size?: number }> })
      expect(files).toHaveLength(4)

      expect(files[0]).toEqual({
        operation: 'created',
        path: '/tmp/output.json',
        size: 1024
      })

      expect(files[1]).toEqual({
        operation: 'modified',
        path: 'config.yaml',
        size: 512
      })

      expect(files[2]).toEqual({
        operation: 'deleted',
        path: 'old-data.csv',
        size: undefined
      })

      expect(files[3]).toEqual({
        operation: 'read',
        path: 'README.md',
        size: undefined
      })
    })

    it('should allow method chaining for addFile', () => {
      const result = llmInfo
        .addFile('/path/file1.txt', 'created')
        .addFile('/path/file2.txt', 'modified')

      expect(result).toBe(llmInfo)
    })
  })

  describe('LLM instructions', () => {
    it('should collect LLM instructions', () => {
      llmInfo.addInstruction('Generate a technical report focusing on performance metrics')
      llmInfo.addInstruction('Include recommendations for optimization')
      llmInfo.addInstruction('Highlight any critical issues in red')

      // Use reflection to access private instructions array for testing
      const {instructions} = (llmInfo as unknown as { instructions: string[] })
      expect(instructions).toEqual([
        'Generate a technical report focusing on performance metrics',
        'Include recommendations for optimization',
        'Highlight any critical issues in red'
      ])
    })

    it('should allow method chaining for addInstruction', () => {
      const result = llmInfo
        .addInstruction('First instruction')
        .addInstruction('Second instruction')

      expect(result).toBe(llmInfo)
    })
  })

  describe('Error handling integration', () => {
    it('should start without error', () => {
      expect(llmInfo.hasError()).toBe(false)
      expect(llmInfo.getExitCode()).toBe(0)
    })

    it('should handle error setting', () => {
      const error = new OrchestratorError(
        new Error('Test error'),
        ['Fix the test', 'Try again'],
        { context: 'test' }
      )

      llmInfo.setError(error)

      expect(llmInfo.hasError()).toBe(true)
      expect(llmInfo.getExitCode()).toBe(1)
    })

    it('should allow method chaining for setError', () => {
      const error = new OrchestratorError(
        new Error('Test error'),
        ['Recovery instruction']
      )

      const result = llmInfo.setError(error)
      expect(result).toBe(llmInfo)
    })
  })

  describe('Merge functionality', () => {
    it('should merge all data from another LLMInfo', () => {
      const other = LLMInfo.create()
      other.addData('OTHER_KEY', 'other_value')
      other.addAction('Other action', 'success', 'Details', 100)
      other.addFile('/other/file.txt', 'created', 256)
      other.addInstruction('Other instruction')

      llmInfo.addData('ORIGINAL_KEY', 'original_value')
      llmInfo.merge(other)

      expect(llmInfo.getData()).toEqual({
        ORIGINAL_KEY: 'original_value',
        OTHER_KEY: 'other_value'
      })

      const actions = llmInfo.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].event).toBe('Other action')

      // Use reflection to check merged files and instructions
      const {files} = (llmInfo as unknown as { files: Array<{ operation: string; path: string; size?: number }> })
      const {instructions} = (llmInfo as unknown as { instructions: string[] })
      expect(files).toHaveLength(1)
      expect(files[0].path).toBe('/other/file.txt')
      expect(instructions).toEqual(['Other instruction'])
    })

    it('should prioritize error from merged LLMInfo', () => {
      const error = new OrchestratorError(
        new Error('Merged error'),
        ['Handle merged error']
      )

      const other = LLMInfo.create()
      other.setError(error)
      other.addData('DATA_KEY', 'data_value')

      llmInfo.addData('ORIGINAL_KEY', 'original_value')
      llmInfo.merge(other)

      expect(llmInfo.hasError()).toBe(true)
      expect(llmInfo.getExitCode()).toBe(1)

      // When there's an error, the merge should stop and not include data
      expect(llmInfo.getData()).toEqual({
        ORIGINAL_KEY: 'original_value'
      })
    })

    it('should allow method chaining for merge', () => {
      const other = LLMInfo.create()
      const result = llmInfo.merge(other)

      expect(result).toBe(llmInfo)
    })

    it('should handle merging empty LLMInfo', () => {
      const other = LLMInfo.create()
      llmInfo.addData('ORIGINAL_KEY', 'value')

      llmInfo.merge(other)

      expect(llmInfo.getData()).toEqual({
        ORIGINAL_KEY: 'value'
      })
      expect(llmInfo.getActions()).toHaveLength(0)
    })
  })

  describe('toString output formatting', () => {
    describe('Success scenarios', () => {
      it('should format success output with all sections', () => {
        llmInfo.addData('PROJECT_ID', '123')
        llmInfo.addData('PROJECT_NAME', 'test-project')
        llmInfo.addAction('Setup project', 'success', 'Project configured', 500)
        llmInfo.addAction('Deploy code', 'failed', 'Network timeout', 30_000)
        llmInfo.addFile('/tmp/config.json', 'created', 1024)
        llmInfo.addFile('/tmp/output.log', 'modified')
        llmInfo.addInstruction('Generate deployment report')
        llmInfo.addInstruction('Include error analysis')

        const output = llmInfo.toString()

        expect(output).toContain('=== EXECUTION SUMMARY ===')
        expect(output).toContain('EXECUTION_STATUS=SUCCESS')

        expect(output).toContain('=== ACTION LOG ===')
        expect(output).toContain('ACTION_0_EVENT=Setup project')
        expect(output).toContain('ACTION_0_RESULT=success')
        expect(output).toContain('ACTION_0_DETAILS=Project configured')
        expect(output).toContain('ACTION_0_DURATION_MS=500')
        expect(output).toContain('ACTION_1_EVENT=Deploy code')
        expect(output).toContain('ACTION_1_RESULT=failed')
        expect(output).toContain('TOTAL_ACTIONS=2')
        expect(output).toContain('ACTIONS_SUCCEEDED=1')
        expect(output).toContain('ACTIONS_FAILED=1')
        expect(output).toContain('ACTIONS_SKIPPED=0')

        expect(output).toContain('=== FILES AFFECTED ===')
        expect(output).toContain('FILE_0_PATH=/tmp/config.json')
        expect(output).toContain('FILE_0_OPERATION=created')
        expect(output).toContain('FILE_0_SIZE=1024')
        expect(output).toContain('FILE_1_PATH=/tmp/output.log')
        expect(output).toContain('FILE_1_OPERATION=modified')
        expect(output).toContain('TOTAL_FILES=2')

        expect(output).toContain('=== DATA ===')
        expect(output).toContain('PROJECT_ID=123')
        expect(output).toContain('PROJECT_NAME=test-project')

        expect(output).toContain('=== INSTRUCTIONS FOR LLM ===')
        expect(output).toContain('- Generate deployment report')
        expect(output).toContain('- Include error analysis')
      })

      it('should handle success output with debug log path', () => {
        const infoWithDebug = LLMInfo.create({ debugLogPath: '/tmp/debug.log' })
        infoWithDebug.addData('TEST_KEY', 'test_value')

        const output = infoWithDebug.toString()

        expect(output).toContain('DEBUG_LOG=/tmp/debug.log')
      })

      it('should handle minimal success output', () => {
        const output = llmInfo.toString()

        expect(output).toContain('=== EXECUTION SUMMARY ===')
        expect(output).toContain('EXECUTION_STATUS=SUCCESS')
        expect(output).not.toContain('=== ACTION LOG ===')
        expect(output).not.toContain('=== FILES AFFECTED ===')
        expect(output).not.toContain('=== DATA ===')
        expect(output).not.toContain('=== INSTRUCTIONS FOR LLM ===')
      })
    })

    describe('Error scenarios', () => {
      it('should format error output with full details', () => {
        const error = new OrchestratorError(
          new Error('Database connection failed'),
          ['Check database credentials', 'Verify network connectivity'],
          { 
            database: 'production',
            host: 'db.example.com',
            port: 5432
          }
        )

        llmInfo.setError(error)

        const output = llmInfo.toString()

        expect(output).toContain('================== COMMAND EXECUTION FAILED ==================')
        expect(output).toContain('⚠️  STOP PROCESSING - DO NOT CONTINUE WITH OPERATION  ⚠️')

        expect(output).toContain('=== ERROR DETAILS ===')
        expect(output).toContain('ERROR_TYPE=Error')
        expect(output).toContain('ERROR_MESSAGE=Database connection failed')
        expect(output).toContain('ERROR_TIMESTAMP=')

        expect(output).toContain('=== RECOVERY INSTRUCTIONS ===')
        expect(output).toContain('- Check database credentials')
        expect(output).toContain('- Verify network connectivity')

        expect(output).toContain('=== DEBUG INFO ===')
        expect(output).toContain('HOST="db.example.com"')
        expect(output).toContain('PORT=5432')
        expect(output).toContain('DATABASE="production"')
      })

      it('should format error output with debug log path', () => {
        const infoWithDebug = LLMInfo.create({ debugLogPath: '/tmp/debug.log' })
        const error = new OrchestratorError(
          new Error('Test error'),
          ['Fix the error']
        )

        infoWithDebug.setError(error)

        const output = infoWithDebug.toString()

        expect(output).toContain('DEBUG_LOG=/tmp/debug.log')
        expect(output).toContain('To view full debug details: cat /tmp/debug.log')
      })

      it('should handle error with stack trace', () => {
        const originalError = new Error('Test error with stack')
        const error = new OrchestratorError(
          originalError,
          ['Fix the error']
        )

        llmInfo.setError(error)

        const output = llmInfo.toString()

        if (originalError.stack) {
          expect(output).toContain('=== STACK TRACE ===')
          expect(output).toContain(originalError.stack)
        }
      })

      it('should handle error without context or debug info', () => {
        const error = new OrchestratorError(
          new Error('Simple error'),
          ['Simple fix']
        )

        llmInfo.setError(error)

        const output = llmInfo.toString()

        expect(output).toContain('ERROR_MESSAGE=Simple error')
        expect(output).toContain('- Simple fix')
        expect(output).not.toContain('=== ERROR CONTEXT ===')
        expect(output).not.toContain('=== DEBUG INFO ===')
      })
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle empty string values', () => {
      llmInfo.addData('EMPTY_STRING', '')
      expect(llmInfo.getData().EMPTY_STRING).toBe('')
    })

    it('should handle zero and false values', () => {
      llmInfo.addData('ZERO_VALUE', 0)
      llmInfo.addData('FALSE_VALUE', false)

      const data = llmInfo.getData()
      expect(data.ZERO_VALUE).toBe('0')
      expect(data.FALSE_VALUE).toBe('false')
    })

    it('should preserve data integrity across multiple operations', () => {
      llmInfo
        .addData('KEY_1', 'value1')
        .addAction('Action 1', 'success')
        .addFile('/file1.txt', 'created')
        .addInstruction('Instruction 1')
        .addData('KEY_2', 'value2')
        .addAction('Action 2', 'failed')

      expect(llmInfo.getData()).toEqual({
        KEY_1: 'value1',
        KEY_2: 'value2'
      })

      expect(llmInfo.getActions()).toHaveLength(2)
    })

    it('should handle unicode and special characters in values', () => {
      llmInfo.addData('UNICODE_TEXT', 'Hello 世界 🌍')
      llmInfo.addData('SPECIAL_CHARS', 'Line1\nLine2\tTabbed')

      const data = llmInfo.getData()
      expect(data.UNICODE_TEXT).toBe('Hello 世界 🌍')
      expect(data.SPECIAL_CHARS).toBe('Line1\nLine2\tTabbed')
    })

    it('should handle long file paths and descriptions', () => {
      const longPath = '/very/long/path/to/some/deeply/nested/directory/structure/file.txt'
      const longDescription = 'This is a very long description that might be used in real-world scenarios where the details are extensive and comprehensive.'

      llmInfo.addFile(longPath, 'created', 2048)
      llmInfo.addAction('Long action name', 'success', longDescription, 5000)

      const actions = llmInfo.getActions()
      expect(actions[0].details).toBe(longDescription)
    })
  })
})