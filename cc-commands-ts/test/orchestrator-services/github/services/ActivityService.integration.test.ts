/**
 * @file Activity Service Integration Test
 * 
 * Tests the ActivityService against real GitHub repositories.
 * Focuses on aggregating activity across multiple repositories with some failing.
 */

import { describe, expect, it } from 'vitest'

import { ActivityService } from '../../../../src/orchestrator-services/github/services/ActivityService.js'
import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubRestApiService } from '../../../../src/orchestrator-services/github/services/GitHubRestApiService.js'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService.js'

describe('ActivityService Integration', () => {
  let activityService: ActivityService
  let repositoryService: RepositoryService
  let restApiService: GitHubRestApiService
  let authService: AuthService

  beforeEach(async () => {
    authService = new AuthService()
    const token = await authService.getGitHubToken()
    restApiService = new GitHubRestApiService(token)
    repositoryService = new RepositoryService(restApiService)
    activityService = new ActivityService(repositoryService)
  })

  it('should aggregate activity across accessible repositories', async () => {
    const owner = 'LongTermSupport'
    const repositories = ['LongTermSupport/cc-commands']
    const timeWindowDays = 30
    
    console.log(`Testing activity aggregation: ${repositories.join(', ')}`)
    
    // This should work for accessible repositories
    const since = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
    const activity = await activityService.aggregateActivityAcrossRepos(repositories, owner, since)
    
    expect(activity).toBeDefined()
    expect(activity.repositoriesCount).toBe(1)
    expect(activity.repositoryList).toContain('LongTermSupport/cc-commands')
    expect(activity.analysisPeriodDays).toBeGreaterThanOrEqual(timeWindowDays - 1)
    expect(activity.analysisPeriodDays).toBeLessThanOrEqual(timeWindowDays + 1)
    
    // Should have some activity data
    expect(activity.commitsCount).toBeGreaterThanOrEqual(0)
    expect(activity.totalIssuesCount).toBeGreaterThanOrEqual(0)
    expect(activity.totalPrsCount).toBeGreaterThanOrEqual(0)
    
    console.log(`✓ Activity aggregated successfully`)
    console.log(`✓ Repositories: ${activity.repositoriesCount}`)
    console.log(`✓ Commits: ${activity.commitsCount}`)
    console.log(`✓ Issues: ${activity.totalIssuesCount}`)
    console.log(`✓ Pull Requests: ${activity.totalPrsCount}`)
  })

  it('should handle mixed accessible and inaccessible repositories gracefully', async () => {
    const owner = 'LongTermSupport'  // Use consistent owner
    const repositories = [
      'LongTermSupport/cc-commands',    // Should work
      'actions/vscode-github-actions',  // Likely 404 - wrong owner but should be handled gracefully
      'definitely-not-real/fake-repo'  // Definitely 404
    ]
    const timeWindowDays = 7
    
    console.log(`Testing mixed repository aggregation: ${repositories.join(', ')}`)
    
    // Should succeed by aggregating only the accessible repositories
    const since = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
    const activity = await activityService.aggregateActivityAcrossRepos(repositories, owner, since)
    
    // Should have aggregated data from at least the accessible repository
    expect(activity).toBeDefined()
    expect(activity.repositoriesCount).toBeGreaterThan(0)  // At least LongTermSupport/cc-commands should work
    expect(activity.repositoryList).toContain('LongTermSupport/cc-commands')
    
    // Should have reasonable data from the working repository
    expect(activity.commitsCount).toBeGreaterThanOrEqual(0)
    expect(activity.totalIssuesCount).toBeGreaterThanOrEqual(0)
    
    console.log(`✓ Mixed aggregation succeeded`)
    console.log(`✓ Successfully processed repositories: ${activity.repositoriesCount}`)
    console.log(`✓ Repository list: ${activity.repositoryList.join(', ')}`)
    console.log(`✓ Commits: ${activity.commitsCount}, Issues: ${activity.totalIssuesCount}`)
  })

  it('should handle case where all repositories are inaccessible', async () => {
    const owner = 'definitely-not-real'
    const repositories = [
      'definitely-not-real/fake-repo-1',
      'definitely-not-real/fake-repo-2',
      'actions/vscode-github-actions'  // Also likely inaccessible
    ]
    const timeWindowDays = 7
    
    console.log(`Testing all-inaccessible repository aggregation: ${repositories.join(', ')}`)
    
    try {
      const since = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
      const activity = await activityService.aggregateActivityAcrossRepos(repositories, owner, since)
      
      // If it somehow succeeds, should have zero data
      expect(activity.repositoriesCount).toBe(0)
      expect(activity.commitsCount).toBe(0)
      console.log(`✓ All-inaccessible aggregation returned empty results`)
      
    } catch (error) {
      // Should fail gracefully with meaningful error
      expect(error).toBeDefined()
      expect(error.message).toContain('Repository not found')
      
      console.log(`✓ All-inaccessible aggregation failed gracefully: ${error.message}`)
    }
  })

  it('should aggregate activity statistics correctly', async () => {
    const owner = 'LongTermSupport'
    const repositories = ['LongTermSupport/cc-commands']
    const timeWindowDays = 30
    
    console.log(`Testing activity statistics calculation`)
    
    const since = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
    const activity = await activityService.aggregateActivityAcrossRepos(repositories, owner, since)
    
    // Verify statistical calculations
    expect(activity.avgCommitsPerDay).toBeGreaterThanOrEqual(0)
    expect(activity.avgIssuesPerDay).toBeGreaterThanOrEqual(0)
    expect(activity.avgPrsPerDay).toBeGreaterThanOrEqual(0)
    
    // Daily averages should be reasonable
    if (activity.commitsCount > 0) {
      expect(activity.avgCommitsPerDay).toBeLessThanOrEqual(activity.commitsCount)
    }
    
    // Period should match request
    expect(activity.analysisPeriodDays).toBeGreaterThanOrEqual(timeWindowDays - 1)
    expect(activity.analysisPeriodDays).toBeLessThanOrEqual(timeWindowDays + 1)
    
    console.log(`✓ Statistics calculated correctly`)
    console.log(`✓ Avg commits/day: ${activity.avgCommitsPerDay.toFixed(2)}`)
    console.log(`✓ Avg issues/day: ${activity.avgIssuesPerDay.toFixed(2)}`)
    console.log(`✓ Avg PRs/day: ${activity.avgPrsPerDay.toFixed(2)}`)
  })
})