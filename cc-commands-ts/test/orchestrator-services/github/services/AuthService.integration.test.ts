/**
 * @file AuthService Integration Tests
 * 
 * Tests actual GitHub CLI integration without mocks
 */

import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService'

describe('AuthService Integration', () => {
  const service = new AuthService()

  describe('getGitHubToken - real gh CLI', () => {
    it('should get token from gh CLI if authenticated', async () => {
      // Check if gh is available
      try {
        execSync('which gh', { encoding: 'utf8' })
      } catch {
        console.log('Skipping test - gh CLI not installed')
        return
      }

      // Check if gh is authenticated
      try {
        execSync('gh auth status', { encoding: 'utf8' })
      } catch {
        console.log('Skipping test - gh CLI not authenticated')
        return
      }

      // Test actual token retrieval
      const token = await service.getGitHubToken()
      
      expect(token).toBeTruthy()
      expect(token).toMatch(/^(ghp_|gho_|github_pat_)/) // GitHub token patterns
    })

    it('should validate retrieved token works with API', async () => {
      // Skip if no gh CLI
      try {
        execSync('gh auth status', { encoding: 'utf8' })
      } catch {
        console.log('Skipping test - gh CLI not authenticated')
        return
      }

      const token = await service.getGitHubToken()
      const username = await service.getAuthenticatedUser(token)
      
      expect(username).toBeTruthy()
      expect(typeof username).toBe('string')
    })
  })
})