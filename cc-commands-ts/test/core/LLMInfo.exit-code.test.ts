/**
 * @file LLMInfo Exit Code Unit Tests
 * 
 * Tests to isolate and verify LLMInfo.getExitCode() behavior.
 * This helps debug why successful commands are returning exit code 1.
 */

import { describe, expect, it } from 'vitest'

import { OrchestratorError } from '../../src/core/error/OrchestratorError.js'
import { LLMInfo } from '../../src/core/LLMInfo.js'

describe('LLMInfo Exit Code Logic', () => {

  it('should return exit code 0 for fresh LLMInfo instance', () => {
    const info = LLMInfo.create()
    
    expect(info.getExitCode()).toBe(0)
    expect(info.hasError()).toBe(false)
  })

  it('should return exit code 0 when successful actions are added', () => {
    const info = LLMInfo.create()
    
    info.addAction('Test action 1', 'success')
    info.addAction('Test action 2', 'success')
    info.addData('TEST_DATA', 'value')
    
    expect(info.getExitCode()).toBe(0)
    expect(info.hasError()).toBe(false)
  })

  it('should return exit code 0 even when actions are skipped', () => {
    const info = LLMInfo.create()
    
    info.addAction('Test action 1', 'success')
    info.addAction('Test action 2', 'skipped')
    info.addData('TEST_DATA', 'value')
    
    expect(info.getExitCode()).toBe(0)
    expect(info.hasError()).toBe(false)
  })

  it('should return exit code 0 even when actions fail but no error is set', () => {
    const info = LLMInfo.create()
    
    info.addAction('Test action 1', 'success')
    info.addAction('Test action 2', 'failed', 'This failed but no error was set')
    info.addData('TEST_DATA', 'value')
    
    // Actions can fail without setting an error - exit code should still be 0
    expect(info.getExitCode()).toBe(0)
    expect(info.hasError()).toBe(false)
  })

  it('should return exit code 1 when error is explicitly set', () => {
    const info = LLMInfo.create()
    
    info.addAction('Test action 1', 'success')
    info.addData('TEST_DATA', 'value')
    
    const error = new OrchestratorError(
      new Error('This is a test error'),
      ['Fix this', 'Try that']
    )
    info.setError(error)
    
    expect(info.getExitCode()).toBe(1)
    expect(info.hasError()).toBe(true)
  })

  it('should return exit code 1 when merging LLMInfo with error', () => {
    const successInfo = LLMInfo.create()
    successInfo.addAction('Success action', 'success')
    successInfo.addData('SUCCESS_DATA', 'value')
    
    const errorInfo = LLMInfo.create()
    const error = new OrchestratorError(
      new Error('Error from another LLMInfo'),
      ['Fix the merged error']
    )
    errorInfo.setError(error)
    
    // Merge should propagate the error
    successInfo.merge(errorInfo)
    
    expect(successInfo.getExitCode()).toBe(1)
    expect(successInfo.hasError()).toBe(true)
  })

  it('should not change exit code when merging successful LLMInfo', () => {
    const info1 = LLMInfo.create()
    info1.addAction('First action', 'success')
    info1.addData('DATA_1', 'value1')
    
    const info2 = LLMInfo.create()
    info2.addAction('Second action', 'success')
    info2.addData('DATA_2', 'value2')
    
    info1.merge(info2)
    
    expect(info1.getExitCode()).toBe(0)
    expect(info1.hasError()).toBe(false)
    expect(info1.getActions()).toHaveLength(2)
  })

  it('should maintain exit code 0 with complex successful data', () => {
    const info = LLMInfo.create()
    
    // Add many successful actions like the real command
    for (let i = 1; i <= 21; i++) {
      info.addAction(`Action ${i}`, 'success', `Details for action ${i}`, 100 + i)
    }
    
    // Add lots of data
    info.addData('EXECUTION_STATUS', 'SUCCESS')
    info.addData('TOTAL_ACTIONS', '21')
    info.addData('ACTIONS_SUCCEEDED', '21')
    info.addData('ACTIONS_FAILED', '0')
    info.addData('REPOSITORY_COUNT', '5')
    info.addData('PROJECT_NAME', 'test-project')
    
    // Add instructions
    info.addInstruction('Generate a comprehensive report')
    info.addInstruction('Include all metrics')
    
    // Add file operations
    info.addFile('/tmp/debug.log', 'created', 1024)
    
    expect(info.getExitCode()).toBe(0)
    expect(info.hasError()).toBe(false)
    expect(info.getActions()).toHaveLength(21)
    const data = info.getData()
    const status = Object.hasOwn(data, 'EXECUTION_STATUS') ? data['EXECUTION_STATUS'] : undefined
    if (status) {
      expect(status).toBe('SUCCESS')
    } else {
      throw new Error('EXECUTION_STATUS not found in data')
    }
  })
})