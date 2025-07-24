/**
 * @file AuthService Tests
 * 
 * Tests for GitHub authentication service functionality.
 */

import { execSync } from 'node:child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError'
import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService'

// Mock execSync
vi.mock('node:child_process', () => ({
  execSync: vi.fn()
}))

// Mock Octokit
const mockGetAuthenticated = vi.fn()
const mockOctokit = {
  rest: {
    users: {
      getAuthenticated: mockGetAuthenticated
    }
  }
}

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokit)
}))

describe('AuthService', () => {
  let service: AuthService
  const mockExecSync = vi.mocked(execSync)

  beforeEach(() => {
    service = new AuthService()
    vi.clearAllMocks()
  })

  describe('getGitHubToken', () => {
    it('should return token from gh CLI', async () => {
      mockExecSync.mockReturnValue('ghp_test_token_123\n')

      const token = await service.getGitHubToken()

      expect(token).toBe('ghp_test_token_123')
      expect(mockExecSync).toHaveBeenCalledWith('gh auth token', {
        encoding: 'utf8',
        timeout: 5000
      })
    })

    it('should handle empty token response', async () => {
      mockExecSync.mockReturnValue('')

      await expect(service.getGitHubToken())
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should handle gh CLI command failure', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found: gh')
      })

      await expect(service.getGitHubToken())
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should trim whitespace from token', async () => {
      mockExecSync.mockReturnValue('  ghp_test_token_123  \n')

      const token = await service.getGitHubToken()

      expect(token).toBe('ghp_test_token_123')
    })
  })

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      mockGetAuthenticated.mockResolvedValue({
        data: { login: 'testuser' }
      })

      const isValid = await service.validateToken('valid_token')

      expect(isValid).toBe(true)
    })

    it('should return false for invalid token', async () => {
      mockGetAuthenticated.mockRejectedValue(new Error('Bad credentials'))

      const isValid = await service.validateToken('invalid_token')

      expect(isValid).toBe(false)
    })
  })

  describe('getAuthenticatedUser', () => {
    it('should return username for valid token', async () => {
      mockGetAuthenticated.mockResolvedValue({
        data: { login: 'testuser' }
      })

      const username = await service.getAuthenticatedUser('valid_token')

      expect(username).toBe('testuser')
    })

    it('should throw OrchestratorError for invalid token', async () => {
      mockGetAuthenticated.mockRejectedValue(new Error('Bad credentials'))

      await expect(service.getAuthenticatedUser('invalid_token'))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should include masked token in error debug info', async () => {
      mockGetAuthenticated.mockRejectedValue(new Error('Bad credentials'))

      try {
        await service.getAuthenticatedUser('ghp_1234567890abcdef')
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.token).toBe('ghp_123...')
        }
      }
    })
  })
})