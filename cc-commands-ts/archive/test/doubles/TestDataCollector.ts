/**
 * @file Test double for DataCollectionOrchestrationService
 * 
 * Implements IOrchestrationService for testing without real GitHub API calls.
 */

import type { IOrchestrationService, ServiceContext } from '../../src/interfaces/IOrchestrationService'

import { CommandError } from '../../src/errors/CommandError'
import { LLMInfo } from '../../src/types/LLMInfo'

/**
 * Test implementation of data collector
 */
export class TestDataCollector implements IOrchestrationService {
  private defaultResponse: LLMInfo | null = null
  private responses = new Map<string, LLMInfo>()
  
  /**
   * Add a canned response for a specific repository
   */
  addResponse(repoKey: string, response: LLMInfo): void {
    this.responses.set(repoKey, response)
  }
  
  /**
   * Helper to create error response
   */
  createErrorResponse(message: string): LLMInfo {
    const result = LLMInfo.create()
    result.setError(new CommandError(
      new Error(message),
      ['Check repository exists', 'Verify GitHub token is valid'],
      { source: 'TestDataCollector' }
    ))
    result.addAction('Data collection', 'failed', message)
    return result
  }
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const owner = context.params['owner'] as string
    const repo = context.params['repo'] as string
    const audience = (context.params['audience'] as string) || 'dev'
    const days = Number(context.params['days']) || 30
    
    const key = `${owner}/${repo}`
    
    // Check for specific response
    if (this.responses.has(key)) {
      return this.responses.get(key)!
    }
    
    // Use default if configured
    if (this.defaultResponse) {
      return this.defaultResponse
    }
    
    // Generate generic test data
    const result = LLMInfo.create()
    
    // Repository info
    result.addData('REPOSITORY_NAME', repo)
    result.addData('REPOSITORY_OWNER', owner)
    result.addData('PRIMARY_LANGUAGE', 'TypeScript')
    result.addData('DESCRIPTION', `Test repository ${repo}`)
    result.addData('LICENSE', 'MIT')
    result.addData('TOPICS', 'test, mock')
    result.addData('DEFAULT_BRANCH', 'main')
    result.addData('CREATED_AT', '2023-01-01')
    result.addData('UPDATED_AT', '2025-01-01')
    result.addData('IS_FORK', 'false')
    result.addData('IS_ARCHIVED', 'false')
    result.addData('VISIBILITY', 'public')
    
    // Activity metrics
    result.addData('COMMIT_COUNT', '100')
    result.addData('ISSUE_COUNT', '10')
    result.addData('PR_COUNT', '20')
    result.addData('RELEASE_COUNT', '5')
    result.addData('CONTRIBUTOR_COUNT', '3')
    result.addData('STARS', '50')
    result.addData('FORKS', '10')
    result.addData('WATCHERS', '25')
    result.addData('OPEN_ISSUES', '2')
    
    // Latest release
    result.addData('LATEST_RELEASE_VERSION', 'v1.0.0')
    result.addData('LATEST_RELEASE_DATE', '2025-01-01')
    result.addData('LATEST_RELEASE_NAME', 'Test Release')
    result.addData('LATEST_RELEASE_IS_PRERELEASE', 'false')
    
    // Contributors
    result.addData('TOP_CONTRIBUTORS', 'user1 (50), user2 (30), user3 (20)')
    
    // Other
    result.addData('AUDIENCE', audience)
    result.addData('DAYS_ANALYZED', String(days))
    
    // Add action
    result.addAction('Data collection', 'success', `Collected test data for ${owner}/${repo}`)
    
    // Add instructions
    result.addInstruction('Generate a project summary report using the collected data')
    result.addInstruction('Adapt the report style and detail level based on the AUDIENCE parameter')
    
    return result
  }
  
  /**
   * Clear all responses
   */
  reset(): void {
    this.responses.clear()
    this.defaultResponse = null
  }
  
  /**
   * Set default response for any repository
   */
  setDefaultResponse(response: LLMInfo): void {
    this.defaultResponse = response
  }
}