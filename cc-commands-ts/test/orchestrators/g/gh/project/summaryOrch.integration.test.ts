/**
 * @file Summary Orchestrator Integration Test
 * 
 * Tests the full orchestrator flow with real GitHub API calls.
 * Focuses on project ID extraction and data flow between services.
 */

import { describe, expect, it } from 'vitest'

import { ISummaryOrchestratorArgs } from '../../../../../src/orchestrator-services/github/types/ArgumentTypes.js'
import { createTypedGitHubServices } from '../../../../../src/orchestrator-services/github/utils/ServiceFactory.js'
import { summaryOrch } from '../../../../../src/orchestrators/g/gh/project/summaryOrch.js'

describe('Summary Orchestrator Integration', () => {

  it('should extract PROJECT_V2_ID from detection result', async () => {
    // Use GitHub organization which we know has Projects v2
    const args: ISummaryOrchestratorArgs = {
      format: 'technical',
      projectArgs: {
        input: 'github',
        mode: 'owner'
      },
      timeWindowDays: 30
    }

    const services = await createTypedGitHubServices()
    
    // This should complete project detection phase successfully
    const result = await summaryOrch(args, services)
    
    // Debug: output the actual result to see what's failing
    if (result.hasError()) {
      console.log('=== ORCHESTRATOR ERROR OUTPUT ===')
      console.log(result.toString())
      console.log('=== END ERROR OUTPUT ===')
    }
    
    expect(result.hasError()).toBe(false)
    expect(result.getExitCode()).toBe(0)
    
    const data = result.getData()
    
    // Should have successfully detected and selected a project
    expect(data.PROJECT_OWNER).toBe('github')
    expect(data.PROJECTS_FOUND).toMatch(/\d+/)
    expect(data.SELECTED_PROJECT).toBeDefined()
    
    // Should have extracted a valid project ID (V2 format)
    expect(data.PROJECT_V2_ID).toMatch(/^PVT_[A-Za-z0-9_]+$/)
    
    console.log(`✓ Project detected: ${data.SELECTED_PROJECT}`)
    console.log(`✓ Project ID extracted: ${data.PROJECT_V2_ID}`)
    console.log(`✓ Projects found: ${data.PROJECTS_FOUND}`)
  })

  it('should handle project detection phase correctly', async () => {
    const args: ISummaryOrchestratorArgs = {
      format: 'executive',
      projectArgs: {
        input: 'github',
        mode: 'owner'  
      },
      timeWindowDays: 7
    }

    const services = await createTypedGitHubServices()
    
    const result = await summaryOrch(args, services)
    
    // Debug: output the actual result to see what's failing
    if (result.hasError()) {
      console.log('=== ORCHESTRATOR ERROR OUTPUT (test 2) ===')
      console.log(result.toString())
      console.log('=== END ERROR OUTPUT ===')
    }
    
    // Should not fail on project ID extraction
    expect(result.hasError()).toBe(false)
    
    const data = result.getData()
    
    // Verify the orchestrator phases completed
    expect(data.DETECTION_MODE).toBe('owner')
    expect(data.INPUT_ARGS).toBe('github')
    expect(data.AUTHENTICATED_USER).toBeDefined()
    
    console.log(`✓ Authentication: ${data.AUTHENTICATED_USER}`)
    console.log(`✓ Detection mode: ${data.DETECTION_MODE}`)
  })

  it('should fail gracefully for non-existent organization', async () => {
    const args: ISummaryOrchestratorArgs = {
      format: 'technical',
      projectArgs: {
        input: 'definitely-not-a-real-org-123456',
        mode: 'owner'
      },
      timeWindowDays: 30
    }

    const services = await createTypedGitHubServices()
    
    const result = await summaryOrch(args, services)
    
    // Should fail gracefully
    expect(result.hasError()).toBe(true)
    expect(result.getExitCode()).toBe(1)
    
    console.log('✓ Graceful failure for non-existent org')
  })
})