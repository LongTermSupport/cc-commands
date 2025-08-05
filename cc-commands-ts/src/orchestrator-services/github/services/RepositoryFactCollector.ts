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

    // Calculate basic activity counts
    const commitCount = commits.length
    const totalIssues = issues.length
    const totalPrs = pullRequests.length
    
    // Calculate issue breakdowns (mathematical facts only)
    const openIssues = issues.filter(issue => issue.state === 'open').length
    const closedIssues = issues.filter(issue => issue.state === 'closed').length
    
    // Calculate PR breakdowns (mathematical facts only) 
    const openPrs = pullRequests.filter(pr => pr.state === 'open').length
    const mergedPrs = pullRequests.filter(pr => pr.mergedAt !== null).length
    const closedPrs = pullRequests.filter(pr => pr.state === 'closed' && pr.mergedAt === null).length
    
    // Calculate mathematical ratios
    const issueOpenCloseRatio = MathematicalCalculator.calculateRatio(openIssues, closedIssues)
    const prMergeSuccessRate = MathematicalCalculator.calculateRatio(mergedPrs, totalPrs)
    const commitsToIssuesRatio = MathematicalCalculator.calculateRatio(commitCount, totalIssues)
    const commitsToPrsRatio = MathematicalCalculator.calculateRatio(commitCount, totalPrs)
    
    // Calculate velocity metrics (pure mathematical rates)
    const commitsPerDay = MathematicalCalculator.calculateRatio(commitCount, timeWindow.totalDays)
    const issuesPerDay = MathematicalCalculator.calculateRatio(totalIssues, timeWindow.totalDays)
    const prsPerDay = MathematicalCalculator.calculateRatio(totalPrs, timeWindow.totalDays)
    const commitsPerBusinessDay = MathematicalCalculator.calculateRatio(commitCount, timeWindow.businessDays)
    
    // Calculate activity density metrics
    const totalActivity = commitCount + totalIssues + totalPrs
    const activityDensity = MathematicalCalculator.calculateRatio(totalActivity, timeWindow.totalDays)
    const businessDayActivityDensity = MathematicalCalculator.calculateRatio(totalActivity, timeWindow.businessDays)

    return {
      ACTIVITY_DENSITY_PER_BUSINESS_DAY: String(businessDayActivityDensity),
      // Activity density metrics
      ACTIVITY_DENSITY_PER_DAY: String(activityDensity),
      ANALYSIS_BUSINESS_DAYS: String(timeWindow.businessDays),
      ANALYSIS_END_DATE: timeWindow.endDate.toISOString(),
      
      // Time window facts
      ANALYSIS_PERIOD_DAYS: String(timeWindow.totalDays),
      ANALYSIS_START_DATE: timeWindow.startDate.toISOString(),
      COMMITS_PER_BUSINESS_DAY: String(commitsPerBusinessDay),
      // Velocity metrics (daily rates)
      COMMITS_PER_DAY: String(commitsPerDay),
      COMMITS_TO_ISSUES_RATIO: String(commitsToIssuesRatio),
      COMMITS_TO_PRS_RATIO: String(commitsToPrsRatio),
      // Activity counts (raw facts)
      COMMITS_TOTAL: String(commitCount),
      // Mathematical ratios
      ISSUE_OPEN_CLOSE_RATIO: String(issueOpenCloseRatio),
      ISSUES_CLOSED: String(closedIssues),
      
      ISSUES_OPEN: String(openIssues),
      ISSUES_PER_DAY: String(issuesPerDay),
      ISSUES_TOTAL: String(totalIssues),
      PR_MERGE_SUCCESS_RATE: String(prMergeSuccessRate),
      
      PRS_CLOSED_UNMERGED: String(closedPrs),
      PRS_MERGED: String(mergedPrs),
      PRS_OPEN: String(openPrs),
      PRS_PER_DAY: String(prsPerDay),
      
      PRS_TOTAL: String(totalPrs),
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

    // Extract unique contributors from each activity type (mathematical fact collection)
    const commitAuthors = new Set(commits.map(c => c.authorName).filter(Boolean))
    const issueAuthors = new Set(issues.map(i => i.creator).filter(Boolean))
    const prAuthors = new Set(pullRequests.map(pr => pr.creator).filter(Boolean))
    
    // Calculate contributor overlap and distribution (mathematical facts)
    const allContributors = new Set([...commitAuthors, ...issueAuthors, ...prAuthors])
    const commitOnlyContributors = new Set([...commitAuthors].filter(c => !issueAuthors.has(c) && !prAuthors.has(c)))
    const crossActivityContributors = new Set([...commitAuthors].filter(c => issueAuthors.has(c) || prAuthors.has(c)))
    
    // Calculate contribution distribution metrics
    const contributorCommitCounts: Record<string, number> = {}
    for (const commit of commits) {
      if (commit.authorName) {
        contributorCommitCounts[commit.authorName] = (contributorCommitCounts[commit.authorName] || 0) + 1
      }
    }
    
    const commitCounts = Object.values(contributorCommitCounts)
    const totalCommitsByContributors = commitCounts.reduce((sum, count) => sum + count, 0)
    
    // Find top contributor (mathematical fact)
    const topContributor = Object.entries(contributorCommitCounts)
      .sort(([, a], [, b]) => b - a).at(0)
    const topContributorCommits = topContributor?.[1] || 0
    const topContributorPercentage = MathematicalCalculator.calculatePercentage(
      topContributorCommits, 
      totalCommitsByContributors
    )
    
    // Calculate contributor concentration metrics
    const contributorGiniCoefficient = MathematicalCalculator.calculateGiniCoefficient(commitCounts)
    const averageCommitsPerContributor = MathematicalCalculator.calculateRatio(
      totalCommitsByContributors, 
      contributorCommitCounts ? Object.keys(contributorCommitCounts).length : 0
    )

    return {
      AVERAGE_COMMITS_PER_CONTRIBUTOR: String(averageCommitsPerContributor),
      COMMIT_CONTRIBUTORS: String(commitAuthors.size),
      // Cross-activity contributor analysis
      COMMIT_ONLY_CONTRIBUTORS: String(commitOnlyContributors.size),
      CONTRIBUTOR_ANALYSIS_END: new Date().toISOString(),
      
      // Activity analysis period
      CONTRIBUTOR_ANALYSIS_START: since.toISOString(),
      // Statistical distribution measures
      CONTRIBUTOR_GINI_COEFFICIENT: String(contributorGiniCoefficient),
      CROSS_ACTIVITY_CONTRIBUTOR_RATIO: String(MathematicalCalculator.calculateRatio(
        crossActivityContributors.size, 
        allContributors.size
      )),
      
      CROSS_ACTIVITY_CONTRIBUTORS: String(crossActivityContributors.size),
      ISSUE_CONTRIBUTORS: String(issueAuthors.size),
      PR_CONTRIBUTORS: String(prAuthors.size),
      TOP_CONTRIBUTOR_COMMITS: String(topContributorCommits),
      
      // Contribution distribution facts
      TOP_CONTRIBUTOR_NAME: topContributor?.[0] || '',
      TOP_CONTRIBUTOR_PERCENTAGE: String(topContributorPercentage),
      
      // Raw contributor counts
      TOTAL_CONTRIBUTORS: String(allContributors.size),
      TOTAL_TRACKED_COMMITS: String(totalCommitsByContributors)
    }
  }

  /**
   * Collect detailed issue analysis facts
   */
  async collectIssueAnalysisFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const issues = await this.githubApi.searchIssues(owner, repo, since)
    const now = new Date()
    
    // Separate issues by state (mathematical classification)
    const openIssues = issues.filter(issue => issue.state === 'open')
    const closedIssues = issues.filter(issue => issue.state === 'closed')
    
    // Calculate issue age statistics for open issues
    const openIssueAges = openIssues.map(issue => 
      MathematicalCalculator.daysBetween(issue.createdAt, now)
    )
    
    // Calculate resolution times for closed issues  
    const resolutionTimes = closedIssues
      .filter(issue => issue.closedAt)
      .map(issue => MathematicalCalculator.daysBetween(issue.createdAt, issue.closedAt!))
    
    // Calculate statistical measures
    const averageOpenIssueAge = MathematicalCalculator.calculateMean(openIssueAges)
    const medianOpenIssueAge = MathematicalCalculator.calculateMedian(openIssueAges)
    const oldestOpenIssueAge = openIssueAges.length > 0 ? Math.max(...openIssueAges) : 0
    
    const averageResolutionTime = MathematicalCalculator.calculateMean(resolutionTimes)
    const medianResolutionTime = MathematicalCalculator.calculateMedian(resolutionTimes)
    
    // Calculate issue velocity metrics
    const issueCloseRate = MathematicalCalculator.calculateRatio(closedIssues.length, issues.length)
    const daysSinceLastIssue = issues.length > 0 ? 
      Math.min(...issues.map(issue => MathematicalCalculator.daysBetween(issue.createdAt, now))) : 0
      
    // Calculate issue distribution percentiles for resolution times
    const resolutionPercentiles = MathematicalCalculator.calculatePercentiles(resolutionTimes, [25, 50, 75, 90])

    return {
      // Open issue age analysis
      AVERAGE_OPEN_ISSUE_AGE_DAYS: String(averageOpenIssueAge),
      AVERAGE_RESOLUTION_TIME_DAYS: String(averageResolutionTime),
      // Issue velocity facts
      DAYS_SINCE_LAST_ISSUE: String(daysSinceLastIssue),
      
      ISSUE_ANALYSIS_END: now.toISOString(),
      ISSUE_ANALYSIS_PERIOD_DAYS: String(MathematicalCalculator.daysBetween(since, now)),
      // Analysis period
      ISSUE_ANALYSIS_START: since.toISOString(),
      
      // Issue resolution metrics
      ISSUE_CLOSE_RATE: String(issueCloseRate),
      ISSUES_CLOSED_COUNT: String(closedIssues.length),
      ISSUES_OPEN_COUNT: String(openIssues.length),
      
      ISSUES_WITH_RESOLUTION_DATA: String(resolutionTimes.length),
      MEDIAN_OPEN_ISSUE_AGE_DAYS: String(medianOpenIssueAge),
      
      MEDIAN_RESOLUTION_TIME_DAYS: String(medianResolutionTime),
      OLDEST_OPEN_ISSUE_AGE_DAYS: String(oldestOpenIssueAge),
      // Distribution statistics
      RESOLUTION_TIME_P25: String(resolutionPercentiles['P25'] || 0),
      RESOLUTION_TIME_P50: String(resolutionPercentiles['P50'] || 0),
      
      RESOLUTION_TIME_P75: String(resolutionPercentiles['P75'] || 0),
      RESOLUTION_TIME_P90: String(resolutionPercentiles['P90'] || 0),
      // Basic issue counts
      TOTAL_ISSUES_ANALYZED: String(issues.length)
    }
  }

  /**
   * Collect pull request facts
   */
  async collectPullRequestFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>> {
    const pullRequests = await this.githubApi.searchPullRequests(owner, repo, since)
    const now = new Date()
    
    // Separate PRs by state and merge status (mathematical classification)
    const openPrs = pullRequests.filter(pr => pr.state === 'open')
    const closedPrs = pullRequests.filter(pr => pr.state === 'closed')
    const mergedPrs = pullRequests.filter(pr => pr.mergedAt !== null)
    const closedUnmergedPrs = closedPrs.filter(pr => pr.mergedAt === null)
    
    // Calculate PR age statistics for open PRs
    const openPrAges = openPrs.map(pr => 
      MathematicalCalculator.daysBetween(pr.createdAt, now)
    )
    
    // Calculate merge times for merged PRs
    const mergeTimes = mergedPrs
      .filter(pr => pr.mergedAt)
      .map(pr => MathematicalCalculator.daysBetween(pr.createdAt, pr.mergedAt!))
    
    // Calculate statistical measures
    const averageOpenPrAge = MathematicalCalculator.calculateMean(openPrAges)
    const medianOpenPrAge = MathematicalCalculator.calculateMedian(openPrAges)
    const oldestOpenPrAge = openPrAges.length > 0 ? Math.max(...openPrAges) : 0
    
    const averageMergeTime = MathematicalCalculator.calculateMean(mergeTimes)
    const medianMergeTime = MathematicalCalculator.calculateMedian(mergeTimes)
    
    // Calculate PR success metrics
    const prMergeRate = MathematicalCalculator.calculateRatio(mergedPrs.length, pullRequests.length)
    const prCloseWithoutMergeRate = MathematicalCalculator.calculateRatio(closedUnmergedPrs.length, pullRequests.length)
    
    // Calculate PR velocity metrics
    const daysSinceLastPr = pullRequests.length > 0 ? 
      Math.min(...pullRequests.map(pr => MathematicalCalculator.daysBetween(pr.createdAt, now))) : 0
      
    // Calculate PR size statistics (if available in DTO)
    const prSizes = pullRequests
      .filter(pr => pr.additions !== undefined && pr.deletions !== undefined)
      .map(pr => (pr.additions || 0) + (pr.deletions || 0))
    const averagePrSize = MathematicalCalculator.calculateMean(prSizes)
    const medianPrSize = MathematicalCalculator.calculateMedian(prSizes)
      
    // Calculate merge time distribution percentiles
    const mergeTimePercentiles = MathematicalCalculator.calculatePercentiles(mergeTimes, [25, 50, 75, 90])

    return {
      // Merge time analysis
      AVERAGE_MERGE_TIME_DAYS: String(averageMergeTime),
      // Open PR age analysis
      AVERAGE_OPEN_PR_AGE_DAYS: String(averageOpenPrAge),
      // PR size analysis (if available)
      AVERAGE_PR_SIZE_LINES: String(averagePrSize),
      // PR velocity facts
      DAYS_SINCE_LAST_PR: String(daysSinceLastPr),
      MEDIAN_MERGE_TIME_DAYS: String(medianMergeTime),
      
      MEDIAN_OPEN_PR_AGE_DAYS: String(medianOpenPrAge),
      MEDIAN_PR_SIZE_LINES: String(medianPrSize),
      
      // Distribution statistics
      MERGE_TIME_P25: String(mergeTimePercentiles['P25'] || 0),
      MERGE_TIME_P50: String(mergeTimePercentiles['P50'] || 0),
      MERGE_TIME_P75: String(mergeTimePercentiles['P75'] || 0),
      
      MERGE_TIME_P90: String(mergeTimePercentiles['P90'] || 0),
      OLDEST_OPEN_PR_AGE_DAYS: String(oldestOpenPrAge),
      PR_ANALYSIS_END: now.toISOString(),
      
      PR_ANALYSIS_PERIOD_DAYS: String(MathematicalCalculator.daysBetween(since, now)),
      // Analysis period
      PR_ANALYSIS_START: since.toISOString(),
      PR_CLOSE_WITHOUT_MERGE_RATE: String(prCloseWithoutMergeRate),
      
      // PR success metrics
      PR_MERGE_RATE: String(prMergeRate),
      
      PRS_CLOSED_COUNT: String(closedPrs.length),
      PRS_CLOSED_UNMERGED_COUNT: String(closedUnmergedPrs.length),
      PRS_MERGED_COUNT: String(mergedPrs.length),
      PRS_OPEN_COUNT: String(openPrs.length),
      
      PRS_WITH_MERGE_DATA: String(mergeTimes.length),
      PRS_WITH_SIZE_DATA: String(prSizes.length),
      // Basic PR counts
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