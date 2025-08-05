/**
 * @file ProjectV2ItemDTO Tests
 * 
 * TDD APPROACH: These tests are based on stub assumptions.
 * When real GraphQL API calls are made, failing tests will reveal the actual structure.
 */

import { describe, expect, it } from 'vitest'

import { ProjectV2ItemDTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2ItemDTO'
import { ProjectV2ItemGraphQLResponse } from '../../../../src/orchestrator-services/github/types/GitHubGraphQLTypes'

describe('ProjectV2ItemDTO', () => {
  describe('fromGraphQLResponse', () => {
    it('should create DTO from issue item response', () => {
      // STUB: This response structure is our initial assumption
      const stubResponse: ProjectV2ItemGraphQLResponse = {
        __typename: 'ProjectV2Item',
        content: {
          __typename: 'Issue',
          id: 'I_kwHOABXVks4Af-jq',
          repository: {
            nameWithOwner: 'test-org/test-repo'
          },
          title: 'Test Issue',
          url: 'https://github.com/test-org/test-repo/issues/1'
        },
        fieldValues: {
          nodes: [
            {
              __typename: 'ProjectV2ItemFieldTextValue',
              field: {
                __typename: 'ProjectV2Field',
                id: 'PVTF_lAHOABXVks4Af-jq',
                name: 'Status'
              },
              text: 'In Progress'
            },
            {
              __typename: 'ProjectV2ItemFieldSingleSelectValue',
              field: {
                __typename: 'ProjectV2SingleSelectField',
                id: 'PVTSSF_lAHOABXVks4Af-jq',
                name: 'Priority'
              },
              name: 'High'
            }
          ]
        },
        id: 'PVTI_lAHOABXVks4Af-jqzgNDCGY',
        type: 'ISSUE'
      }

      const dto = ProjectV2ItemDTO.fromGraphQLResponse(stubResponse)

      expect(dto.id).toBe('PVTI_lAHOABXVks4Af-jqzgNDCGY')
      expect(dto.type).toBe('ISSUE')
      expect(dto.title).toBe('Test Issue')
      expect(dto.url).toBe('https://github.com/test-org/test-repo/issues/1')
      expect(dto.repository).toBe('test-org/test-repo')
      expect(dto.fieldValues).toEqual({
        'Priority': 'High',
        'Status': 'In Progress'
      })
    })

    it('should handle pull request items', () => {
      const stubResponse: ProjectV2ItemGraphQLResponse = {
        __typename: 'ProjectV2Item',
        content: {
          __typename: 'PullRequest',
          id: 'PR_123',
          repository: {
            nameWithOwner: 'test-org/test-repo'
          },
          title: 'Fix bug in authentication',
          url: 'https://github.com/test-org/test-repo/pull/45'
        },
        fieldValues: {
          nodes: [
            {
              __typename: 'ProjectV2ItemFieldDateValue',
              date: '2023-12-31',
              field: {
                __typename: 'ProjectV2Field',
                id: 'PVTF_date123',
                name: 'Due Date'
              }
            }
          ]
        },
        id: 'PVTI_pr123',
        type: 'PULL_REQUEST'
      }

      const dto = ProjectV2ItemDTO.fromGraphQLResponse(stubResponse)

      expect(dto.type).toBe('PULL_REQUEST')
      expect(dto.title).toBe('Fix bug in authentication')
      expect(dto.getFieldValue('Due Date')).toBe('2023-12-31')
    })

    it('should handle draft issues without content', () => {
      const stubResponse: ProjectV2ItemGraphQLResponse = {
        __typename: 'ProjectV2Item',
        content: null,
        fieldValues: {
          nodes: [
            {
              __typename: 'ProjectV2ItemFieldTextValue',
              field: {
                __typename: 'ProjectV2Field',
                id: 'PVTF_title123',
                name: 'Title'
              },
              text: 'Draft: New feature idea'
            }
          ]
        },
        id: 'PVTI_draft123',
        type: 'DRAFT_ISSUE'
      }

      const dto = ProjectV2ItemDTO.fromGraphQLResponse(stubResponse)

      expect(dto.type).toBe('DRAFT_ISSUE')
      expect(dto.title).toBeNull()
      expect(dto.url).toBeNull()
      expect(dto.repository).toBeNull()
      expect(dto.hasContent()).toBe(false)
      expect(dto.getFieldValue('Title')).toBe('Draft: New feature idea')
    })

    it('should handle items with content but no repository', () => {
      // RED: This test reproduces the real-world error we encountered
      // Some project items have content (title, url) but no repository link
      const stubResponse: ProjectV2ItemGraphQLResponse = {
        __typename: 'ProjectV2Item',
        content: {
          __typename: 'Issue',
          id: 'I_kwHOABXVks4Af-jq',
          // repository is undefined - this causes the error
          title: 'Test Issue without repo link',
          url: 'https://github.com/test-org/test-repo/issues/1'
        },
        fieldValues: {
          nodes: [
            {
              __typename: 'ProjectV2ItemFieldTextValue',
              field: {
                __typename: 'ProjectV2Field',
                id: 'PVTF_status123',
                name: 'Status'
              },
              text: 'In Progress'
            }
          ]
        },
        id: 'PVTI_no_repo_123',
        type: 'ISSUE'
      }

      // This should NOT throw an error - it should handle missing repository gracefully
      expect(() => {
        const dto = ProjectV2ItemDTO.fromGraphQLResponse(stubResponse)
        expect(dto.repository).toBeNull() // Should be null, not cause a crash
        expect(dto.title).toBe('Test Issue without repo link')
        expect(dto.url).toBe('https://github.com/test-org/test-repo/issues/1')
      }).not.toThrow()
    })
  })

  describe('instance methods', () => {
    const dto = new ProjectV2ItemDTO(
      'PVTI_test123',
      'ISSUE',
      'Test Issue',
      'https://github.com/test/repo/issues/1',
      'test/repo',
      {
        'Assignee': 'john-doe',
        'Priority': 'Medium',
        'Status': 'Done'
      }
    )

    it('should detect if item has content', () => {
      expect(dto.hasContent()).toBe(true)

      const draftDto = new ProjectV2ItemDTO(
        'PVTI_draft', 'DRAFT_ISSUE', null, null, null, {}
      )
      expect(draftDto.hasContent()).toBe(false)
    })

    it('should get field values by name', () => {
      expect(dto.getFieldValue('Status')).toBe('Done')
      expect(dto.getFieldValue('Priority')).toBe('Medium')
      expect(dto.getFieldValue('NonExistent')).toBeNull()
    })

    it('should return all field names', () => {
      const fieldNames = dto.getFieldNames()
      // Object.keys() order is not guaranteed, so check for content not order
      expect(fieldNames).toHaveLength(3)
      expect(fieldNames).toContain('Status')
      expect(fieldNames).toContain('Priority')
      expect(fieldNames).toContain('Assignee')
    })

    it('should convert to LLM data format', () => {
      const llmData = dto.toLLMData()

      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_ID', 'PVTI_test123')
      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_TYPE', 'ISSUE')
      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_TITLE', 'Test Issue')
      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_URL', 'https://github.com/test/repo/issues/1')
      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_REPOSITORY', 'test/repo')
      
      const fieldValuesJson = llmData['PROJECT_V2_ITEM_FIELD_VALUES']
      const parsedFieldValues = JSON.parse(fieldValuesJson)
      expect(parsedFieldValues).toEqual({
        'Assignee': 'john-doe',
        'Priority': 'Medium',
        'Status': 'Done'
      })
    })
  })
})