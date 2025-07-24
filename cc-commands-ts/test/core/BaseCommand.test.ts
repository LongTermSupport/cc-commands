/**
 * @file Comprehensive unit tests for BaseCommand class
 * 
 * Tests the base class for all cc-commands including:
 * - Abstract class pattern and execute() method requirement
 * - Final run() method behavior and CLI integration
 * - LLMInfo validation and output formatting
 * - Error handling and recovery mechanisms
 * - OCLIF integration (stdout output, exit codes)
 * - Command lifecycle and execution flow
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BaseCommand } from '../../src/core/BaseCommand.js'
import { OrchestratorError } from '../../src/core/error/OrchestratorError.js'
import { LLMInfo } from '../../src/core/LLMInfo.js'

// Mock process.stdout.write
const mockStdoutWrite = vi.fn()

// Mock OCLIF Command class
const mockExit = vi.fn()
const mockParseMethod = vi.fn()

// Create a concrete implementation for testing
class TestCommand extends BaseCommand {
  private executeMock: () => Promise<LLMInfo>

  constructor(executeMock: () => Promise<LLMInfo>) {
    super()
    this.executeMock = executeMock
    // Mock OCLIF methods
    this.exit = mockExit
    this.parse = mockParseMethod
  }

  async execute(): Promise<LLMInfo> {
    return this.executeMock()
  }
}

// Test command that throws an error
class ErrorTestCommand extends BaseCommand {
  private errorToThrow: Error

  constructor(errorToThrow: Error) {
    super()
    this.errorToThrow = errorToThrow
    this.exit = mockExit
    this.parse = mockParseMethod
  }

  async execute(): Promise<LLMInfo> {
    throw this.errorToThrow
  }
}

// Test command that returns non-LLMInfo
class InvalidReturnCommand extends BaseCommand {
  constructor() {
    super()
    this.exit = mockExit
    this.parse = mockParseMethod
  }

  async execute(): Promise<LLMInfo> {
    // @ts-expect-error - Intentionally returning wrong type for testing
    return { invalid: 'object' }
  }
}

describe('BaseCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock process.stdout.write
    Object.defineProperty(process.stdout, 'write', {
      value: mockStdoutWrite,
      writable: true
    })
  })

  describe('Abstract class pattern', () => {
    it('should be an abstract class that cannot be instantiated directly', () => {
      // Abstract classes in TypeScript are only compile-time constructs
      // At runtime, they behave like regular classes, so we test that
      // they require the execute method to be implemented
      expect(BaseCommand.prototype.execute).toBeUndefined()
    })

    it('should require subclasses to implement execute method', () => {
      // This is enforced by TypeScript at compile time
      // but we can test that concrete implementations work
      const mockExecute = vi.fn().mockResolvedValue(LLMInfo.create())
      const command = new TestCommand(mockExecute)

      expect(command).toBeInstanceOf(BaseCommand)
      expect(typeof command.execute).toBe('function')
    })

    it('should have final run method that cannot be overridden', () => {
      class AttemptOverrideCommand extends BaseCommand {
        async execute(): Promise<LLMInfo> {
          return LLMInfo.create()
        }

        // @ts-expect-error - Testing that run method cannot be overridden
        async run(): Promise<void> {
          console.log('Attempted override')
        }
      }

      const command = new AttemptOverrideCommand()
      // The method should exist and be the BaseCommand version
      expect(command.run).toBeDefined()
    })
  })

  describe('Successful command execution', () => {
    it('should execute command and output LLMInfo result', async () => {
      const mockLLMInfo = LLMInfo.create()
      mockLLMInfo.addData('TEST_KEY', 'test_value')
      mockLLMInfo.addAction('Test action', 'success')

      const mockExecute = vi.fn().mockResolvedValue(mockLLMInfo)
      const command = new TestCommand(mockExecute)

      await command.run()

      expect(mockExecute).toHaveBeenCalledOnce()
      expect(mockStdoutWrite).toHaveBeenCalledWith(mockLLMInfo.toString())
      expect(mockExit).toHaveBeenCalledWith(0) // Success exit code
    })

    it('should handle LLMInfo with debug log path', async () => {
      const mockLLMInfo = LLMInfo.create({ debugLogPath: '/tmp/debug.log' })
      mockLLMInfo.addData('DEBUG_TEST', 'debug_value')

      const mockExecute = vi.fn().mockResolvedValue(mockLLMInfo)
      const command = new TestCommand(mockExecute)

      await command.run()

      const outputString = mockLLMInfo.toString()
      expect(mockStdoutWrite).toHaveBeenCalledWith(outputString)
      expect(outputString).toContain('DEBUG_LOG=/tmp/debug.log')
    })

    it('should handle empty LLMInfo result', async () => {
      const mockLLMInfo = LLMInfo.create()
      const mockExecute = vi.fn().mockResolvedValue(mockLLMInfo)
      const command = new TestCommand(mockExecute)

      await command.run()

      expect(mockStdoutWrite).toHaveBeenCalledWith(mockLLMInfo.toString())
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle LLMInfo with complex data structures', async () => {
      const mockLLMInfo = LLMInfo.create()
      mockLLMInfo.addData('PROJECT_ID', '12345')
      mockLLMInfo.addData('REPOSITORY_COUNT', '3')
      mockLLMInfo.addAction('Fetch repositories', 'success', 'Found 3 repos', 1500)
      mockLLMInfo.addAction('Analyze code', 'success', 'Analysis complete', 2300)
      mockLLMInfo.addFile('/tmp/analysis.json', 'created', 2048)
      mockLLMInfo.addInstruction('Generate comprehensive report')
      mockLLMInfo.addInstruction('Include performance metrics')

      const mockExecute = vi.fn().mockResolvedValue(mockLLMInfo)
      const command = new TestCommand(mockExecute)

      await command.run()

      const outputString = mockLLMInfo.toString()
      expect(mockStdoutWrite).toHaveBeenCalledWith(outputString)
      expect(outputString).toContain('PROJECT_ID=12345')
      expect(outputString).toContain('ACTION_0_EVENT=Fetch repositories')
      expect(outputString).toContain('FILE_0_PATH=/tmp/analysis.json')
      expect(outputString).toContain('- Generate comprehensive report')
    })
  })

  describe('Error command execution', () => {
    it('should handle LLMInfo with error set', async () => {
      const orchestratorError = new OrchestratorError(
        new Error('Service unavailable'),
        ['Check service status', 'Retry operation'],
        { service: 'github-api' }
      )

      const mockLLMInfo = LLMInfo.create()
      mockLLMInfo.setError(orchestratorError)

      const mockExecute = vi.fn().mockResolvedValue(mockLLMInfo)
      const command = new TestCommand(mockExecute)

      await command.run()

      expect(mockStdoutWrite).toHaveBeenCalledWith(mockLLMInfo.toString())
      expect(mockExit).toHaveBeenCalledWith(1) // Error exit code

      const outputString = mockLLMInfo.toString()
      expect(outputString).toContain('COMMAND EXECUTION FAILED')
      expect(outputString).toContain('STOP PROCESSING')
      expect(outputString).toContain('Service unavailable')
    })

    it('should handle exceptions thrown by execute method', async () => {
      const thrownError = new Error('Execute method failed')
      const command = new ErrorTestCommand(thrownError)

      await command.run()

      expect(mockStdoutWrite).toHaveBeenCalledOnce()
      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_TYPE=COMMAND_EXECUTION_ERROR')
      expect(outputArg).toContain('ERROR_MESSAGE=Execute method failed')
      expect(outputArg).toContain('Display error message and exit')
    })

    it('should handle non-Error exceptions', async () => {
      const thrownValue = 'String error thrown'
      const command = new TestCommand(async () => {
        throw thrownValue
      })

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_TYPE=COMMAND_EXECUTION_ERROR')
      expect(outputArg).toContain('ERROR_MESSAGE=String error thrown')
    })

    it('should handle Error objects with stack traces', async () => {
      const errorWithStack = new Error('Error with stack trace')
      const command = new ErrorTestCommand(errorWithStack)

      await command.run()

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_STACK=')
      expect(outputArg).toContain(errorWithStack.stack)
    })

    it('should handle Error objects without stack traces', async () => {
      const errorWithoutStack = new Error('Error without stack')
      errorWithoutStack.stack = undefined
      const command = new ErrorTestCommand(errorWithoutStack)

      await command.run()

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_MESSAGE=Error without stack')
      expect(outputArg).not.toContain('ERROR_STACK=')
    })

    it('should handle unknown error types gracefully', async () => {
      const unknownError = { code: 500, message: 'Unknown error type' }
      const command = new TestCommand(async () => {
        throw unknownError
      })

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_TYPE=COMMAND_EXECUTION_ERROR')
      expect(outputArg).toContain('ERROR_MESSAGE=[object Object]')
    })
  })

  describe('LLMInfo validation', () => {
    it('should validate that execute returns LLMInfo instance', async () => {
      const command = new InvalidReturnCommand()

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_MESSAGE=execute() must return an LLMInfo instance')
    })

    it('should validate LLMInfo even when execute returns Promise<any>', async () => {
      const command = new TestCommand(async () => 
        // @ts-expect-error - Testing runtime validation
         null
      )

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_MESSAGE=execute() must return an LLMInfo instance')
    })

    it('should accept valid LLMInfo instances', async () => {
      const validLLMInfo = LLMInfo.create()
      const command = new TestCommand(async () => validLLMInfo)

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(0)
      expect(mockStdoutWrite).toHaveBeenCalledWith(validLLMInfo.toString())
    })
  })

  describe('OCLIF integration', () => {
    it('should use OCLIF exit method instead of process.exit', async () => {
      const mockLLMInfo = LLMInfo.create()
      const command = new TestCommand(async () => mockLLMInfo)

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(0)
      expect(mockExit).toHaveBeenCalledTimes(1)
    })

    it('should write to stdout instead of using this.log', async () => {
      const mockLLMInfo = LLMInfo.create()
      mockLLMInfo.addData('OUTPUT_TEST', 'stdout_test')

      const command = new TestCommand(async () => mockLLMInfo)

      await command.run()

      expect(mockStdoutWrite).toHaveBeenCalledOnce()
      expect(mockStdoutWrite).toHaveBeenCalledWith(mockLLMInfo.toString())
    })

    it('should handle different exit codes based on LLMInfo state', async () => {
      // Test success case
      const successInfo = LLMInfo.create()
      const successCommand = new TestCommand(async () => successInfo)

      await successCommand.run()
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockClear()

      // Test error case
      const errorInfo = LLMInfo.create()
      const orchestratorError = new OrchestratorError(
        new Error('Test error'),
        ['Fix the test']
      )
      errorInfo.setError(orchestratorError)
      const errorCommand = new TestCommand(async () => errorInfo)

      await errorCommand.run()
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('Command lifecycle and execution flow', () => {
    it('should follow proper execution sequence', async () => {
      const executionOrder: string[] = []
      
      const mockExecute = vi.fn().mockImplementation(async () => {
        executionOrder.push('execute')
        return LLMInfo.create()
      })

      const originalWrite = process.stdout.write
      const mockWrite = vi.fn().mockImplementation((...args) => {
        executionOrder.push('stdout')
        return originalWrite.call(process.stdout, ...args)
      })
      Object.defineProperty(process.stdout, 'write', { value: mockWrite })

      const mockExitWithOrder = vi.fn().mockImplementation((code) => {
        executionOrder.push(`exit(${code})`)
      })

      const command = new TestCommand(mockExecute)
      command.exit = mockExitWithOrder

      await command.run()

      expect(executionOrder).toEqual(['execute', 'stdout', 'exit(0)'])
    })

    it('should handle async execute methods properly', async () => {
      let resolvePromise: (value: LLMInfo) => void
      const delayedPromise = new Promise<LLMInfo>((resolve) => {
        resolvePromise = resolve
      })

      const command = new TestCommand(async () => delayedPromise)

      const runPromise = command.run()

      // Command should not complete until execute resolves
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 10)
      })
      expect(mockStdoutWrite).not.toHaveBeenCalled()
      expect(mockExit).not.toHaveBeenCalled()

      // Resolve the execute promise
      const testInfo = LLMInfo.create()
      testInfo.addData('ASYNC_TEST', 'completed')
      resolvePromise!(testInfo)

      await runPromise

      expect(mockStdoutWrite).toHaveBeenCalledWith(testInfo.toString())
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle execute method that rejects', async () => {
      const rejectionError = new Error('Execute method rejected')
      const command = new TestCommand(async () => {
        throw rejectionError
      })

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)

      const outputArg = mockStdoutWrite.mock.calls[0][0]
      expect(outputArg).toContain('ERROR_MESSAGE=Execute method rejected')
    })
  })

  describe('Real-world integration scenarios', () => {
    it('should handle orchestrator-style command execution', async () => {
      // Simulate a real orchestrator returning comprehensive data
      const orchestratorResult = LLMInfo.create({ debugLogPath: '/tmp/command.log' })
      
      orchestratorResult.addData('COMMAND_NAME', 'github-project-summary')
      orchestratorResult.addData('PROJECT_ID', 'PVT_12345')
      orchestratorResult.addData('REPOSITORY_COUNT', '5')
      orchestratorResult.addData('TOTAL_ISSUES', '42')
      
      orchestratorResult.addAction('Authenticate with GitHub', 'success', 'Token validated', 150)
      orchestratorResult.addAction('Fetch project data', 'success', 'Retrieved project metadata', 800)
      orchestratorResult.addAction('Analyze repositories', 'success', 'Processed 5 repositories', 2300)
      
      orchestratorResult.addFile('/tmp/project-data.json', 'created', 4096)
      orchestratorResult.addFile('/tmp/analysis-report.md', 'created', 8192)
      
      orchestratorResult.addInstruction('Generate executive summary focusing on project health')
      orchestratorResult.addInstruction('Include repository activity metrics')
      orchestratorResult.addInstruction('Highlight any blocked or stale issues')

      const command = new TestCommand(async () => orchestratorResult)

      await command.run()

      const output = mockStdoutWrite.mock.calls[0][0]
      
      // Verify comprehensive output format
      expect(output).toContain('=== EXECUTION SUMMARY ===')
      expect(output).toContain('EXECUTION_STATUS=SUCCESS')
      expect(output).toContain('DEBUG_LOG=/tmp/command.log')
      
      expect(output).toContain('=== ACTION LOG ===')
      expect(output).toContain('TOTAL_ACTIONS=3')
      expect(output).toContain('ACTIONS_SUCCEEDED=3')
      
      expect(output).toContain('=== FILES AFFECTED ===')
      expect(output).toContain('TOTAL_FILES=2')
      
      expect(output).toContain('=== DATA ===')
      expect(output).toContain('PROJECT_ID=PVT_12345')
      
      expect(output).toContain('=== INSTRUCTIONS FOR LLM ===')
      expect(output).toContain('- Generate executive summary')

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle orchestrator error scenarios properly', async () => {
      // Simulate orchestrator encountering a service error
      const serviceError = new OrchestratorError(
        new Error('GitHub API rate limit exceeded'),
        [
          'Wait for rate limit reset (check X-RateLimit-Reset header)',
          'Use authenticated requests to increase limit',
          'Implement exponential backoff for retries'
        ],
        {
          apiEndpoint: 'https://api.github.com/graphql',
          rateLimitRemaining: 0,
          rateLimitReset: '2025-01-15T11:00:00Z',
          requestId: 'req_123456'
        }
      )

      const errorResult = LLMInfo.create({ debugLogPath: '/tmp/error.log' })
      errorResult.addData('COMMAND_STATUS', 'FAILED')
      errorResult.addData('ERROR_DOMAIN', 'GITHUB_API')
      errorResult.setError(serviceError)

      const command = new TestCommand(async () => errorResult)

      await command.run()

      const output = mockStdoutWrite.mock.calls[0][0]
      
      expect(output).toContain('COMMAND EXECUTION FAILED')
      expect(output).toContain('STOP PROCESSING')
      expect(output).toContain('GitHub API rate limit exceeded')
      expect(output).toContain('Wait for rate limit reset')
      expect(output).toContain('APIENDPOINT="https://api.github.com/graphql"')
      
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('Edge cases and error conditions', () => {
    it('should handle execute method returning undefined', async () => {
      const command = new TestCommand(async () => 
        // @ts-expect-error - Testing runtime behavior
 {}
      )

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)
      const output = mockStdoutWrite.mock.calls[0][0]
      expect(output).toContain('execute() must return an LLMInfo instance')
    })

    it('should handle execute method throwing null', async () => {
      const command = new TestCommand(async () => {
        // eslint-disable-next-line no-throw-literal
        throw null
      })

      await command.run()

      expect(mockExit).toHaveBeenCalledWith(1)
      const output = mockStdoutWrite.mock.calls[0][0]
      expect(output).toContain('ERROR_MESSAGE=null')
    })

    it('should handle stdout write failures gracefully', async () => {
      mockStdoutWrite.mockImplementation(() => {
        throw new Error('Stdout write failed')
      })

      const mockLLMInfo = LLMInfo.create()
      const command = new TestCommand(async () => mockLLMInfo)

      // Should not throw, should still attempt to exit
      await expect(command.run()).rejects.toThrow('Stdout write failed')
    })

    it('should handle very large output data', async () => {
      // Reset the mock to clear previous implementations
      mockStdoutWrite.mockRestore()
      mockStdoutWrite.mockImplementation(() => true)

      const largeInfo = LLMInfo.create()
      
      // Add large amounts of data
      for (let i = 0; i < 100; i++) {
        largeInfo.addData(`LARGE_KEY_${i}`, 'A'.repeat(100))
        largeInfo.addAction(`Large action ${i}`, 'success', 'B'.repeat(50), i * 10)
      }

      const command = new TestCommand(async () => largeInfo)

      await command.run()

      expect(mockStdoutWrite).toHaveBeenCalledOnce()
      expect(mockExit).toHaveBeenCalledWith(0)

      const output = mockStdoutWrite.mock.calls[0][0]
      expect(output.length).toBeGreaterThan(10_000) // Should be substantial output
    })
  })
})