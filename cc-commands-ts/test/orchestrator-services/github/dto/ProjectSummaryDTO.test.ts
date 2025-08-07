/**
 * @file Unit tests for ProjectSummaryDTO
 * 
 * Tests project summary data aggregation and transformation to standardized
 * LLM data format. Covers constructor validation, factory methods, utility
 * methods, calculated metrics, and edge cases.
 */

/* eslint-disable max-nested-callbacks */

import { describe, expect, it } from 'vitest'

import { ProjectSummaryDTO } from '../../../../src/orchestrator-services/github/dto/ProjectSummaryDTO'


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
        18.26, // commitsToIssuesRatio (2847/156)
        31.98, // commitsToPrsRatio (2847/89)
        5.6, // contributorsToReposRatio (28/5)
        250, // starsToReposRatio (1250/5)
        730, // ageDays (2 years)
        5, // daysSinceUpdate
        1.5 // activityDensityLast30Days (45/30)
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
      expect(dto.commitsToIssuesRatio).toBe(18.26)
      expect(dto.commitsToPrsRatio).toBe(31.98)
      expect(dto.contributorsToReposRatio).toBe(5.6)
      expect(dto.starsToReposRatio).toBe(250)
      expect(dto.ageDays).toBe(730)
      expect(dto.daysSinceUpdate).toBe(5)
      expect(dto.activityDensityLast30Days).toBe(1.5)
    })

    it('should handle readonly properties correctly', () => {
      const dto = new ProjectSummaryDTO(
        'test-project', 'test-owner', 'Description', 'https://test.com',
        'JavaScript', [], new Date(), new Date(),
        1, 1, 100, 50, 5, 10, 3, 20, 5, 75, 8, 15, 3, 80, 2,
        2.5, 3.33, 10, 100, 365, 5, 0.17
      )

      // Properties should be readonly - TypeScript compile-time check only
      expect(dto.name).toBe('test-project')
      expect(dto.owner).toBe('test-owner')
      expect(dto.commitsToIssuesRatio).toBe(2.5)
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
        issuesOpenCount: 14,
        issuesTotalCount: 98,
        languages: ['Python', 'R', 'SQL'],
        name: 'data-analysis-toolkit',
        owner: 'analytics-team',
        primaryLanguage: 'Python',
        prsOpenCount: 4,
        prsTotalCount: 67,
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
      expect(dto.commitsToIssuesRatio).toBe(15.54) // Calculated: 1523/98 = 15.54
      expect(dto.commitsToPrsRatio).toBe(22.73) // Calculated: 1523/67 = 22.73
      expect(dto.contributorsToReposRatio).toBe(5) // Calculated: 15/3 = 5.0
      expect(dto.starsToReposRatio).toBe(282.33) // Calculated: 847/3 = 282.33
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
      expect(dto.commitsToIssuesRatio).toBe(0) // No commits or issues
      expect(dto.commitsToPrsRatio).toBe(0) // No commits or PRs
      expect(dto.contributorsToReposRatio).toBe(0) // No contributors or repos
      expect(dto.starsToReposRatio).toBe(0) // No stars or repos
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
      expect(dto.commitsToIssuesRatio).toBe(0) // 0 issues means 0 ratio
      expect(dto.commitsToPrsRatio).toBe(0) // No commits data provided
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
      expect(dto.commitsToIssuesRatio).toBe(0)
      expect(dto.commitsToPrsRatio).toBe(0)
      expect(dto.contributorsToReposRatio).toBe(0)
      expect(dto.starsToReposRatio).toBe(0)
      expect(dto.ageDays).toBeGreaterThan(0) // Should be calculated from dates
      expect(dto.daysSinceUpdate).toBeGreaterThan(0) // Should be calculated from dates
      expect(dto.activityDensityLast30Days).toBe(0) // No activity data
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

  describe('mathematical properties', () => {
    const testDto = new ProjectSummaryDTO(
      'math-test', 'test-owner', 'Test project', 'https://test.com',
      'TypeScript', ['TypeScript', 'JavaScript'], 
      new Date('2024-01-01T00:00:00Z'), // createdAt
      new Date('2025-01-15T00:00:00Z'), // updatedAt  
      2, 1, 500, 1000, 25, 10, 5, 50, 8, 75, 12, 30, 2, 80, 3,
      20, // commitsToIssuesRatio (1000/50)
      33.33, // commitsToPrsRatio (1000/30)
      5, // contributorsToReposRatio (10/2)
      250, // starsToReposRatio (500/2)
      379, // ageDays (calculated from 2024-01-01 to 2025-01-15)
      5, // daysSinceUpdate
      0.83 // activityDensityLast30Days (25/30)
    )

    it('should have correct mathematical ratios', () => {
      expect(testDto.commitsToIssuesRatio).toBe(20)
      expect(testDto.commitsToPrsRatio).toBe(33.33)
      expect(testDto.contributorsToReposRatio).toBe(5)
      expect(testDto.starsToReposRatio).toBe(250)
    })

    it('should have correct temporal calculations', () => {
      expect(testDto.ageDays).toBe(379)
      expect(testDto.daysSinceUpdate).toBe(5)
      expect(testDto.activityDensityLast30Days).toBe(0.83)
    })

    it('should handle zero denominators correctly', () => {
      const zeroDto = new ProjectSummaryDTO(
        'zero-test', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
        0, 0, 0, 100, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, // commitsToIssuesRatio (issues = 0)
        0, // commitsToPrsRatio (PRs = 0)
        0, // contributorsToReposRatio (repos = 0)
        0, // starsToReposRatio (repos = 0)
        100, 5, 0.33
      )

      expect(zeroDto.commitsToIssuesRatio).toBe(0)
      expect(zeroDto.commitsToPrsRatio).toBe(0)
      expect(zeroDto.contributorsToReposRatio).toBe(0)
      expect(zeroDto.starsToReposRatio).toBe(0)
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
        19.41, // commitsToIssuesRatio (3842/198)
        30.25, // commitsToPrsRatio (3842/127)
        8.5, // contributorsToReposRatio (34/4)
        537.5, // starsToReposRatio (2150/4)
        613, // ageDays (calculated)
        7, // daysSinceUpdate
        2.23 // activityDensityLast30Days (67/30)
      )

      const llmData = dto.toLLMData()

      expect(llmData).toEqual({
        PROJECT_ACTIVE_CONTRIBUTORS: '12',
        PROJECT_ACTIVE_REPOSITORIES: '3',
        PROJECT_ACTIVITY_DENSITY_LAST_30_DAYS: '2.23',
        PROJECT_AGE_DAYS: '613',
        PROJECT_AVERAGE_ISSUE_AGE_DAYS: '16',
        PROJECT_AVERAGE_PR_AGE_DAYS: '8',
        PROJECT_COMMITS_LAST_30_DAYS: '67',
        PROJECT_COMMITS_TO_ISSUES_RATIO: '19.41',
        PROJECT_COMMITS_TO_PRS_RATIO: '30.25',
        PROJECT_CONTRIBUTORS_TO_REPOS_RATIO: '8.5',
        PROJECT_CREATED_AT: '2023-05-15T09:30:00.000Z',
        PROJECT_DAYS_SINCE_UPDATE: '7',
        PROJECT_DESCRIPTION: 'Test project for LLM data conversion',
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
        PROJECT_REPOSITORY_COUNT: '4',
        PROJECT_STARS_TO_REPOS_RATIO: '537.5',
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
        new Date(), new Date(), 1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2,
        10, 20, 5, 100, 365, 5, 0.33
      )

      const llmData = dto.toLLMData()
      expect(llmData.PROJECT_LANGUAGES).toBe('')
      expect(llmData.PROJECT_PRIMARY_LANGUAGE).toBe('Unknown')
    })

    it('should use consistent key names matching private Keys constants', () => {
      const dto = new ProjectSummaryDTO(
        'key-test', 'owner', 'desc', 'url', 'lang', [], new Date(), new Date(),
        1, 1, 100, 100, 10, 5, 2, 10, 2, 80, 5, 5, 1, 80, 2,
        10, 20, 5, 100, 365, 5, 0.33
      )

      const llmData = dto.toLLMData()
      const keys = Object.keys(llmData)

      // Verify all expected keys are present
      const expectedKeys = [
        'PROJECT_ACTIVE_CONTRIBUTORS', 'PROJECT_ACTIVE_REPOSITORIES', 
        'PROJECT_ACTIVITY_DENSITY_LAST_30_DAYS', 'PROJECT_AGE_DAYS',
        'PROJECT_AVERAGE_ISSUE_AGE_DAYS', 'PROJECT_AVERAGE_PR_AGE_DAYS',
        'PROJECT_COMMITS_LAST_30_DAYS', 'PROJECT_COMMITS_TO_ISSUES_RATIO',
        'PROJECT_COMMITS_TO_PRS_RATIO', 'PROJECT_CONTRIBUTORS_TO_REPOS_RATIO',
        'PROJECT_CREATED_AT', 'PROJECT_DAYS_SINCE_UPDATE', 'PROJECT_DESCRIPTION',
        'PROJECT_ISSUES_CLOSED_RATIO', 'PROJECT_ISSUES_OPEN_COUNT',
        'PROJECT_ISSUES_TOTAL_COUNT', 'PROJECT_LANGUAGES', 'PROJECT_NAME', 'PROJECT_OWNER',
        'PROJECT_PRIMARY_LANGUAGE', 'PROJECT_PRS_MERGED_RATIO', 'PROJECT_PRS_OPEN_COUNT',
        'PROJECT_PRS_TOTAL_COUNT', 'PROJECT_REPOSITORY_COUNT', 'PROJECT_STARS_TO_REPOS_RATIO',
        'PROJECT_STARS_TOTAL', 'PROJECT_TOTAL_COMMITS', 'PROJECT_TOTAL_CONTRIBUTORS',
        'PROJECT_UPDATED_AT', 'PROJECT_URL'
      ]

      for (const key of expectedKeys) {
        expect(keys).toContain(key)
      }

      expect(keys).toHaveLength(expectedKeys.length)
    })
  })

  describe('JSON methods for result files', () => {
    let dto: ProjectSummaryDTO
    
    beforeEach(() => {
      dto = new ProjectSummaryDTO(
        'Test Project', 
        'test-org', 
        'A comprehensive test project for validation',
        'https://github.com/orgs/test/projects/1',
        'TypeScript',
        ['TypeScript', 'JavaScript', 'Python'], 
        new Date('2023-01-01T00:00:00Z'), 
        new Date('2025-01-15T00:00:00Z'),
        3, 150, 25, 45, 20, 8, 12,
        10, 20, 5, 100, 365, 5, 0.33
      )
    })
    
    describe('toJsonData', () => {
      it('should return structured project data with all namespaces', () => {
        const jsonData = dto.toJsonData()
        
        expect(jsonData).toHaveProperty('raw')
        expect(jsonData).toHaveProperty('calculated')
        expect(jsonData.raw).toHaveProperty('github_api')
        expect(jsonData.calculated).toHaveProperty('project_totals')
        expect(jsonData.calculated).toHaveProperty('time_calculations')
        expect(jsonData.calculated).toHaveProperty('activity_metrics')
        expect(jsonData.calculated).toHaveProperty('mathematical_ratios')
        expect(jsonData.calculated).toHaveProperty('statistical_measures')
      })
      
      it('should preserve raw project data unchanged', () => {
        const jsonData = dto.toJsonData()
        const rawData = jsonData.raw.github_api
        
        expect(rawData.name).toBe('Test Project')
        expect(rawData.url).toBe('https://github.com/orgs/test/projects/1')
        expect(rawData.description).toBe('A comprehensive test project for validation')
        expect(rawData.owner).toBe('test-org')
        expect(rawData.primary_language).toBe('TypeScript')
      })
      
      it('should calculate project totals correctly', () => {
        const jsonData = dto.toJsonData()
        const totals = jsonData.calculated.project_totals
        
        expect(totals.repository_count).toBe(3)
        expect(totals.total_stars).toBe(150)
        expect(totals.total_contributors).toBe(25)
        expect(totals.total_commits).toBe(45)
        expect(totals.issues_total_count).toBe(20)
        expect(totals.prs_total_count).toBe(12)
      })
      
      it('should calculate activity metrics correctly', () => {
        const jsonData = dto.toJsonData()
        const activity = jsonData.calculated.activity_metrics
        
        expect(activity.commits_last_30_days).toBe(10)
        expect(activity.issues_open_count).toBe(8)
        expect(activity.prs_open_count).toBe(5)
        expect(activity.active_contributors).toBe(20)
        expect(activity.active_repositories).toBe(5)
      })
      
      it('should calculate mathematical ratios correctly', () => {
        const jsonData = dto.toJsonData()
        const ratios = jsonData.calculated.mathematical_ratios
        
        expect(ratios.stars_to_repos_ratio).toBeCloseTo(150/3, 2)
        expect(ratios.contributors_to_repos_ratio).toBeCloseTo(25/3, 2)
        expect(ratios.commits_to_issues_ratio).toBeCloseTo(45/20, 2)
        expect(ratios.commits_to_prs_ratio).toBeCloseTo(45/12, 2)
        expect(ratios.issues_closed_ratio).toBeCloseTo((20-8)/20, 2)
        expect(ratios.prs_merged_ratio).toBeCloseTo((12-5)/12, 2)
      })
      
      it('should calculate time-based metrics correctly', () => {
        const jsonData = dto.toJsonData()
        const timeCalcs = jsonData.calculated.time_calculations
        
        expect(timeCalcs.age_days).toBeGreaterThan(700) // More than 2 years
        expect(timeCalcs.days_since_update).toBeGreaterThan(0)
        expect(timeCalcs.activity_density_last_30_days).toBe(0.33)
        expect(timeCalcs.created_at_iso).toBe('2023-01-01T00:00:00.000Z')
        expect(timeCalcs.updated_at_iso).toBe('2025-01-15T00:00:00.000Z')
      })
      
      it('should calculate statistical measures', () => {
        const jsonData = dto.toJsonData()
        const stats = jsonData.calculated.statistical_measures
        
        expect(stats.average_issue_age_days).toBe(100)
        expect(stats.average_pr_age_days).toBe(365)
        expect(typeof stats.repository_count_percentile).toBe('number')
        expect(typeof stats.contributor_count_percentile).toBe('number')
      })
    })
    
    describe('getJqHints', () => {
      it('should return comprehensive project-level jq hints', () => {
        const hints = dto.getJqHints()
        
        expect(hints.length).toBeGreaterThan(10)
        expect(hints).toContainEqual(expect.objectContaining({
          description: expect.stringContaining('repositories'),
          query: '.calculated.project_totals.repository_count',
          scope: 'single_item'
        }))
      })
      
      it('should include hints for all project calculation categories', () => {
        const hints = dto.getJqHints()
        const queries = hints.map(h => h.query)
        
        expect(queries.some(q => q.includes('project_totals'))).toBe(true)
        expect(queries.some(q => q.includes('time_calculations'))).toBe(true)
        expect(queries.some(q => q.includes('activity_metrics'))).toBe(true)
        expect(queries.some(q => q.includes('mathematical_ratios'))).toBe(true)
        expect(queries.some(q => q.includes('statistical_measures'))).toBe(true)
      })
      
      it('should provide project-specific query examples', () => {
        const hints = dto.getJqHints()
        const descriptions = hints.map(h => h.description.toLowerCase())
        
        expect(descriptions.some(d => d.includes('project'))).toBe(true)
        expect(descriptions.some(d => d.includes('repository') || d.includes('repo'))).toBe(true)
        expect(descriptions.some(d => d.includes('contributor'))).toBe(true)
        expect(descriptions.some(d => d.includes('issue') || d.includes('pull request'))).toBe(true)
      })
    })
  })
})