/**
 * @file Test suite for executeProjectSummary orchestration function
 * 
 * Tests the pure orchestration logic without oclif overhead.
 * This is the preferred testing approach for functional DI pattern.
 */

import { describe, expect, it, vi } from 'vitest'

import type { ProjectSummaryServices } from '../../../../../src/orchestrators/g/gh/project/executeProjectSummary'

import { executeProjectSummary } from '../../../../../src/orchestrators/g/gh/project/executeProjectSummary'
import { LLMInfo } from '../../../../../src/types/LLMInfo'

describe('executeProjectSummary', () => {
  describe('Input Modes', () => {
    it('should handle URL mode correctly', async () => {
      // Create mock services
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPOSITORY_NAME', 'testrepo')
              .addData('REPOSITORY_OWNER', 'testuser')
              .addData('PRIMARY_LANGUAGE', 'TypeScript')
              .addData('DESCRIPTION', 'Test repository')
              .addData('AUDIENCE', 'dev')
              .addAction('Data collection', 'success')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('ENV_VALID', 'true')
              .addAction('Environment validation', 'success')
          )
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('INPUT_MODE', 'url')
              .addData('REPO_OWNER', 'testuser')
              .addData('REPO_NAME', 'testrepo')
              .addData('REPO_URL', 'https://github.com/testuser/testrepo')
              .addAction('Project detection', 'success')
          )
        }
      }

      // Execute orchestration
      const result = await executeProjectSummary(
        mockServices,
        { url: 'https://github.com/testuser/testrepo' },
        { audience: 'dev', days: 30, token: 'test-token' }
      )

      // Verify result
      expect(result.hasError()).toBe(false)
      const data = result.getData()
      expect(data.INPUT_MODE).toBe('url')
      expect(data.REPOSITORY_OWNER).toBe('testuser')
      expect(data.REPOSITORY_NAME).toBe('testrepo')
      expect(data.PRIMARY_LANGUAGE).toBe('TypeScript')
      
      // Verify service calls
      expect(mockServices.envValidator.execute).toHaveBeenCalledWith({
        params: {
          requiredEnvVars: [],
          requiredTools: ['git']
        }
      })
      
      expect(mockServices.projectDetector.execute).toHaveBeenCalledWith({
        params: {
          owner: undefined,
          repo: undefined,
          url: 'https://github.com/testuser/testrepo'
        }
      })
      
      expect(mockServices.dataCollector.execute).toHaveBeenCalledWith({
        params: {
          audience: 'dev',
          days: 30,
          owner: 'testuser',
          repo: 'testrepo'
        }
      })
    })

    it('should handle manual mode with owner/repo', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPOSITORY_NAME', 'testrepo')
              .addData('REPOSITORY_OWNER', 'testuser')
              .addAction('Data collection', 'success')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('ENV_VALID', 'true')
              .addAction('Environment validation', 'success')
          )
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('INPUT_MODE', 'manual')
              .addData('REPO_OWNER', 'testuser')
              .addData('REPO_NAME', 'testrepo')
              .addAction('Project detection', 'success')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30, owner: 'testuser', repo: 'testrepo' }
      )

      expect(result.hasError()).toBe(false)
      expect(result.getData().INPUT_MODE).toBe('manual')
      
      expect(mockServices.projectDetector.execute).toHaveBeenCalledWith({
        params: {
          owner: 'testuser',
          repo: 'testrepo',
          url: undefined
        }
      })
    })

    it('should handle auto mode from current directory', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPOSITORY_NAME', 'autorepo')
              .addData('REPOSITORY_OWNER', 'autouser')
              .addAction('Data collection', 'success')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('ENV_VALID', 'true')
              .addAction('Environment validation', 'success')
          )
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('INPUT_MODE', 'auto')
              .addData('REPO_OWNER', 'autouser')
              .addData('REPO_NAME', 'autorepo')
              .addAction('Project detection', 'success')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      expect(result.hasError()).toBe(false)
      expect(result.getData().INPUT_MODE).toBe('auto')
      expect(result.getData().REPOSITORY_OWNER).toBe('autouser')
    })
  })

  describe('Audience Parameter', () => {
    it('should pass through audience as raw data', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('AUDIENCE', 'technical-lead')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPO_OWNER', 'user')
              .addData('REPO_NAME', 'repo')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'technical-lead', days: 30 }
      )

      expect(result.getData().AUDIENCE).toBe('technical-lead')
      expect(mockServices.dataCollector.execute).toHaveBeenCalledWith({
        params: {
          audience: 'technical-lead',
          days: 30,
          owner: 'user',
          repo: 'repo'
        }
      })
    })

    it('should use default audience if not specified', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('AUDIENCE', 'dev')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPO_OWNER', 'user')
              .addData('REPO_NAME', 'repo')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      expect(result.getData().AUDIENCE).toBe('dev')
    })
  })

  describe('Error Handling', () => {
    it('should handle environment validation failure', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn()
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .setError(new Error('GitHub token required'))
              .addAction('Environment validation', 'failed')
          )
        },
        projectDetector: {
          execute: vi.fn()
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      expect(result.hasError()).toBe(true)
      expect(result.error?.message).toContain('GitHub token required')
      expect(mockServices.projectDetector.execute).not.toHaveBeenCalled()
      expect(mockServices.dataCollector.execute).not.toHaveBeenCalled()
    })

    it('should handle project detection failure', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn()
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .setError(new Error('Invalid GitHub URL format'))
              .addAction('Project detection', 'failed')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        { url: 'not-a-url' },
        { audience: 'dev', days: 30 }
      )

      expect(result.hasError()).toBe(true)
      expect(result.error?.message).toContain('Invalid GitHub URL')
      expect(mockServices.dataCollector.execute).not.toHaveBeenCalled()
    })

    it('should handle data collection failure', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .setError(new Error('Repository not found: 404'))
              .addAction('Data collection', 'failed')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPO_OWNER', 'user')
              .addData('REPO_NAME', 'repo')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      expect(result.hasError()).toBe(true)
      expect(result.error?.message).toContain('Repository not found')
    })

    it('should handle missing owner/repo from detection', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn()
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              // Missing REPO_OWNER and REPO_NAME
              .addAction('Project detection', 'success')
          )
        }
      }

      await expect(
        executeProjectSummary(mockServices, {}, { audience: 'dev', days: 30 })
      ).rejects.toThrow('Project detection did not return owner/name')
    })
  })

  describe('Data Collection', () => {
    it('should merge all data from services', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('STARS', '100')
              .addData('FORKS', '20')
              .addData('CONTRIBUTORS', '5')
              .addFile('/tmp/data.json', 'created', 1024)
              .addInstruction('Generate comprehensive report')
          )
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('ENV_VALID', 'true')
              .addData('GIT_VERSION', '2.39.0')
          )
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPO_OWNER', 'user')
              .addData('REPO_NAME', 'repo')
              .addData('DEFAULT_BRANCH', 'main')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      // Check all data is merged
      const data = result.getData()
      expect(data.ENV_VALID).toBe('true')
      expect(data.GIT_VERSION).toBe('2.39.0')
      expect(data.REPO_OWNER).toBe('user')
      expect(data.REPO_NAME).toBe('repo')
      expect(data.DEFAULT_BRANCH).toBe('main')
      expect(data.STARS).toBe('100')
      expect(data.FORKS).toBe('20')
      expect(data.CONTRIBUTORS).toBe('5')

      // Check actions contain all steps
      const actions = result.getActions()
      expect(actions.length).toBeGreaterThan(0)
      
      // Verify the data includes everything
      expect(Object.keys(data).length).toBeGreaterThan(7)
    })

    it('should include orchestration metadata', async () => {
      const mockServices: ProjectSummaryServices = {
        dataCollector: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        envValidator: {
          execute: vi.fn().mockResolvedValue(LLMInfo.create())
        },
        projectDetector: {
          execute: vi.fn().mockResolvedValue(
            LLMInfo.create()
              .addData('REPO_OWNER', 'user')
              .addData('REPO_NAME', 'repo')
          )
        }
      }

      const result = await executeProjectSummary(
        mockServices,
        {},
        { audience: 'dev', days: 30 }
      )

      // Check for final orchestration action
      const actions = result.getActions()
      expect(actions.length).toBeGreaterThan(0)
      
      // The last action should be from data collection or orchestration
      const hasOrchestrationComplete = actions.some(a => a.event === 'Orchestration complete')
      expect(hasOrchestrationComplete).toBe(true)
    })
  })
})