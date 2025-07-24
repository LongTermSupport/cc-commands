/**
 * @file Integration test suite for g:gh:project:summary command
 * 
 * Tests the full command execution using test doubles to avoid real API calls.
 * This tests CLI argument parsing, command execution flow, and output formatting.
 * 
 * For real API tests against the cc-commands repository, see summary.real-integration.test.ts
 * 
 * NOTE: Due to @oclif/test limitations, stdout/stderr are not captured properly.
 * These tests can only verify that commands execute without errors.
 */

import { runCommand } from '@oclif/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LLMInfo } from '../../../../../src/types/LLMInfo'
import { TestServiceFactory } from '../../../../factories/TestServiceFactory'

describe('g:gh:project:summary integration with test doubles', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env['GITHUB_TOKEN']
    // Enable test mode for subprocess
    process.env['TEST_MODE'] = 'true'
  })

  afterEach(() => {
    delete process.env['TEST_MODE']
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
      
      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      // Due to @oclif/test limitations, we can only verify no error occurred
      expect(error).toBeUndefined()
    })

    it('should handle manual mode with owner/repo flags', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        inputMode: 'manual',
        owner: 'manualuser',
        repo: 'manualrepo'
      })

      const { error } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'manualuser',
        '--repo',
        'manualrepo',
      ])

      expect(error).toBeUndefined()
    })

    it('should handle auto mode from current directory', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        inputMode: 'auto',
        owner: 'autouser',
        repo: 'autorepo'
      })

      const { error } = await runCommand(['g:gh:project:summary'])

      expect(error).toBeUndefined()
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

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
        '--audience',
        'technical-lead',
      ])

      expect(error).toBeUndefined()
    })

    it('should use default audience if not specified', async () => {
      const { error } = await runCommand(['g:gh:project:summary'])
      expect(error).toBeUndefined()
    })
  })

  describe('GitHub Authentication', () => {
    it('should use provided token', async () => {
      // Since we're in subprocess, we can't capture the token directly
      // Just verify the command runs without error
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--token',
        'ghp_test123',
      ])

      expect(error).toBeUndefined()
    })

    it('should use GITHUB_TOKEN environment variable', async () => {
      process.env['GITHUB_TOKEN'] = 'ghp_env123'
      
      const { error } = await runCommand(['g:gh:project:summary'])
      
      // Command should succeed with env token
      expect(error).toBeUndefined()
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

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error).toBeUndefined()
    })
  })

  describe('Data Collection', () => {
    it('should collect and format all project data', async () => {
      // Use the default comprehensive response from TestDataCollector
      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error).toBeUndefined()
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

      expect(error).toBeDefined()
      expect(error?.message).toContain('Invalid GitHub URL')
    })

    it('should handle missing repo flag when owner is provided', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'testuser',
        // Missing --repo flag
      ])

      expect(error).toBeDefined()
      expect(error?.message).toContain('--repo')
    })

    it('should handle auto-detection failure', async () => {
      const testServices = TestServiceFactory.createProjectSummaryServices()
      
      testServices.projectDetector.setDetectionResult({
        error: 'Not in a git repository'
      })

      const { error } = await runCommand(['g:gh:project:summary'])

      expect(error).toBeDefined()
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

      expect(error).toBeDefined()
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

      expect(error).toBeDefined()
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

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error).toBeUndefined()
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

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error).toBeUndefined()
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

      const { error } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/testuser/testrepo',
      ])

      expect(error).toBeUndefined()
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

      expect(error).toBeDefined()
      expect(error?.message).toContain('must also be provided')
    })

    it('should handle days flag', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--days',
        '60',
      ])

      expect(error).toBeUndefined()
    })
  })
})