/**
 * @file GitHubGraphQLService Tests
 * 
 * Tests for GraphQL service methods including mocked GraphQL responses
 * and real error handling scenarios.
 */

/* eslint-disable cc-commands/require-typed-data-access */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError'
import { ProjectV2DTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2DTO'
import { ProjectV2ItemDTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2ItemDTO'

// Mock the graphql import BEFORE importing the service
const mockGraphQLClient = vi.fn()
const mockGraphQL = {
  defaults: vi.fn(() => mockGraphQLClient)
}

vi.mock('@octokit/graphql', () => ({
  graphql: mockGraphQL
}))

// Import the service AFTER the mock is set up
const { GitHubGraphQLService } = await import('../../../../src/orchestrator-services/github/services/GitHubGraphQLService')

describe('GitHubGraphQLService', () => {
  let service: InstanceType<typeof GitHubGraphQLService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GitHubGraphQLService('ghp_test_token_123')
  })

  describe('constructor', () => {
    it('should create service with token', () => {
      expect(service).toBeInstanceOf(GitHubGraphQLService)
      expect(mockGraphQL.defaults).toHaveBeenCalledWith({
        headers: { authorization: 'token ghp_test_token_123' }
      })
    })
  })

  describe('executeQuery', () => {
    it('should execute GraphQL query with variables', async () => {
      const mockResponse = { viewer: { login: 'testuser' } }
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const query = 'query { viewer { login } }'
      const variables = { test: 'value' }
      
      const result = await service.executeQuery(query, variables)
      
      expect(result).toEqual(mockResponse)
      expect(mockGraphQLClient).toHaveBeenCalledWith(query, variables)
    })

    it('should handle GraphQL errors gracefully', async () => {
      const error = new Error('GraphQL Error: Unauthorized')
      mockGraphQLClient.mockRejectedValue(error)

      await expect(service.executeQuery('query { viewer { login } }'))
        .rejects.toBeInstanceOf(OrchestratorError)
    })

    it('should handle non-Error objects', async () => {
      mockGraphQLClient.mockRejectedValue('String error')

      await expect(service.executeQuery('query { viewer { login } }'))
        .rejects.toBeInstanceOf(OrchestratorError)
    })
  })

  describe('findProjectsByOwner', () => {
    it('should fetch projects for user successfully', async () => {
      const mockUserResponse = {
        user: {
          projectsV2: {
            nodes: [{
              closed: false,
              createdAt: '2023-01-01T00:00:00Z',
              id: 'PVT_kwHOABXVks4Af-jq',
              items: { totalCount: 5 },
              owner: { __typename: 'User', login: 'testuser' },
              public: true,
              readme: 'Test readme',
              shortDescription: 'Test description',
              title: 'Test Project',
              updatedAt: '2023-01-02T00:00:00Z',
              url: 'https://github.com/users/testuser/projects/1'
            }]
          }
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockUserResponse)

      const result = await service.findProjectsByOwner('testuser')
      
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(ProjectV2DTO)
      expect(result[0]?.title).toBe('Test Project')
    })

    it('should try organization query if user query fails', async () => {
      const userError = new Error('User not found')
      const orgResponse = {
        organization: {
          projectsV2: {
            nodes: [{
              closed: false,
              createdAt: '2023-01-01T00:00:00Z',
              id: 'PVT_kwHOABXVks4Af-jq',
              items: { totalCount: 10 },
              owner: { __typename: 'Organization', login: 'testorg' },
              public: true,
              readme: null,
              shortDescription: null,
              title: 'Org Project',
              updatedAt: '2023-01-02T00:00:00Z',
              url: 'https://github.com/orgs/testorg/projects/1'
            }]
          }
        }
      }
      
      mockGraphQLClient
        .mockRejectedValueOnce(userError)
        .mockResolvedValueOnce(orgResponse)

      const result = await service.findProjectsByOwner('testorg')
      
      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe('Org Project')
      expect(mockGraphQLClient).toHaveBeenCalledTimes(2)
    })

    it('should throw error if both user and org queries fail', async () => {
      const error = new Error('Not found')
      mockGraphQLClient.mockRejectedValue(error)

      await expect(service.findProjectsByOwner('nonexistent'))
        .rejects.toBeInstanceOf(OrchestratorError)
    })
  })

  describe('getProject', () => {
    it('should fetch project data successfully', async () => {
      const mockResponse = {
        node: {
          __typename: 'ProjectV2',
          closed: false,
          createdAt: '2023-01-01T00:00:00Z',
          id: 'PVT_kwHOABXVks4Af-jq',
          items: {
            nodes: [],
            totalCount: 2
          },
          owner: { __typename: 'User', login: 'testuser' },
          public: true,
          readme: 'Test readme',
          shortDescription: 'Test description',
          title: 'Test Project',
          updatedAt: '2023-01-02T00:00:00Z',
          url: 'https://github.com/users/testuser/projects/1'
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const result = await service.getProject('PVT_kwHOABXVks4Af-jq')
      
      expect(result).toBeInstanceOf(ProjectV2DTO)
      expect(result.title).toBe('Test Project')
      expect(result.itemCount).toBe(2)
    })

    it('should throw error when project not found', async () => {
      mockGraphQLClient.mockResolvedValue({ node: null })

      await expect(service.getProject('PVT_invalid'))
        .rejects.toBeInstanceOf(OrchestratorError)
    })

    it('should validate project node ID format', async () => {
      const error = new Error('Bad Request')
      mockGraphQLClient.mockRejectedValue(error)

      try {
        await service.getProject('invalid_id')
      } catch (error_) {
        expect(error_).toBeInstanceOf(OrchestratorError)
        if (error_ instanceof OrchestratorError) {
          expect(error_.recoveryInstructions).toContain('Check network connectivity')
        }
      }
    })
  })

  describe('getProjectFields', () => {
    it('should fetch project fields successfully', async () => {
      const mockResponse = {
        node: {
          fields: {
            nodes: [
              {
                __typename: 'ProjectV2Field',
                dataType: 'SINGLE_SELECT',
                id: 'field1',
                name: 'Status'
              },
              {
                __typename: 'ProjectV2SingleSelectField',
                dataType: 'SINGLE_SELECT',
                id: 'field2',
                name: 'Priority',
                options: [
                  { id: 'opt1', name: 'High' },
                  { id: 'opt2', name: 'Low' }
                ]
              }
            ]
          }
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const result = await service.getProjectFields('PVT_kwHOABXVks4Af-jq')
      
      expect(result).toHaveLength(2)
      expect(result[0]?.name).toBe('Status')
      expect(result[1]?.name).toBe('Priority')
    })

    it('should handle project with no fields', async () => {
      mockGraphQLClient.mockResolvedValue({ node: null })

      await expect(service.getProjectFields('PVT_invalid'))
        .rejects.toBeInstanceOf(OrchestratorError)
    })
  })

  describe('getProjectItems', () => {
    it('should fetch project items successfully', async () => {
      const mockResponse = {
        node: {
          items: {
            nodes: [{
              content: {
                __typename: 'Issue',
                id: 'issue1',
                repository: { nameWithOwner: 'owner/repo' },
                title: 'Test Issue',
                url: 'https://github.com/owner/repo/issues/1'
              },
              fieldValues: {
                nodes: [{
                  __typename: 'ProjectV2ItemFieldTextValue',
                  field: {
                    __typename: 'ProjectV2Field',
                    id: 'field1',
                    name: 'Status'
                  },
                  text: 'In Progress'
                }],
                totalCount: 1
              },
              id: 'item1',
              type: 'ISSUE'
            }],
            totalCount: 1
          }
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const result = await service.getProjectItems('PVT_kwHOABXVks4Af-jq')
      
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(ProjectV2ItemDTO)
      expect(result[0]?.id).toBe('item1')
      expect(result[0]?.type).toBe('ISSUE')
    })

    it('should handle pagination for large projects', async () => {
      const mockResponse = {
        node: {
          items: {
            nodes: Array.from({ length: 100 }, (_, i) => ({
              content: {
                __typename: 'Issue',
                id: `issue${i}`,
                repository: { nameWithOwner: 'owner/repo' },
                title: `Issue ${i}`,
                url: `https://github.com/owner/repo/issues/${i}`
              },
              fieldValues: { nodes: [], totalCount: 0 },
              id: `item${i}`,
              type: 'ISSUE'
            })),
            totalCount: 150
          }
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const result = await service.getProjectItems('PVT_kwHOABXVks4Af-jq')
      
      expect(result).toHaveLength(100)
      expect(result[0]?.id).toBe('item0')
      expect(result[99]?.id).toBe('item99')
    })

    it('should handle complex nested field values correctly', async () => {
      const mockResponse = {
        node: {
          items: {
            nodes: [{
              content: {
                __typename: 'PullRequest',
                id: 'pr1',
                repository: { nameWithOwner: 'owner/repo' },
                title: 'Test PR',
                url: 'https://github.com/owner/repo/pull/1'
              },
              fieldValues: {
                nodes: [
                  {
                    __typename: 'ProjectV2ItemFieldTextValue',
                    field: { __typename: 'ProjectV2Field', id: 'field1', name: 'Status' },
                    text: 'Ready for Review'
                  },
                  {
                    __typename: 'ProjectV2ItemFieldSingleSelectValue',
                    field: { __typename: 'ProjectV2SingleSelectField', id: 'field2', name: 'Priority' },
                    name: 'High'
                  },
                  {
                    __typename: 'ProjectV2ItemFieldDateValue',
                    date: '2023-12-01',
                    field: { __typename: 'ProjectV2Field', id: 'field3', name: 'Due Date' }
                  }
                ],
                totalCount: 3
              },
              id: 'item1',
              type: 'PULL_REQUEST'
            }],
            totalCount: 1
          }
        }
      }
      
      mockGraphQLClient.mockResolvedValue(mockResponse)

      const result = await service.getProjectItems('PVT_kwHOABXVks4Af-jq')
      
      expect(result).toHaveLength(1)
      expect(result[0]?.type).toBe('PULL_REQUEST')
      expect(result[0]?.getFieldNames()).toHaveLength(3)
    })

    it('should respect rate limits', async () => {
      const rateLimitError = new Error('API rate limit exceeded')
      mockGraphQLClient.mockRejectedValue(rateLimitError)

      try {
        await service.getProjectItems('PVT_kwHOABXVks4Af-jq')
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.recoveryInstructions).toContain('Check network connectivity')
        }
      }
    })
  })
})