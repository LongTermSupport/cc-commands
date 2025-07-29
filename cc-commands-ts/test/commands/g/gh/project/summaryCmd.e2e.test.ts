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

  it('should return project summary for a valid public repository', () => {
    const result = runCommand('LongTermSupport/cc-commands')
    
    // Debug output
    if (result.exitCode !== 0) {
      console.error('Command failed with exit code:', result.exitCode)
      console.error('stdout:', result.stdout)
      console.error('stderr:', result.stderr)
    }
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
    expect(result.stdout).toContain('REPOSITORY_NAME=cc-commands')
    expect(result.stdout).toContain('REPOSITORY_OWNER=LongTermSupport')
    expect(result.stdout).toContain('REPOSITORY_FULL_NAME=LongTermSupport/cc-commands')
    expect(result.stdout).toMatch(/REPOSITORY_STARGAZERS_COUNT=\d+/)
  })

  it('should handle repository URLs', () => {
    const result = runCommand('https://github.com/LongTermSupport/cc-commands')
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('REPOSITORY_NAME=cc-commands')
    expect(result.stdout).toContain('REPOSITORY_OWNER=LongTermSupport')
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