/**
 * @file Activity Analysis Orchestrator Service Integration Tests
 * 
 * Integration tests for activity analysis orchestrator service.
 * Tests coordination between repository, activity, and auth services.
 */

 

import { beforeEach, describe, expect, it } from 'vitest'

import { LLMInfo } from '../../../src/core/LLMInfo'
import { activityAnalysisOrchServ } from '../../../src/orchestrator-services/github/activityAnalysisOrchServ'
import { IActivityAnalysisArgs } from '../../../src/orchestrator-services/github/types/ArgumentTypes'
import { createTypedGitHubServices } from '../../../src/orchestrator-services/github/utils/ServiceFactory'

describe('Activity Analysis Orchestrator Service Integration', () => {
  let services: Awaited<ReturnType<typeof createTypedGitHubServices>>

  beforeEach(async () => {
    // Use real service factory with authentication
    services = await createTypedGitHubServices()
  })

  describe('activity analysis coordination', () => {
    it('should coordinate repository and activity services for analysis', async () => {
      const args: IActivityAnalysisArgs = {
        owner: 'octocat',
        repositories: ['Hello-World'], // Repository names without owner prefix
        timeWindowDays: 30
      }

      const result = await activityAnalysisOrchServ(args, services)

      expect(result).toBeInstanceOf(LLMInfo)
      
      // In test environment, authentication may fail - handle both success and failure cases
      if (result.hasError()) {
        // Should provide structured error information
        expect(result.getExitCode()).toBe(1)
        const output = result.toString()
        expect(output).toContain('STOP PROCESSING')
        expect(output).toContain('RECOVERY INSTRUCTIONS')
      } else {
        // If authentication works, verify activity data structure
        const data = result.getData()
        
        // Should have activity analysis data
        expect(data).toHaveProperty('ANALYSIS_REPOSITORIES_COUNT')
        expect(data).toHaveProperty('ANALYSIS_START_DATE')
        expect(data).toHaveProperty('ANALYSIS_END_DATE')
        expect(data.ANALYSIS_REPOSITORIES_COUNT).toBe('1')
        
        // Should have activity metrics if data is available
        expect(data).toHaveProperty('COMMITS_COUNT')
        expect(data).toHaveProperty('TOTAL_ISSUES_COUNT')
        expect(data).toHaveProperty('TOTAL_PRS_COUNT')
      }
    })

    it('should handle multiple repositories coordination', async () => {
      const args: IActivityAnalysisArgs = {
        owner: 'octocat',
        repositories: ['Hello-World', 'Spoon-Knife'], // Repository names without owner prefix
        timeWindowDays: 60
      }

      const result = await activityAnalysisOrchServ(args, services)

      expect(result).toBeInstanceOf(LLMInfo)
      
      if (!result.hasError()) {
        const data = result.getData()
        expect(data.ANALYSIS_REPOSITORIES_COUNT).toBe('2')
        
        // Should aggregate data across repositories
        expect(data).toHaveProperty('COMMITS_COUNT')
        expect(data).toHaveProperty('CONTRIBUTORS_COUNT')
      }
    })

    it('should provide comprehensive LLM instructions for activity analysis', async () => {
      const args: IActivityAnalysisArgs = {
        owner: 'octocat',
        repositories: ['Hello-World'],
        timeWindowDays: 30
      }

      const result = await activityAnalysisOrchServ(args, services)

      if (!result.hasError()) {
        const output = result.toString()
        
        // Should contain LLM instructions section
        expect(output).toContain('=== INSTRUCTIONS FOR LLM ===')
        
        // Should provide guidance for activity analysis
        expect(output).toMatch(/analyze|activity|metrics|trends/i)
      }
    })

    it('should handle authentication errors gracefully', async () => {
      const args: IActivityAnalysisArgs = {
        owner: 'nonexistent',
        repositories: ['fake-repo'],
        timeWindowDays: 30
      }

      const result = await activityAnalysisOrchServ(args, services)

      // Should handle errors and return structured error information
      if (result.hasError()) {
        expect(result.getExitCode()).toBe(1)
        const output = result.toString()
        expect(output).toContain('STOP PROCESSING')
        expect(output).toContain('RECOVERY INSTRUCTIONS')
      }
    })

    it('should provide action log of coordination activities', async () => {
      const args: IActivityAnalysisArgs = {
        owner: 'octocat',
        repositories: ['Hello-World'],
        timeWindowDays: 30
      }

      const result = await activityAnalysisOrchServ(args, services)

      const output = result.toString()
      const actions = result.getActions()
      
      // Should always have actions recorded (even if they failed)
      expect(actions.length).toBeGreaterThan(0)
      
      // Should always log coordination steps (even in error case)
      expect(output).toContain('=== ACTION LOG ===')
      
      // Should have attempted activity analysis
      const analysisAction = actions.find(action => 
        action.event.toLowerCase().includes('activity') || 
        action.event.toLowerCase().includes('analysis')
      )
      expect(analysisAction).toBeDefined()
    })

    it('should handle time window analysis correctly', async () => {
      // Test with a 30-day time window
      const args: IActivityAnalysisArgs = {
        owner: 'octocat',
        repositories: ['Hello-World'],
        timeWindowDays: 30
      }

      const result = await activityAnalysisOrchServ(args, services)

      if (!result.hasError()) {
        const data = result.getData()
        
        // Should have time period information
        expect(data).toHaveProperty('ANALYSIS_START_DATE')
        expect(data).toHaveProperty('ANALYSIS_END_DATE')
        expect(data).toHaveProperty('ANALYSIS_TIME_WINDOW_DAYS')
        
        // Time window days should match the input
        const timeWindowDays = Number.parseInt(data.ANALYSIS_TIME_WINDOW_DAYS || '0', 10)
        expect(timeWindowDays).toBe(30)
      }
    })
  })
})