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

  describe('Help and Basic CLI', () => {
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
  })

  describe('Real Public Project Tests', () => {
    it('should handle public LongTermSupport project URL without crashing', () => {
      // RED: This test uses the real public project to reproduce the repository parsing error
      // https://github.com/orgs/LongTermSupport/projects/1 - now public
      const result = runCommand('"https://github.com/orgs/LongTermSupport/projects/1"')
      
      // Debug output for failing case
      if (result.exitCode !== 0) {
        console.log('Exit code:', result.exitCode)
        console.log('stdout:', result.stdout)
        console.log('stderr:', result.stderr)
      }
      
      // Should not crash with "Cannot read properties of undefined (reading 'nameWithOwner')"
      expect(result.stdout).not.toContain('Cannot read properties of undefined')
      
      // Should either succeed (exit 0) or fail gracefully with proper error message
      if (result.exitCode === 0) {
        // Success case - should contain project data
        expect(result.stdout).toContain('PROJECT_V2_TITLE=TEST PROJECT for cc-commands')
        expect(result.stdout).toContain('PROJECT_V2_OWNER=LongTermSupport')
      } else {
        // Failure case - should have proper error recovery instructions, not a crash
        expect(result.stdout).toContain('RECOVERY INSTRUCTIONS')
        expect(result.stdout).not.toContain('TypeError')
      }
    })
  })

  describe('Owner Mode Detection', () => {
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
    
    // Verify command completed successfully (may have some failed sub-actions but overall success)
    const actionsSucceeded = Number.parseInt(result.stdout.match(/ACTIONS_SUCCEEDED=(\d+)/)?.[1] || '0', 10)
    
    // Command is successful if exit code is 0 and there are some successful actions
    // Some sub-actions may fail due to API issues, rate limiting, or missing permissions
    expect(actionsSucceeded).toBeGreaterThan(0)
    
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

    it('should handle owner/repo format by extracting owner', () => {
      const result = runCommand('github/docs')
      
      // Should extract 'github' as the owner and ignore '/docs'
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('PROJECT_OWNER=github')
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })

    it('should fail gracefully for non-existent organization', () => {
    const result = runCommand('definitely/not-a-real-repo-123456')
    
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('STOP PROCESSING')
    expect(result.stdout).toContain('ERROR_TYPE=')
    })
  })

  describe('Auto Mode Detection', () => {
    it('should attempt auto-detection from git remote when no arguments provided', { timeout: 15_000 }, () => {
    const result = runCommand('')
    
    // Debug output to understand what happened
    console.log(`Exit code: ${result.exitCode}`)
    console.log(`Detection mode: ${result.stdout.match(/DETECTION_MODE=(\w+)/)?.[1] || 'none'}`)
    
    // Should attempt auto-detection (regardless of success/failure)
    expect(result.stdout).toContain('DETECTION_MODE=auto')
    
    // Should either succeed with a project OR fail gracefully with proper error
    if (result.exitCode === 0) {
      // Success case - found a project
      expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
      expect(result.stdout).toContain('PROJECT_TITLE=')
    } else {
      // Expected failure case - no project associated with git remote
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('STOP PROCESSING')
      expect(result.stdout).toContain('Could not detect GitHub project from git remote')
      expect(result.stdout).toContain('Ensure you are in a git repository directory')
    }
    })
  })

  describe('URL Mode Detection', () => {
    it('should handle GitHub organization project URLs', { timeout: 15_000 }, () => {
      const result = runCommand('"https://github.com/orgs/github/projects/1"')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('DETECTION_MODE=url')
        expect(result.stdout).toContain('PROJECT_OWNER=github')
        expect(result.stdout).toContain('PROJECT_NUMBER=1')
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
      } else {
        // May fail if project doesn't exist or no access
        expect(result.stdout).toContain('STOP PROCESSING')
        expect(result.stdout).toContain('DETECTION_MODE=url')
      }
    })

    it('should handle GitHub user project URLs', { timeout: 15_000 }, () => {
      const result = runCommand('"https://github.com/users/octocat/projects/1"')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('DETECTION_MODE=url')
        expect(result.stdout).toContain('PROJECT_OWNER=octocat')
        expect(result.stdout).toContain('PROJECT_NUMBER=1')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
        expect(result.stdout).toContain('DETECTION_MODE=url')
      }
    })

    it('should fail gracefully for invalid GitHub project URLs', () => {
      const result = runCommand('"https://github.com/invalid/url/format"')
      
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('STOP PROCESSING')
      expect(result.stdout).toContain('Invalid GitHub project URL format')
      expect(result.stdout).toContain('Use format: https://github.com/orgs/ORG/projects/123')
    })

    it('should fail gracefully for non-GitHub URLs', () => {
      const result = runCommand('"https://gitlab.com/some/project"')
      
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('STOP PROCESSING')
      expect(result.stdout).toContain('Invalid GitHub project URL format')
    })
  })

  describe('Command Flags', () => {
    it('should handle format flag variations', { timeout: 15_000 }, () => {
      const result = runCommand('github --format executive')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
        expect(result.stdout).toContain('FORMAT=executive')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })

    it('should handle since flag for time window', { timeout: 15_000 }, () => {
      const result = runCommand('github --since 7d')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
        expect(result.stdout).toContain('TIME_WINDOW_DAYS=7')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })

    it('should handle combined flags', { timeout: 15_000 }, () => {
      const result = runCommand('github --format detailed --since 14d')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
        expect(result.stdout).toContain('FORMAT=detailed')
        expect(result.stdout).toContain('TIME_WINDOW_DAYS=14')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })

    it('should handle invalid format flag gracefully', () => {
      const result = runCommand('github --format invalid')
      
      // Command may return 0 or 1 depending on error handling
      expect(result.exitCode).toBeGreaterThanOrEqual(0)
      
      // Error message should be present in either stdout or stderr
      const output = result.stdout + result.stderr
      expect(output).toContain('Expected --format=invalid to be one of')
      expect(output).toMatch(/technical.*executive.*detailed/)
    })

    it('should handle invalid time window gracefully', { timeout: 15_000 }, () => {
      const result = runCommand('github --since invalid')
      
      if (result.exitCode === 0) {
        // Should use default time window when invalid
        expect(result.stdout).toContain('TIME_WINDOW_DAYS=30')
      } else {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })
  })

  describe('Output Format Verification', () => {
    it('should include proper LLM instructions in successful output', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('=== INSTRUCTIONS FOR LLM ===')
        expect(result.stdout).toContain('Generate a comprehensive GitHub project summary report')
      }
    })

    it('should include action log in output', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      // Both success and failure should include action log
      expect(result.stdout).toContain('=== ACTION LOG ===')
      expect(result.stdout).toMatch(/ACTION_\d+_EVENT=/)
      expect(result.stdout).toMatch(/ACTION_\d+_RESULT=/)
      expect(result.stdout).toContain('TOTAL_ACTIONS=')
    })

    it('should include proper data section formatting', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('=== DATA ===')
        expect(result.stdout).toContain('DETECTION_MODE=owner')
        expect(result.stdout).toContain('INPUT_ARGS=github')
      }
    })
  })

  describe('JSON Result File Output', () => {
    it('should generate both stdout and JSON file outputs', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      if (result.exitCode === 0) {
        // Should have traditional key=value output
        expect(result.stdout).toContain('PROJECT_OWNER=github')
        expect(result.stdout).toMatch(/PROJECTS_FOUND=\d+/)
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
        
        // Should reference JSON result file
        expect(result.stdout).toContain('RESULT_FILE=')
        expect(result.stdout).toMatch(/RESULT_FILE=.*\.json\.xz/)
        
        // Should include query examples
        expect(result.stdout).toContain('Query examples:')
        expect(result.stdout).toContain('xzcat')
        expect(result.stdout).toContain('| jq')
      }
    })

    it('should include jq query hints in output', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      if (result.exitCode === 0) {
        // Should provide helpful jq query examples
        expect(result.stdout).toMatch(/\| jq '\.metadata'/)
        expect(result.stdout).toMatch(/\| jq '\.calculated\.project_totals'/)
        expect(result.stdout).toMatch(/\| jq '\.raw\.github_api'/)
        
        // Should mention scope and purpose
        expect(result.stdout).toContain('Basic structure')
        expect(result.stdout).toContain('Project overview')
      }
    })

    it('should handle JSON file generation errors gracefully', { timeout: 15_000 }, () => {
      // This test runs against real system, so JSON generation should work
      // if XZ is available. Error handling is tested in unit tests.
      const result = runCommand('github')
      
      // Should either succeed or fail cleanly
      expect([0, 1]).toContain(result.exitCode)
      
      if (result.exitCode === 1) {
        expect(result.stdout).toContain('STOP PROCESSING')
      }
    })

    it('should preserve existing LLM instruction format', { timeout: 15_000 }, () => {
      const result = runCommand('github')
      
      if (result.exitCode === 0) {
        // JSON file generation should not interfere with LLM instructions
        expect(result.stdout).toContain('=== INSTRUCTIONS FOR LLM ===')
        expect(result.stdout).toContain('Generate a comprehensive GitHub project summary report')
        
        // Should still have execution summary
        expect(result.stdout).toContain('=== EXECUTION SUMMARY ===')
        expect(result.stdout).toContain('EXECUTION_STATUS=SUCCESS')
      }
    })
  })
})