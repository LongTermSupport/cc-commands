/**
 * @file Integration test suite for g:gh:project:summary command
 * 
 * Tests the full command execution using test doubles to avoid real API calls.
 * This tests CLI argument parsing, command execution flow, and output formatting.
 * 
 * For real API tests against the cc-commands repository, see summary.real-integration.test.ts
 */

import { runCommand } from '@oclif/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ServiceFactory } from '../../../../../src/factories/ServiceFactory.js'
import { LLMInfo } from '../../../../../src/types/LLMInfo.js'
import { TestServiceFactory } from '../../../../factories/TestServiceFactory.js'

describe('g:gh:project:summary integration with test doubles', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env['GITHUB_TOKEN']
    
    // Mock ServiceFactory to use TestServiceFactory
    vi.spyOn(ServiceFactory, 'createProjectSummaryServices')
      .mockImplementation(() => TestServiceFactory.createProjectSummaryServices())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input Modes', () => {
    it('should handle URL mode correctly', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      // Configure test responses
      testServices.projectDetector.setDetectionResult({
        inputMode: 'url',
        owner: 'testuser',
        repo: 'testrepo'
      })
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addData('PRIMARY_LANGUAGE', 'TypeScript')
          .addData('DESCRIPTION', 'Test repository')
          .addData('AUDIENCE', 'dev')
          .addAction('Data collection', 'success')
      )
      
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('INPUT_MODE=url')
      expect(stdout).toContain('REPOSITORY_OWNER=testuser')
      expect(stdout).toContain('REPOSITORY_NAME=testrepo')
      expect(stdout).toContain('PRIMARY_LANGUAGE=TypeScript')
    })

    it('should handle manual mode with owner/repo flags', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        inputMode: 'manual',
        owner: 'manualuser',
        repo: 'manualrepo'
      })

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'manualuser',
        '--repo',
        'manualrepo',
      ])

      expect(stdout).toContain('INPUT_MODE=manual')
      expect(stdout).toContain('REPOSITORY_OWNER=manualuser')
      expect(stdout).toContain('REPOSITORY_NAME=manualrepo')
    })

    it('should handle auto mode from current directory', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        inputMode: 'auto',
        owner: 'autouser',
        repo: 'autorepo'
      })

      const { stdout } = await runCommand(['g:gh:project:summary'])

      expect(stdout).toContain('INPUT_MODE=auto')
      expect(stdout).toContain('REPOSITORY_OWNER=autouser')
      expect(stdout).toContain('REPOSITORY_NAME=autorepo')
    })
  })

  describe('Audience Parameter', () => {
    it('should pass through audience as raw data', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addData('AUDIENCE', 'technical-lead')
          .addAction('Data collection', 'success')
      )

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
        '--audience',
        'technical-lead',
      ])

      expect(stdout).toContain('AUDIENCE=technical-lead')
      // Should NOT contain any LLM instructions
      expect(stdout).not.toContain('Generate a')
    })

    it('should use default audience if not specified', async () => {
      const { stdout } = await runCommand(['g:gh:project:summary'])
      expect(stdout).toContain('AUDIENCE=dev')
    })
  })

  describe('GitHub Authentication', () => {
    it('should use provided token', async () => {
      let capturedToken: string | undefined
      
      // Restore original mock to capture token
      vi.restoreAllMocks()
      vi.spyOn(ServiceFactory, 'createProjectSummaryServices')
        .mockImplementation((token) => {
          capturedToken = token
          return TestServiceFactory.createProjectSummaryServices()
        })

      await runCommand([
        'g:gh:project:summary',
        '--token',
        'ghp_test123',
      ])

      expect(capturedToken).toBe('ghp_test123')
    })

    it('should use GITHUB_TOKEN environment variable', async () => {
      process.env['GITHUB_TOKEN'] = 'ghp_env123'
      
      const { stdout } = await runCommand(['g:gh:project:summary'])
      
      // Command should succeed with env token
      expect(stdout).toContain('ENV_VALID=true')
    })

    it('should work without authentication', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addInstruction('No GitHub token provided - rate limits may apply')
          .addAction('Data collection', 'success')
      )

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('No GitHub token provided')
    })
  })

  describe('Data Collection', () => {
    it('should collect and format all project data', async () => {
      // Use the default comprehensive response from TestDataCollector
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      // Verify repository information
      expect(stdout).toContain('REPOSITORY_NAME=testrepo')
      expect(stdout).toContain('REPOSITORY_OWNER=testuser')
      expect(stdout).toContain('PRIMARY_LANGUAGE=TypeScript')
      expect(stdout).toContain('TOPICS=test, mock')
      
      // Verify metrics
      expect(stdout).toContain('COMMIT_COUNT=100')
      expect(stdout).toContain('CONTRIBUTOR_COUNT=3')
      expect(stdout).toContain('STARS=50')
      
      // Verify release info
      expect(stdout).toContain('LATEST_RELEASE_VERSION=v1.0.0')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid URL format', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        error: 'Invalid GitHub URL format: not-a-github-url'
      })

      const { error } = await runCommand([
        'g:gh:project:summary',
        'not-a-github-url',
      ])

      expect(error?.message).toContain('Invalid GitHub URL')
    })

    it('should handle missing repo flag when owner is provided', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'testuser',
        // Missing --repo flag
      ])

      expect(error?.message).toContain('--repo')
    })

    it('should handle auto-detection failure', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        error: 'Not in a git repository'
      })

      const { error } = await runCommand(['g:gh:project:summary'])

      expect(error?.message).toContain('git repository')
    })

    it('should handle GitHub API errors', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.addResponse('testuser/testrepo',
        testServices.dataCollector.createErrorResponse('Repository not found: 404')
      )

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error?.message).toContain('Repository not found')
    })

    it('should handle rate limit errors', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.addResponse('testuser/testrepo',
        testServices.dataCollector.createErrorResponse('GitHub API rate limit exceeded')
      )

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error?.message).toContain('rate limit')
    })
  })

  describe('Edge Cases', () => {
    it('should handle repositories with no releases', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addData('LATEST_RELEASE_VERSION', 'No releases')
          .addData('LAST_RELEASE_DATE', 'No releases')
          .addData('RELEASE_COUNT', '0')
          .addAction('Data collection', 'success')
      )

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('LAST_RELEASE_DATE=No releases')
      expect(stdout).toContain('RELEASE_COUNT=0')
    })

    it('should handle repositories with no workflows', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addData('WORKFLOW_COUNT', '0')
          .addAction('Data collection', 'success')
      )

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('WORKFLOW_COUNT=0')
    })

    it('should handle repositories with no description', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.dataCollector.setDefaultResponse(
        LLMInfo.create()
          .addData('REPOSITORY_NAME', 'testrepo')
          .addData('REPOSITORY_OWNER', 'testuser')
          .addData('DESCRIPTION', 'No description')
          .addAction('Data collection', 'success')
      )

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('DESCRIPTION=No description')
    })
  })

  describe('CLI Argument Validation', () => {
    it('should require both owner and repo flags together', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'testuser',
        // Missing --repo
      ])

      expect(error?.message).toContain('must also be provided')
    })

    it('should handle days flag', async () => {
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--days',
        '60',
      ])

      expect(stdout).toContain('DAYS_ANALYZED=60')
    })
  })
})