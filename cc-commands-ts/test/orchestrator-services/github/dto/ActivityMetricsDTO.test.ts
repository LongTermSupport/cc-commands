/**
 * @file Unit tests for ActivityMetricsDTO
 * 
 * Tests the ActivityMetricsDTO class including constructor validation,
 * toLLMData method, factory methods, utility methods, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ActivityMetricsDTO } from '../../../../src/orchestrator-services/github/dto/ActivityMetricsDTO.js'

describe('ActivityMetricsDTO', () => {
  const validActivityData = {
    activeContributors: 5,
    analysisPeriodDays: 30,
    analysisPeriodEnd: new Date('2025-01-15T12:00:00Z'),
    analysisPeriodStart: new Date('2024-12-16T12:00:00Z'),
    avgCommitsPerDay: 2.5,
    avgIssuesPerDay: 1.2,
    avgPrsPerDay: 0.8,
    closedIssuesCount: 25,
    commitsCount: 75,
    contributorsCount: 8,
    mergedPrsCount: 20,
    mostActiveContributor: 'alice-dev',
    mostActiveRepository: 'owner/main-repo',
    openIssuesCount: 11,
    openPrsCount: 4,
    releaseCount: 2,
    repositoriesCount: 3,
    repositoryList: ['owner/repo1', 'owner/repo2', 'owner/repo3'],
    totalAdditions: 2500,
    totalDeletions: 800,
    totalFilesChanged: 150,
    totalIssuesCount: 36,
    totalPrsCount: 24
  }

  describe('constructor', () => {
    it('should create a valid ActivityMetricsDTO instance', () => {
      const dto = new ActivityMetricsDTO(
        validActivityData.repositoriesCount,
        validActivityData.repositoryList,
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        validActivityData.analysisPeriodDays,
        validActivityData.commitsCount,
        validActivityData.totalIssuesCount,
        validActivityData.openIssuesCount,
        validActivityData.closedIssuesCount,
        validActivityData.totalPrsCount,
        validActivityData.openPrsCount,
        validActivityData.mergedPrsCount,
        validActivityData.contributorsCount,
        validActivityData.activeContributors,
        validActivityData.mostActiveContributor,
        validActivityData.mostActiveRepository,
        validActivityData.releaseCount,
        validActivityData.totalAdditions,
        validActivityData.totalDeletions,
        validActivityData.totalFilesChanged,
        validActivityData.avgCommitsPerDay,
        validActivityData.avgIssuesPerDay,
        validActivityData.avgPrsPerDay
      )

      expect(dto.repositoriesCount).toBe(3)
      expect(dto.repositoryList).toEqual(['owner/repo1', 'owner/repo2', 'owner/repo3'])
      expect(dto.commitsCount).toBe(75)
      expect(dto.totalIssuesCount).toBe(36)
      expect(dto.activeContributors).toBe(5)
      expect(dto.mostActiveContributor).toBe('alice-dev')
      expect(dto.avgCommitsPerDay).toBe(2.5)
    })

    it('should handle metrics with null optional fields', () => {
      const dto = new ActivityMetricsDTO(
        1,
        ['owner/solo-repo'],
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        30,
        0, // no commits
        0, // no issues
        0,
        0,
        0, // no PRs
        0,
        0,
        0, // no contributors
        0,
        null, // no most active contributor
        null, // no most active repository
        0, // no releases
        0, // no additions
        0, // no deletions
        0, // no files changed
        0, // no daily averages
        0,
        0
      )

      expect(dto.repositoriesCount).toBe(1)
      expect(dto.commitsCount).toBe(0)
      expect(dto.mostActiveContributor).toBeNull()
      expect(dto.mostActiveRepository).toBeNull()
      expect(dto.avgCommitsPerDay).toBe(0)
    })

    it('should handle single repository metrics', () => {
      const dto = new ActivityMetricsDTO(
        1,
        ['owner/single-repo'],
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        7, // one week
        14, // 2 commits per day
        5,
        2,
        3,
        3,
        1,
        2,
        2,
        2,
        'solo-dev',
        'owner/single-repo',
        1,
        500,
        100,
        25,
        2,
        0.71,
        0.43
      )

      expect(dto.repositoriesCount).toBe(1)
      expect(dto.repositoryList).toEqual(['owner/single-repo'])
      expect(dto.analysisPeriodDays).toBe(7)
      expect(dto.mostActiveRepository).toBe('owner/single-repo')
    })
  })

  describe('toLLMData', () => {
    it('should convert to LLM data format correctly', () => {
      const dto = new ActivityMetricsDTO(
        validActivityData.repositoriesCount,
        validActivityData.repositoryList,
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        validActivityData.analysisPeriodDays,
        validActivityData.commitsCount,
        validActivityData.totalIssuesCount,
        validActivityData.openIssuesCount,
        validActivityData.closedIssuesCount,
        validActivityData.totalPrsCount,
        validActivityData.openPrsCount,
        validActivityData.mergedPrsCount,
        validActivityData.contributorsCount,
        validActivityData.activeContributors,
        validActivityData.mostActiveContributor,
        validActivityData.mostActiveRepository,
        validActivityData.releaseCount,
        validActivityData.totalAdditions,
        validActivityData.totalDeletions,
        validActivityData.totalFilesChanged,
        validActivityData.avgCommitsPerDay,
        validActivityData.avgIssuesPerDay,
        validActivityData.avgPrsPerDay
      )

      const llmData = dto.toLLMData()

      expect(llmData.ACTIVITY_REPOSITORIES_COUNT).toBe('3')
      expect(llmData.ACTIVITY_REPOSITORY_LIST).toBe('owner/repo1, owner/repo2, owner/repo3')
      expect(llmData.ACTIVITY_ANALYSIS_PERIOD_DAYS).toBe('30')
      expect(llmData.ACTIVITY_ANALYSIS_PERIOD_START).toBe('2024-12-16T12:00:00.000Z')
      expect(llmData.ACTIVITY_ANALYSIS_PERIOD_END).toBe('2025-01-15T12:00:00.000Z')
      expect(llmData.ACTIVITY_COMMITS_COUNT).toBe('75')
      expect(llmData.ACTIVITY_TOTAL_ISSUES_COUNT).toBe('36')
      expect(llmData.ACTIVITY_OPEN_ISSUES_COUNT).toBe('11')
      expect(llmData.ACTIVITY_CLOSED_ISSUES_COUNT).toBe('25')
      expect(llmData.ACTIVITY_TOTAL_PRS_COUNT).toBe('24')
      expect(llmData.ACTIVITY_OPEN_PRS_COUNT).toBe('4')
      expect(llmData.ACTIVITY_MERGED_PRS_COUNT).toBe('20')
      expect(llmData.ACTIVITY_CONTRIBUTORS_COUNT).toBe('8')
      expect(llmData.ACTIVITY_ACTIVE_CONTRIBUTORS).toBe('5')
      expect(llmData.ACTIVITY_MOST_ACTIVE_CONTRIBUTOR).toBe('alice-dev')
      expect(llmData.ACTIVITY_MOST_ACTIVE_REPOSITORY).toBe('owner/main-repo')
      expect(llmData.ACTIVITY_RELEASE_COUNT).toBe('2')
      expect(llmData.ACTIVITY_TOTAL_ADDITIONS).toBe('2500')
      expect(llmData.ACTIVITY_TOTAL_DELETIONS).toBe('800')
      expect(llmData.ACTIVITY_TOTAL_FILES_CHANGED).toBe('150')
      expect(llmData.ACTIVITY_AVG_COMMITS_PER_DAY).toBe('2.5')
      expect(llmData.ACTIVITY_AVG_ISSUES_PER_DAY).toBe('1.2')
      expect(llmData.ACTIVITY_AVG_PRS_PER_DAY).toBe('0.8')
    })

    it('should handle null values in toLLMData', () => {
      const dto = new ActivityMetricsDTO(
        1,
        ['owner/empty-repo'],
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        30,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        null, // no most active contributor
        null, // no most active repository
        0, 0, 0, 0, 0, 0, 0
      )

      const llmData = dto.toLLMData()

      expect(llmData.ACTIVITY_MOST_ACTIVE_CONTRIBUTOR).toBe('')
      expect(llmData.ACTIVITY_MOST_ACTIVE_REPOSITORY).toBe('')
      expect(llmData.ACTIVITY_COMMITS_COUNT).toBe('0')
      expect(llmData.ACTIVITY_REPOSITORIES_COUNT).toBe('1')
      expect(llmData.ACTIVITY_REPOSITORY_LIST).toBe('owner/empty-repo')
    })
  })

  describe('fromAggregatedData', () => {
    it('should create DTO from aggregated metrics data', () => {
      const repositories = ['owner/repo1', 'owner/repo2']
      const periodStart = new Date('2025-01-01T00:00:00Z')
      const periodEnd = new Date('2025-01-08T00:00:00Z') // 7 days
      const metrics = {
        codeChanges: { additions: 1200, deletions: 300, filesChanged: 45 },
        commits: 28,
        contributors: { active: 3, mostActive: 'top-dev', total: 4 },
        issues: { closed: 7, open: 8, total: 15 },
        mostActiveRepo: 'owner/repo1',
        pullRequests: { merged: 9, open: 3, total: 12 },
        releases: 1
      }

      const dto = ActivityMetricsDTO.fromAggregatedData(repositories, periodStart, periodEnd, metrics)

      expect(dto.repositoriesCount).toBe(2)
      expect(dto.repositoryList).toEqual(['owner/repo1', 'owner/repo2'])
      expect(dto.analysisPeriodDays).toBe(7)
      expect(dto.commitsCount).toBe(28)
      expect(dto.totalIssuesCount).toBe(15)
      expect(dto.openIssuesCount).toBe(8)
      expect(dto.closedIssuesCount).toBe(7)
      expect(dto.totalPrsCount).toBe(12)
      expect(dto.mergedPrsCount).toBe(9)
      expect(dto.contributorsCount).toBe(4)
      expect(dto.activeContributors).toBe(3)
      expect(dto.mostActiveContributor).toBe('top-dev')
      expect(dto.mostActiveRepository).toBe('owner/repo1')
      expect(dto.releaseCount).toBe(1)
      expect(dto.totalAdditions).toBe(1200)
      expect(dto.avgCommitsPerDay).toBe(4) // 28 commits / 7 days
    })

    it('should handle metrics without optional fields', () => {
      const repositories = ['owner/minimal-repo']
      const periodStart = new Date('2025-01-01T00:00:00Z')
      const periodEnd = new Date('2025-01-02T00:00:00Z') // 1 day
      const metrics = {
        codeChanges: { additions: 50, deletions: 10, filesChanged: 3 },
        commits: 2,
        contributors: { active: 1, total: 1 }, // no mostActive
        issues: { closed: 0, open: 1, total: 1 },
        pullRequests: { merged: 0, open: 0, total: 0 },
        releases: 0
      }

      const dto = ActivityMetricsDTO.fromAggregatedData(repositories, periodStart, periodEnd, metrics)

      expect(dto.mostActiveContributor).toBeNull()
      expect(dto.mostActiveRepository).toBeNull()
      expect(dto.analysisPeriodDays).toBe(1)
      expect(dto.avgCommitsPerDay).toBe(2)
    })
  })

  describe('fromTimeWindow', () => {
    it('should create DTO from time window analysis', () => {
      const repositories = ['owner/repo1', 'owner/repo2']
      const timeWindow = 14 // 2 weeks
      const rawMetrics = {
        commitData: [
          { additions: 800, count: 20, deletions: 200, files: 30, repo: 'owner/repo1' },
          { additions: 600, count: 15, deletions: 150, files: 25, repo: 'owner/repo2' }
        ],
        contributorData: [
          { activeContributors: ['alice', 'bob'], contributors: ['alice', 'bob', 'carol'], repo: 'owner/repo1' },
          { activeContributors: ['alice'], contributors: ['alice', 'david'], repo: 'owner/repo2' }
        ],
        issueData: [
          { closed: 5, open: 3, repo: 'owner/repo1', total: 8 },
          { closed: 3, open: 2, repo: 'owner/repo2', total: 5 }
        ],
        prData: [
          { merged: 5, open: 1, repo: 'owner/repo1', total: 6 },
          { merged: 3, open: 1, repo: 'owner/repo2', total: 4 }
        ],
        releaseData: [
          { releases: 1, repo: 'owner/repo1' },
          { releases: 0, repo: 'owner/repo2' }
        ]
      }

      const dto = ActivityMetricsDTO.fromTimeWindow(repositories, timeWindow, rawMetrics)

      expect(dto.repositoriesCount).toBe(2)
      expect(dto.analysisPeriodDays).toBe(14)
      expect(dto.commitsCount).toBe(35) // 20 + 15
      expect(dto.totalIssuesCount).toBe(13) // 8 + 5
      expect(dto.totalPrsCount).toBe(10) // 6 + 4
      expect(dto.contributorsCount).toBe(4) // alice, bob, carol, david (unique)
      expect(dto.activeContributors).toBe(2) // alice, bob (unique active)
      expect(dto.mostActiveRepository).toBe('owner/repo1') // highest commit count
      expect(dto.totalAdditions).toBe(1400) // 800 + 600
      expect(dto.totalDeletions).toBe(350) // 200 + 150
      expect(dto.totalFilesChanged).toBe(55) // 30 + 25
      expect(dto.releaseCount).toBe(1)
      expect(dto.avgCommitsPerDay).toBe(2.5) // 35 commits / 14 days
    })

    it('should handle empty metrics data', () => {
      const repositories = ['owner/empty-repo']
      const timeWindow = 7
      const rawMetrics = {
        commitData: [],
        contributorData: [],
        issueData: [],
        prData: [],
        releaseData: []
      }

      const dto = ActivityMetricsDTO.fromTimeWindow(repositories, timeWindow, rawMetrics)

      expect(dto.repositoriesCount).toBe(1)
      expect(dto.commitsCount).toBe(0)
      expect(dto.contributorsCount).toBe(0)
      expect(dto.mostActiveContributor).toBeNull()
      expect(dto.mostActiveRepository).toBeNull()
      expect(dto.avgCommitsPerDay).toBe(0)
    })
  })

  describe('createEmpty', () => {
    it('should create empty metrics DTO', () => {
      const repositories = ['owner/repo1', 'owner/repo2']
      const periodStart = new Date('2025-01-01T00:00:00Z')
      const periodEnd = new Date('2025-01-31T00:00:00Z') // 30 days

      const dto = ActivityMetricsDTO.createEmpty(repositories, periodStart, periodEnd)

      expect(dto.repositoriesCount).toBe(2)
      expect(dto.repositoryList).toEqual(['owner/repo1', 'owner/repo2'])
      expect(dto.analysisPeriodDays).toBe(30)
      expect(dto.commitsCount).toBe(0)
      expect(dto.totalIssuesCount).toBe(0)
      expect(dto.totalPrsCount).toBe(0)
      expect(dto.contributorsCount).toBe(0)
      expect(dto.activeContributors).toBe(0)
      expect(dto.mostActiveContributor).toBeNull()
      expect(dto.mostActiveRepository).toBeNull()
      expect(dto.releaseCount).toBe(0)
      expect(dto.avgCommitsPerDay).toBe(0)
      expect(dto.avgIssuesPerDay).toBe(0)
      expect(dto.avgPrsPerDay).toBe(0)
    })
  })

  describe('utility methods', () => {
    let dto: ActivityMetricsDTO

    beforeEach(() => {
      dto = new ActivityMetricsDTO(
        validActivityData.repositoriesCount,
        validActivityData.repositoryList,
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        validActivityData.analysisPeriodDays,
        validActivityData.commitsCount,
        validActivityData.totalIssuesCount,
        validActivityData.openIssuesCount,
        validActivityData.closedIssuesCount,
        validActivityData.totalPrsCount,
        validActivityData.openPrsCount,
        validActivityData.mergedPrsCount,
        validActivityData.contributorsCount,
        validActivityData.activeContributors,
        validActivityData.mostActiveContributor,
        validActivityData.mostActiveRepository,
        validActivityData.releaseCount,
        validActivityData.totalAdditions,
        validActivityData.totalDeletions,
        validActivityData.totalFilesChanged,
        validActivityData.avgCommitsPerDay,
        validActivityData.avgIssuesPerDay,
        validActivityData.avgPrsPerDay
      )
    })

    it('should generate correct summary', () => {
      const summary = dto.getSummary()
      expect(summary).toBe('3 repositories, 30 days: 75 commits, 36 issues, 24 PRs (moderate activity)')
    })

    it('should generate summary for single repository', () => {
      const singleRepoDto = new ActivityMetricsDTO(
        1, ['owner/solo'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        7, 5, 2, 1, 1, 1, 0, 1, 1, 1, 'dev', 'owner/solo', 0, 100, 20, 5, 0.71, 0.29, 0.14
      )

      const summary = singleRepoDto.getSummary()
      expect(summary).toBe('1 repository, 7 days: 5 commits, 2 issues, 1 PRs (moderate activity)')
    })

    it('should calculate activity intensity correctly', () => {
      expect(dto.getActivityIntensity()).toBe('moderate') // (75+36+24)/30 = 4.5 avg daily
      
      // Test other intensity levels
      const lowActivityDto = new ActivityMetricsDTO(
        1, ['owner/low'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        30, 5, 3, 1, 2, 2, 1, 1, 1, 1, null, null, 0, 50, 10, 3, 0.17, 0.1, 0.07
      )
      expect(lowActivityDto.getActivityIntensity()).toBe('low') // (5+3+2)/30 = 0.33

      const veryHighDto = new ActivityMetricsDTO(
        1, ['owner/busy'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        10, 200, 80, 40, 40, 50, 10, 40, 5, 3, null, null, 5, 5000, 1000, 200, 20, 8, 5
      )
      expect(veryHighDto.getActivityIntensity()).toBe('very_high') // (200+80+50)/10 = 33 avg daily
    })

    it('should calculate merge rate correctly', () => {
      expect(dto.getMergeRate()).toBe(83) // 20 merged / 24 total = 83.33% rounded to 83%
      
      // Test edge case with no PRs
      const noPrDto = new ActivityMetricsDTO(
        1, ['owner/no-prs'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        7, 10, 5, 2, 3, 0, 0, 0, 2, 1, null, null, 0, 100, 20, 5, 1.43, 0.71, 0
      )
      expect(noPrDto.getMergeRate()).toBe(0)
    })

    it('should calculate issue resolution rate correctly', () => {
      expect(dto.getIssueResolutionRate()).toBe(69) // 25 closed / 36 total = 69.44% rounded to 69%
      
      // Test edge case with no issues
      const noIssueDto = new ActivityMetricsDTO(
        1, ['owner/no-issues'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        7, 10, 0, 0, 0, 3, 1, 2, 2, 1, null, null, 0, 100, 20, 5, 1.43, 0, 0.43
      )
      expect(noIssueDto.getIssueResolutionRate()).toBe(0)
    })

    it('should calculate contributor engagement ratio correctly', () => {
      expect(dto.getContributorEngagementRatio()).toBe(0.63) // 5 active / 8 total = 0.625 rounded to 0.63
      
      // Test edge case with no contributors
      const noContributorDto = new ActivityMetricsDTO(
        1, ['owner/automated'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        7, 10, 2, 1, 1, 1, 0, 1, 0, 0, null, null, 0, 100, 20, 5, 1.43, 0.29, 0.14
      )
      expect(noContributorDto.getContributorEngagementRatio()).toBe(0)
    })

    it('should detect actively developed projects', () => {
      expect(dto.isActivelyDeveloped()).toBe(true) // 75 commits over 30 days with active contributors
      
      // Test inactive project
      const inactiveDto = new ActivityMetricsDTO(
        1, ['owner/stale'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        30, 1, 5, 3, 2, 2, 1, 1, 0, 0, null, null, 0, 10, 5, 1, 0.03, 0.17, 0.07
      )
      expect(inactiveDto.isActivelyDeveloped()).toBe(false) // Only 1 commit, no active contributors
    })
  })

  describe('edge cases and validation', () => {
    it('should handle zero time period', () => {
      const sameDate = new Date('2025-01-15T12:00:00Z')
      const dto = ActivityMetricsDTO.createEmpty(['owner/repo'], sameDate, sameDate)
      
      expect(dto.analysisPeriodDays).toBe(0)
      expect(dto.avgCommitsPerDay).toBe(0) // Should not divide by zero
    })

    it('should handle large numbers', () => {
      const largeNumbers = {
        commits: 50_000,
        contributors: 1000,
        issues: 25_000,
        prs: 15_000
      }

      const dto = new ActivityMetricsDTO(
        100, // 100 repositories
        Array.from({ length: 100 }, (_, i) => `owner/repo${i + 1}`),
        validActivityData.analysisPeriodStart,
        validActivityData.analysisPeriodEnd,
        365, // full year
        largeNumbers.commits,
        largeNumbers.issues,
        largeNumbers.issues * 0.3, // 30% open
        largeNumbers.issues * 0.7, // 70% closed
        largeNumbers.prs,
        largeNumbers.prs * 0.2, // 20% open
        largeNumbers.prs * 0.8, // 80% merged
        largeNumbers.contributors,
        largeNumbers.contributors * 0.6, // 60% active
        'super-contributor',
        'owner/main-repo',
        50, // releases
        1_000_000, // additions
        300_000, // deletions
        50_000, // files changed
        136.99, // avg commits per day
        68.49, // avg issues per day
        41.1 // avg PRs per day
      )

      const llmData = dto.toLLMData()
      expect(llmData.ACTIVITY_COMMITS_COUNT).toBe('50000')
      expect(llmData.ACTIVITY_CONTRIBUTORS_COUNT).toBe('1000')
      expect(llmData.ACTIVITY_REPOSITORIES_COUNT).toBe('100')
      expect(dto.getActivityIntensity()).toBe('very_high')
    })

    it('should handle empty repository list', () => {
      const dto = ActivityMetricsDTO.createEmpty([], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd)
      
      expect(dto.repositoriesCount).toBe(0)
      expect(dto.repositoryList).toEqual([])
      
      const llmData = dto.toLLMData()
      expect(llmData.ACTIVITY_REPOSITORY_LIST).toBe('')
    })

    it('should handle unicode and special characters in repository names', () => {
      const unicodeRepos = ['owner/测试-repo', 'owner/émoji-🚀-repo', 'owner/special.chars_repo']
      const dto = ActivityMetricsDTO.createEmpty(unicodeRepos, validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd)
      
      expect(dto.repositoryList).toEqual(unicodeRepos)
      
      const llmData = dto.toLLMData()
      expect(llmData.ACTIVITY_REPOSITORY_LIST).toBe('owner/测试-repo, owner/émoji-🚀-repo, owner/special.chars_repo')
    })

    it('should handle fractional averages correctly', () => {
      // Test rounding behavior
      const dto = new ActivityMetricsDTO(
        1, ['owner/precise'], validActivityData.analysisPeriodStart, validActivityData.analysisPeriodEnd,
        3, // 3 days
        10, 7, 3, 4, 5, 2, 3, 4, 2, 'dev', 'owner/precise', 1, 250, 75, 15,
        3.33, // 10/3 = 3.333... should round to 3.33
        2.33, // 7/3 = 2.333... should round to 2.33
        1.67  // 5/3 = 1.666... should round to 1.67
      )

      const llmData = dto.toLLMData()
      expect(llmData.ACTIVITY_AVG_COMMITS_PER_DAY).toBe('3.33')
      expect(llmData.ACTIVITY_AVG_ISSUES_PER_DAY).toBe('2.33')
      expect(llmData.ACTIVITY_AVG_PRS_PER_DAY).toBe('1.67')
    })
  })
})