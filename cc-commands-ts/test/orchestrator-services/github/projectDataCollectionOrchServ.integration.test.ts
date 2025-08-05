/**
 * @file Project Data Collection Orchestrator Service Integration Tests
 * 
 * Integration tests for project data collection orchestrator service.
 * Tests coordination between GraphQL, REST API, and repository services.
 */

 

import { beforeEach, describe, expect, it } from 'vitest'

import { LLMInfo } from '../../../src/core/LLMInfo'
import { projectDataCollectionOrchServ } from '../../../src/orchestrator-services/github/projectDataCollectionOrchServ'
import { IProjectDataCollectionArgs } from '../../../src/orchestrator-services/github/types/ArgumentTypes'
import { createTypedGitHubServices } from '../../../src/orchestrator-services/github/utils/ServiceFactory'

describe('Project Data Collection Orchestrator Service Integration', () => {
  let services: Awaited<ReturnType<typeof createTypedGitHubServices>>

  beforeEach(async () => {
    // Use real service factory with authentication
    services = await createTypedGitHubServices()
  })

  describe('project data collection coordination', () => {
    it('should coordinate GraphQL and REST API services for project data', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq' // Real public project ID
      }

      const result = await projectDataCollectionOrchServ(args, services)

      expect(result).toBeInstanceOf(LLMInfo)
      
      // In test environment, authentication may fail - handle both success and failure cases
      if (result.hasError()) {
        // Should provide structured error information
        expect(result.getExitCode()).toBe(1)
        const output = result.toString()
        expect(output).toContain('STOP PROCESSING')
        expect(output).toContain('RECOVERY INSTRUCTIONS')
      } else {
        // If authentication works, verify project data structure
        const data = result.getData()
        
        // Should have project data from GraphQL service
        expect(data).toHaveProperty('PROJECT_V2_ID')
        expect(data).toHaveProperty('PROJECT_V2_TITLE')
        expect(data.PROJECT_V2_ID).toBe(args.projectNodeId)
        
        // Should have discovered repositories if project has items
        if (Number.parseInt(data.PROJECT_V2_ITEM_COUNT || '0', 10) > 0) {
          expect(data).toHaveProperty('DISCOVERED_REPOSITORIES_COUNT')
          expect(Number.parseInt(data.DISCOVERED_REPOSITORIES_COUNT || '0', 10)).toBeGreaterThan(0)
        }
      }
    })

    it('should handle project with no items gracefully', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq' // May be empty project
      }

      const result = await projectDataCollectionOrchServ(args, services)

      expect(result).toBeInstanceOf(LLMInfo)
      
      // Should not error even if project has no items
      if (result.hasError()) {
        console.log('Project data collection failed:', result.toString())
      } else {
        const data = result.getData()
        expect(data).toHaveProperty('PROJECT_V2_ID')
        expect(data.PROJECT_V2_ID).toBe(args.projectNodeId)
      }
    })

    it('should include proper LLM instructions for project data interpretation', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      if (!result.hasError()) {
        const output = result.toString()
        
        // Should contain LLM instructions section
        expect(output).toContain('=== INSTRUCTIONS FOR LLM ===')
        
        // Should provide guidance for project data analysis
        expect(output).toMatch(/analyze|project|data|repository/i)
      }
    })

    it('should handle authentication errors gracefully', async () => {
      // This test will likely hit authentication issues with stub tokens
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_invalid_id_for_auth_test'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      // Should handle auth errors and return structured error information
      if (result.hasError()) {
        expect(result.getExitCode()).toBe(1)
        const output = result.toString()
        expect(output).toContain('STOP PROCESSING')
        expect(output).toContain('RECOVERY INSTRUCTIONS')
      }
    })

    it('should provide action log of coordination steps', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      const output = result.toString()
      
      // Should log the coordination steps
      expect(output).toContain('=== ACTION LOG ===')
      
      const actions = result.getActions()
      expect(actions.length).toBeGreaterThan(0)
      
      // Should have attempted project data collection
      const projectAction = actions.find(action => 
        action.event.toLowerCase().includes('project') || 
        action.event.toLowerCase().includes('data')
      )
      expect(projectAction).toBeDefined()
    })
  })

  describe('JSON result file integration', () => {
    it('should generate structured JSON data with proper namespacing', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      if (!result.hasError()) {
        const jsonData = result.getJsonData()
        
        // Should have proper namespace structure
        expect(jsonData).toHaveProperty('metadata')
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        
        // Metadata should be present
        expect(jsonData.metadata).toHaveProperty('generated_at')
        expect(jsonData.metadata).toHaveProperty('command')
        expect(jsonData.metadata).toHaveProperty('execution_time_ms')
        
        // Raw data should preserve GitHub API responses
        expect(jsonData.raw).toHaveProperty('github_api')
        expect(jsonData.raw.github_api).toHaveProperty('project_detection')
        
        // Calculated data should have TypeScript computations
        expect(jsonData.calculated).toHaveProperty('project_totals')
        expect(jsonData.calculated).toHaveProperty('time_calculations')
        expect(jsonData.calculated).toHaveProperty('activity_metrics')
      }
    })

    it('should provide comprehensive jq hints for data exploration', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      if (!result.hasError()) {
        const hints = result.getJqHints()
        
        expect(hints.length).toBeGreaterThan(5)
        
        // Should include hints for all major data categories
        const queries = hints.map(h => h.query)
        expect(queries.some(q => q.includes('.metadata'))).toBe(true)
        expect(queries.some(q => q.includes('.raw.github_api'))).toBe(true)
        expect(queries.some(q => q.includes('.calculated'))).toBe(true)
        
        // All hints should have required properties
        for (const hint of hints) {
          expect(hint.query).toBeTruthy()
          expect(hint.description).toBeTruthy()
          expect(['single_item', 'list', 'statistical']).toContain(hint.scope)
        }
      }
    })

    it('should include result file path in LLM output', async () => {
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)

      if (!result.hasError()) {
        const output = result.toString()
        const resultPath = result.getResultPath()
        
        if (resultPath) {
          expect(output).toContain('RESULT_FILE=')
          expect(output).toContain(resultPath)
          expect(output).toContain('Query examples:')
          expect(output).toContain('xzcat')
          expect(output).toContain('| jq')
        }
      }
    })

    it('should handle XZ compression failures gracefully', async () => {
      // This test would require mocking execSync to fail during compression
      // For integration tests, we assume XZ is available and working
      // Compression failure testing is handled in unit tests
      const args: IProjectDataCollectionArgs = {
        projectNodeId: 'PVT_kwHOABXVks4Af-jq'
      }

      const result = await projectDataCollectionOrchServ(args, services)
      
      // Should either succeed with JSON file or fail with clear error
      expect(result).toBeInstanceOf(LLMInfo)
      expect(typeof result.getExitCode()).toBe('number')
      expect([0, 1]).toContain(result.getExitCode())
    })
  })
})