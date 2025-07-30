/**
 * @file Unit tests for IssueDataDTO
 * 
 * Tests the IssueDataDTO class including constructor validation,
 * toLLMData method, factory methods, utility methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { IssueDataDTO } from '../../../../src/orchestrator-services/github/dto/IssueDataDTO'

describe('IssueDataDTO', () => {
  const validIssueData = {
    assignees: ['alice', 'bob'],
    body: 'This is a detailed issue description with multiple lines.\n\nIt includes code blocks and references.',
    closedAt: null,
    commentsCount: 15,
    createdAt: new Date('2025-01-10T09:00:00Z'),
    creator: 'reporter',
    id: 'issue_123456',
    labels: ['bug', 'high-priority', 'backend'],
    locked: false,
    milestone: 'v2.0',
    number: 42,
    repository: 'owner/awesome-repo',
    state: 'open' as const,
    title: 'Fix critical authentication bug in user login',
    updatedAt: new Date('2025-01-12T14:30:00Z'),
    url: 'https://github.com/owner/awesome-repo/issues/42'
  }

  describe('constructor', () => {
    it('should create a valid IssueDataDTO instance', () => {
      const dto = new IssueDataDTO(
        validIssueData.id,
        validIssueData.number,
        validIssueData.title,
        validIssueData.body,
        validIssueData.state,
        validIssueData.locked,
        validIssueData.assignees,
        validIssueData.labels,
        validIssueData.milestone,
        validIssueData.creator,
        validIssueData.repository,
        validIssueData.url,
        validIssueData.commentsCount,
        validIssueData.createdAt,
        validIssueData.updatedAt,
        validIssueData.closedAt
      )

      expect(dto.id).toBe('issue_123456')
      expect(dto.number).toBe(42)
      expect(dto.title).toBe('Fix critical authentication bug in user login')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['alice', 'bob'])
      expect(dto.labels).toEqual(['bug', 'high-priority', 'backend'])
      expect(dto.milestone).toBe('v2.0')
      expect(dto.creator).toBe('reporter')
      expect(dto.commentsCount).toBe(15)
    })

    it('should handle closed issue with closed date', () => {
      const closedAt = new Date('2025-01-15T16:45:00Z')
      const dto = new IssueDataDTO(
        'closed_issue_789',
        24,
        'Resolved feature request',
        'This has been implemented',
        'closed',
        false,
        ['maintainer'],
        ['enhancement', 'completed'],
        null, // no milestone
        'contributor',
        'org/project',
        'https://github.com/org/project/issues/24',
        8,
        validIssueData.createdAt,
        validIssueData.updatedAt,
        closedAt
      )

      expect(dto.state).toBe('closed')
      expect(dto.closedAt).toEqual(closedAt)
      expect(dto.isClosed()).toBe(true)
      expect(dto.isOpen()).toBe(false)
      expect(dto.milestone).toBeNull()
    })

    it('should handle minimal issue data', () => {
      const dto = new IssueDataDTO(
        'minimal_123',
        1,
        'Simple issue',
        '',
        'open',
        false,
        [], // no assignees
        [], // no labels
        null, // no milestone
        'user',
        'owner/repo',
        'https://github.com/owner/repo/issues/1',
        0, // no comments
        new Date(),
        new Date(),
        null // not closed
      )

      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.commentsCount).toBe(0)
      expect(dto.body).toBe('')
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new IssueDataDTO(
        validIssueData.id,
        validIssueData.number,
        validIssueData.title,
        validIssueData.body,
        validIssueData.state,
        validIssueData.locked,
        validIssueData.assignees,
        validIssueData.labels,
        validIssueData.milestone,
        validIssueData.creator,
        validIssueData.repository,
        validIssueData.url,
        validIssueData.commentsCount,
        validIssueData.createdAt,
        validIssueData.updatedAt,
        validIssueData.closedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.ISSUE_ID).toBe('issue_123456')
      expect(llmData.ISSUE_NUMBER).toBe('42')
      expect(llmData.ISSUE_TITLE).toBe('Fix critical authentication bug in user login')
      expect(llmData.ISSUE_STATE).toBe('open')
      expect(llmData.ISSUE_ASSIGNEES).toBe('alice, bob')
      expect(llmData.ISSUE_LABELS).toBe('bug, high-priority, backend')
      expect(llmData.ISSUE_MILESTONE).toBe('v2.0')
      expect(llmData.ISSUE_CREATOR).toBe('reporter')
      expect(llmData.ISSUE_REPOSITORY).toBe('owner/awesome-repo')
      expect(llmData.ISSUE_URL).toBe('https://github.com/owner/awesome-repo/issues/42')
      expect(llmData.ISSUE_COMMENTS_COUNT).toBe('15')
      expect(llmData.ISSUE_LOCKED).toBe('false')
      expect(llmData.ISSUE_CREATED_AT).toBe('2025-01-10T09:00:00.000Z')
      expect(llmData.ISSUE_UPDATED_AT).toBe('2025-01-12T14:30:00.000Z')
      expect(llmData.ISSUE_CLOSED_AT).toBe('')
      expect(llmData.ISSUE_BODY).toBe('This is a detailed issue description with multiple lines.\n\nIt includes code blocks and references.')
    })

    it('should handle null and empty values in toLLMData', () => {
      const dto = new IssueDataDTO(
        'empty_123',
        99,
        'Empty issue',
        '',
        'closed',
        true,
        [], // no assignees
        [], // no labels
        null, // no milestone
        'user',
        'owner/repo',
        'https://github.com/owner/repo/issues/99',
        0,
        validIssueData.createdAt,
        validIssueData.updatedAt,
        new Date('2025-01-13T10:00:00Z')
      )

      const llmData = dto.toLLMData()

      expect(llmData.ISSUE_ASSIGNEES).toBe('')
      expect(llmData.ISSUE_LABELS).toBe('')
      expect(llmData.ISSUE_MILESTONE).toBe('')
      expect(llmData.ISSUE_BODY).toBe('')
      expect(llmData.ISSUE_CLOSED_AT).toBe('2025-01-13T10:00:00.000Z')
      expect(llmData.ISSUE_LOCKED).toBe('true')
    })
  })

  describe('fromGitHubApiResponse', () => {
    it('should create DTO from valid REST API response', () => {
       
      const apiResponseGitHubData = {
        assignees: [
          { login: 'dev1' },
          { login: 'dev2' }
        ],
        body: 'Issue body from API',
        closed_at: null,
        comments: 7,
        created_at: '2025-01-08T12:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/15',
        id: 98_765,
        labels: [
          { name: 'bug' },
          { name: 'urgent' }
        ],
        locked: false,
        milestone: { title: 'Sprint 3' },
        number: 15,
        repository: { full_name: 'owner/repo' },
        state: 'open',
        title: 'API Issue Title',
        updated_at: '2025-01-10T16:30:00Z',
        user: { login: 'issue-reporter' }
      }
       

      const dto = IssueDataDTO.fromGitHubApiResponse(apiResponseGitHubData)

      expect(dto.id).toBe('98765')
      expect(dto.number).toBe(15)
      expect(dto.title).toBe('API Issue Title')
      expect(dto.body).toBe('Issue body from API')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['dev1', 'dev2'])
      expect(dto.labels).toEqual(['bug', 'urgent'])
      expect(dto.milestone).toBe('Sprint 3')
      expect(dto.creator).toBe('issue-reporter')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.commentsCount).toBe(7)
      expect(dto.closedAt).toBeNull()
    })

    it('should handle closed issue from API response', () => {
       
      const closedApiResponseGitHubData = {
        body: 'Fixed issue',
        closed_at: '2025-01-11T14:20:00Z',
        comments: 3,
        created_at: '2025-01-05T09:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/20',
        id: 55_555,
        labels: [{ name: 'resolved' }],
        locked: true,
        number: 20,
        repository_url: 'https://api.github.com/repos/owner/repo',
        state: 'closed',
        title: 'Closed Issue',
        updated_at: '2025-01-11T14:20:00Z',
        user: { login: 'closer' }
      }
       

      const dto = IssueDataDTO.fromGitHubApiResponse(closedApiResponseGitHubData)

      expect(dto.state).toBe('closed')
      expect(dto.locked).toBe(true)
      expect(dto.closedAt).toEqual(new Date('2025-01-11T14:20:00Z'))
      expect(dto.repository).toBe('owner/repo') // Extracted from repository_url
      expect(dto.labels).toEqual(['resolved'])
    })

    it('should handle minimal API response', () => {
      const apiResponse = {
        id: 12_345,
        number: 1,
        title: 'Minimal Issue'
      }

      const dto = IssueDataDTO.fromGitHubApiResponse(apiResponse)

      expect(dto.id).toBe('12345')
      expect(dto.number).toBe(1)
      expect(dto.title).toBe('Minimal Issue')
      expect(dto.body).toBe('')
      expect(dto.state).toBe('open') // Default
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
      expect(dto.repository).toBe('unknown/unknown')
    })

    it('should handle malformed API response with missing required fields', () => {
      // Test with empty object - this could happen from a real API
      const dto = IssueDataDTO.fromGitHubApiResponse({})
      
      expect(dto.id).toBe('0')
      expect(dto.number).toBe(0)
      expect(dto.title).toBe('Untitled Issue')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('fromGraphQLResponse', () => {
    it('should create DTO from valid GraphQL response', () => {
      const graphqlResponse = {
        assignees: {
          nodes: [
            { login: 'graphql-dev1' },
            { login: 'graphql-dev2' }
          ]
        },
        author: { login: 'graphql-reporter' },
        body: 'GraphQL issue body',
        closed: false,
        closedAt: null,
        comments: { totalCount: 12 },
        createdAt: '2025-01-06T11:00:00Z',
        id: 'gql_issue_456',
        labels: {
          nodes: [
            { name: 'graphql' },
            { name: 'enhancement' }
          ]
        },
        locked: false,
        milestone: { title: 'GraphQL Phase 1' },
        number: 33,
        state: 'OPEN',
        title: 'GraphQL Issue Title',
        updatedAt: '2025-01-09T15:45:00Z',
        url: 'https://github.com/org/graphql-repo/issues/33'
      }

      const dto = IssueDataDTO.fromGraphQLResponse(graphqlResponse, 'org/graphql-repo')

      expect(dto.id).toBe('gql_issue_456')
      expect(dto.number).toBe(33)
      expect(dto.title).toBe('GraphQL Issue Title')
      expect(dto.body).toBe('GraphQL issue body')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['graphql-dev1', 'graphql-dev2'])
      expect(dto.labels).toEqual(['graphql', 'enhancement'])
      expect(dto.milestone).toBe('GraphQL Phase 1')
      expect(dto.creator).toBe('graphql-reporter')
      expect(dto.repository).toBe('org/graphql-repo')
      expect(dto.commentsCount).toBe(12)
      expect(dto.closedAt).toBeNull()
    })

    it('should handle closed GraphQL issue', () => {
      const graphqlResponse = {
        author: { login: 'closer' },
        body: 'This was resolved',
        closed: true,
        closedAt: '2025-01-12T13:30:00Z',
        comments: { totalCount: 5 },
        createdAt: '2025-01-01T08:00:00Z',
        id: 'gql_closed_789',
        number: 77,
        state: 'CLOSED',
        title: 'Closed GraphQL Issue',
        updatedAt: '2025-01-12T13:30:00Z',
        url: 'https://github.com/org/repo/issues/77'
      }

      const dto = IssueDataDTO.fromGraphQLResponse(graphqlResponse, 'org/repo')

      expect(dto.state).toBe('closed')
      expect(dto.closedAt).toEqual(new Date('2025-01-12T13:30:00Z'))
      expect(dto.isClosed()).toBe(true)
    })

    it('should handle minimal GraphQL response', () => {
      const minimalResponse = {
        id: 'gql_minimal_999',
        number: 1,
        title: 'Minimal GraphQL Issue'
      }

      const dto = IssueDataDTO.fromGraphQLResponse(minimalResponse, 'owner/repo')

      expect(dto.id).toBe('gql_minimal_999')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
      expect(dto.commentsCount).toBe(0)
    })

    it('should handle malformed GraphQL response with missing fields', () => {
      // Test with minimal GraphQL response - this could happen from a real API
      const dto = IssueDataDTO.fromGraphQLResponse({}, 'owner/repo')
      
      expect(dto.id).toBe('unknown')
      expect(dto.title).toBe('Untitled Issue')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('fromCliOutput', () => {
    it('should create DTO from valid CLI output', () => {
      const cliOutput = {
        assignees: ['cli-dev'],
        body: 'CLI issue body',
        closedAt: null,
        comments: 4,
        createdAt: '2025-01-07T10:30:00Z',
        id: 'cli_issue_321',
        labels: ['cli', 'feature'],
        locked: false,
        milestone: 'CLI v1.0',
        number: 88,
        repository: 'cli/awesome-tool',
        state: 'open',
        title: 'CLI Issue Title',
        updatedAt: '2025-01-08T14:15:00Z',
        url: 'https://github.com/cli/awesome-tool/issues/88',
        user: { login: 'cli-user' }
      }

      const dto = IssueDataDTO.fromCliOutput(cliOutput)

      expect(dto.id).toBe('cli_issue_321')
      expect(dto.number).toBe(88)
      expect(dto.title).toBe('CLI Issue Title')
      expect(dto.body).toBe('CLI issue body')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['cli-dev'])
      expect(dto.labels).toEqual(['cli', 'feature'])
      expect(dto.milestone).toBe('CLI v1.0')
      expect(dto.creator).toBe('cli-user')
      expect(dto.repository).toBe('cli/awesome-tool')
      expect(dto.commentsCount).toBe(4)
    })

    it('should handle minimal CLI output', () => {
      const minimalOutput = {
        id: 'cli_minimal_111',
        number: 5,
        title: 'Minimal CLI Issue'
      }

      const dto = IssueDataDTO.fromCliOutput(minimalOutput)

      expect(dto.id).toBe('cli_minimal_111')
      expect(dto.title).toBe('Minimal CLI Issue')
      expect(dto.body).toBe('')
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
    })

    it('should handle malformed CLI output with missing fields', () => {
      // Test with minimal CLI output - this could happen from real CLI
      const dto = IssueDataDTO.fromCliOutput({})
      
      expect(dto.id).toBe('unknown')
      expect(dto.title).toBe('Untitled Issue')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('utility methods', () => {
    let openIssue: IssueDataDTO
    let closedIssue: IssueDataDTO

    beforeEach(() => {
      openIssue = new IssueDataDTO(
        'open_123', 10, 'Open Issue', 'Open body', 'open', false,
        ['alice'], ['bug', 'urgent'], 'v1.0', 'reporter', 'owner/repo',
        'https://github.com/owner/repo/issues/10', 5,
        new Date('2025-01-01T00:00:00Z'), new Date('2025-01-05T00:00:00Z'), null
      )

      closedIssue = new IssueDataDTO(
        'closed_456', 20, 'Closed Issue', 'Closed body', 'closed', true,
        ['bob'], ['enhancement'], null, 'maintainer', 'owner/repo',
        'https://github.com/owner/repo/issues/20', 8,
        new Date('2024-12-15T00:00:00Z'), new Date('2024-12-20T00:00:00Z'), new Date('2024-12-20T00:00:00Z')
      )
    })

    it('should identify issue states correctly', () => {
      expect(openIssue.isOpen()).toBe(true)
      expect(openIssue.isClosed()).toBe(false)

      expect(closedIssue.isOpen()).toBe(false)
      expect(closedIssue.isClosed()).toBe(true)
    })

    it('should check assignee correctly', () => {
      expect(openIssue.isAssignedTo('alice')).toBe(true)
      expect(openIssue.isAssignedTo('bob')).toBe(false)
      expect(closedIssue.isAssignedTo('bob')).toBe(true)
    })

    it('should check labels correctly', () => {
      expect(openIssue.hasLabel('bug')).toBe(true)
      expect(openIssue.hasLabel('urgent')).toBe(true)
      expect(openIssue.hasLabel('enhancement')).toBe(false)
      expect(closedIssue.hasLabel('enhancement')).toBe(true)
    })

    it('should generate correct summary', () => {
      expect(openIssue.getSummary()).toBe('#10: Open Issue (open) [bug, urgent]')
      expect(closedIssue.getSummary()).toBe('#20: Closed Issue (closed) [enhancement]')
    })

    it('should calculate age correctly', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const age = openIssue.getAgeInDays()
      expect(age).toBeGreaterThan(0)
      expect(age).toBeLessThan(365) // Less than a year
    })

    it('should calculate days since update', () => {
      const daysSince = openIssue.getDaysSinceUpdate()
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365)
    })

    it('should calculate days since closure for closed issues', () => {
      expect(openIssue.getDaysSinceClosure()).toBeNull()
      
      const daysSinceClosure = closedIssue.getDaysSinceClosure()
      expect(daysSinceClosure).toBeGreaterThan(0)
      expect(daysSinceClosure).toBeLessThan(365)
    })

    it('should detect recent activity', () => {
      // Create issue with very recent update
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      const recentIssue = new IssueDataDTO(
        'recent_789', 30, 'Recent Issue', 'Body', 'open', false,
        [], [], null, 'user', 'owner/repo', 'url', 0,
        new Date(), recentDate, null
      )

      expect(recentIssue.hasRecentActivity(7)).toBe(true)
      expect(recentIssue.hasRecentActivity(1)).toBe(false)
    })

    it('should detect stale issues', () => {
      // Create issue with old update
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      const staleIssue = new IssueDataDTO(
        'stale_999', 40, 'Stale Issue', 'Body', 'open', false,
        [], [], null, 'user', 'owner/repo', 'url', 0,
        new Date(), oldDate, null
      )

      expect(staleIssue.isStale(30)).toBe(true)
      expect(staleIssue.isStale(60)).toBe(false)
    })
  })

  describe('edge cases and validation', () => {
    it('should handle unicode and special characters', () => {
      const dto = new IssueDataDTO(
        'unicode_123', 50, 'Issue with émojis 🐛 and 中文', 'Body contains "quotes" and \'apostrophes\'', 'open', false,
        ['用户-alice', 'bob-développeur'], ['emoji-🚀', '中文-label'], 'milestone-v2.0', 'creator-用户',
        'special-org/repo_name', 'https://github.com/special-org/repo_name/issues/50', 0,
        new Date(), new Date(), null
      )

      expect(dto.title).toBe('Issue with émojis 🐛 and 中文')
      expect(dto.body).toBe('Body contains "quotes" and \'apostrophes\'')
      expect(dto.assignees).toContain('用户-alice')
      expect(dto.labels).toContain('emoji-🚀')

      const llmData = dto.toLLMData()
      expect(llmData.ISSUE_TITLE).toBe('Issue with émojis 🐛 and 中文')
      expect(llmData.ISSUE_ASSIGNEES).toBe('用户-alice, bob-développeur')
    })

    it('should handle very large numbers', () => {
      const dto = new IssueDataDTO(
        'large_123', 999_999, 'Large Number Issue', 'Body', 'open', false,
        [], [], null, 'user', 'owner/repo', 'url', 5000,
        new Date(), new Date(), null
      )

      expect(dto.number).toBe(999_999)
      expect(dto.commentsCount).toBe(5000)
      
      const llmData = dto.toLLMData()
      expect(llmData.ISSUE_NUMBER).toBe('999999')
      expect(llmData.ISSUE_COMMENTS_COUNT).toBe('5000')
    })

    it('should handle empty arrays and null milestone', () => {
      const dto = new IssueDataDTO(
        'empty_123', 1, 'Empty Issue', '', 'open', false,
        [], [], null, 'user', 'owner/repo', 'url', 0,
        new Date(), new Date(), null
      )

      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.milestone).toBeNull()
      
      const llmData = dto.toLLMData()
      expect(llmData.ISSUE_ASSIGNEES).toBe('')
      expect(llmData.ISSUE_LABELS).toBe('')
      expect(llmData.ISSUE_MILESTONE).toBe('')
    })

    it('should handle long issue bodies', () => {
      const longBody = 'A'.repeat(10_000) // Very long body
      const dto = new IssueDataDTO(
        'long_123', 1, 'Long Issue', longBody, 'open', false,
        [], [], null, 'user', 'owner/repo', 'url', 0,
        new Date(), new Date(), null
      )

      expect(dto.body).toBe(longBody)
      expect(dto.body.length).toBe(10_000)
      
      const llmData = dto.toLLMData()
      expect(llmData.ISSUE_BODY).toBe(longBody)
    })
  })
})