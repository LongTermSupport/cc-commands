/**
 * @file GitHub CLI Integration Test for AuthService
 * 
 * Tests real GitHub CLI token extraction and validation.
 * Assumes `gh` is authenticated and available.
 */

import { describe, expect, it } from 'vitest'

import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'

describe('AuthService GitHub CLI Integration', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
  })

  it('should extract token from gh CLI', async () => {
    const token = await authService.getGitHubToken()
    
    // Token should exist and be a valid GitHub token format
    expect(token).toBeDefined()
    expect(token).toMatch(/^gh[pousr]_[A-Za-z0-9_]{36,}$/)
    
    console.log(`✓ Token extracted: ${token.slice(0, 10)}...`)
  })

  it('should validate the extracted token', async () => {
    const token = await authService.getGitHubToken()
    const isValid = await authService.validateToken(token)
    
    expect(isValid).toBe(true)
    
    console.log('✓ Token validation successful')
  })

  it('should get authenticated user info', async () => {
    const token = await authService.getGitHubToken()
    
    // Make a simple API call to test the token works
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'cc-commands-ts-test'
      }
    })
    
    expect(response.status).toBe(200)
    
    const user = await response.json()
    expect(user.login).toBeDefined()
    
    console.log(`✓ Authenticated as: ${user.login}`)
  })

  it('should have required scopes for Projects v2', async () => {
    const token = await authService.getGitHubToken()
    
    // Check token scopes via API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'cc-commands-ts-test'
      }
    })
    
    const scopes = response.headers.get('x-oauth-scopes')
    console.log(`✓ Token scopes: ${scopes}`)
    
    // Should have project read access (either 'repo' or 'read:project')
    expect(scopes).toMatch(/(repo|read:project)/)
  })
})