/**
 * @file Unit tests for RepositoryDataDTO
 * 
 * Tests the RepositoryDataDTO class including constructor validation,
 * toLLMData method, factory methods, utility methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { RepositoryDataDTO } from '../../../../src/orchestrator-services/github/dto/RepositoryDataDTO'

describe('RepositoryDataDTO', () => {
  const validRepositoryData = {
    createdAt: new Date('2023-01-01T00:00:00Z'),
    defaultBranch: 'main',
    description: 'A test repository for validation',
    forksCount: 12,
    fullName: 'testuser/test-repo',
    hasIssues: true,
    hasProjects: true,
    hasWiki: true,
    homepage: 'https://testuser.github.io/test-repo',
    id: 123_456,
    isArchived: false,
    isFork: false,
    isPrivate: false,
    language: 'TypeScript',
    languages: ['TypeScript', 'JavaScript', 'CSS'],
    license: 'MIT',
    name: 'test-repo',
    openIssuesCount: 5,
    owner: 'testuser',
    ownerType: 'User' as const,
    pushedAt: new Date('2025-01-14T15:30:00Z'),
    size: 1024,
    stargazersCount: 42,
    topics: ['testing', 'typescript', 'github'],
    updatedAt: new Date('2025-01-15T12:00:00Z'),
    url: 'https://github.com/testuser/test-repo',
    visibility: 'public' as const,
    watchersCount: 38
  }

  describe('constructor', () => {
    it('should create a valid RepositoryDataDTO instance', () => {
      const dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      expect(dto.id).toBe(validRepositoryData.id)
      expect(dto.name).toBe(validRepositoryData.name)
      expect(dto.fullName).toBe(validRepositoryData.fullName)
      expect(dto.owner).toBe(validRepositoryData.owner)
      expect(dto.language).toBe(validRepositoryData.language)
      expect(dto.languages).toEqual(validRepositoryData.languages)
      expect(dto.topics).toEqual(validRepositoryData.topics)
    })

    it('should handle repositories with null optional fields', () => {
      const dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        null, // description
        validRepositoryData.url,
        null, // homepage
        null, // language
        [],   // languages
        [],   // topics
        null, // license
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        null  // pushedAt
      )

      expect(dto.description).toBeNull()
      expect(dto.homepage).toBeNull()
      expect(dto.language).toBeNull()
      expect(dto.license).toBeNull()
      expect(dto.pushedAt).toBeNull()
      expect(dto.languages).toEqual([])
      expect(dto.topics).toEqual([])
    })

    it('should handle private repositories', () => {
      const dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        'Organization',
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        'private',
        true, // isPrivate
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      expect(dto.visibility).toBe('private')
      expect(dto.isPrivate).toBe(true)
      expect(dto.ownerType).toBe('Organization')
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.REPOSITORY_ID).toBe('123456')
      expect(llmData.REPOSITORY_NAME).toBe('test-repo')
      expect(llmData.REPOSITORY_FULL_NAME).toBe('testuser/test-repo')
      expect(llmData.REPOSITORY_OWNER).toBe('testuser')
      expect(llmData.REPOSITORY_OWNER_TYPE).toBe('User')
      expect(llmData.REPOSITORY_DESCRIPTION).toBe('A test repository for validation')
      expect(llmData.REPOSITORY_URL).toBe('https://github.com/testuser/test-repo')
      expect(llmData.REPOSITORY_LANGUAGE).toBe('TypeScript')
      expect(llmData.REPOSITORY_LANGUAGES).toBe('TypeScript, JavaScript, CSS')
      expect(llmData.REPOSITORY_TOPICS).toBe('testing, typescript, github')
      expect(llmData.REPOSITORY_LICENSE).toBe('MIT')
      expect(llmData.REPOSITORY_VISIBILITY).toBe('public')
      expect(llmData.REPOSITORY_IS_PRIVATE).toBe('false')
      expect(llmData.REPOSITORY_IS_FORK).toBe('false')
      expect(llmData.REPOSITORY_IS_ARCHIVED).toBe('false')
      expect(llmData.REPOSITORY_HAS_ISSUES).toBe('true')
      expect(llmData.REPOSITORY_DEFAULT_BRANCH).toBe('main')
      expect(llmData.REPOSITORY_STARGAZERS_COUNT).toBe('42')
      expect(llmData.REPOSITORY_FORKS_COUNT).toBe('12')
      expect(llmData.REPOSITORY_CREATED_AT).toBe('2023-01-01T00:00:00.000Z')
      expect(llmData.REPOSITORY_PUSHED_AT).toBe('2025-01-14T15:30:00.000Z')
    })

    it('should handle null values in toLLMData', () => {
      const dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        null, // description
        validRepositoryData.url,
        null, // homepage
        null, // language
        [],   // languages
        [],   // topics
        null, // license
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        null  // pushedAt
      )

      const llmData = dto.toLLMData()

      expect(llmData.REPOSITORY_DESCRIPTION).toBe('')
      expect(llmData.REPOSITORY_HOMEPAGE).toBe('')
      expect(llmData.REPOSITORY_LANGUAGE).toBe('')
      expect(llmData.REPOSITORY_LICENSE).toBe('')
      expect(llmData.REPOSITORY_LANGUAGES).toBe('')
      expect(llmData.REPOSITORY_TOPICS).toBe('')
      expect(llmData.REPOSITORY_PUSHED_AT).toBe('')
    })
  })

  describe('fromGitHubApiResponse', () => {
    it('should create DTO from valid GitHub API response', () => {
       
      const apiResponse = {
        archived: false,
        clone_url: 'https://github.com/testuser/test-repo.git',
        created_at: '2023-01-01T00:00:00Z',
        default_branch: 'main',
        description: 'A test repository',
        disabled: false,
        fork: false,
        forks_count: 12,
        full_name: 'testuser/test-repo',
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        homepage: 'https://testuser.github.io/test-repo',
        html_url: 'https://github.com/testuser/test-repo',
        id: 123_456,
        language: 'TypeScript',
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT'
        },
        name: 'test-repo',
        open_issues_count: 5,
        owner: {
          avatar_url: 'https://github.com/images/error/testuser_happy.gif',
          id: 789,
          login: 'testuser',
          type: 'User' as const
        },
        private: false,
        pushed_at: '2025-01-14T15:30:00Z',
        size: 1024,
        ssh_url: 'git@github.com:testuser/test-repo.git',
        stargazers_count: 42,
        topics: ['testing', 'typescript'],
        updated_at: '2025-01-15T12:00:00Z',
        url: 'https://api.github.com/repos/testuser/test-repo',
        watchers_count: 38
      }
       

      const dto = RepositoryDataDTO.fromGitHubApiResponse(apiResponse)

      expect(dto.id).toBe(123_456)
      expect(dto.name).toBe('test-repo')
      expect(dto.fullName).toBe('testuser/test-repo')
      expect(dto.owner).toBe('testuser')
      expect(dto.ownerType).toBe('User')
      expect(dto.description).toBe('A test repository')
      expect(dto.url).toBe('https://github.com/testuser/test-repo')
      expect(dto.language).toBe('TypeScript')
      expect(dto.topics).toEqual(['testing', 'typescript'])
      expect(dto.license).toBe('MIT License')
      expect(dto.visibility).toBe('public')
      expect(dto.isPrivate).toBe(false)
      expect(dto.stargazersCount).toBe(42)
      expect(dto.forksCount).toBe(12)
    })

    it('should handle private repository from API response', () => {
       
      const apiResponse = {
        archived: false,
        clone_url: 'https://github.com/testorg/private-repo.git',
        created_at: '2024-06-01T00:00:00Z',
        default_branch: 'develop',
        description: 'Private organization repository',
        disabled: false,
        fork: false,
        forks_count: 0,
        full_name: 'testorg/private-repo',
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        html_url: 'https://github.com/testorg/private-repo',
        id: 789_012,
        language: 'JavaScript',
        name: 'private-repo',
        open_issues_count: 8,
        owner: {
          avatar_url: 'https://github.com/images/error/testorg_happy.gif',
          id: 456,
          login: 'testorg',
          type: 'Organization' as const
        },
        private: true,
        pushed_at: '2025-01-09T14:20:00Z',
        size: 512,
        ssh_url: 'git@github.com:testorg/private-repo.git',
        stargazers_count: 0,
        updated_at: '2025-01-10T09:00:00Z',
        url: 'https://api.github.com/repos/testorg/private-repo',
        watchers_count: 3
      }
       

      const dto = RepositoryDataDTO.fromGitHubApiResponse(apiResponse)

      expect(dto.owner).toBe('testorg')
      expect(dto.ownerType).toBe('Organization')
      expect(dto.visibility).toBe('private')
      expect(dto.isPrivate).toBe(true)
      expect(dto.hasProjects).toBe(false)
      expect(dto.hasWiki).toBe(false)
      expect(dto.defaultBranch).toBe('develop')
    })

    it('should handle minimal API response with missing optional fields', () => {
       
      const minimalResponse = {
        archived: false,
        clone_url: 'https://github.com/user/minimal-repo.git',
        created_at: '2025-01-01T00:00:00Z',
        default_branch: 'main',
        disabled: false,
        fork: false,
        forks_count: 0,
        full_name: 'user/minimal-repo',
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        html_url: 'https://github.com/user/minimal-repo',
        id: 999,
        name: 'minimal-repo',
        open_issues_count: 0,
        owner: {
          id: 123,
          login: 'user',
          type: 'User' as const
        },
        private: false,
        size: 0,
        ssh_url: 'git@github.com:user/minimal-repo.git',
        stargazers_count: 0,
        updated_at: '2025-01-01T00:00:00Z',
        url: 'https://api.github.com/repos/user/minimal-repo',
        watchers_count: 0
      }
       

      const dto = RepositoryDataDTO.fromGitHubApiResponse(minimalResponse)

      expect(dto.id).toBe(999)
      expect(dto.name).toBe('minimal-repo')
      expect(dto.description).toBeNull()
      expect(dto.homepage).toBeNull()
      expect(dto.language).toBeNull()
      expect(dto.license).toBeNull()
      expect(dto.topics).toEqual([])
      expect(dto.languages).toEqual([])
    })

    it('should throw error for invalid API response', () => {
      // Test with completely empty response
      expect(() => {
        RepositoryDataDTO.fromGitHubApiResponse({})
      }).toThrow('Invalid GitHub Repository API response: missing required fields: id, name, full_name, owner')

      // Test with partial required fields
      expect(() => {
        RepositoryDataDTO.fromGitHubApiResponse({ id: 123 })
      }).toThrow('Invalid GitHub Repository API response: missing required fields: name, full_name, owner')
    })
  })

  describe('fromGitHubCliOutput', () => {
    it('should create DTO from valid CLI output', () => {
      const cliOutput = {
        createdAt: '2023-06-01T00:00:00Z',
        defaultBranch: 'main',
        description: 'Repository from CLI',
        forksCount: 8,
        hasIssues: true,
        hasProjects: true,
        hasWiki: true,
        homepage: 'https://testuser.github.io/test-repo',
        id: 123_456,
        isArchived: false,
        isFork: false,
        isPrivate: false,
        languages: ['TypeScript', 'JavaScript'],
        license: 'MIT',
        name: 'test-repo',
        nameWithOwner: 'testuser/test-repo',
        openIssuesCount: 3,
        owner: 'testuser',
        ownerType: 'User' as const,
        primaryLanguage: 'TypeScript',
        pushedAt: '2025-01-11T16:45:00Z',
        size: 768,
        stargazersCount: 25,
        topics: ['cli', 'github'],
        updatedAt: '2025-01-12T10:00:00Z',
        url: 'https://github.com/testuser/test-repo',
        visibility: 'PUBLIC' as const,
        watchersCount: 20
      }

      const dto = RepositoryDataDTO.fromGitHubCliOutput(cliOutput)

      expect(dto.id).toBe(123_456)
      expect(dto.name).toBe('test-repo')
      expect(dto.fullName).toBe('testuser/test-repo')
      expect(dto.owner).toBe('testuser')
      expect(dto.ownerType).toBe('User')
      expect(dto.description).toBe('Repository from CLI')
      expect(dto.language).toBe('TypeScript')
      expect(dto.languages).toEqual(['TypeScript', 'JavaScript'])
      expect(dto.topics).toEqual(['cli', 'github'])
      expect(dto.visibility).toBe('public')
      expect(dto.isPrivate).toBe(false)
    })

    it('should handle CLI output with minimal fields', () => {
      const minimalCliOutput = {
        name: 'simple-repo'
      }

      const dto = RepositoryDataDTO.fromGitHubCliOutput(minimalCliOutput)

      expect(dto.name).toBe('simple-repo')
      expect(dto.id).toBe(0)
      expect(dto.fullName).toBe('unknown/simple-repo')
      expect(dto.owner).toBe('unknown')
      expect(dto.ownerType).toBe('User')
      expect(dto.description).toBeNull()
      expect(dto.language).toBeNull()
      expect(dto.languages).toEqual([])
      expect(dto.topics).toEqual([])
    })

    it('should throw error for malformed CLI output', () => {
      // Test with empty CLI output - this can happen from real CLI
      expect(() => {
        RepositoryDataDTO.fromGitHubCliOutput({})
      }).toThrow('Invalid GitHub CLI output: missing required field: name')
    })
  })

  describe('utility methods', () => {
    let dto: RepositoryDataDTO

    beforeEach(() => {
      dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('testuser/test-repo (TypeScript) - public, 42 stars, 12 forks')
    })

    it('should generate summary without language', () => {
      const dtoWithoutLanguage = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        null, // no language
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        'private',
        true,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      const summary = dtoWithoutLanguage.getSummary()
      expect(summary).toBe('testuser/test-repo - private, 42 stars, 12 forks')
    })

    it('should calculate age in days', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const age = dto.getAgeInDays()
      
      // Age should be positive and reasonable (created on 2023-01-01)
      expect(age).toBeGreaterThan(700) // More than 2 years
      expect(age).toBeLessThan(1000)   // Less than 3 years
    })

    it('should calculate days since update', () => {
      // Test uses real dates - just verify it returns a reasonable number
      const daysSince = dto.getDaysSinceUpdate()
      
      // Days since update should be positive and reasonable (updated on 2025-01-15)
      expect(daysSince).toBeGreaterThan(0)
      expect(daysSince).toBeLessThan(365) // Less than a year
    })

    it('should calculate days since last push', () => {
      const daysSince = dto.getDaysSinceLastPush()
      
      expect(daysSince).not.toBeNull()
      expect(daysSince!).toBeGreaterThan(0)
      expect(daysSince!).toBeLessThan(365)
    })

    it('should handle null pushed_at date', () => {
      const dtoWithoutPush = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        null // no push date
      )

      const daysSince = dtoWithoutPush.getDaysSinceLastPush()
      expect(daysSince).toBeNull()
    })

    it('should detect actively maintained repositories', () => {
      // Create a recently updated repository
      const recentDto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        new Date('2023-01-01T00:00:00Z'), // created date
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // updated 30 days ago
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)  // pushed 10 days ago
      )

      expect(recentDto.isActivelyMaintained()).toBe(true)
      
      // Test with old repository
      const oldDto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        new Date('2020-01-01T00:00:00Z'), // old created date
        new Date('2020-06-01T00:00:00Z'), // old updated date (more than 90 days ago)
        new Date('2020-05-01T00:00:00Z')  // old pushed date (more than 30 days ago)
      )

      expect(oldDto.isActivelyMaintained()).toBe(false)
    })

    it('should detect repositories with significant engagement', () => {
      expect(dto.hasSignificantEngagement()).toBe(true) // 42 stars, 12 forks
      
      // Test with low engagement
      const lowEngagementDto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        2, // low stars
        1, // low watchers
        0, // no forks
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      expect(lowEngagementDto.hasSignificantEngagement()).toBe(false)
    })

    it('should handle edge cases for engagement detection', () => {
      // Test with exactly threshold values
      const thresholdDto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        10, // exactly threshold
        5,  // exactly threshold
        5,  // exactly threshold
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      expect(thresholdDto.hasSignificantEngagement()).toBe(true)
    })
  })

  describe('edge cases and validation', () => {
    it('should handle zero values', () => {
      const zeroDto = new RepositoryDataDTO(
        0, // id
        'zero-repo',
        'user/zero-repo',
        'user',
        'User',
        null,
        'https://github.com/user/zero-repo',
        null,
        null,
        [],
        [],
        null,
        'public',
        false,
        false,
        false,
        true,
        true,
        true,
        'main',
        0, // stars
        0, // watchers
        0, // forks
        0, // issues
        0, // size
        new Date(),
        new Date(),
        null
      )

      const llmData = zeroDto.toLLMData()
      expect(llmData.REPOSITORY_ID).toBe('0')
      expect(llmData.REPOSITORY_STARGAZERS_COUNT).toBe('0')
      expect(llmData.REPOSITORY_FORKS_COUNT).toBe('0')
      expect(llmData.REPOSITORY_SIZE).toBe('0')
    })

    it('should handle large numbers', () => {
      const largeNumbers = {
        forksCount: 50_000,
        id: 999_999_999,
        size: 999_999,
        stargazersCount: 1_000_000
      }

      const dto = new RepositoryDataDTO(
        largeNumbers.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.owner,
        validRepositoryData.ownerType,
        validRepositoryData.description,
        validRepositoryData.url,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.topics,
        validRepositoryData.license,
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        largeNumbers.stargazersCount,
        validRepositoryData.watchersCount,
        largeNumbers.forksCount,
        validRepositoryData.openIssuesCount,
        largeNumbers.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      const llmData = dto.toLLMData()
      expect(llmData.REPOSITORY_ID).toBe('999999999')
      expect(llmData.REPOSITORY_STARGAZERS_COUNT).toBe('1000000')
      expect(llmData.REPOSITORY_FORKS_COUNT).toBe('50000')
      expect(llmData.REPOSITORY_SIZE).toBe('999999')
    })

    it('should handle unicode and special characters in fields', () => {
      const unicodeDto = new RepositoryDataDTO(
        validRepositoryData.id,
        'test-unicode-🚀',
        'user/test-unicode-🚀',
        'user',
        'User',
        'Repository with unicode: 你好世界 and émojis 🎉',
        validRepositoryData.url,
        'https://example.com/🌍',
        'TypeScript',
        ['JavaScript', 'TypeScript'],
        ['unicode', '国际化', 'émojis'],
        'MIT',
        validRepositoryData.visibility,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )

      const llmData = unicodeDto.toLLMData()
      expect(llmData.REPOSITORY_NAME).toBe('test-unicode-🚀')
      expect(llmData.REPOSITORY_DESCRIPTION).toBe('Repository with unicode: 你好世界 and émojis 🎉')
      expect(llmData.REPOSITORY_TOPICS).toBe('unicode, 国际化, émojis')
      expect(llmData.REPOSITORY_HOMEPAGE).toBe('https://example.com/🌍')
    })
  })

  describe('JSON methods for result files', () => {
    let dto: RepositoryDataDTO
    
    beforeEach(() => {
      dto = new RepositoryDataDTO(
        validRepositoryData.id,
        validRepositoryData.name,
        validRepositoryData.fullName,
        validRepositoryData.description,
        validRepositoryData.homepage,
        validRepositoryData.language,
        validRepositoryData.languages,
        validRepositoryData.license,
        validRepositoryData.topics,
        validRepositoryData.owner,
        validRepositoryData.isPrivate,
        validRepositoryData.isFork,
        validRepositoryData.isArchived,
        validRepositoryData.hasIssues,
        validRepositoryData.hasProjects,
        validRepositoryData.hasWiki,
        validRepositoryData.defaultBranch,
        validRepositoryData.stargazersCount,
        validRepositoryData.watchersCount,
        validRepositoryData.forksCount,
        validRepositoryData.openIssuesCount,
        validRepositoryData.size,
        validRepositoryData.createdAt,
        validRepositoryData.updatedAt,
        validRepositoryData.pushedAt
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured data with raw and calculated namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('github_api')
        expect(jsonData.calculated).toHaveProperty('time_calculations')
        expect(jsonData.calculated).toHaveProperty('activity_metrics')
        expect(jsonData.calculated).toHaveProperty('mathematical_ratios')
      })
      
      it('should preserve raw repository data unchanged', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData.raw.github_api.name).toBe('test-repo')
        expect(jsonData.raw.github_api.full_name).toBe('testuser/test-repo')
        expect(jsonData.raw.github_api.description).toBe('A test repository for validation')
        expect(jsonData.raw.github_api.language).toBe('TypeScript')
        expect(jsonData.raw.github_api.stargazers_count).toBe(42)
      })
      
      it('should calculate time metrics correctly', () => {
        const jsonData = dto.toJsonData()
        const timeCalcs = jsonData.calculated.time_calculations
        
        expect(timeCalcs.age_days).toBeGreaterThan(0)
        expect(timeCalcs.days_since_updated).toBeGreaterThanOrEqual(0)
        expect(typeof timeCalcs.business_days_since_activity).toBe('number')
        expect(timeCalcs.created_at_iso).toBe('2023-01-01T00:00:00.000Z')
      })
      
      it('should calculate activity metrics', () => {
        const jsonData = dto.toJsonData()
        const activityMetrics = jsonData.calculated.activity_metrics
        
        expect(activityMetrics.stargazers_count).toBe(42)
        expect(activityMetrics.forks_count).toBe(12)
        expect(activityMetrics.open_issues_count).toBe(8)
        expect(activityMetrics.watchers_count).toBe(38)
      })
      
      it('should calculate mathematical ratios', () => {
        const jsonData = dto.toJsonData()
        const ratios = jsonData.calculated.mathematical_ratios
        
        expect(ratios.watchers_to_stars_ratio).toBeCloseTo(38/42, 2)
        expect(ratios.forks_to_stars_ratio).toBeCloseTo(12/42, 2)
        expect(ratios.issues_to_stars_ratio).toBeCloseTo(8/42, 2)
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(5)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('name'),
          query: '.raw.github_api.name',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all calculation categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('time_calculations'))).toBe(true)
        expect(queries.some(q => q.includes('activity_metrics'))).toBe(true)
        expect(queries.some(q => q.includes('mathematical_ratios'))).toBe(true)
      })
      
      it('should provide helpful descriptions and scopes', () => {
        const hints = dto.getJqHints()
        
        for (const hint of hints) {
          expect(hint.query).toBeTruthy()
          expect(hint.description).toBeTruthy()
          expect(['single_item', 'list', 'statistical']).toContain(hint.scope)
        }
      })
    })
  })
})