/**
 * @file ProjectV2DTO Tests
 * 
 * TDD APPROACH: These tests are based on stub assumptions.
 * When real GraphQL API calls are made, failing tests will reveal the actual structure.
 */

import { describe, expect, it } from 'vitest'

import { ProjectV2DTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2DTO'
import { ProjectV2GraphQLResponse } from '../../../../src/orchestrator-services/github/types/GitHubGraphQLTypes'

describe('ProjectV2DTO', () => {
  describe('fromGraphQLResponse', () => {
    it('should create DTO from stub GraphQL response structure', () => {
      // CORRECTED: This response structure matches the real GitHub Projects v2 GraphQL API
      // Based on actual API discovery - tests now reflect real structure
      const realApiResponse: ProjectV2GraphQLResponse = {
        node: {
          __typename: 'ProjectV2',
          closed: false,
          createdAt: '2023-01-01T00:00:00Z',
          id: 'PVT_kwHOABXVks4Af-jq',
          items: {
            nodes: [],
            totalCount: 5
          },
          owner: {
            __typename: 'Organization',
            login: 'test-org'
          },
          public: true,
          readme: 'This is a test project',
          shortDescription: 'A test project',
          title: 'Test Project',
          updatedAt: '2023-01-02T00:00:00Z',
          url: 'https://github.com/orgs/test-org/projects/1'
        }
      }

      const dto = ProjectV2DTO.fromGraphQLResponse(realApiResponse)

      expect(dto.id).toBe('PVT_kwHOABXVks4Af-jq')
      expect(dto.title).toBe('Test Project')
      expect(dto.url).toBe('https://github.com/orgs/test-org/projects/1')
      expect(dto.description).toBe('A test project') // Now comes from shortDescription
      expect(dto.owner).toBe('test-org')
      expect(dto.ownerType).toBe('ORGANIZATION')
      expect(dto.visibility).toBe('PUBLIC')
      expect(dto.state).toBe('OPEN')
      expect(dto.itemCount).toBe(5)
      expect(dto.shortDescription).toBe('A test project')
      expect(dto.readme).toBe('This is a test project')
    })

    it('should handle user-owned projects', () => {
      const userProjectResponse: ProjectV2GraphQLResponse = {
        node: {
          __typename: 'ProjectV2',
          closed: true,
          createdAt: '2023-01-01T00:00:00Z',
          id: 'PVT_kwHOABXVks4Af-jq',
          items: {
            nodes: [],
            totalCount: 0
          },
          owner: {
            __typename: 'User',
            login: 'testuser'
          },
          public: false,
          readme: null,
          shortDescription: null,
          title: 'User Project',
          updatedAt: '2023-01-02T00:00:00Z',
          url: 'https://github.com/users/testuser/projects/1'
        }
      }

      const dto = ProjectV2DTO.fromGraphQLResponse(userProjectResponse)

      expect(dto.owner).toBe('testuser')
      expect(dto.ownerType).toBe('USER')
      expect(dto.visibility).toBe('PRIVATE')
      expect(dto.state).toBe('CLOSED')
      expect(dto.itemCount).toBe(0)
      expect(dto.description).toBeNull()
      expect(dto.shortDescription).toBeNull()
      expect(dto.readme).toBeNull()
    })
  })

  describe('instance methods', () => {
    const dto = new ProjectV2DTO(
      'PVT_test123',
      'Test Project',
      'https://github.com/orgs/test/projects/1',
      'Test description',
      'test-org',
      'ORGANIZATION',
      'PUBLIC',
      'OPEN',
      new Date('2023-01-01T00:00:00Z'),
      new Date('2023-01-02T00:00:00Z'),
      10,
      'Short desc',
      'Readme content'
    )

    it('should calculate age in days correctly', () => {
      const age = dto.getAgeInDays()
      expect(typeof age).toBe('number')
      expect(age).toBeGreaterThan(0)
    })

    it('should calculate days since update correctly', () => {
      const daysSince = dto.getDaysSinceUpdate()
      expect(typeof daysSince).toBe('number')
      expect(daysSince).toBeGreaterThan(0)
    })

    it('should return correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('Test Project (test-org/PVT_test123) - 10 items')
    })

    it('should detect if project has items', () => {
      expect(dto.hasItems()).toBe(true)
      
      const emptyDto = new ProjectV2DTO(
        'PVT_test123', 'Empty', 'url', null, 'owner', 'USER', 'PRIVATE', 'OPEN',
        new Date(), new Date(), 0
      )
      expect(emptyDto.hasItems()).toBe(false)
    })

    it('should convert to LLM data format', () => {
      const llmData = dto.toLLMData()
      
      expect(llmData).toHaveProperty('PROJECT_V2_ID', 'PVT_test123')
      expect(llmData).toHaveProperty('PROJECT_V2_TITLE', 'Test Project')
      expect(llmData).toHaveProperty('PROJECT_V2_OWNER', 'test-org')
      expect(llmData).toHaveProperty('PROJECT_V2_OWNER_TYPE', 'ORGANIZATION')
      expect(llmData).toHaveProperty('PROJECT_V2_VISIBILITY', 'PUBLIC')
      expect(llmData).toHaveProperty('PROJECT_V2_STATE', 'OPEN')
      expect(llmData).toHaveProperty('PROJECT_V2_ITEM_COUNT', '10')
      expect(llmData).toHaveProperty('PROJECT_V2_DESCRIPTION', 'Test description')
      expect(llmData).toHaveProperty('PROJECT_V2_SHORT_DESCRIPTION', 'Short desc')
      expect(llmData).toHaveProperty('PROJECT_V2_README', 'Readme content')
    })
  })
})