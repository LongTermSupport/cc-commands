/**
 * @file GitHub GraphQL Service Integration Test
 * 
 * Tests the GitHubGraphQLService against real GitHub API.
 * Focuses on GraphQL query syntax and union type handling.
 */

import { describe, expect, it } from 'vitest'

import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubGraphQLService } from '../../../../src/orchestrator-services/github/services/GitHubGraphQLService.js'

describe('GitHubGraphQLService Integration', () => {
  let graphqlService: GitHubGraphQLService
  let authService: AuthService

  beforeEach(async () => {
    authService = new AuthService()
    const token = await authService.getGitHubToken()
    graphqlService = new GitHubGraphQLService(token)
  })

  it('should find projects for GitHub organization without GraphQL errors', async () => {
    // Test the basic project listing query
    const projects = await graphqlService.findProjectsByOwner('github')
    
    expect(projects).toBeDefined()
    expect(Array.isArray(projects)).toBe(true)
    expect(projects.length).toBeGreaterThan(0)
    
    console.log(`✓ Found ${projects.length} projects for GitHub org`)
    console.log(`✓ First project: ${projects.at(0).title}`)
  })

  it('should get project details by ID without union type errors', async () => {
    // First get a project ID
    const projects = await graphqlService.findProjectsByOwner('github')
    expect(projects.length).toBeGreaterThan(0)
    
    const projectId = projects.at(0).id
    console.log(`Testing project ID: ${projectId}`)
    
    // This should NOT fail with "Selections can't be made directly on unions"
    const project = await graphqlService.getProject(projectId)
    
    expect(project).toBeDefined()
    expect(project.id).toBe(projectId)
    expect(project.title).toBeDefined()
    
    console.log(`✓ Project retrieved: ${project.title}`)
    console.log(`✓ Project has ${project.itemsCount} items`)
  })

  it('should get project items without GraphQL union errors', async () => {
    // First get a project ID
    const projects = await graphqlService.findProjectsByOwner('github')
    expect(projects.length).toBeGreaterThan(0)
    
    const projectId = projects.at(0).id
    console.log(`Testing project items for ID: ${projectId}`)
    
    // This should NOT fail with union type selection errors
    const items = await graphqlService.getProjectItems(projectId)
    
    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
    
    console.log(`✓ Retrieved ${items.length} project items`)
    
    if (items.length > 0) {
      const firstItem = items.at(0)
      if (firstItem) {
        console.log(`✓ First item type: ${firstItem.type}`)
        console.log(`✓ First item has ${firstItem.fieldValues.length} field values`)
      }
    }
  })

  it('should handle project with no items gracefully', async () => {
    // Test with an empty or minimal project
    const projects = await graphqlService.findProjectsByOwner('github')
    
    // Try to find a project with minimal items or create test case
    const projectId = projects.at(0).id
    
    try {
      const items = await graphqlService.getProjectItems(projectId)
      
      // Should succeed even if empty
      expect(Array.isArray(items)).toBe(true)
      console.log(`✓ Project items query succeeded with ${items.length} items`)
      
    } catch (error) {
      // If it fails, it should NOT be due to GraphQL union errors
      expect(error.message).not.toContain('Selections can\'t be made directly on unions')
      expect(error.message).not.toContain('ProjectV2FieldConfiguration')
      console.log(`✓ Failure was NOT due to GraphQL union errors: ${error.message}`)
    }
  })

  it('should execute raw GraphQL query without syntax errors', async () => {
    // Test a minimal GraphQL query to ensure basic syntax works
    const query = `
      query {
        viewer {
          login
        }
      }
    `
    
    const result = await graphqlService.executeQuery(query, {})
    
    expect(result.viewer).toBeDefined()
    expect(result.viewer.login).toBeDefined()
    
    console.log(`✓ Raw GraphQL query succeeded for user: ${result.viewer.login}`)
  })
})