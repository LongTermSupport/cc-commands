/**
 * @file Repository Service Integration Test
 * 
 * Tests the RepositoryService against real GitHub repositories.
 * Focuses on repository access and activity analysis errors.
 */

import { describe, expect, it } from 'vitest'

import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubRestApiService } from '../../../../src/orchestrator-services/github/services/GitHubRestApiService.js'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService.js'

describe('RepositoryService Integration', () => {
  let repositoryService: RepositoryService
  let restApiService: GitHubRestApiService
  let authService: AuthService

  beforeEach(async () => {
    authService = new AuthService()
    const token = await authService.getGitHubToken()
    restApiService = new GitHubRestApiService(token)
    repositoryService = new RepositoryService(restApiService)
  })

  it('should get repository activity for accessible repository', async () => {
    // Test with LongTermSupport/cc-commands - a repository we know exists and have access to
    const owner = 'LongTermSupport'
    const repo = 'cc-commands'
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    console.log(`Testing repository access: ${owner}/${repo}`)
    
    // This should NOT fail with 404 errors
    const activity = await repositoryService.getRepositoryActivity(owner, repo, since)
    
    expect(activity).toBeDefined()
    expect(activity.repositoryList).toContain(`${owner}/${repo}`)
    expect(activity.analysisPeriodStart).toEqual(since)
    expect(activity.repositoriesCount).toBe(1)
    
    // Should have some activity data (even if zero)
    expect(activity.commitsCount).toBeGreaterThanOrEqual(0)
    expect(activity.totalIssuesCount).toBeGreaterThanOrEqual(0)
    expect(activity.totalPrsCount).toBeGreaterThanOrEqual(0)
    
    console.log(`✓ Repository activity retrieved for ${owner}/${repo}`)
    console.log(`✓ Commits: ${activity.commitsCount}`)
    console.log(`✓ Issues: ${activity.totalIssuesCount}`)
    console.log(`✓ Pull Requests: ${activity.totalPrsCount}`)
  })

  it('should handle private/non-existent repository gracefully', async () => {
    // Test with a repository that likely doesn't exist or is private
    const owner = 'actions'
    const repo = 'vscode-github-actions'
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    console.log(`Testing private/non-existent repository: ${owner}/${repo}`)
    
    try {
      const activity = await repositoryService.getRepositoryActivity(owner, repo, since)
      
      // If it succeeds, it should return valid data
      expect(activity).toBeDefined()
      console.log(`✓ Repository ${owner}/${repo} is accessible`)
      
    } catch (error) {
      // Should handle 404 errors gracefully with meaningful error messages
      expect(error.message).toContain('Repository not found or access denied')
      expect(error.message).toContain(`${owner}/${repo}`)
      
      console.log(`✓ Repository ${owner}/${repo} is not accessible (404) - handled gracefully`)
      console.log(`✓ Error message: ${error.message}`)
    }
  })

  it('should handle repository access errors in activity aggregation', async () => {
    // Test with a mix of accessible and inaccessible repositories
    const repositories = [
      'LongTermSupport/cc-commands',  // Should work
      'actions/vscode-github-actions', // Likely 404
      'definitely-not-real/fake-repo'  // Definitely 404
    ]
    
    console.log(`Testing mixed repository access: ${repositories.join(', ')}`)
    
    const results = []
    const errors = []
    
    // Use Promise.allSettled to avoid await-in-loop ESLint error
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    const promises = repositories.map(async (repo) => {
      const [owner, repoName] = repo.split('/')
      try {
        const activity = await repositoryService.getRepositoryActivity(owner, repoName, since)
        console.log(`✓ ${repo} - SUCCESS`)
        return { activity, repo, type: 'success' as const }
      } catch (error) {
        console.log(`✗ ${repo} - ERROR: ${error.message}`)
        return { error, repo, type: 'error' as const }
      }
    })
    
    const allResults = await Promise.allSettled(promises)
    
    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        if (result.value.type === 'success') {
          results.push({ activity: result.value.activity, repo: result.value.repo })
        } else {
          errors.push({ error: result.value.error, repo: result.value.repo })
        }
      }
    }
    
    // Should have at least one success (LongTermSupport/cc-commands)
    expect(results.length).toBeGreaterThan(0)
    
    // Should handle errors gracefully (not crash the entire process)
    expect(errors.length).toBeGreaterThan(0)
    
    console.log(`✓ Mixed repository test completed: ${results.length} successes, ${errors.length} errors`)
  })

  it('should validate repository names before API calls', async () => {
    // Test with invalid repository format
    const invalidRepos = [
      { owner: '', repo: 'test' },
      { owner: 'test', repo: '' },
      { owner: 'test/invalid', repo: 'repo' },
      { owner: 'test', repo: 'repo/invalid' }
    ]
    
    // Use Promise.allSettled to avoid await-in-loop ESLint error
    const promises = invalidRepos.map(async ({ owner, repo }) => {
      console.log(`Testing invalid repository format: "${owner}/${repo}"`)
      
      try {
        await repositoryService.getRepositoryActivity(owner, repo, new Date())
        // Should not reach here for invalid formats
        return { owner, repo, success: true }
      } catch (error) {
        // Should catch validation errors
        console.log(`✓ Invalid format "${owner}/${repo}" rejected: ${error.message}`)
        return { error, owner, repo, success: false }
      }
    })
    
    const results = await Promise.allSettled(promises)
    
    // All should fail validation
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          // Force failure - invalid formats should be rejected
          expect(true).toBe(false)
        } else {
          // Correct - validation error caught
          expect(result.value.error).toBeDefined()
        }
      }
    }
  })
})