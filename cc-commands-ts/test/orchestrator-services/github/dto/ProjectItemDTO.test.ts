/**
 * @file Unit tests for ProjectItemDTO
 * 
 * Tests the ProjectItemDTO class including constructor validation,
 * toLLMData method, factory methods, utility methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ProjectItemDTO } from '../../../../src/orchestrator-services/github/dto/ProjectItemDTO.js'

describe('ProjectItemDTO', () => {
  const validProjectItemData = {
    assignees: ['alice', 'bob'],
    contentId: 'issue_123',
    contentRepository: 'owner/repo',
    contentState: 'open',
    contentTitle: 'Fix authentication bug',
    contentType: 'Issue' as const,
    contentUrl: 'https://github.com/owner/repo/issues/42',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    creator: 'alice',
    fieldValues: { Priority: 'High', Status: 'In Progress' },
    id: 'item_456',
    isArchived: false,
    labels: ['bug', 'authentication'],
    milestone: 'v2.0',
    number: 42,
    projectId: 'project_789',
    repositoryName: 'repo',
    status: 'In Progress',
    type: 'ISSUE' as const,
    updatedAt: new Date('2025-01-12T14:30:00Z')
  }

  describe('constructor', () => {
    it('should create a valid ProjectItemDTO instance', () => {
      const dto = new ProjectItemDTO(
        validProjectItemData.id,
        validProjectItemData.projectId,
        validProjectItemData.type,
        validProjectItemData.contentId,
        validProjectItemData.contentType,
        validProjectItemData.contentTitle,
        validProjectItemData.contentUrl,
        validProjectItemData.contentState,
        validProjectItemData.repositoryName,
        validProjectItemData.contentRepository,
        validProjectItemData.number,
        validProjectItemData.status,
        validProjectItemData.labels,
        validProjectItemData.assignees,
        validProjectItemData.milestone,
        validProjectItemData.creator,
        validProjectItemData.fieldValues,
        validProjectItemData.isArchived,
        validProjectItemData.createdAt,
        validProjectItemData.updatedAt
      )

      expect(dto.id).toBe('item_456')
      expect(dto.projectId).toBe('project_789')
      expect(dto.type).toBe('ISSUE')
      expect(dto.contentTitle).toBe('Fix authentication bug')
      expect(dto.labels).toEqual(['bug', 'authentication'])
      expect(dto.assignees).toEqual(['alice', 'bob'])
      expect(dto.fieldValues).toEqual({ Priority: 'High', Status: 'In Progress' })
    })

    it('should handle draft issue with null content fields', () => {
      const dto = new ProjectItemDTO(
        'draft_123',
        'project_789',
        'DRAFT_ISSUE',
        null, // no content ID
        'DraftIssue',
        'New feature idea',
        null, // no URL
        null, // no state
        null, // no repository
        null, // no repository
        null, // no number
        'Todo',
        [], // no labels
        [], // no assignees
        null, // no milestone
        null, // no creator
        { Status: 'Todo' },
        false,
        validProjectItemData.createdAt,
        validProjectItemData.updatedAt
      )

      expect(dto.type).toBe('DRAFT_ISSUE')
      expect(dto.contentId).toBeNull()
      expect(dto.contentUrl).toBeNull()
      expect(dto.repositoryName).toBeNull()
      expect(dto.number).toBeNull()
      expect(dto.labels).toEqual([])
      expect(dto.assignees).toEqual([])
    })

    it('should handle pull request items', () => {
      const dto = new ProjectItemDTO(
        'pr_item_789',
        'project_123',
        'PULL_REQUEST',
        'pr_456',
        'PullRequest',
        'Add new feature',
        'https://github.com/owner/repo/pull/15',
        'draft',
        'repo',
        'owner/repo',
        15,
        'Review',
        ['enhancement', 'feature'],
        ['developer'],
        null,
        'developer',
        { Priority: 'Medium', Status: 'Review' },
        false,
        validProjectItemData.createdAt,
        validProjectItemData.updatedAt
      )

      expect(dto.type).toBe('PULL_REQUEST')
      expect(dto.contentType).toBe('PullRequest')
      expect(dto.contentState).toBe('draft')
      expect(dto.number).toBe(15)
      expect(dto.hasLabel('enhancement')).toBe(true)
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new ProjectItemDTO(
        validProjectItemData.id,
        validProjectItemData.projectId,
        validProjectItemData.type,
        validProjectItemData.contentId,
        validProjectItemData.contentType,
        validProjectItemData.contentTitle,
        validProjectItemData.contentUrl,
        validProjectItemData.contentState,
        validProjectItemData.repositoryName,
        validProjectItemData.contentRepository,
        validProjectItemData.number,
        validProjectItemData.status,
        validProjectItemData.labels,
        validProjectItemData.assignees,
        validProjectItemData.milestone,
        validProjectItemData.creator,
        validProjectItemData.fieldValues,
        validProjectItemData.isArchived,
        validProjectItemData.createdAt,
        validProjectItemData.updatedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.PROJECT_ITEM_ID).toBe('item_456')
      expect(llmData.PROJECT_ITEM_PROJECT_ID).toBe('project_789')
      expect(llmData.PROJECT_ITEM_TYPE).toBe('ISSUE')
      expect(llmData.PROJECT_ITEM_CONTENT_ID).toBe('issue_123')
      expect(llmData.PROJECT_ITEM_CONTENT_TYPE).toBe('Issue')
      expect(llmData.PROJECT_ITEM_CONTENT_TITLE).toBe('Fix authentication bug')
      expect(llmData.PROJECT_ITEM_CONTENT_URL).toBe('https://github.com/owner/repo/issues/42')
      expect(llmData.PROJECT_ITEM_CONTENT_STATE).toBe('open')
      expect(llmData.PROJECT_ITEM_REPOSITORY_NAME).toBe('repo')
      expect(llmData.PROJECT_ITEM_CONTENT_REPOSITORY).toBe('owner/repo')
      expect(llmData.PROJECT_ITEM_NUMBER).toBe('42')
      expect(llmData.PROJECT_ITEM_STATUS).toBe('In Progress')
      expect(llmData.PROJECT_ITEM_LABELS).toBe('bug, authentication')
      expect(llmData.PROJECT_ITEM_ASSIGNEES).toBe('alice, bob')
      expect(llmData.PROJECT_ITEM_MILESTONE).toBe('v2.0')
      expect(llmData.PROJECT_ITEM_CREATOR).toBe('alice')
      const fieldValues = JSON.parse(llmData.PROJECT_ITEM_FIELD_VALUES)
      expect(fieldValues).toEqual({ Priority: 'High', Status: 'In Progress' })
      expect(llmData.PROJECT_ITEM_ARCHIVED).toBe('false')
      expect(llmData.PROJECT_ITEM_CREATED_AT).toBe('2025-01-10T10:00:00.000Z')
      expect(llmData.PROJECT_ITEM_UPDATED_AT).toBe('2025-01-12T14:30:00.000Z')
    })

    it('should handle null values in toLLMData', () => {
      const dto = new ProjectItemDTO(
        'draft_123',
        'project_789',
        'DRAFT_ISSUE',
        null, // no content
        null, // no content type
        'Draft item',
        null, // no URL
        null, // no state
        null, // no repository
        null, // no repository
        null, // no number
        null, // no status
        [], // no labels
        [], // no assignees
        null, // no milestone
        null, // no creator
        {}, // no field values
        false,
        validProjectItemData.createdAt,
        validProjectItemData.updatedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.PROJECT_ITEM_CONTENT_ID).toBe('')
      expect(llmData.PROJECT_ITEM_CONTENT_TYPE).toBe('')
      expect(llmData.PROJECT_ITEM_CONTENT_URL).toBe('')
      expect(llmData.PROJECT_ITEM_CONTENT_STATE).toBe('')
      expect(llmData.PROJECT_ITEM_REPOSITORY_NAME).toBe('')
      expect(llmData.PROJECT_ITEM_NUMBER).toBe('')
      expect(llmData.PROJECT_ITEM_STATUS).toBe('')
      expect(llmData.PROJECT_ITEM_LABELS).toBe('')
      expect(llmData.PROJECT_ITEM_ASSIGNEES).toBe('')
      expect(llmData.PROJECT_ITEM_MILESTONE).toBe('')
      expect(llmData.PROJECT_ITEM_CREATOR).toBe('')
      expect(llmData.PROJECT_ITEM_FIELD_VALUES).toBe('{}')
    })
  })

  describe('fromGraphQLResponse', () => {
    it('should create DTO from valid GraphQL response', () => {
      const graphqlResponse = {
        content: {
          __typename: 'Issue',
          assignees: {
            nodes: [
              { login: 'alice' },
              { login: 'bob' }
            ]
          },
          author: {
            login: 'reporter'
          },
          id: 'I_456',
          labels: {
            nodes: [
              { name: 'bug' },
              { name: 'security' }
            ]
          },
          milestone: {
            title: 'v1.5'
          },
          number: 25,
          repository: {
            name: 'repo',
            nameWithOwner: 'owner/repo'
          },
          state: 'OPEN',
          title: 'Bug in login system',
          url: 'https://github.com/owner/repo/issues/25'
        },
        createdAt: '2025-01-08T09:00:00Z',
        fieldValues: {
          nodes: [
            {
              field: { name: 'Status' },
              value: 'In Progress'
            },
            {
              field: { name: 'Priority' },
              value: 'High'
            }
          ]
        },
        id: 'PVTI_123',
        isArchived: false,
        type: 'ISSUE',
        updatedAt: '2025-01-10T15:00:00Z'
      }

      const dto = ProjectItemDTO.fromGraphQLResponse(graphqlResponse, 'project_789')

      expect(dto.id).toBe('PVTI_123')
      expect(dto.projectId).toBe('project_789')
      expect(dto.type).toBe('ISSUE')
      expect(dto.contentId).toBe('I_456')
      expect(dto.contentType).toBe('Issue')
      expect(dto.contentTitle).toBe('Bug in login system')
      expect(dto.contentUrl).toBe('https://github.com/owner/repo/issues/25')
      expect(dto.contentState).toBe('OPEN')
      expect(dto.repositoryName).toBe('repo')
      expect(dto.contentRepository).toBe('owner/repo')
      expect(dto.number).toBe(25)
      expect(dto.status).toBe('In Progress')
      expect(dto.labels).toEqual(['bug', 'security'])
      expect(dto.assignees).toEqual(['alice', 'bob'])
      expect(dto.milestone).toBe('v1.5')
      expect(dto.creator).toBe('reporter')
      expect(dto.fieldValues).toEqual({ Priority: 'High', Status: 'In Progress' })
      expect(dto.isArchived).toBe(false)
    })

    it('should handle pull request from GraphQL response', () => {
      const graphqlResponse = {
        content: {
          __typename: 'PullRequest',
          assignees: {
            nodes: [{ login: 'developer' }]
          },
          author: {
            login: 'contributor'
          },
          id: 'PR_101',
          labels: {
            nodes: [{ name: 'enhancement' }]
          },
          number: 12,
          repository: {
            name: 'repo',
            nameWithOwner: 'owner/repo'
          },
          state: 'OPEN',
          title: 'Add new feature',
          url: 'https://github.com/owner/repo/pull/12'
        },
        createdAt: '2025-01-09T11:00:00Z',
        fieldValues: {
          nodes: []
        },
        id: 'PVTI_PR_789',
        isArchived: false,
        type: 'PULL_REQUEST',
        updatedAt: '2025-01-11T16:00:00Z'
      }

      const dto = ProjectItemDTO.fromGraphQLResponse(graphqlResponse, 'project_123')

      expect(dto.type).toBe('PULL_REQUEST')
      expect(dto.contentType).toBe('PullRequest')
      expect(dto.isPullRequest()).toBe(true)
      expect(dto.isIssue()).toBe(false)
      expect(dto.isDraft()).toBe(false)
    })

    it('should handle draft issue from GraphQL response', () => {
      const graphqlResponse = {
        content: {
          __typename: 'DraftIssue',
          title: 'Feature idea'
        },
        createdAt: '2025-01-05T14:00:00Z',
        fieldValues: {
          nodes: [
            {
              field: { name: 'Status' },
              value: 'Backlog'
            }
          ]
        },
        id: 'PVTI_DRAFT_456',
        isArchived: false,
        type: 'DRAFT_ISSUE',
        updatedAt: '2025-01-06T10:00:00Z'
      }

      const dto = ProjectItemDTO.fromGraphQLResponse(graphqlResponse, 'project_456')

      expect(dto.type).toBe('DRAFT_ISSUE')
      expect(dto.contentType).toBe('DraftIssue')
      expect(dto.isDraft()).toBe(true)
      expect(dto.hasContent()).toBe(false)
      expect(dto.contentUrl).toBeNull()
      expect(dto.repositoryName).toBeNull()
      expect(dto.number).toBeNull()
    })

    it('should handle minimal GraphQL response', () => {
      const minimalResponse = {
        createdAt: '2025-01-01T00:00:00Z',
        id: 'PVTI_MIN_999',
        updatedAt: '2025-01-01T00:00:00Z'
      }

      const dto = ProjectItemDTO.fromGraphQLResponse(minimalResponse, 'project_min')

      expect(dto.id).toBe('PVTI_MIN_999')
      expect(dto.projectId).toBe('project_min')
      expect(dto.type).toBe('ISSUE') // Default type
      expect(dto.contentTitle).toBe('Untitled')
      expect(dto.labels).toEqual([])
      expect(dto.assignees).toEqual([])
      expect(dto.fieldValues).toEqual({})
    })

    it('should throw error for invalid GraphQL response', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ProjectItemDTO.fromGraphQLResponse(null as any, 'project_123')
      }).toThrow('Invalid GitHub Project Item GraphQL response: response is null, undefined, or not an object')

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ProjectItemDTO.fromGraphQLResponse({} as any, 'project_123')
      }).toThrow('Invalid GitHub Project Item GraphQL response: missing required field: id')
    })
  })

  describe('fromCliOutput', () => {
    it('should create DTO from valid CLI output', () => {
      const cliOutput = {
        archived: false,
        content: {
          assignees: ['maintainer'],
          author: 'user',
          id: 'CLI_ISSUE_456',
          labels: ['bug', 'cli'],
          milestone: 'v2.1',
          number: 30,
          repositoryName: 'repo',
          state: 'open',
          title: 'CLI reported bug',
          url: 'https://github.com/owner/repo/issues/30'
        },
        createdAt: '2025-01-07T12:00:00Z',
        fields: {
          Priority: 'Medium',
          Status: 'Todo'
        },
        id: 'CLI_ITEM_123',
        type: 'ISSUE',
        updatedAt: '2025-01-08T18:00:00Z'
      }

      const dto = ProjectItemDTO.fromCliOutput(cliOutput, 'project_cli')

      expect(dto.id).toBe('CLI_ITEM_123')
      expect(dto.projectId).toBe('project_cli')
      expect(dto.type).toBe('ISSUE')
      expect(dto.contentTitle).toBe('CLI reported bug')
      expect(dto.contentUrl).toBe('https://github.com/owner/repo/issues/30')
      expect(dto.repositoryName).toBe('repo')
      expect(dto.number).toBe(30)
      expect(dto.labels).toEqual(['bug', 'cli'])
      expect(dto.assignees).toEqual(['maintainer'])
      expect(dto.milestone).toBe('v2.1')
      expect(dto.creator).toBe('user')
      expect(dto.fieldValues).toEqual({ Priority: 'Medium', Status: 'Todo' })
    })

    it('should handle minimal CLI output', () => {
      const minimalOutput = {
        id: 'CLI_MIN_789'
      }

      const dto = ProjectItemDTO.fromCliOutput(minimalOutput, 'project_min')

      expect(dto.id).toBe('CLI_MIN_789')
      expect(dto.contentTitle).toBe('Untitled')
      expect(dto.labels).toEqual([])
      expect(dto.assignees).toEqual([])
      expect(dto.fieldValues).toEqual({})
    })

    it('should throw error for invalid CLI output', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ProjectItemDTO.fromCliOutput(null as any, 'project_123')
      }).toThrow('Invalid GitHub CLI project item output: output is null, undefined, or not an object')

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ProjectItemDTO.fromCliOutput({} as any, 'project_123')
      }).toThrow('Invalid GitHub CLI project item output: missing required field: id')
    })
  })

  describe('createDraftIssue', () => {
    it('should create draft issue DTO', () => {
      const dto = ProjectItemDTO.createDraftIssue(
        'draft_new_123',
        'project_drafts',
        'New feature proposal',
        { Priority: 'Low', Status: 'Backlog' }
      )

      expect(dto.id).toBe('draft_new_123')
      expect(dto.projectId).toBe('project_drafts')
      expect(dto.type).toBe('DRAFT_ISSUE')
      expect(dto.contentType).toBe('DraftIssue')
      expect(dto.contentTitle).toBe('New feature proposal')
      expect(dto.contentId).toBeNull()
      expect(dto.contentUrl).toBeNull()
      expect(dto.repositoryName).toBeNull()
      expect(dto.number).toBeNull()
      expect(dto.fieldValues).toEqual({ Priority: 'Low', Status: 'Backlog' })
      expect(dto.status).toBe('Backlog')
      expect(dto.isDraft()).toBe(true)
    })

    it('should create draft issue with default field values', () => {
      const dto = ProjectItemDTO.createDraftIssue('draft_default', 'project_123', 'Simple draft')

      expect(dto.fieldValues).toEqual({})
      expect(dto.status).toBeNull()
    })
  })

  describe('utility methods', () => {
    let issueDto: ProjectItemDTO
    let prDto: ProjectItemDTO
    let draftDto: ProjectItemDTO

    beforeEach(() => {
      issueDto = new ProjectItemDTO(
        'issue_123', 'project_789', 'ISSUE', 'content_456', 'Issue',
        'Bug report', 'https://github.com/owner/repo/issues/1', 'open',
        'repo', 'owner/repo', 1, 'In Progress', ['bug'], ['alice'],
        'v1.0', 'reporter', { Status: 'In Progress' }, false,
        new Date('2025-01-01T00:00:00Z'), new Date('2025-01-05T00:00:00Z')
      )

      prDto = new ProjectItemDTO(
        'pr_456', 'project_789', 'PULL_REQUEST', 'pr_789', 'PullRequest',
        'New feature', 'https://github.com/owner/repo/pull/2', 'draft',
        'repo', 'owner/repo', 2, 'Review', ['enhancement'], ['bob'],
        null, 'dev', { Status: 'Review' }, false,
        new Date('2025-01-02T00:00:00Z'), new Date('2025-01-06T00:00:00Z')
      )

      draftDto = new ProjectItemDTO(
        'draft_789', 'project_789', 'DRAFT_ISSUE', null, 'DraftIssue',
        'Feature idea', null, null, null, null, null, 'Backlog',
        [], [], null, null, { Status: 'Backlog' }, false,
        new Date('2025-01-03T00:00:00Z'), new Date('2025-01-07T00:00:00Z')
      )
    })

    it('should identify item types correctly', () => {
      expect(issueDto.isIssue()).toBe(true)
      expect(issueDto.isPullRequest()).toBe(false)
      expect(issueDto.isDraft()).toBe(false)

      expect(prDto.isIssue()).toBe(false)
      expect(prDto.isPullRequest()).toBe(true)
      expect(prDto.isDraft()).toBe(false)

      expect(draftDto.isIssue()).toBe(false)
      expect(draftDto.isPullRequest()).toBe(false)
      expect(draftDto.isDraft()).toBe(true)
    })

    it('should check content availability', () => {
      expect(issueDto.hasContent()).toBe(true)
      expect(prDto.hasContent()).toBe(true)
      expect(draftDto.hasContent()).toBe(false)
    })

    it('should check status correctly', () => {
      expect(issueDto.hasStatus('In Progress')).toBe(true)
      expect(issueDto.hasStatus('Done')).toBe(false)
      expect(prDto.hasStatus('Review')).toBe(true)
      expect(draftDto.hasStatus('Backlog')).toBe(true)
    })

    it('should check assignee correctly', () => {
      expect(issueDto.isAssignedTo('alice')).toBe(true)
      expect(issueDto.isAssignedTo('bob')).toBe(false)
      expect(prDto.isAssignedTo('bob')).toBe(true)
      expect(draftDto.isAssignedTo('anyone')).toBe(false)
    })

    it('should check labels correctly', () => {
      expect(issueDto.hasLabel('bug')).toBe(true)
      expect(issueDto.hasLabel('enhancement')).toBe(false)
      expect(prDto.hasLabel('enhancement')).toBe(true)
      expect(draftDto.hasLabel('anything')).toBe(false)
    })

    it('should generate correct summary', () => {
      expect(issueDto.getSummary()).toBe('issue: Bug report (In Progress) [repo]')
      expect(prDto.getSummary()).toBe('pull request: New feature (Review) [repo]')
      expect(draftDto.getSummary()).toBe('draft issue: Feature idea (Backlog)')
    })

    it('should get correct type display names', () => {
      expect(issueDto.getTypeDisplayName()).toBe('Issue')
      expect(prDto.getTypeDisplayName()).toBe('Pull Request')
      expect(draftDto.getTypeDisplayName()).toBe('Draft Issue')
    })

    it('should calculate age correctly', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const age = issueDto.getAgeInDays()
      expect(age).toBeGreaterThan(0)
      expect(age).toBeLessThan(365) // Less than a year
    })

    it('should calculate days since update', () => {
      const daysSince = issueDto.getDaysSinceUpdate()
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365) // Less than a year
    })
  })

  describe('edge cases and validation', () => {
    it('should handle empty field values object', () => {
      const dto = new ProjectItemDTO(
        'empty_123', 'project_789', 'ISSUE', 'content_456', 'Issue',
        'Empty item', 'https://github.com/owner/repo/issues/1', 'open',
        'repo', 'owner/repo', 1, null, [], [], null, null,
        {}, // empty field values
        false, new Date(), new Date()
      )

      const llmData = dto.toLLMData()
      expect(llmData.PROJECT_ITEM_FIELD_VALUES).toBe('{}')
      expect(dto.status).toBeNull()
    })

    it('should handle unicode and special characters', () => {
      const dto = new ProjectItemDTO(
        'unicode_123', 'project_789', 'ISSUE', 'content_456', 'Issue',
        'Bug with émoji 🐛 and 中文', 'https://github.com/owner/repo/issues/1', 'open',
        'special-repo_name', 'owner/special-repo_name', 1, 'In Progress',
        ['bug-🐛', '中文-label'], ['用户-alice', 'bob-développeur'],
        'milestone-v2.0', 'creator-用户', { 'Status-状态': 'In Progress-进行中' },
        false, new Date(), new Date()
      )

      expect(dto.contentTitle).toBe('Bug with émoji 🐛 and 中文')
      expect(dto.labels).toContain('bug-🐛')
      expect(dto.labels).toContain('中文-label')
      expect(dto.assignees).toContain('用户-alice')
      expect(dto.assignees).toContain('bob-développeur')

      const llmData = dto.toLLMData()
      expect(llmData.PROJECT_ITEM_CONTENT_TITLE).toBe('Bug with émoji 🐛 and 中文')
      expect(llmData.PROJECT_ITEM_LABELS).toBe('bug-🐛, 中文-label')
      expect(llmData.PROJECT_ITEM_ASSIGNEES).toBe('用户-alice, bob-développeur')
    })

    it('should handle very large numbers', () => {
      const dto = new ProjectItemDTO(
        'large_123', 'project_789', 'ISSUE', 'content_456', 'Issue',
        'Large number issue', 'https://github.com/owner/repo/issues/999999', 'open',
        'repo', 'owner/repo', 999_999, 'Open', [], [], null, null, {},
        false, new Date(), new Date()
      )

      expect(dto.number).toBe(999_999)
      const llmData = dto.toLLMData()
      expect(llmData.PROJECT_ITEM_NUMBER).toBe('999999')
    })

    it('should handle complex field values', () => {
      const complexFieldValues = {
        'Boolean': 'true',
        'JSON-like': '{"nested": "value"}',
        'Multi Word Field': 'Multi word value',
        'Numbers': '42',
        'Special-Chars': 'Value with "quotes" and \'apostrophes\''
      }

      const dto = new ProjectItemDTO(
        'complex_123', 'project_789', 'ISSUE', 'content_456', 'Issue',
        'Complex item', 'https://github.com/owner/repo/issues/1', 'open',
        'repo', 'owner/repo', 1, 'Multi Word Field', [], [], null, null,
        complexFieldValues, false, new Date(), new Date()
      )

      expect(dto.fieldValues).toEqual(complexFieldValues)
      expect(dto.status).toBe('Multi Word Field')

      const llmData = dto.toLLMData()
      const parsedFieldValues = JSON.parse(llmData.PROJECT_ITEM_FIELD_VALUES)
      expect(parsedFieldValues).toEqual(complexFieldValues)
    })
  })
})