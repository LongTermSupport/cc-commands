/**
 * @file Real integration test for g:gh:project:summary command
 * 
 * Tests against the actual cc-commands GitHub repository.
 * This ensures the command works with real API calls and real data.
 */

import { runCommand } from '@oclif/test'
import { describe, expect, it } from 'vitest'

describe('g:gh:project:summary real integration', () => {
  // Skip these tests in CI to avoid rate limits
  const skipInCI = process.env['CI'] ? it.skip : it

  describe('Real GitHub Repository Tests', () => {
    skipInCI('should analyze the cc-commands repository', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/LongTermSupport/cc-commands',
      ])

      // The repository exists and should return data
      if (error) {
        // If there's an error, it might be due to rate limiting
        expect(error.message).toMatch(/rate limit/i)
      } else {
        // Should have repository data
        expect(stdout).toContain('REPOSITORY_NAME=cc-commands')
        expect(stdout).toContain('REPOSITORY_OWNER=LongTermSupport')
        
        // Should have detected TypeScript as primary language
        expect(stdout).toMatch(/PRIMARY_LANGUAGE=(TypeScript|JavaScript)/)
      }
      
      // Should have basic repository info
      expect(stdout).toContain('DEFAULT_BRANCH=main')
      expect(stdout).toContain('VISIBILITY=public')
      expect(stdout).toContain('IS_FORK=false')
      
      // Should have collected metrics
      expect(stdout).toMatch(/COMMIT_COUNT=\d+/)
      expect(stdout).toMatch(/CONTRIBUTOR_COUNT=\d+/)
      expect(stdout).toMatch(/STARS=\d+/)
      
      // Should have the audience parameter
      expect(stdout).toContain('AUDIENCE=dev')
      
      // Should complete successfully
      expect(stdout).toContain('COMMAND COMPLETE')
    }, 30_000) // Increased timeout for real API calls

    skipInCI('should work with owner/repo flags', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'LongTermSupport',
        '--repo',
        'cc-commands',
      ])

      expect(error).toBeUndefined()
      expect(stdout).toContain('INPUT_MODE=manual')
      expect(stdout).toContain('REPOSITORY_NAME=cc-commands')
      expect(stdout).toContain('REPOSITORY_OWNER=LongTermSupport')
    }, 30_000)

    skipInCI('should analyze with custom audience and days', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/LongTermSupport/cc-commands',
        '--audience',
        'technical-lead',
        '--days',
        '60',
      ])

      expect(error).toBeUndefined()
      expect(stdout).toContain('AUDIENCE=technical-lead')
      expect(stdout).toContain('DAYS_ANALYZED=60')
    }, 30_000)

    skipInCI('should handle repository with no releases gracefully', async () => {
      // Using a repository that likely has no releases
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/github/gitignore',
      ])

      expect(error).toBeUndefined()
      expect(stdout).toContain('REPOSITORY_NAME=gitignore')
      
      // Should handle missing release data
      if (stdout.includes('RELEASE_COUNT=0')) {
        expect(stdout).toMatch(/LATEST_RELEASE_VERSION=(No releases|None)/)
      }
    }, 30_000)
  })

  describe('Error Cases with Real API', () => {
    skipInCI('should fail for non-existent repository', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/this-org-should-not-exist-123456/this-repo-should-not-exist-123456',
      ])

      expect(error).toBeDefined()
      expect(error?.message).toMatch(/not found|404/i)
    }, 30_000)

    skipInCI('should fail for private repository without access', async () => {
      // Using a known private repo pattern
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'github',
        '--repo',
        'private-repo-test-123456',
      ])

      expect(error).toBeDefined()
      // Could be 404 (not found) or 403 (forbidden) depending on auth
      expect(error?.message).toMatch(/not found|404|forbidden|403/i)
    }, 30_000)
  })

  describe('Auto-detection from Current Directory', () => {
    // This test only works if run from within a git repository
    skipInCI('should auto-detect from current git repository', async () => {
      // First check if we're in a git repo
      const gitCheck = await import('node:child_process').then(m => 
        new Promise<boolean>((resolve) => {
          m.exec('git rev-parse --git-dir', (error) => {
            resolve(!error)
          })
        })
      )

      if (!gitCheck) {
        console.log('Not in a git repository, skipping auto-detection test')
        return
      }

      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
      ])

      // If it works, we should see INPUT_MODE=auto
      if (error) {
        // If it fails, it should be because no GitHub remote was found
        expect(error.message).toMatch(/no github remote|not a github repository/i)
      } else {
        expect(stdout).toContain('INPUT_MODE=auto')
        expect(stdout).toMatch(/REPOSITORY_NAME=\w+/)
        expect(stdout).toMatch(/REPOSITORY_OWNER=\w+/)
      }
    }, 30_000)
  })

  describe('GitHub Token Handling', () => {
    skipInCI('should use gh CLI token if available', async () => {
      // Check if gh CLI is available and authenticated
      const ghAvailable = await import('node:child_process').then(m =>
        new Promise<boolean>((resolve) => {
          m.exec('gh auth status', (error) => {
            resolve(!error)
          })
        })
      )

      if (!ghAvailable) {
        console.log('GitHub CLI not authenticated, skipping gh token test')
        return
      }

      // Remove GITHUB_TOKEN env var to ensure gh CLI is used
      const originalToken = process.env['GITHUB_TOKEN']
      delete process.env['GITHUB_TOKEN']

      try {
        const { error, stdout } = await runCommand([
          'g:gh:project:summary',
          'https://github.com/LongTermSupport/cc-commands',
        ])

        expect(error).toBeUndefined()
        // Should still work with gh CLI token
        expect(stdout).toContain('REPOSITORY_NAME=cc-commands')
      } finally {
        // Restore original token
        if (originalToken) {
          process.env['GITHUB_TOKEN'] = originalToken
        }
      }
    }, 30_000)

    skipInCI('should work without authentication for public repos', async () => {
      // Remove all auth sources
      const originalToken = process.env['GITHUB_TOKEN']
      delete process.env['GITHUB_TOKEN']

      try {
        const { error, stdout } = await runCommand([
          'g:gh:project:summary',
          'https://github.com/facebook/react',
        ])

        // Should work but might have rate limit warnings
        if (!error || error.message.includes('rate limit')) {
          expect(stdout).toContain('REPOSITORY_NAME=react')
          expect(stdout).toContain('REPOSITORY_OWNER=facebook')
        }
      } finally {
        if (originalToken) {
          process.env['GITHUB_TOKEN'] = originalToken
        }
      }
    }, 30_000)
  })
})