/**
 * @file Unit tests for ProjectSummaryDTO
 * 
 * Tests project summary data aggregation and transformation to standardized
 * LLM data format. Covers constructor validation, factory methods, utility
 * methods, calculated metrics, and edge cases.
 */

import { describe, expect, it, vi } from 'vitest'

import { ProjectSummaryDTO } from '../../../../src/orchestrator-services/github/dto/ProjectSummaryDTO.js'

const createDtoWithScore = (score: number): ProjectSummaryDTO => 
  new ProjectSummaryDTO(
    'test', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
    1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'medium', score
  )

describe('ProjectSummaryDTO', () => {
  describe('constructor', () => {
    it('should create instance with all required properties', () => {
      const createdAt = new Date('2023-01-15T10:00:00Z')
      const updatedAt = new Date('2025-01-20T15:30:00Z')
      
      const dto = new ProjectSummaryDTO(
        'awesome-project',
        'tech-org',
        'An awesome open source project',
        'https://github.com/tech-org/awesome-project',
        'TypeScript',
        ['TypeScript', 'JavaScript', 'CSS'],
        createdAt,
        updatedAt,
        5, // repositoryCount
        3, // activeRepositories
        1250, // starsTotal
        2847, // totalCommits
        45, // commitsLast30Days
        28, // totalContributors
        8, // activeContributors
        156, // issuesTotalCount
        23, // issuesOpenCount
        85, // issuesClosedRatio
        12, // averageIssueAgeDays
        89, // prsTotalCount
        7, // prsOpenCount
        92, // prsMergedRatio
        5, // averagePrAgeDays
        'high', // recentActivityLevel
        88 // healthScore
      )

      expect(dto.name).toBe('awesome-project')
      expect(dto.owner).toBe('tech-org')
      expect(dto.description).toBe('An awesome open source project')
      expect(dto.url).toBe('https://github.com/tech-org/awesome-project')
      expect(dto.primaryLanguage).toBe('TypeScript')
      expect(dto.languages).toEqual(['TypeScript', 'JavaScript', 'CSS'])
      expect(dto.createdAt).toEqual(createdAt)
      expect(dto.updatedAt).toEqual(updatedAt)
      expect(dto.repositoryCount).toBe(5)
      expect(dto.activeRepositories).toBe(3)
      expect(dto.starsTotal).toBe(1250)
      expect(dto.totalCommits).toBe(2847)
      expect(dto.commitsLast30Days).toBe(45)
      expect(dto.totalContributors).toBe(28)
      expect(dto.activeContributors).toBe(8)
      expect(dto.issuesTotalCount).toBe(156)
      expect(dto.issuesOpenCount).toBe(23)
      expect(dto.issuesClosedRatio).toBe(85)
      expect(dto.averageIssueAgeDays).toBe(12)
      expect(dto.prsTotalCount).toBe(89)
      expect(dto.prsOpenCount).toBe(7)
      expect(dto.prsMergedRatio).toBe(92)
      expect(dto.averagePrAgeDays).toBe(5)
      expect(dto.recentActivityLevel).toBe('high')
      expect(dto.healthScore).toBe(88)
    })

    it('should handle readonly properties correctly', () => {
      const dto = new ProjectSummaryDTO(
        'test-project', 'test-owner', 'Description', 'https://test.com',
        'JavaScript', [], new Date(), new Date(),
        1, 1, 100, 50, 5, 10, 3, 20, 5, 75, 8, 15, 3, 80, 2, 'medium', 70
      )

      // Properties should be readonly - TypeScript compile-time check only
      expect(dto.name).toBe('test-project')
      expect(dto.owner).toBe('test-owner')
      expect(dto.healthScore).toBe(70)
    })
  })

  describe('fromAggregatedData', () => {
    it('should create DTO from complete aggregated data', () => {
      const summaryData = {
        activeContributors: 6,
        activeRepositories: 2,
        averageIssueAgeDays: 18,
        averagePrAgeDays: 7,
        commitsLast30Days: 28,
        createdAt: '2022-06-10T08:00:00Z',
        description: 'Comprehensive data analysis toolkit',
        healthScore: 82,
        issuesOpenCount: 14,
        issuesTotalCount: 98,
        languages: ['Python', 'R', 'SQL'],
        name: 'data-analysis-toolkit',
        owner: 'analytics-team',
        primaryLanguage: 'Python',
        prsOpenCount: 4,
        prsTotalCount: 67,
        recentActivityLevel: 'medium' as const,
        repositoryCount: 3,
        starsTotal: 847,
        totalCommits: 1523,
        totalContributors: 15,
        updatedAt: '2025-01-18T14:20:00Z',
        url: 'https://github.com/analytics-team/data-analysis-toolkit'
      }

      const dto = ProjectSummaryDTO.fromAggregatedData(summaryData)

      expect(dto.name).toBe('data-analysis-toolkit')
      expect(dto.owner).toBe('analytics-team')
      expect(dto.description).toBe('Comprehensive data analysis toolkit')
      expect(dto.url).toBe('https://github.com/analytics-team/data-analysis-toolkit')
      expect(dto.primaryLanguage).toBe('Python')
      expect(dto.languages).toEqual(['Python', 'R', 'SQL'])
      expect(dto.createdAt).toEqual(new Date('2022-06-10T08:00:00Z'))
      expect(dto.updatedAt).toEqual(new Date('2025-01-18T14:20:00Z'))
      expect(dto.repositoryCount).toBe(3)
      expect(dto.activeRepositories).toBe(2)
      expect(dto.starsTotal).toBe(847)
      expect(dto.totalCommits).toBe(1523)
      expect(dto.commitsLast30Days).toBe(28)
      expect(dto.totalContributors).toBe(15)
      expect(dto.activeContributors).toBe(6)
      expect(dto.issuesTotalCount).toBe(98)
      expect(dto.issuesOpenCount).toBe(14)
      expect(dto.issuesClosedRatio).toBe(86) // Calculated: (98-14)/98 * 100 = 85.7 -> 86
      expect(dto.averageIssueAgeDays).toBe(18)
      expect(dto.prsTotalCount).toBe(67)
      expect(dto.prsOpenCount).toBe(4)
      expect(dto.prsMergedRatio).toBe(94) // Calculated: (67-4)/67 * 100 = 94.0
      expect(dto.averagePrAgeDays).toBe(7)
      expect(dto.recentActivityLevel).toBe('medium')
      expect(dto.healthScore).toBe(82)
    })

    it('should handle minimal aggregated data with defaults', () => {
      const summaryData = {
        name: 'minimal-project',
        owner: 'individual-dev'
      }

      const dto = ProjectSummaryDTO.fromAggregatedData(summaryData)

      expect(dto.name).toBe('minimal-project')
      expect(dto.owner).toBe('individual-dev')
      expect(dto.description).toBe('No description available')
      expect(dto.url).toBe('')
      expect(dto.primaryLanguage).toBe('Unknown')
      expect(dto.languages).toEqual([])
      expect(dto.createdAt).toBeInstanceOf(Date)
      expect(dto.updatedAt).toBeInstanceOf(Date)
      expect(dto.repositoryCount).toBe(0)
      expect(dto.activeRepositories).toBe(0)
      expect(dto.starsTotal).toBe(0)
      expect(dto.totalCommits).toBe(0)
      expect(dto.commitsLast30Days).toBe(0)
      expect(dto.totalContributors).toBe(0)
      expect(dto.activeContributors).toBe(0)
      expect(dto.issuesTotalCount).toBe(0)
      expect(dto.issuesOpenCount).toBe(0)
      expect(dto.issuesClosedRatio).toBe(0)
      expect(dto.averageIssueAgeDays).toBe(0)
      expect(dto.prsTotalCount).toBe(0)
      expect(dto.prsOpenCount).toBe(0)
      expect(dto.prsMergedRatio).toBe(0)
      expect(dto.averagePrAgeDays).toBe(0)
      expect(dto.recentActivityLevel).toBe('low')
      expect(dto.healthScore).toBe(0)
    })

    it('should calculate ratios correctly for edge cases', () => {
      const summaryData = {
        issuesOpenCount: 0,
        issuesTotalCount: 0, // No issues
        name: 'edge-case-project',
        owner: 'test-owner',
        prsOpenCount: 0,
        prsTotalCount: 10 // All PRs are merged
      }

      const dto = ProjectSummaryDTO.fromAggregatedData(summaryData)

      expect(dto.issuesClosedRatio).toBe(0) // 0 total issues = 0% ratio
      expect(dto.prsMergedRatio).toBe(100) // All PRs merged = 100% ratio
      expect(dto.healthScore).toBe(50) // Average of 0% and 100%
    })

    it('should handle Date objects and string dates', () => {
      const createdDate = new Date('2023-01-01T00:00:00Z')
      const updatedDateString = '2025-01-20T12:00:00Z'

      const summaryData = {
        createdAt: createdDate, // Date object
        name: 'date-test-project',
        owner: 'date-tester',
        updatedAt: updatedDateString // String date
      }

      const dto = ProjectSummaryDTO.fromAggregatedData(summaryData)

      expect(dto.createdAt).toEqual(createdDate)
      expect(dto.updatedAt).toEqual(new Date(updatedDateString))
    })

    it('should throw error for invalid aggregated data', () => {
      expect(() => ProjectSummaryDTO.fromAggregatedData(null)).toThrow(
        'Invalid project summary data: data is null, undefined, or not an object'
      )
      expect(() => ProjectSummaryDTO.fromAggregatedData()).toThrow(
        'Invalid project summary data: data is null, undefined, or not an object'
      )
      expect(() => ProjectSummaryDTO.fromAggregatedData('invalid')).toThrow(
        'Invalid project summary data: data is null, undefined, or not an object'
      )
    })

    it('should throw error for missing required fields', () => {
      expect(() => ProjectSummaryDTO.fromAggregatedData({})).toThrow(
        'Invalid project summary data: name is required and must be a string'
      )
      expect(() => ProjectSummaryDTO.fromAggregatedData({ name: 'test' })).toThrow(
        'Invalid project summary data: owner is required and must be a string'
      )
      expect(() => ProjectSummaryDTO.fromAggregatedData({ name: 123, owner: 'test' })).toThrow(
        'Invalid project summary data: name is required and must be a string'
      )
    })
  })

  describe('fromBasicData', () => {
    it('should create DTO from basic data with defaults', () => {
      const basicData = {
        createdAt: '2024-01-01T00:00:00Z',
        description: 'A basic project',
        name: 'basic-project',
        owner: 'basic-owner',
        updatedAt: '2025-01-01T00:00:00Z',
        url: 'https://github.com/basic-owner/basic-project'
      }

      const dto = ProjectSummaryDTO.fromBasicData(basicData)

      expect(dto.name).toBe('basic-project')
      expect(dto.owner).toBe('basic-owner')
      expect(dto.description).toBe('A basic project')
      expect(dto.url).toBe('https://github.com/basic-owner/basic-project')
      expect(dto.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(dto.updatedAt).toEqual(new Date('2025-01-01T00:00:00Z'))
      
      // All metrics should be zero/default
      expect(dto.repositoryCount).toBe(0)
      expect(dto.healthScore).toBe(0)
      expect(dto.recentActivityLevel).toBe('low')
    })

    it('should handle minimal basic data', () => {
      const basicData = {
        name: 'minimal',
        owner: 'min-owner'
      }

      const dto = ProjectSummaryDTO.fromBasicData(basicData)

      expect(dto.name).toBe('minimal')
      expect(dto.owner).toBe('min-owner')
      expect(dto.description).toBe('No description available')
      expect(dto.url).toBe('')
      expect(dto.primaryLanguage).toBe('Unknown')
      expect(dto.createdAt).toBeInstanceOf(Date)
      expect(dto.updatedAt).toBeInstanceOf(Date)
    })

    it('should throw error for invalid basic data', () => {
      expect(() => ProjectSummaryDTO.fromBasicData(null)).toThrow(
        'Invalid basic project data: data is null, undefined, or not an object'
      )
      expect(() => ProjectSummaryDTO.fromBasicData({})).toThrow(
        'Invalid basic project data: name is required and must be a string'
      )
      expect(() => ProjectSummaryDTO.fromBasicData({ name: 'test' })).toThrow(
        'Invalid basic project data: owner is required and must be a string'
      )
    })
  })

  describe('utility methods', () => {
    const testDto = new ProjectSummaryDTO(
      'utility-test', 'test-owner', 'Test project', 'https://test.com',
      'TypeScript', ['TypeScript', 'JavaScript'], 
      new Date('2024-01-01T00:00:00Z'), // createdAt
      new Date('2025-01-15T00:00:00Z'), // updatedAt  
      2, 1, 500, 1000, 25, 10, 5, 50, 8, 75, 12, 30, 2, 80, 3, 'high', 85
    )

    describe('getAgeInDays', () => {
      it('should calculate project age correctly', () => {
        const mockDate = new Date('2025-01-20T00:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        const age = testDto.getAgeInDays()
        expect(age).toBe(385) // Days between 2024-01-01 and 2025-01-20

        vi.useRealTimers()
      })
    })

    describe('getDaysSinceUpdate', () => {
      it('should calculate days since last update', () => {
        const mockDate = new Date('2025-01-20T00:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        const daysSince = testDto.getDaysSinceUpdate()
        expect(daysSince).toBe(5) // Days between 2025-01-15 and 2025-01-20

        vi.useRealTimers()
      })
    })

    describe('getActivityDescription', () => {
      it('should return correct activity descriptions', () => {
        const highActivity = new ProjectSummaryDTO(
          'high', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
          1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'high', 80
        )
        const mediumActivity = new ProjectSummaryDTO(
          'medium', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
          1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'medium', 80
        )
        const lowActivity = new ProjectSummaryDTO(
          'low', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
          1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'low', 80
        )

        expect(highActivity.getActivityDescription()).toBe('Very active with frequent commits and updates')
        expect(mediumActivity.getActivityDescription()).toBe('Moderately active with regular updates')
        expect(lowActivity.getActivityDescription()).toBe('Low activity with infrequent updates')
      })
    })

    describe('getHealthStatus', () => {
      it('should return correct health status based on score', () => {
        expect(createDtoWithScore(95).getHealthStatus()).toBe('Excellent')
        expect(createDtoWithScore(75).getHealthStatus()).toBe('Good')
        expect(createDtoWithScore(55).getHealthStatus()).toBe('Fair')
        expect(createDtoWithScore(35).getHealthStatus()).toBe('Poor')
        expect(createDtoWithScore(15).getHealthStatus()).toBe('Critical')
      })
    })

    describe('hasRecentActivity', () => {
      it('should check recent activity correctly', () => {
        const mockDate = new Date('2025-01-20T00:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        expect(testDto.hasRecentActivity(10)).toBe(true) // Updated 5 days ago, within 10 days
        expect(testDto.hasRecentActivity(3)).toBe(false) // Updated 5 days ago, not within 3 days
        expect(testDto.hasRecentActivity()).toBe(true) // Default 30 days, updated 5 days ago

        vi.useRealTimers()
      })
    })

    describe('isActivelyMaintained', () => {
      it('should identify actively maintained projects', () => {
        const mockDate = new Date('2025-01-20T00:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        expect(testDto.isActivelyMaintained()).toBe(true) // All criteria met

        const inactiveDto = new ProjectSummaryDTO(
          'inactive', 'owner', 'desc', 'url', 'lang', [], 
          new Date('2024-01-01T00:00:00Z'), 
          new Date('2024-12-01T00:00:00Z'), // Updated 50 days ago
          1, 1, 100, 100, 0, 5, 0, 10, 2, 80, 5, 5, 1, 80, 2, 'low', 15
        )

        expect(inactiveDto.isActivelyMaintained()).toBe(false) // Fails multiple criteria

        vi.useRealTimers()
      })
    })

    describe('getSummary', () => {
      it('should generate comprehensive project summary', () => {
        const mockDate = new Date('2025-01-20T00:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        const summary = testDto.getSummary()
        expect(summary).toBe('test-owner/utility-test (TypeScript) with 2 repositories - actively maintained')

        vi.useRealTimers()
      })

      it('should handle single repository projects', () => {
        const singleRepoDto = new ProjectSummaryDTO(
          'single', 'owner', 'desc', 'url', 'JavaScript', [], new Date(), new Date(),
          1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'high', 80
        )

        const summary = singleRepoDto.getSummary()
        expect(summary).toBe('owner/single (JavaScript) - actively maintained')
      })

      it('should handle unknown language projects', () => {
        const unknownLangDto = new ProjectSummaryDTO(
          'unknown', 'owner', 'desc', 'url', 'Unknown', [], new Date(), new Date(),
          1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'high', 80
        )

        const summary = unknownLangDto.getSummary()
        expect(summary).toBe('owner/unknown - actively maintained')
      })

      it('should handle inactive projects', () => {
        const inactiveDto = new ProjectSummaryDTO(
          'inactive', 'owner', 'desc', 'url', 'Python', [], 
          new Date('2024-01-01T00:00:00Z'), 
          new Date('2024-06-01T00:00:00Z'),
          1, 1, 100, 100, 0, 5, 0, 10, 2, 80, 5, 5, 1, 80, 2, 'low', 15
        )

        const summary = inactiveDto.getSummary()
        expect(summary).toBe('owner/inactive (Python) - low activity')
      })
    })
  })

  describe('toLLMData', () => {
    it('should convert all properties to LLM data format', () => {
      const dto = new ProjectSummaryDTO(
        'llm-test-project',
        'llm-owner',
        'Test project for LLM data conversion',
        'https://github.com/llm-owner/llm-test-project',
        'TypeScript',
        ['TypeScript', 'JavaScript', 'CSS', 'HTML'],
        new Date('2023-05-15T09:30:00Z'),
        new Date('2025-01-18T16:45:00Z'),
        4, // repositoryCount
        3, // activeRepositories
        2150, // starsTotal
        3842, // totalCommits
        67, // commitsLast30Days
        34, // totalContributors
        12, // activeContributors
        198, // issuesTotalCount
        29, // issuesOpenCount
        85, // issuesClosedRatio
        16, // averageIssueAgeDays
        127, // prsTotalCount
        11, // prsOpenCount
        91, // prsMergedRatio
        8, // averagePrAgeDays
        'high', // recentActivityLevel
        88 // healthScore
      )

      const llmData = dto.toLLMData()

      expect(llmData).toEqual({
        PROJECT_ACTIVE_CONTRIBUTORS: '12',
        PROJECT_ACTIVE_REPOSITORIES: '3',
        PROJECT_AVERAGE_ISSUE_AGE_DAYS: '16',
        PROJECT_AVERAGE_PR_AGE_DAYS: '8',
        PROJECT_COMMITS_LAST_30_DAYS: '67',
        PROJECT_CREATED_AT: '2023-05-15T09:30:00.000Z',
        PROJECT_DESCRIPTION: 'Test project for LLM data conversion',
        PROJECT_HEALTH_SCORE: '88',
        PROJECT_ISSUES_CLOSED_RATIO: '85',
        PROJECT_ISSUES_OPEN_COUNT: '29',
        PROJECT_ISSUES_TOTAL_COUNT: '198',
        PROJECT_LANGUAGES: 'TypeScript, JavaScript, CSS, HTML',
        PROJECT_NAME: 'llm-test-project',
        PROJECT_OWNER: 'llm-owner',
        PROJECT_PRIMARY_LANGUAGE: 'TypeScript',
        PROJECT_PRS_MERGED_RATIO: '91',
        PROJECT_PRS_OPEN_COUNT: '11',
        PROJECT_PRS_TOTAL_COUNT: '127',
        PROJECT_RECENT_ACTIVITY_LEVEL: 'high',
        PROJECT_REPOSITORY_COUNT: '4',
        PROJECT_STARS_TOTAL: '2150',
        PROJECT_TOTAL_COMMITS: '3842',
        PROJECT_TOTAL_CONTRIBUTORS: '34',
        PROJECT_UPDATED_AT: '2025-01-18T16:45:00.000Z',
        PROJECT_URL: 'https://github.com/llm-owner/llm-test-project'
      })
    })

    it('should handle empty languages array', () => {
      const dto = new ProjectSummaryDTO(
        'no-lang', 'owner', 'desc', 'url', 'Unknown', [],
        new Date(), new Date(), 1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'low', 50
      )

      const llmData = dto.toLLMData()
      expect(llmData.PROJECT_LANGUAGES).toBe('')
      expect(llmData.PROJECT_PRIMARY_LANGUAGE).toBe('Unknown')
    })

    it('should use consistent key names matching private Keys constants', () => {
      const dto = new ProjectSummaryDTO(
        'key-test', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
        1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2, 'medium', 70
      )

      const llmData = dto.toLLMData()
      const keys = Object.keys(llmData)

      // Verify all expected keys are present
      const expectedKeys = [
        'PROJECT_ACTIVE_CONTRIBUTORS', 'PROJECT_ACTIVE_REPOSITORIES', 
        'PROJECT_AVERAGE_ISSUE_AGE_DAYS', 'PROJECT_AVERAGE_PR_AGE_DAYS',
        'PROJECT_COMMITS_LAST_30_DAYS', 'PROJECT_CREATED_AT', 'PROJECT_DESCRIPTION',
        'PROJECT_HEALTH_SCORE', 'PROJECT_ISSUES_CLOSED_RATIO', 'PROJECT_ISSUES_OPEN_COUNT',
        'PROJECT_ISSUES_TOTAL_COUNT', 'PROJECT_LANGUAGES', 'PROJECT_NAME', 'PROJECT_OWNER',
        'PROJECT_PRIMARY_LANGUAGE', 'PROJECT_PRS_MERGED_RATIO', 'PROJECT_PRS_OPEN_COUNT',
        'PROJECT_PRS_TOTAL_COUNT', 'PROJECT_RECENT_ACTIVITY_LEVEL', 'PROJECT_REPOSITORY_COUNT',
        'PROJECT_STARS_TOTAL', 'PROJECT_TOTAL_COMMITS', 'PROJECT_TOTAL_CONTRIBUTORS',
        'PROJECT_UPDATED_AT', 'PROJECT_URL'
      ]

      for (const key of expectedKeys) {
        expect(keys).toContain(key)
      }

      expect(keys.length).toBe(expectedKeys.length)
    })
  })
})