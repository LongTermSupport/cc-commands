/**
 * @file Tests for ProxyAwareGitHubService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProxyAwareGitHubService } from '../../../../src/orchestrator-services/github/services/ProxyAwareGitHubService.js'

// Mock the proxy client creation
vi.mock('../../../../src/infrastructure/http/ProxyAwareClient.js', () => ({
  createProxyAwareGitHubClient: vi.fn().mockResolvedValue({
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    request: vi.fn()
  })
}))

describe('ProxyAwareGitHubService', () => {
  let service: ProxyAwareGitHubService
  let mockApiClient: any

  beforeEach(async () => {
    const { createProxyAwareGitHubClient } = await import('../../../../src/infrastructure/http/ProxyAwareClient.js')
    
    mockApiClient = {
      delete: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      request: vi.fn()
    }
    
    vi.mocked(createProxyAwareGitHubClient).mockResolvedValue(mockApiClient)
    
    service = new ProxyAwareGitHubService('fake-token')
    
    // Wait for client initialization
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  describe('repository operations', () => {
    it('should check repository access', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { id: 1, name: 'test-repo' },
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo'
      })

      const hasAccess = await service.checkRepositoryAccess('owner', 'repo')

      expect(hasAccess).toBe(true)
      expect(mockApiClient.get).toHaveBeenCalledWith('/repos/owner/repo')
    })

    it('should handle repository access failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Not found'))

      const hasAccess = await service.checkRepositoryAccess('owner', 'nonexistent')

      expect(hasAccess).toBe(false)
    })

    it('should get repository data', async () => {
      const mockRepoData = {
        archived: false,
        clone_url: 'https://github.com/owner/test-repo.git',
        created_at: '2023-01-01T00:00:00Z',
        default_branch: 'main',
        description: 'Test repository',
        disabled: false,
        fork: false,
        forks_count: 9,
        full_name: 'owner/test-repo',
        has_issues: true,
        has_pages: false,
        has_projects: true,
        has_wiki: true,
        html_url: 'https://github.com/owner/test-repo',
        id: 123,
        language: 'TypeScript',
        license: null,
        name: 'test-repo',
        open_issues_count: 0,
        owner: {
          avatar_url: 'https://github.com/images/error/owner_happy.gif',
          id: 1,
          login: 'owner',
          node_id: 'MDQ6VXNlcjE=',
          type: 'User',
          url: 'https://api.github.com/users/owner'
        },
        private: false,
        pushed_at: '2023-12-01T00:00:00Z',
        size: 108,
        ssh_url: 'git@github.com:owner/test-repo.git',
        stargazers_count: 80,
        updated_at: '2023-12-01T00:00:00Z',
        url: 'https://api.github.com/repos/owner/test-repo',
        visibility: 'public',
        watchers_count: 80
      }

      mockApiClient.get.mockResolvedValue({
        data: mockRepoData,
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/test-repo'
      })

      const repoDTO = await service.getRepository('owner', 'test-repo')

      expect(repoDTO).toBeDefined()
      expect(repoDTO.name).toBe('test-repo')
      expect(repoDTO.owner).toBe('owner')
      expect(repoDTO.starsCount).toBe(80)
      expect(mockApiClient.get).toHaveBeenCalledWith('/repos/owner/test-repo')
    })
  })

  describe('commits operations', () => {
    it('should get commits with pagination', async () => {
      const mockCommits = [
        {
          author: null,
          commit: {
            author: { date: '2023-01-01T00:00:00Z', email: 'test@example.com', name: 'Test User' },
            committer: { date: '2023-01-01T00:00:00Z', email: 'test@example.com', name: 'Test User' },
            message: 'Test commit',
            url: 'https://api.github.com/repos/owner/repo/git/commits/abc123',
            verification: { payload: null, reason: 'unsigned', signature: null, verified: false }
          },
          committer: null,
          html_url: 'https://github.com/owner/repo/commit/abc123',
          parents: [],
          sha: 'abc123',
          stats: { additions: 1, deletions: 0, total: 1 },
          url: 'https://api.github.com/repos/owner/repo/commits/abc123'
        }
      ]

      mockApiClient.get.mockResolvedValue({
        data: mockCommits,
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo/commits'
      })

      const commits = await service.getAllCommitsRaw('owner', 'repo', { limit: 10 })

      expect(commits).toHaveLength(1)
      expect(commits[0].sha).toBe('abc123')
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/repos/owner/repo/commits',
        expect.objectContaining({
          params: expect.objectContaining({
            page: '1',
            per_page: '100'
          })
        })
      )
    })

    it('should handle commits with date filtering', async () => {
      mockApiClient.get.mockResolvedValue({
        data: [],
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo/commits'
      })

      await service.getAllCommitsRaw('owner', 'repo', { 
        since: '2023-01-01T00:00:00Z',
        until: '2023-12-31T23:59:59Z'
      })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/repos/owner/repo/commits',
        expect.objectContaining({
          params: expect.objectContaining({
            'since': '2023-01-01T00:00:00Z',
            'until': '2023-12-31T23:59:59Z'
          })
        })
      )
    })
  })

  describe('issues operations', () => {
    it('should get issues with pagination', async () => {
      const mockIssues = [
        {
          assignee: null,
          assignees: [],
          author_association: 'OWNER',
          body: 'Test issue body',
          closed_at: null,
          comments: 0,
          created_at: '2023-01-01T00:00:00Z',
          draft: false,
          html_url: 'https://github.com/owner/repo/issues/1',
          id: 1,
          labels: [],
          locked: false,
          milestone: null,
          node_id: 'MDU6SXNzdWUx',
          number: 1,
          pull_request: undefined,
          repository_url: 'https://api.github.com/repos/owner/repo',
          state: 'open',
          state_reason: null,
          title: 'Test issue',
          updated_at: '2023-01-01T00:00:00Z',
          url: 'https://api.github.com/repos/owner/repo/issues/1',
          user: {
            avatar_url: 'https://github.com/images/error/testuser_happy.gif',
            id: 1,
            login: 'testuser',
            node_id: 'MDQ6VXNlcjE=',
            type: 'User',
            url: 'https://api.github.com/users/testuser'
          }
        }
      ]

      mockApiClient.get.mockResolvedValue({
        data: mockIssues,
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo/issues'
      })

      const issues = await service.getAllIssuesRaw('owner', 'repo', { limit: 10 })

      expect(issues).toHaveLength(1)
      expect(issues[0].number).toBe(1)
      expect(issues[0].title).toBe('Test issue')
    })
  })

  describe('pull requests operations', () => {
    it('should get pull requests with pagination', async () => {
      const mockPRs = [
        {
          assignee: null,
          assignees: [],
          author_association: 'OWNER',
          base: {
            ref: 'main',
            repo: null,
            sha: 'abc123'
          },
          body: 'Test PR body',
          closed_at: null,
          created_at: '2023-01-01T00:00:00Z',
          diff_url: 'https://github.com/owner/repo/pull/1.diff',
          draft: false,
          head: {
            ref: 'feature-branch',
            repo: null,
            sha: 'def456'
          },
          html_url: 'https://github.com/owner/repo/pull/1',
          id: 1,
          labels: [],
          locked: false,
          merge_commit_sha: null,
          merged_at: null,
          milestone: null,
          node_id: 'MDExOlB1bGxSZXF1ZXN0MQ==',
          number: 1,
          patch_url: 'https://github.com/owner/repo/pull/1.patch',
          requested_reviewers: [],
          requested_teams: [],
          state: 'open',
          title: 'Test PR',
          updated_at: '2023-01-01T00:00:00Z',
          url: 'https://api.github.com/repos/owner/repo/pulls/1',
          user: {
            avatar_url: 'https://github.com/images/error/testuser_happy.gif',
            id: 1,
            login: 'testuser',
            node_id: 'MDQ6VXNlcjE=',
            type: 'User',
            url: 'https://api.github.com/users/testuser'
          }
        }
      ]

      mockApiClient.get.mockResolvedValue({
        data: mockPRs,
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo/pulls'
      })

      const prs = await service.getAllPullRequestsRaw('owner', 'repo', { limit: 10 })

      expect(prs).toHaveLength(1)
      expect(prs[0].number).toBe(1)
      expect(prs[0].title).toBe('Test PR')
    })
  })

  describe('authentication', () => {
    it('should get authenticated user', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { login: 'authenticated-user' },
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/user'
      })

      const username = await service.getAuthenticatedUser()

      expect(username).toBe('authenticated-user')
      expect(mockApiClient.get).toHaveBeenCalledWith('/user')
    })

    it('should get rate limit status', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          rate: {
            limit: 5000,
            remaining: 4999,
            reset: 1_640_995_200,
            used: 1
          }
        },
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/rate_limit'
      })

      const rateLimit = await service.getRateLimit()

      expect(rateLimit.limit).toBe(5000)
      expect(rateLimit.remaining).toBe(4999)
      expect(rateLimit.used).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should throw OrchestratorError on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'))

      await expect(
        service.checkRepositoryAccess('owner', 'repo')
      ).rejects.toThrow('API Error')
    })

    it('should handle malformed API responses gracefully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: null, // Invalid response format
        fromCache: false,
        headers: {},
        status: 200,
        statusText: 'OK',
        url: 'https://api.github.com/repos/owner/repo/commits'
      })

      await expect(
        service.getAllCommitsRaw('owner', 'repo')
      ).rejects.toThrow('Invalid response format')
    })
  })
})