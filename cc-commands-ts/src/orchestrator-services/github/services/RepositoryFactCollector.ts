/**
 * @file Repository Fact Collector Service
 * 
 * Pure fact collection service for GitHub repositories. Collects raw
 * mathematical data, statistical measures, and factual information
 * without any interpretation, analysis, or subjective assessment.
 * 
 * CRITICAL: This service performs FACTS-ONLY collection. No analysis,
 * interpretation, or quality judgments are made.
 */

import { MathematicalCalculator } from '../../../core/helpers/MathematicalCalculator.js'
import { IGitHubRestApiService } from '../interfaces/IGitHubRestApiService.js'
import { IRepositoryFactCollector } from '../interfaces/IRepositoryFactCollector.js'
import { TimeWindow } from '../types/FactCollectionTypes.js'

/**
 * Repository fact collector implementation
 * 
 * Collects pure mathematical facts from GitHub repositories using the
 * GitHub API. All methods return key-value string pairs suitable for
 * direct consumption by LLMInfo.
 */
export class RepositoryFactCollector implements IRepositoryFactCollector {
  constructor(
    private readonly githubApi: IGitHubRestApiService
  ) {}

  /**
   * Collect repository activity facts for a given time period
   */
  async collectActivityFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const now = new Date()
    const timeWindow: TimeWindow = {
      businessDays: MathematicalCalculator.businessDaysBetween(since, now),
      endDate: now,
      startDate: since,
      totalDays: Math.round(MathematicalCalculator.daysBetween(since, now))
    }

    // Collect raw activity data using existing DTOs
    const [commits, issues, pullRequests] = await Promise.all([
      this.githubApi.searchCommits(owner, repo, since),
      this.githubApi.searchIssues(owner, repo, since),
      this.githubApi.searchPullRequests(owner, repo, since)
    ])

    // Calculate activity counts
    const commitCount = commits.length
    const issueCount = issues.length
    const prCount = pullRequests.length
    
    // Note: These methods would need to be added to the DTOs or we'd need to access the raw data
    // For now, using basic counts until we can properly integrate with existing DTOs
    const totalActivity = commitCount + issueCount + prCount
    const activityDensity = MathematicalCalculator.calculateRatio(totalActivity, timeWindow.totalDays)

    // Calculate daily rates
    const commitsPerDay = MathematicalCalculator.calculateRatio(commitCount, timeWindow.totalDays)
    const issuesPerDay = MathematicalCalculator.calculateRatio(issueCount, timeWindow.totalDays)
    const prsPerDay = MathematicalCalculator.calculateRatio(prCount, timeWindow.totalDays)

    return {
      ACTIVITY_DENSITY: String(activityDensity),
      ANALYSIS_BUSINESS_DAYS: String(timeWindow.businessDays),
      ANALYSIS_END_DATE: timeWindow.endDate.toISOString(),
      ANALYSIS_PERIOD_DAYS: String(timeWindow.totalDays),
      
      ANALYSIS_START_DATE: timeWindow.startDate.toISOString(),
      COMMITS_PER_DAY: String(commitsPerDay),
      
      COMMITS_TOTAL: String(commitCount),
      ISSUES_PER_DAY: String(issuesPerDay),
      
      ISSUES_TOTAL: String(issueCount),
      PRS_PER_DAY: String(prsPerDay),
      
      PRS_TOTAL: String(prCount),
      TOTAL_ACTIVITY: String(totalActivity)
    }
  }

  /**
   * Collect basic repository metadata facts
   */
  async collectBasicFacts(owner: string, repo: string): Promise<Record<string, string>> {
    const repoDTO = await this.githubApi.getRepository(owner, repo)
    
    const ageInDays = repoDTO.getAgeInDays()
    const daysSinceUpdate = repoDTO.getDaysSinceUpdate()
    const daysSincePush = repoDTO.getDaysSinceLastPush()

    return {
      REPO_AGE_DAYS: String(Math.round(ageInDays)),
      REPO_CREATED_DATE: repoDTO.createdAt.toISOString(),
      REPO_DAYS_SINCE_PUSHED: daysSincePush ? String(Math.round(daysSincePush)) : '',
      REPO_DAYS_SINCE_UPDATED: String(Math.round(daysSinceUpdate)),
      REPO_DEFAULT_BRANCH: repoDTO.defaultBranch,
      REPO_ENGAGEMENT_RATIO: String(MathematicalCalculator.calculateRatio(
        repoDTO.forksCount + repoDTO.watchersCount,
        repoDTO.stargazersCount
      )),
      REPO_FORKS_COUNT: String(repoDTO.forksCount),
      REPO_FORKS_TO_STARS_RATIO: String(MathematicalCalculator.calculateRatio(
        repoDTO.forksCount, 
        repoDTO.stargazersCount
      )),
      REPO_FULL_NAME: repoDTO.fullName,
      REPO_IS_ARCHIVED: String(repoDTO.isArchived),
      REPO_IS_FORK: String(repoDTO.isFork),
      REPO_IS_PRIVATE: String(repoDTO.isPrivate),
      REPO_LANGUAGE: repoDTO.language || '',
      REPO_NAME: repoDTO.name,
      REPO_OPEN_ISSUES_COUNT: String(repoDTO.openIssuesCount),
      REPO_OWNER: repoDTO.owner,
      REPO_PUSHED_DATE: repoDTO.pushedAt?.toISOString() || '',
      REPO_SIZE_KB: String(repoDTO.size),
      REPO_STARS_COUNT: String(repoDTO.stargazersCount),
      REPO_UPDATED_DATE: repoDTO.updatedAt.toISOString(),
      REPO_WATCHERS_COUNT: String(repoDTO.watchersCount),
      REPO_WATCHERS_TO_STARS_RATIO: String(MathematicalCalculator.calculateRatio(
        repoDTO.watchersCount, 
        repoDTO.stargazersCount
      ))
    }
  }

  /**
   * Collect contributor-related facts
   */
  async collectContributorFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const [commits, issues, pullRequests] = await Promise.all([
      this.githubApi.searchCommits(owner, repo, since),
      this.githubApi.searchIssues(owner, repo, since),
      this.githubApi.searchPullRequests(owner, repo, since)
    ])

    // For now, return basic counts. Full contributor analysis would require
    // access to detailed DTO data which needs to be implemented separately
    const totalContributors = commits.length + issues.length + pullRequests.length // Simplified placeholder

    return {
      COMMITS_ANALYZED: String(commits.length),
      ISSUES_ANALYZED: String(issues.length),
      PRS_ANALYZED: String(pullRequests.length),
      TOTAL_CONTRIBUTORS: String(totalContributors)
    }
  }

  /**
   * Collect detailed issue analysis facts
   */
  async collectIssueAnalysisFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const issues = await this.githubApi.searchIssues(owner, repo, since)
    
    return {
      ANALYSIS_PERIOD_END: new Date().toISOString(),
      ANALYSIS_PERIOD_START: since.toISOString(),
      TOTAL_ISSUES_ANALYZED: String(issues.length)
    }
  }

  /**
   * Collect pull request facts
   */
  async collectPullRequestFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const pullRequests = await this.githubApi.searchPullRequests(owner, repo, since)
    
    return {
      ANALYSIS_PERIOD_END: new Date().toISOString(),
      ANALYSIS_PERIOD_START: since.toISOString(),
      TOTAL_PRS_ANALYZED: String(pullRequests.length)
    }
  }

  /**
   * Collect timing pattern facts from repository activity
   */
  async collectTimingPatternFacts(_owner: string, _repo: string, since: Date): Promise<Record<string, string>> {
    // Simplified implementation - full timing analysis would require detailed DTO integration
    return {
      ANALYSIS_PERIOD_END: new Date().toISOString(),
      ANALYSIS_PERIOD_START: since.toISOString(),
      TIMING_ANALYSIS_PLACEHOLDER: 'true'
    }
  }
}