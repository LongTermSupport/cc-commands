/**
 * @file Unit tests for PullRequestDataDTO
 * 
 * Tests the PullRequestDataDTO class including constructor validation,
 * toLLMData method, factory methods, utility methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { PullRequestDataDTO } from '../../../../src/orchestrator-services/github/dto/PullRequestDataDTO'

describe('PullRequestDataDTO', () => {
  const validPrData = {
    additions: 150,
    assignees: ['alice', 'bob'],
    baseBranch: 'main',
    body: 'This PR adds new authentication features with comprehensive tests.\n\nCloses #42',
    changedFiles: 8,
    closedAt: null,
    commentsCount: 12,
    commitsCount: 5,
    createdAt: new Date('2025-01-10T09:00:00Z'),
    creator: 'developer',
    deletions: 45,
    draft: false,
    headBranch: 'feature/auth-improvements',
    id: 'pr_123456',
    labels: ['enhancement', 'authentication', 'high-priority'],
    locked: false,
    mergeable: true,
    merged: false,
    mergedAt: null,
    mergedBy: null,
    milestone: 'v2.0',
    number: 84,
    repository: 'owner/awesome-repo',
    requestedReviewers: ['maintainer1', 'maintainer2'],
    reviewCommentsCount: 8,
    state: 'open' as const,
    title: 'Add OAuth2 authentication with JWT tokens',
    updatedAt: new Date('2025-01-12T14:30:00Z'),
    url: 'https://github.com/owner/awesome-repo/pull/84'
  }

  describe('constructor', () => {
    it('should create a valid PullRequestDataDTO instance', () => {
      const dto = new PullRequestDataDTO(
        validPrData.id,
        validPrData.number,
        validPrData.title,
        validPrData.body,
        validPrData.state,
        validPrData.draft,
        validPrData.locked,
        validPrData.merged,
        validPrData.mergeable,
        validPrData.assignees,
        validPrData.requestedReviewers,
        validPrData.labels,
        validPrData.milestone,
        validPrData.creator,
        validPrData.mergedBy,
        validPrData.repository,
        validPrData.url,
        validPrData.headBranch,
        validPrData.baseBranch,
        validPrData.commentsCount,
        validPrData.reviewCommentsCount,
        validPrData.commitsCount,
        validPrData.additions,
        validPrData.deletions,
        validPrData.changedFiles,
        validPrData.createdAt,
        validPrData.updatedAt,
        validPrData.closedAt,
        validPrData.mergedAt
      )

      expect(dto.id).toBe('pr_123456')
      expect(dto.number).toBe(84)
      expect(dto.title).toBe('Add OAuth2 authentication with JWT tokens')
      expect(dto.state).toBe('open')
      expect(dto.draft).toBe(false)
      expect(dto.assignees).toEqual(['alice', 'bob'])
      expect(dto.requestedReviewers).toEqual(['maintainer1', 'maintainer2'])
      expect(dto.labels).toEqual(['enhancement', 'authentication', 'high-priority'])
      expect(dto.milestone).toBe('v2.0')
      expect(dto.creator).toBe('developer')
      expect(dto.headBranch).toBe('feature/auth-improvements')
      expect(dto.baseBranch).toBe('main')
      expect(dto.additions).toBe(150)
      expect(dto.deletions).toBe(45)
      expect(dto.changedFiles).toBe(8)
      expect(dto.merged).toBe(false)
      expect(dto.mergeable).toBe(true)
    })

    it('should handle merged pull request', () => {
      const mergedAt = new Date('2025-01-15T16:45:00Z')
      const dto = new PullRequestDataDTO(
        'merged_pr_789',
        42,
        'Merged feature PR',
        'This was successfully merged',
        'closed',
        false,
        false,
        true, // merged
        null, // mergeable irrelevant after merge
        ['maintainer'],
        [],
        ['feature', 'completed'],
        null,
        'contributor',
        'maintainer',
        'org/project',
        'https://github.com/org/project/pull/42',
        'feature/new-feature',
        'main',
        5,
        3,
        4,
        200,
        50,
        12,
        validPrData.createdAt,
        validPrData.updatedAt,
        mergedAt, // closed at merge time
        mergedAt
      )

      expect(dto.state).toBe('closed')
      expect(dto.merged).toBe(true)
      expect(dto.mergedAt).toEqual(mergedAt)
      expect(dto.closedAt).toEqual(mergedAt)
      expect(dto.mergedBy).toBe('maintainer')
      expect(dto.isMerged()).toBe(true)
      expect(dto.isClosed()).toBe(true)
      expect(dto.isOpen()).toBe(false)
    })

    it('should handle draft pull request', () => {
      const dto = new PullRequestDataDTO(
        'draft_pr_555',
        10,
        'Work in progress: New feature',
        'Still working on this...',
        'open',
        true, // draft
        false,
        false,
        null, // mergeable unknown for drafts
        [],
        [],
        ['wip'],
        null,
        'developer',
        null,
        'owner/repo',
        'https://github.com/owner/repo/pull/10',
        'feature/wip',
        'main',
        2,
        0,
        3,
        75,
        20,
        4,
        new Date(),
        new Date(),
        null,
        null
      )

      expect(dto.draft).toBe(true)
      expect(dto.isDraft()).toBe(true)
      expect(dto.isReadyForReview()).toBe(false)
      expect(dto.merged).toBe(false)
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new PullRequestDataDTO(
        validPrData.id,
        validPrData.number,
        validPrData.title,
        validPrData.body,
        validPrData.state,
        validPrData.draft,
        validPrData.locked,
        validPrData.merged,
        validPrData.mergeable,
        validPrData.assignees,
        validPrData.requestedReviewers,
        validPrData.labels,
        validPrData.milestone,
        validPrData.creator,
        validPrData.mergedBy,
        validPrData.repository,
        validPrData.url,
        validPrData.headBranch,
        validPrData.baseBranch,
        validPrData.commentsCount,
        validPrData.reviewCommentsCount,
        validPrData.commitsCount,
        validPrData.additions,
        validPrData.deletions,
        validPrData.changedFiles,
        validPrData.createdAt,
        validPrData.updatedAt,
        validPrData.closedAt,
        validPrData.mergedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.PR_ID).toBe('pr_123456')
      expect(llmData.PR_NUMBER).toBe('84')
      expect(llmData.PR_TITLE).toBe('Add OAuth2 authentication with JWT tokens')
      expect(llmData.PR_STATE).toBe('open')
      expect(llmData.PR_DRAFT).toBe('false')
      expect(llmData.PR_ASSIGNEES).toBe('alice, bob')
      expect(llmData.PR_REQUESTED_REVIEWERS).toBe('maintainer1, maintainer2')
      expect(llmData.PR_LABELS).toBe('enhancement, authentication, high-priority')
      expect(llmData.PR_MILESTONE).toBe('v2.0')
      expect(llmData.PR_CREATOR).toBe('developer')
      expect(llmData.PR_REPOSITORY).toBe('owner/awesome-repo')
      expect(llmData.PR_URL).toBe('https://github.com/owner/awesome-repo/pull/84')
      expect(llmData.PR_HEAD_BRANCH).toBe('feature/auth-improvements')
      expect(llmData.PR_BASE_BRANCH).toBe('main')
      expect(llmData.PR_COMMENTS_COUNT).toBe('12')
      expect(llmData.PR_REVIEW_COMMENTS_COUNT).toBe('8')
      expect(llmData.PR_COMMITS_COUNT).toBe('5')
      expect(llmData.PR_ADDITIONS).toBe('150')
      expect(llmData.PR_DELETIONS).toBe('45')
      expect(llmData.PR_CHANGED_FILES).toBe('8')
      expect(llmData.PR_MERGED).toBe('false')
      expect(llmData.PR_MERGEABLE).toBe('true')
      expect(llmData.PR_LOCKED).toBe('false')
      expect(llmData.PR_CREATED_AT).toBe('2025-01-10T09:00:00.000Z')
      expect(llmData.PR_UPDATED_AT).toBe('2025-01-12T14:30:00.000Z')
      expect(llmData.PR_CLOSED_AT).toBe('')
      expect(llmData.PR_MERGED_AT).toBe('')
      expect(llmData.PR_MERGED_BY).toBe('')
    })

    it('should handle null and empty values in toLLMData', () => {
      const dto = new PullRequestDataDTO(
        'empty_pr_123',
        99,
        'Empty PR',
        '',
        'closed',
        true,
        true,
        false,
        null, // mergeable unknown
        [], // no assignees
        [], // no reviewers
        [], // no labels
        null, // no milestone
        'user',
        null, // no merger
        'owner/repo',
        'https://github.com/owner/repo/pull/99',
        'feature',
        'main',
        0,
        0,
        1,
        10,
        5,
        2,
        validPrData.createdAt,
        validPrData.updatedAt,
        new Date('2025-01-13T10:00:00Z'),
        null // not merged
      )

      const llmData = dto.toLLMData()

      expect(llmData.PR_ASSIGNEES).toBe('')
      expect(llmData.PR_REQUESTED_REVIEWERS).toBe('')
      expect(llmData.PR_LABELS).toBe('')
      expect(llmData.PR_MILESTONE).toBe('')
      expect(llmData.PR_BODY).toBe('')
      expect(llmData.PR_MERGEABLE).toBe('')
      expect(llmData.PR_MERGED_BY).toBe('')
      expect(llmData.PR_MERGED_AT).toBe('')
      expect(llmData.PR_CLOSED_AT).toBe('2025-01-13T10:00:00.000Z')
      expect(llmData.PR_DRAFT).toBe('true')
      expect(llmData.PR_LOCKED).toBe('true')
    })
  })

  describe('fromGitHubApiResponse', () => {
    it('should create DTO from valid REST API response', () => {
      /* eslint-disable camelcase */
      const apiResponseGitHubData = {
        additions: 120,
        assignees: [
          { login: 'dev1' },
          { login: 'dev2' }
        ],
        base: { ref: 'main' },
        body: 'PR body from API',
        changed_files: 6,
        closed_at: null,
        comments: 4,
        commits: 3,
        created_at: '2025-01-08T12:00:00Z',
        deletions: 30,
        draft: false,
        head: { ref: 'feature/api-test' },
        html_url: 'https://github.com/owner/repo/pull/25',
        id: 98_765,
        labels: [
          { name: 'bug' },
          { name: 'urgent' }
        ],
        locked: false,
        mergeable: true,
        merged: false,
        merged_at: null,
        merged_by: null,
        milestone: { title: 'Sprint 4' },
        number: 25,
        repository: { full_name: 'owner/repo' },
        requested_reviewers: [
          { login: 'reviewer1' },
          { login: 'reviewer2' }
        ],
        review_comments: 7,
        state: 'open',
        title: 'API PR Title',
        updated_at: '2025-01-10T16:30:00Z',
        user: { login: 'pr-creator' }
      }
      /* eslint-enable camelcase */

      const dto = PullRequestDataDTO.fromGitHubApiResponse(apiResponseGitHubData)

      expect(dto.id).toBe('98765')
      expect(dto.number).toBe(25)
      expect(dto.title).toBe('API PR Title')
      expect(dto.body).toBe('PR body from API')
      expect(dto.state).toBe('open')
      expect(dto.draft).toBe(false)
      expect(dto.assignees).toEqual(['dev1', 'dev2'])
      expect(dto.requestedReviewers).toEqual(['reviewer1', 'reviewer2'])
      expect(dto.labels).toEqual(['bug', 'urgent'])
      expect(dto.milestone).toBe('Sprint 4')
      expect(dto.creator).toBe('pr-creator')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.headBranch).toBe('feature/api-test')
      expect(dto.baseBranch).toBe('main')
      expect(dto.additions).toBe(120)
      expect(dto.deletions).toBe(30)
      expect(dto.changedFiles).toBe(6)
      expect(dto.commentsCount).toBe(4)
      expect(dto.reviewCommentsCount).toBe(7)
      expect(dto.commitsCount).toBe(3)
      expect(dto.mergeable).toBe(true)
      expect(dto.merged).toBe(false)
      expect(dto.closedAt).toBeNull()
      expect(dto.mergedAt).toBeNull()
    })

    it('should handle merged PR from API response', () => {
      /* eslint-disable camelcase */
      const mergedApiResponseGitHubData = {
        body: 'Merged PR',
        closed_at: '2025-01-11T14:20:00Z',
        created_at: '2025-01-05T09:00:00Z',
        draft: false,
        html_url: 'https://github.com/owner/repo/pull/30',
        id: 55_555,
        labels: [{ name: 'merged' }],
        locked: false,
        mergeable: null,
        merged: true,
        merged_at: '2025-01-11T14:20:00Z',
        merged_by: { login: 'maintainer' },
        number: 30,
        repository_url: 'https://api.github.com/repos/owner/repo',
        state: 'closed',
        title: 'Merged PR',
        updated_at: '2025-01-11T14:20:00Z',
        user: { login: 'contributor' }
      }
      /* eslint-enable camelcase */

      const dto = PullRequestDataDTO.fromGitHubApiResponse(mergedApiResponseGitHubData)

      expect(dto.state).toBe('closed')
      expect(dto.merged).toBe(true)
      expect(dto.mergedBy).toBe('maintainer')
      expect(dto.closedAt).toEqual(new Date('2025-01-11T14:20:00Z'))
      expect(dto.mergedAt).toEqual(new Date('2025-01-11T14:20:00Z'))
      expect(dto.repository).toBe('owner/repo') // Extracted from repository_url
      expect(dto.labels).toEqual(['merged'])
    })

    it('should handle minimal API response', () => {
      const apiResponse = {
        id: 12_345,
        number: 1,
        title: 'Minimal PR'
      }

      const dto = PullRequestDataDTO.fromGitHubApiResponse(apiResponse)

      expect(dto.id).toBe('12345')
      expect(dto.number).toBe(1)
      expect(dto.title).toBe('Minimal PR')
      expect(dto.body).toBe('')
      expect(dto.state).toBe('open') // Default
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
      expect(dto.repository).toBe('unknown/unknown')
      expect(dto.headBranch).toBe('unknown')
      expect(dto.baseBranch).toBe('main') // Default
    })

    it('should handle malformed API response with missing required fields', () => {
      // Test defensive handling of malformed but validly-typed API response
      const dto = PullRequestDataDTO.fromGitHubApiResponse({})
      
      expect(dto.id).toBe('0')
      expect(dto.number).toBe(0)
      expect(dto.title).toBe('Untitled Pull Request')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('fromGraphQLResponse', () => {
    it('should create DTO from valid GraphQL response', () => {
      const graphqlResponse = {
        additions: 180,
        assignees: {
          nodes: [
            { login: 'graphql-dev1' },
            { login: 'graphql-dev2' }
          ]
        },
        author: { login: 'graphql-creator' },
        baseRefName: 'main',
        body: 'GraphQL PR body',
        changedFiles: 10,
        closed: false,
        closedAt: null,
        comments: { totalCount: 15 },
        commits: { totalCount: 8 },
        createdAt: '2025-01-06T11:00:00Z',
        deletions: 60,
        draft: false,
        headRefName: 'feature/graphql-test',
        id: 'gql_pr_456',
        labels: {
          nodes: [
            { name: 'graphql' },
            { name: 'enhancement' }
          ]
        },
        locked: false,
        mergeable: 'MERGEABLE',
        merged: false,
        mergedAt: null,
        mergedBy: null,
        milestone: { title: 'GraphQL Phase 1' },
        number: 45,
        reviewRequests: {
          nodes: [
            { requestedReviewer: { login: 'graphql-reviewer1' } },
            { requestedReviewer: { login: 'graphql-reviewer2' } }
          ]
        },
        reviews: { totalCount: 3 },
        state: 'OPEN',
        title: 'GraphQL PR Title',
        updatedAt: '2025-01-09T15:45:00Z',
        url: 'https://github.com/org/graphql-repo/pull/45'
      }

      const dto = PullRequestDataDTO.fromGraphQLResponse(graphqlResponse, 'org/graphql-repo')

      expect(dto.id).toBe('gql_pr_456')
      expect(dto.number).toBe(45)
      expect(dto.title).toBe('GraphQL PR Title')
      expect(dto.body).toBe('GraphQL PR body')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['graphql-dev1', 'graphql-dev2'])
      expect(dto.requestedReviewers).toEqual(['graphql-reviewer1', 'graphql-reviewer2'])
      expect(dto.labels).toEqual(['graphql', 'enhancement'])
      expect(dto.milestone).toBe('GraphQL Phase 1')
      expect(dto.creator).toBe('graphql-creator')
      expect(dto.repository).toBe('org/graphql-repo')
      expect(dto.headBranch).toBe('feature/graphql-test')
      expect(dto.baseBranch).toBe('main')
      expect(dto.additions).toBe(180)
      expect(dto.deletions).toBe(60)
      expect(dto.changedFiles).toBe(10)
      expect(dto.commentsCount).toBe(15)
      expect(dto.reviewCommentsCount).toBe(3)
      expect(dto.commitsCount).toBe(8)
      expect(dto.mergeable).toBe(true) // MERGEABLE -> true
      expect(dto.closedAt).toBeNull()
    })

    it('should handle closed GraphQL PR', () => {
      const graphqlResponse = {
        author: { login: 'closer' },
        body: 'This was closed',
        closed: true,
        closedAt: '2025-01-12T13:30:00Z',
        createdAt: '2025-01-01T08:00:00Z',
        id: 'gql_closed_789',
        mergeable: 'CONFLICTING',
        merged: false,
        number: 77,
        state: 'CLOSED',
        title: 'Closed GraphQL PR',
        updatedAt: '2025-01-12T13:30:00Z',
        url: 'https://github.com/org/repo/pull/77'
      }

      const dto = PullRequestDataDTO.fromGraphQLResponse(graphqlResponse, 'org/repo')

      expect(dto.state).toBe('closed')
      expect(dto.closedAt).toEqual(new Date('2025-01-12T13:30:00Z'))
      expect(dto.mergeable).toBe(false) // CONFLICTING -> false
      expect(dto.isClosed()).toBe(true)
    })

    it('should handle minimal GraphQL response', () => {
      const minimalResponse = {
        id: 'gql_minimal_999',
        number: 1,
        title: 'Minimal GraphQL PR'
      }

      const dto = PullRequestDataDTO.fromGraphQLResponse(minimalResponse, 'owner/repo')

      expect(dto.id).toBe('gql_minimal_999')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
      expect(dto.headBranch).toBe('unknown')
      expect(dto.baseBranch).toBe('main')
      expect(dto.mergeable).toBeNull() // Unknown state
    })

    it('should handle malformed GraphQL response with missing fields', () => {
      // Test defensive handling of malformed but validly-typed GraphQL response
      const dto = PullRequestDataDTO.fromGraphQLResponse({}, 'owner/repo')
      
      expect(dto.id).toBe('unknown')
      expect(dto.title).toBe('Untitled Pull Request')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('fromCliOutput', () => {
    it('should create DTO from valid CLI output', () => {
      const cliOutput = {
        additions: 95,
        assignees: ['cli-dev'],
        baseRefName: 'develop',
        body: 'CLI PR body',
        changedFiles: 4,
        closedAt: null,
        comments: 2,
        commits: 2,
        createdAt: '2025-01-07T10:30:00Z',
        deletions: 25,
        draft: false,
        headRefName: 'feature/cli-test',
        id: 'cli_pr_321',
        labels: ['cli', 'feature'],
        locked: false,
        mergeable: 'true',
        merged: false,
        mergedAt: null,
        milestone: 'CLI v1.0',
        number: 88,
        repository: 'cli/awesome-tool',
        requestedReviewers: ['cli-reviewer'],
        reviewComments: 1,
        state: 'open',
        title: 'CLI PR Title',
        updatedAt: '2025-01-08T14:15:00Z',
        url: 'https://github.com/cli/awesome-tool/pull/88',
        user: { login: 'cli-user' }
      }

      const dto = PullRequestDataDTO.fromCliOutput(cliOutput)

      expect(dto.id).toBe('cli_pr_321')
      expect(dto.number).toBe(88)
      expect(dto.title).toBe('CLI PR Title')
      expect(dto.body).toBe('CLI PR body')
      expect(dto.state).toBe('open')
      expect(dto.assignees).toEqual(['cli-dev'])
      expect(dto.requestedReviewers).toEqual(['cli-reviewer'])
      expect(dto.labels).toEqual(['cli', 'feature'])
      expect(dto.milestone).toBe('CLI v1.0')
      expect(dto.creator).toBe('cli-user')
      expect(dto.repository).toBe('cli/awesome-tool')
      expect(dto.headBranch).toBe('feature/cli-test')
      expect(dto.baseBranch).toBe('develop')
      expect(dto.mergeable).toBe(true) // 'true' -> true
      expect(dto.additions).toBe(95)
      expect(dto.deletions).toBe(25)
    })

    it('should handle minimal CLI output', () => {
      const minimalOutput = {
        id: 'cli_minimal_111',
        number: 5,
        title: 'Minimal CLI PR'
      }

      const dto = PullRequestDataDTO.fromCliOutput(minimalOutput)

      expect(dto.id).toBe('cli_minimal_111')
      expect(dto.title).toBe('Minimal CLI PR')
      expect(dto.body).toBe('')
      expect(dto.assignees).toEqual([])
      expect(dto.labels).toEqual([])
      expect(dto.creator).toBe('unknown')
      expect(dto.baseBranch).toBe('main') // Default
    })

    it('should handle malformed CLI output with missing fields', () => {
      // Test defensive handling of malformed but validly-typed CLI output
      const dto = PullRequestDataDTO.fromCliOutput({})
      
      expect(dto.id).toBe('unknown')
      expect(dto.title).toBe('Untitled Pull Request')
      expect(dto.creator).toBe('unknown')
    })
  })

  describe('utility methods', () => {
    let openPr: PullRequestDataDTO
    let mergedPr: PullRequestDataDTO
    let draftPr: PullRequestDataDTO

    beforeEach(() => {
      openPr = new PullRequestDataDTO(
        'open_123', 10, 'Open PR', 'Open body', 'open', false, false, false, true,
        ['alice'], ['reviewer'], ['bug', 'urgent'], 'v1.0', 'creator', null,
        'owner/repo', 'https://github.com/owner/repo/pull/10', 'feature', 'main',
        5, 3, 2, 100, 50, 4, new Date('2025-01-01T00:00:00Z'), new Date('2025-01-05T00:00:00Z'), null, null
      )

      mergedPr = new PullRequestDataDTO(
        'merged_456', 20, 'Merged PR', 'Merged body', 'closed', false, false, true, null,
        ['bob'], [], ['enhancement'], null, 'contributor', 'maintainer',
        'owner/repo', 'https://github.com/owner/repo/pull/20', 'feature', 'main',
        8, 2, 3, 200, 75, 6, new Date('2024-12-15T00:00:00Z'), new Date('2024-12-20T00:00:00Z'),
        new Date('2024-12-20T00:00:00Z'), new Date('2024-12-20T00:00:00Z')
      )

      draftPr = new PullRequestDataDTO(
        'draft_789', 30, 'Draft PR', 'Draft body', 'open', true, false, false, null,
        [], [], ['wip'], null, 'developer', null,
        'owner/repo', 'https://github.com/owner/repo/pull/30', 'wip', 'main',
        2, 0, 1, 25, 10, 2, new Date('2025-01-03T00:00:00Z'), new Date('2025-01-07T00:00:00Z'), null, null
      )
    })

    it('should identify PR states correctly', () => {
      expect(openPr.isOpen()).toBe(true)
      expect(openPr.isClosed()).toBe(false)
      expect(openPr.isMerged()).toBe(false)
      expect(openPr.isDraft()).toBe(false)

      expect(mergedPr.isOpen()).toBe(false)
      expect(mergedPr.isClosed()).toBe(true)
      expect(mergedPr.isMerged()).toBe(true)
      expect(mergedPr.isDraft()).toBe(false)

      expect(draftPr.isOpen()).toBe(true)
      expect(draftPr.isClosed()).toBe(false)
      expect(draftPr.isMerged()).toBe(false)
      expect(draftPr.isDraft()).toBe(true)
    })

    it('should check readiness for review', () => {
      expect(openPr.isReadyForReview()).toBe(true)
      expect(mergedPr.isReadyForReview()).toBe(false) // closed
      expect(draftPr.isReadyForReview()).toBe(false) // draft
    })

    it('should check assignee correctly', () => {
      expect(openPr.isAssignedTo('alice')).toBe(true)
      expect(openPr.isAssignedTo('bob')).toBe(false)
      expect(mergedPr.isAssignedTo('bob')).toBe(true)
    })

    it('should check requested reviewers correctly', () => {
      expect(openPr.isRequestedReviewer('reviewer')).toBe(true)
      expect(openPr.isRequestedReviewer('alice')).toBe(false)
      expect(mergedPr.isRequestedReviewer('anyone')).toBe(false)
    })

    it('should check labels correctly', () => {
      expect(openPr.hasLabel('bug')).toBe(true)
      expect(openPr.hasLabel('urgent')).toBe(true)
      expect(openPr.hasLabel('enhancement')).toBe(false)
      expect(mergedPr.hasLabel('enhancement')).toBe(true)
      expect(draftPr.hasLabel('wip')).toBe(true)
    })

    it('should generate correct summary', () => {
      expect(openPr.getSummary()).toBe('PR #10: Open PR (open) [bug, urgent]')
      expect(mergedPr.getSummary()).toBe('PR #20: Merged PR (merged) [enhancement]')
      expect(draftPr.getSummary()).toBe('draft PR #30: Draft PR (open) [wip]')
    })

    it('should calculate net changes correctly', () => {
      expect(openPr.getNetChanges()).toBe(50) // 100 - 50
      expect(mergedPr.getNetChanges()).toBe(125) // 200 - 75
      expect(draftPr.getNetChanges()).toBe(15) // 25 - 10
    })

    it('should calculate age correctly', () => {
      const age = openPr.getAgeInDays()
      expect(age).toBeGreaterThan(0)
      expect(age).toBeLessThan(365) // Less than a year
    })

    it('should calculate days since update', () => {
      const daysSince = openPr.getDaysSinceUpdate()
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365)
    })

    it('should calculate days since closure for closed PRs', () => {
      expect(openPr.getDaysSinceClosure()).toBeNull()
      
      const daysSinceClosure = mergedPr.getDaysSinceClosure()
      expect(daysSinceClosure).toBeGreaterThan(0)
      expect(daysSinceClosure).toBeLessThan(365)
    })

    it('should calculate days since merge for merged PRs', () => {
      expect(openPr.getDaysSinceMerge()).toBeNull()
      expect(draftPr.getDaysSinceMerge()).toBeNull()
      
      const daysSinceMerge = mergedPr.getDaysSinceMerge()
      expect(daysSinceMerge).toBeGreaterThan(0)
      expect(daysSinceMerge).toBeLessThan(365)
    })

    it('should detect recent activity', () => {
      // Create PR with very recent update
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      const recentPr = new PullRequestDataDTO(
        'recent_789', 40, 'Recent PR', 'Body', 'open', false, false, false, true,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), recentDate, null, null
      )

      expect(recentPr.hasRecentActivity(7)).toBe(true)
      expect(recentPr.hasRecentActivity(1)).toBe(false)
    })

    it('should detect stale PRs', () => {
      // Create PR with old update
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      const stalePr = new PullRequestDataDTO(
        'stale_999', 50, 'Stale PR', 'Body', 'open', false, false, false, true,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), oldDate, null, null
      )

      expect(stalePr.isStale(30)).toBe(true)
      expect(stalePr.isStale(60)).toBe(false)
    })
  })

  describe('edge cases and validation', () => {
    it('should handle unicode and special characters', () => {
      const dto = new PullRequestDataDTO(
        'unicode_123', 60, 'PR with émojis 🚀 and 中文', 'Body contains "quotes" and \'apostrophes\'',
        'open', false, false, false, true, ['用户-alice', 'bob-développeur'], ['reviewer-用户'],
        ['emoji-🚀', '中文-label'], 'milestone-v2.0', 'creator-用户', null,
        'special-org/repo_name', 'https://github.com/special-org/repo_name/pull/60',
        'feature-émoji', 'main-中文', 0, 0, 1, 50, 20, 3, new Date(), new Date(), null, null
      )

      expect(dto.title).toBe('PR with émojis 🚀 and 中文')
      expect(dto.body).toBe('Body contains "quotes" and \'apostrophes\'')
      expect(dto.assignees).toContain('用户-alice')
      expect(dto.labels).toContain('emoji-🚀')
      expect(dto.headBranch).toBe('feature-émoji')
      expect(dto.baseBranch).toBe('main-中文')

      const llmData = dto.toLLMData()
      expect(llmData.PR_TITLE).toBe('PR with émojis 🚀 and 中文')
      expect(llmData.PR_ASSIGNEES).toBe('用户-alice, bob-développeur')
    })

    it('should handle very large numbers', () => {
      const dto = new PullRequestDataDTO(
        'large_123', 999_999, 'Large Number PR', 'Body', 'open', false, false, false, true,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        1000, 500, 100, 10_000, 5000, 250, new Date(), new Date(), null, null
      )

      expect(dto.number).toBe(999_999)
      expect(dto.additions).toBe(10_000)
      expect(dto.deletions).toBe(5000)
      expect(dto.changedFiles).toBe(250)
      
      const llmData = dto.toLLMData()
      expect(llmData.PR_NUMBER).toBe('999999')
      expect(llmData.PR_ADDITIONS).toBe('10000')
      expect(llmData.PR_DELETIONS).toBe('5000')
      expect(llmData.PR_CHANGED_FILES).toBe('250')
    })

    it('should handle mergeable states correctly', () => {
      const mergeableTrue = new PullRequestDataDTO(
        'mergeable_true', 1, 'Title', 'Body', 'open', false, false, false, true,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), new Date(), null, null
      )

      const mergeableFalse = new PullRequestDataDTO(
        'mergeable_false', 2, 'Title', 'Body', 'open', false, false, false, false,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), new Date(), null, null
      )

      const mergeableUnknown = new PullRequestDataDTO(
        'mergeable_unknown', 3, 'Title', 'Body', 'open', false, false, false, null,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), new Date(), null, null
      )

      expect(mergeableTrue.mergeable).toBe(true)
      expect(mergeableFalse.mergeable).toBe(false)
      expect(mergeableUnknown.mergeable).toBeNull()

      const llmDataTrue = mergeableTrue.toLLMData()
      const llmDataFalse = mergeableFalse.toLLMData()
      const llmDataUnknown = mergeableUnknown.toLLMData()

      expect(llmDataTrue.PR_MERGEABLE).toBe('true')
      expect(llmDataFalse.PR_MERGEABLE).toBe('false')
      expect(llmDataUnknown.PR_MERGEABLE).toBe('')
    })

    it('should handle long PR bodies', () => {
      const longBody = 'A'.repeat(10_000) // Very long body
      const dto = new PullRequestDataDTO(
        'long_123', 1, 'Long PR', longBody, 'open', false, false, false, true,
        [], [], [], null, 'user', null, 'owner/repo', 'url', 'feature', 'main',
        0, 0, 1, 10, 5, 1, new Date(), new Date(), null, null
      )

      expect(dto.body).toBe(longBody)
      expect(dto.body.length).toBe(10_000)
      
      const llmData = dto.toLLMData()
      expect(llmData.PR_BODY).toBe(longBody)
    })
  })
})