/**
 * @file E2E tests for GitHub Projects v2 functionality with REAL API calls
 * 
 * These tests verify the multi-step workflow for discovering and analyzing
 * GitHub Projects v2 with multiple repositories using actual GitHub API.
 * 
 * NOTE: These tests require a valid GitHub token and make real API calls.
 * They may be skipped in CI to avoid rate limits.
 */

import { runCommand } from '@oclif/test'
import { describe, expect, it } from 'vitest'

// Skip these tests in CI to avoid rate limits
const skipInCI = process.env['CI'] ? it.skip : it

describe('g:gh:project:summary E2E with real GitHub API', () => {
  describe('Detect Mode with Real Organizations', () => {
    skipInCI('should detect projects for the facebook organization', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        '--org',
        'facebook'
      ])
      
      expect(error).toBeUndefined()
      
      // Should show detect mode was used
      expect(stdout).toContain('MODE=detect')
      expect(stdout).toContain('ORGANIZATION=facebook')
      
      // Should find actual Facebook projects (may vary)
      expect(stdout).toContain('PROJECT_COUNT=')
      
      // If projects exist, should have project info
      if (stdout.includes('PROJECT_COUNT=0')) {
        expect(stdout).toContain('No GitHub Projects found')
      } else {
        expect(stdout).toContain('MOST_RECENT_PROJECT_ID=')
        expect(stdout).toContain('Found')
        expect(stdout).toContain('GitHub Projects for facebook')
      }
    })
    
    skipInCI('should auto-detect organization from React repo URL', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        'https://github.com/facebook/react'
      ])
      
      expect(error).toBeUndefined()
      
      // Should detect facebook organization from URL
      expect(stdout).toContain('REPO_OWNER=facebook')
      expect(stdout).toContain('MODE=detect')
      expect(stdout).toContain('ORGANIZATION=facebook')
    })
    
    skipInCI('should detect projects for vercel organization', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        '--org',
        'vercel'
      ])
      
      expect(error).toBeUndefined()
      
      expect(stdout).toContain('MODE=detect')
      expect(stdout).toContain('ORGANIZATION=vercel')
      expect(stdout).toContain('PROJECT_COUNT=')
    })
  })
  
  describe('Error Handling with Real API', () => {
    skipInCI('should handle non-existent organization gracefully', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        '--org',
        'this-org-definitely-does-not-exist-12345'
      ])
      
      // Should complete but find no projects
      expect(error).toBeUndefined()
      expect(stdout).toContain('PROJECT_COUNT=0')
      expect(stdout).toContain('No GitHub Projects found')
    })
    
    skipInCI('should handle rate limiting gracefully', async () => {
      // This is hard to test reliably without hitting actual rate limits
      // Just verify the command handles API responses properly
      const { error } = await runCommand([
        'g:gh:project:summary',
        '--org',
        'github'  // Large org that might trigger rate limits
      ])
      
      // Should either succeed or fail with proper error
      if (error) {
        expect(error.message).toMatch(/rate limit|API rate limit/i)
      }
    })
  })
  
  describe('Collect Mode (if projects exist)', () => {
    skipInCI('should fail collect mode without project ID', async () => {
      const { error } = await runCommand([
        'g:gh:project:summary',
        'collect'
      ])
      
      expect(error).toBeDefined()
      expect(error?.message).toContain('Missing required projectId')
    })
    
    // Note: We can't test actual collect mode without knowing a valid project ID
    // This would require first running detect mode and parsing the output
  })
  
  describe('Auto-detection from Current Directory', () => {
    skipInCI('should detect organization from current git repository', async () => {
      // This test runs in the cc-commands-ts directory
      const { error, stdout } = await runCommand([
        'g:gh:project:summary'
      ])
      
      expect(error).toBeUndefined()
      
      // Should detect LongTermSupport organization
      expect(stdout).toContain('REPO_OWNER=LongTermSupport')
      expect(stdout).toContain('MODE=detect')
      expect(stdout).toContain('ORGANIZATION=LongTermSupport')
    })
  })
  
  describe('Full Workflow with Known Organization', () => {
    skipInCI('should complete detect workflow for microsoft organization', async () => {
      const { error, stdout } = await runCommand([
        'g:gh:project:summary',
        '--org',
        'microsoft'
      ])
      
      expect(error).toBeUndefined()
      
      // Microsoft likely has projects
      expect(stdout).toContain('MODE=detect')
      expect(stdout).toContain('ORGANIZATION=microsoft')
      expect(stdout).toContain('PROJECT_COUNT=')
      
      // Should provide instructions for next step
      expect(stdout).toContain('Show the user the list of GitHub Projects')
    })
  })
})