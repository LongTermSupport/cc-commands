/**
 * @file Unit tests for ProjectDataDTO
 * 
 * Tests the ProjectDataDTO class including constructor validation,
 * toLLMData method, factory methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ProjectDataDTO } from '../../../../src/orchestrator-services/github/dto/ProjectDataDTO.js'

describe('ProjectDataDTO', () => {
  const validProjectData = {
    createdAt: new Date('2025-01-01T00:00:00Z'),
    description: 'A test project for validation',
    id: 'PVT_12345',
    itemCount: 5,
    owner: 'testuser',
    ownerType: 'USER' as const,
    readme: 'Project readme content',
    repositories: ['testuser/repo1', 'testuser/repo2'],
    repositoryCount: 2,
    shortDescription: 'Short desc',
    state: 'OPEN' as const,
    title: 'Test Project',
    updatedAt: new Date('2025-01-15T12:00:00Z'),
    url: 'https://github.com/users/testuser/projects/1',
    visibility: 'PUBLIC' as const
  }

  describe('constructor', () => {
    it('should create a valid ProjectDataDTO instance', () => {
      const dto = new ProjectDataDTO(
        validProjectData.id,
        validProjectData.title,
        validProjectData.url,
        validProjectData.description,
        validProjectData.owner,
        validProjectData.ownerType,
        validProjectData.visibility,
        validProjectData.state,
        validProjectData.createdAt,
        validProjectData.updatedAt,
        validProjectData.itemCount,
        validProjectData.repositoryCount,
        validProjectData.repositories,
        validProjectData.shortDescription,
        validProjectData.readme
      )

      expect(dto.id).toBe(validProjectData.id)
      expect(dto.title).toBe(validProjectData.title)
      expect(dto.owner).toBe(validProjectData.owner)
      expect(dto.repositories).toEqual(validProjectData.repositories)
    })

    it('should handle null optional fields', () => {
      const dto = new ProjectDataDTO(
        validProjectData.id,
        validProjectData.title,
        validProjectData.url,
        null, // description
        validProjectData.owner,
        validProjectData.ownerType,
        validProjectData.visibility,
        validProjectData.state,
        validProjectData.createdAt,
        validProjectData.updatedAt,
        validProjectData.itemCount,
        validProjectData.repositoryCount,
        validProjectData.repositories,
        null, // shortDescription
        null  // readme
      )

      expect(dto.description).toBeNull()
      expect(dto.shortDescription).toBeNull()
      expect(dto.readme).toBeNull()
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new ProjectDataDTO(
        validProjectData.id,
        validProjectData.title,
        validProjectData.url,
        validProjectData.description,
        validProjectData.owner,
        validProjectData.ownerType,
        validProjectData.visibility,
        validProjectData.state,
        validProjectData.createdAt,
        validProjectData.updatedAt,
        validProjectData.itemCount,
        validProjectData.repositoryCount,
        validProjectData.repositories,
        validProjectData.shortDescription,
        validProjectData.readme
      )

      const llmData = dto.toLLMData()

      expect(llmData.PROJECT_ID).toBe(validProjectData.id)
      expect(llmData.PROJECT_TITLE).toBe(validProjectData.title)
      expect(llmData.PROJECT_OWNER).toBe(validProjectData.owner)
      expect(llmData.PROJECT_OWNER_TYPE).toBe(validProjectData.ownerType)
      expect(llmData.PROJECT_VISIBILITY).toBe(validProjectData.visibility)
      expect(llmData.PROJECT_STATE).toBe(validProjectData.state)
      expect(llmData.PROJECT_CREATED_AT).toBe(validProjectData.createdAt.toISOString())
      expect(llmData.PROJECT_UPDATED_AT).toBe(validProjectData.updatedAt.toISOString())
      expect(llmData.PROJECT_ITEM_COUNT).toBe('5')
      expect(llmData.PROJECT_REPOSITORY_COUNT).toBe('2')
      expect(llmData.PROJECT_REPOSITORIES).toBe('testuser/repo1, testuser/repo2')
    })

    it('should handle null values in toLLMData', () => {
      const dto = new ProjectDataDTO(
        validProjectData.id,
        validProjectData.title,
        validProjectData.url,
        null, // description
        validProjectData.owner,
        validProjectData.ownerType,
        validProjectData.visibility,
        validProjectData.state,
        validProjectData.createdAt,
        validProjectData.updatedAt,
        validProjectData.itemCount,
        validProjectData.repositoryCount,
        validProjectData.repositories
      )

      const llmData = dto.toLLMData()

      expect(llmData.PROJECT_DESCRIPTION).toBe('')
      expect(llmData.PROJECT_SHORT_DESCRIPTION).toBe('')
      expect(llmData.PROJECT_README).toBe('')
    })
  })

  describe('fromGitHubProjectV2Response', () => {
    it('should create DTO from valid GitHub API response', () => {
      const apiResponse = {
        closed: false,
        createdAt: '2025-01-01T00:00:00Z',
        description: 'A test project',
        id: 'PVT_12345',
        items: {
          totalCount: 3
        },
        owner: {
          login: 'testuser',
          type: 'User'
        },
        public: true,
        repositories: [
          { nameWithOwner: 'testuser/repo1' },
          { nameWithOwner: 'testuser/repo2' }
        ],
        title: 'Test Project',
        updatedAt: '2025-01-15T12:00:00Z',
        url: 'https://github.com/users/testuser/projects/1'
      }

      const dto = ProjectDataDTO.fromGitHubProjectV2Response(apiResponse)

      expect(dto.id).toBe('PVT_12345')
      expect(dto.title).toBe('Test Project')
      expect(dto.owner).toBe('testuser')
      expect(dto.ownerType).toBe('USER')
      expect(dto.visibility).toBe('PUBLIC')
      expect(dto.state).toBe('OPEN')
      expect(dto.itemCount).toBe(3)
      expect(dto.repositoryCount).toBe(2)
      expect(dto.repositories).toEqual(['testuser/repo1', 'testuser/repo2'])
    })

    it('should handle organization owner', () => {
      const apiResponse = {
        closed: true,
        createdAt: '2025-01-01T00:00:00Z',
        description: 'Organization project',
        id: 'PVT_67890',
        owner: {
          login: 'testorg',
          type: 'Organization'
        },
        public: false,
        title: 'Org Project',
        updatedAt: '2025-01-15T12:00:00Z',
        url: 'https://github.com/orgs/testorg/projects/1'
      }

      const dto = ProjectDataDTO.fromGitHubProjectV2Response(apiResponse)

      expect(dto.owner).toBe('testorg')
      expect(dto.ownerType).toBe('ORGANIZATION')
      expect(dto.visibility).toBe('PRIVATE')
      expect(dto.state).toBe('CLOSED')
    })

    it('should throw error for invalid API response', () => {
      expect(() => {
        ProjectDataDTO.fromGitHubProjectV2Response(null)
      }).toThrow('Invalid GitHub Project v2 API response: response is null, undefined, or not an object')

      expect(() => {
        ProjectDataDTO.fromGitHubProjectV2Response({})
      }).toThrow('Invalid GitHub Project v2 API response: missing required fields: id, title, url, owner, createdAt, updatedAt')

      expect(() => {
        ProjectDataDTO.fromGitHubProjectV2Response({ id: 'test' })
      }).toThrow('Invalid GitHub Project v2 API response: missing required fields:')
    })
  })

  describe('fromGitHubCliOutput', () => {
    it('should create DTO from valid CLI output', () => {
      const cliOutput = {
        body: 'Project description from CLI',
        createdAt: '2025-01-01T00:00:00Z',
        id: 'PVT_12345',
        items: [{ id: '1' }, { id: '2' }],
        owner: {
          login: 'testuser',
          type: 'User'
        },
        repositories: ['testuser/repo1'],
        state: 'OPEN',
        title: 'CLI Project',
        updatedAt: '2025-01-15T12:00:00Z',
        url: 'https://github.com/users/testuser/projects/1',
        visibility: 'PUBLIC'
      }

      const dto = ProjectDataDTO.fromGitHubCliOutput(cliOutput)

      expect(dto.id).toBe('PVT_12345')
      expect(dto.title).toBe('CLI Project')
      expect(dto.description).toBe('Project description from CLI')
      expect(dto.itemCount).toBe(2)
      expect(dto.repositoryCount).toBe(1)
    })

    it('should throw error for invalid CLI output', () => {
      expect(() => {
        ProjectDataDTO.fromGitHubCliOutput(null)
      }).toThrow('Invalid GitHub CLI output: output is null, undefined, or not an object')
    })
  })

  describe('utility methods', () => {
    let dto: ProjectDataDTO

    beforeEach(() => {
      dto = new ProjectDataDTO(
        validProjectData.id,
        validProjectData.title,
        validProjectData.url,
        validProjectData.description,
        validProjectData.owner,
        validProjectData.ownerType,
        validProjectData.visibility,
        validProjectData.state,
        validProjectData.createdAt,
        validProjectData.updatedAt,
        validProjectData.itemCount,
        validProjectData.repositoryCount,
        validProjectData.repositories,
        validProjectData.shortDescription,
        validProjectData.readme
      )
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('Test Project (testuser/PVT_12345) - 5 items, 2 repos')
    })

    it('should check if project has repositories', () => {
      expect(dto.hasRepositories()).toBe(true)

      const emptyDto = new ProjectDataDTO(
        'PVT_1',
        'Empty Project',
        'https://example.com',
        null,
        'user',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date(),
        new Date(),
        0,
        0,
        []
      )
      expect(emptyDto.hasRepositories()).toBe(false)
    })

    it('should check if project has items', () => {
      expect(dto.hasItems()).toBe(true)

      const emptyDto = new ProjectDataDTO(
        'PVT_1',
        'Empty Project',
        'https://example.com',
        null,
        'user',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date(),
        new Date(),
        0,
        0,
        []
      )
      expect(emptyDto.hasItems()).toBe(false)
    })

    it('should calculate age in days', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const age = dto.getAgeInDays()
      
      // Age should be positive and reasonable (created on 2025-01-01)
      expect(age).toBeGreaterThan(0)
      expect(age).toBeLessThan(365) // Less than a year
    })

    it('should calculate days since update', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const daysSince = dto.getDaysSinceUpdate()
      
      // Days since update should be positive and reasonable (updated on 2025-01-15)
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365) // Less than a year
    })
  })
})