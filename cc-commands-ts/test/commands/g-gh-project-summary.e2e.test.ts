import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

interface CommandResult {
  exitCode: number
  stderr: string
  stdout: string
}

interface ExecError extends Error {
  status?: number
  stderr?: string
  stdout?: string
}

const runCommand = (args: string = ''): CommandResult => {
  try {
    const stdout = execSync(`node ./bin/run.js g-gh-project-summary ${args}`, {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN || '', NODE_ENV: 'test' }
    })
    return { exitCode: 0, stderr: '', stdout }
  } catch (error) {
    const execError = error as ExecError
    return {
      exitCode: execError.status || 1,
      stderr: execError.stderr || '',
      stdout: execError.stdout || ''
    }
  }
}

describe('g-gh-project-summary E2E', () => {

  it('should show help when requested', () => {
    const result = runCommand('--help')
    
    // Debug output
    if (result.exitCode !== 0) {
      console.error('Help command failed with exit code:', result.exitCode)
      console.error('stdout:', result.stdout)
      console.error('stderr:', result.stderr)
    }
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Generate comprehensive GitHub project summary')
    expect(result.stdout).toContain('g-gh-project-summary')
  })

  it('should return project summary for organization with Projects v2', { timeout: 15_000 }, () => {
    const result = runCommand('github')
    
    // Debug output for exit code verification
    console.log(`Exit code: ${result.exitCode}`)
    console.log(`Execution status: ${result.stdout.includes('EXECUTION_STATUS=SUCCESS') ? 'SUCCESS' : 'NOT SUCCESS'}`)
    console.log(`Actions succeeded: ${result.stdout.match(/ACTIONS_SUCCEEDED=(\d+)/)?.[1] || 'unknown'}`)
    console.log(`Actions failed: ${result.stdout.match(/ACTIONS_FAILED=(\d+)/)?.[1] || 'unknown'}`)
    
    if (result.exitCode !== 0) {
      console.error('Command failed with exit code:', result.exitCode)
      console.error('stdout:', result.stdout)
      console.error('stderr:', result.stderr)
    }
    
    // Primary assertions - exit code MUST be 0 for successful execution
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
    
    // Verify no failed actions when command succeeds
    const actionsFailed = Number.parseInt(result.stdout.match(/ACTIONS_FAILED=(\d+)/)?.[1] || '0', 10)
    expect(actionsFailed).toBe(0)
    
    // Content assertions - verify project data is collected
    expect(result.stdout).toContain('PROJECT_OWNER=github')
    expect(result.stdout).toMatch(/PROJECTS_FOUND=\d+/)
  })

  it('should handle repository owner (LongTermSupport)', () => {
    const result = runCommand('LongTermSupport')
    
    // This may fail if no projects are found, which is expected behavior
    if (result.exitCode === 0) {
      expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
      expect(result.stdout).toContain('PROJECT_OWNER=LongTermSupport')
    } else {
      // If no projects found, should fail gracefully
      expect(result.stdout).toContain('STOP PROCESSING')
    }
  })

  it('should fail gracefully for non-existent repository', () => {
    const result = runCommand('definitely/not-a-real-repo-123456')
    
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('STOP PROCESSING')
    expect(result.stdout).toContain('ERROR_TYPE=')
  })

  it('should fail when no arguments provided', () => {
    const result = runCommand('')
    
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('STOP PROCESSING')
  })
})