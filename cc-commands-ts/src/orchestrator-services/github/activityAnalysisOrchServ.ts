/**
 * @file GitHub Activity Analysis Orchestrator Service
 * 
 * Orchestrator service for analyzing activity across project repositories.
 * Coordinates activity data collection, aggregation, and summary generation.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError'
import { LLMInfo } from '../../core/LLMInfo'
import { ActivityMetricsDTO } from './dto/ActivityMetricsDTO'
import { ProjectSummaryDTO } from './dto/ProjectSummaryDTO'
import { IActivityAnalysisArgs } from './types/ArgumentTypes'
import { TActivityAnalysisServices } from './types/ServiceTypes'

/**
 * Activity Analysis Orchestrator Service
 * 
 * This orchestrator service coordinates comprehensive activity analysis
 * across multiple repositories. It handles time window parsing, activity
 * data collection, cross-repository aggregation, and summary generation.
 * 
 * Expected input format:
 * - "repositories:repo1,repo2,repo3|owner:orgname|timeWindow:30"
 * - All parameters are required for analysis
 * 
 * @param args - Formatted string with repositories, owner, and time window
 * @param services - Activity analysis services (repository, activity, auth)
 * @returns LLMInfo with comprehensive activity analysis and insights
 */
export const activityAnalysisOrchServ = async (
  args: string,
  services: TActivityAnalysisServices
): Promise<LLMInfo> => {
  // Parse string arguments into typed structure
  const parsedArgs = parseActivityAnalysisArgs(args)
  
  // Delegate to typed implementation
  return activityAnalysisOrchServImpl(parsedArgs, services)
}

/**
 * Internal implementation with typed arguments
 */
async function activityAnalysisOrchServImpl(
  args: IActivityAnalysisArgs,
  services: TActivityAnalysisServices
): Promise<LLMInfo> {
  const result = LLMInfo.create()
  
  try {
    // Use typed arguments directly
    result.addData('ANALYSIS_OWNER', args.owner)
    result.addData('ANALYSIS_TIME_WINDOW_DAYS', String(args.timeWindowDays))
    result.addData('ANALYSIS_REPOSITORIES_COUNT', String(args.repositories.length))
    result.addData('ANALYSIS_REPOSITORIES_LIST', args.repositories.join(', '))
    
    // Calculate analysis date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (args.timeWindowDays * 24 * 60 * 60 * 1000))
    result.addData('ANALYSIS_START_DATE', startDate.toISOString())
    result.addData('ANALYSIS_END_DATE', endDate.toISOString())
    
    // Validate authentication
    result.addAction('Validate authentication for activity analysis', 'success')
    const token = await services.authService.getGitHubToken()
    const authenticatedUser = await services.authService.getAuthenticatedUser(token)
    result.addAction('Validate authentication for activity analysis', 'success', `Authenticated as ${authenticatedUser}`)
    result.addData('AUTHENTICATED_USER', authenticatedUser)
    
    // Collect activity data from all repositories
    result.addAction('Aggregate activity across repositories', 'success')
    
    const aggregatedActivity = await services.activityService.aggregateActivityAcrossRepos(
      args.repositories,
      args.owner,
      startDate
    )
    
    result.addAction('Aggregate activity across repositories', 'success', 
      `Analyzed ${aggregatedActivity.repositoriesCount} repositories`)
    
    // Add aggregated activity data to result
    result.addDataBulk(aggregatedActivity.toLLMData())
    
    // Calculate activity summary
    result.addAction('Calculate activity summary', 'success')
    
    const activitySummary = await services.activityService.calculateActivitySummary([aggregatedActivity])
    
    result.addAction('Calculate activity summary', 'success', 
      `Generated summary with health score: ${activitySummary.healthScore}`)
    
    // Add summary data to result  
    const summaryData = activitySummary.toLLMData()
    for (const [key, value] of Object.entries(summaryData)) {
      result.addData(`SUMMARY_${key}`, value)
    }
    
    // Identify most active repositories
    result.addAction('Identify most active repositories', 'success')
    
    const mostActiveRepos = await services.activityService.identifyMostActiveRepositories([aggregatedActivity])
    
    result.addAction('Identify most active repositories', 'success', 
      `Ranked ${mostActiveRepos.length} repositories by activity`)
    
    result.addData('MOST_ACTIVE_REPOSITORIES', mostActiveRepos.slice(0, 5).join(', '))
    result.addData('TOP_REPOSITORY', mostActiveRepos[0] || 'None')
    
    // Generate analysis insights
    const insights = generateActivityInsights(aggregatedActivity, activitySummary, mostActiveRepos)
    result.addData('ANALYSIS_INSIGHTS', insights.join('; '))
    
    // Determine analysis completeness
    const completenessScore = calculateAnalysisCompleteness(aggregatedActivity)
    result.addData('ANALYSIS_COMPLETENESS_SCORE', String(completenessScore))
    result.addData('ANALYSIS_QUALITY', completenessScore >= 80 ? 'high' : completenessScore >= 60 ? 'medium' : 'low')
    
    result.addInstruction('Generate a comprehensive activity analysis report based on the collected data')
    result.addInstruction('Highlight key insights about project health and activity patterns')
    result.addInstruction('Include recommendations based on the activity analysis')
    result.addInstruction('Adapt the report style based on the analysis quality and completeness')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify all repositories exist and are accessible',
          'Check if the time window is reasonable (1-365 days)',
          'Ensure you have read access to all specified repositories',
          'Consider reducing the number of repositories if rate limits are hit'
        ],
        { 
          error: error instanceof Error ? error.message : String(error),
          owner: args.owner,
          repositories: args.repositories,
          timeWindowDays: args.timeWindowDays 
        }
      ))
    }
    
    return result
  }
}

/**
 * Parse activity analysis arguments
 */
function parseActivityAnalysisArgs(args: string): IActivityAnalysisArgs {
  const parts = args.split('|')
  const params: Record<string, string> = {}
  
  for (const part of parts) {
    const [key, value] = part.split(':')
    if (key && value) {
      params[key] = value
    }
  }
  
  // Validate required parameters
  if (!params['repositories']) {
    throw new OrchestratorError(
      new Error('Repositories parameter is required'),
      [
        'Include repositories in format: repositories:repo1,repo2,repo3',
        'Provide at least one repository for analysis',
        'Use comma-separated list for multiple repositories'
      ],
      { args }
    )
  }
  
  if (!params['owner']) {
    throw new OrchestratorError(
      new Error('Owner parameter is required'),
      [
        'Include owner in format: owner:orgname',
        'Provide the GitHub username or organization name',
        'Ensure the owner has access to the specified repositories'
      ],
      { args }
    )
  }
  
  if (!params['timeWindow']) {
    throw new OrchestratorError(
      new Error('Time window parameter is required'),
      [
        'Include time window in format: timeWindow:30',
        'Specify the number of days for analysis (1-365)',
        'Common values: 7 (week), 30 (month), 90 (quarter)'
      ],
      { args }
    )
  }
  
  // Parse and validate values
  const repositories = params['repositories'].split(',').map(repo => repo.trim()).filter(Boolean)
  const timeWindowDays = Number.parseInt(params['timeWindow'], 10)
  
  if (repositories.length === 0) {
    throw new OrchestratorError(
      new Error('At least one repository is required'),
      [
        'Provide valid repository names',
        'Use format: repositories:repo1,repo2,repo3',
        'Remove empty entries from repository list'
      ],
      { repositories: params['repositories'] }
    )
  }
  
  if (Number.isNaN(timeWindowDays) || timeWindowDays < 1 || timeWindowDays > 365) {
    throw new OrchestratorError(
      new Error('Time window must be between 1 and 365 days'),
      [
        'Use a numeric value for time window',
        'Choose a reasonable analysis period (7-90 days recommended)',
        'Consider API rate limits for longer time windows'
      ],
      { timeWindow: params['timeWindow'] }
    )
  }
  
  return {
    owner: params['owner'],
    repositories,
    timeWindowDays
  }
}

/**
 * Generate activity insights based on analysis results
 */
function generateActivityInsights(
  activity: ActivityMetricsDTO,
  summary: ProjectSummaryDTO,
  mostActiveRepos: string[]
): string[] {
  const insights = []
  
  // Activity level insights
  const activityIntensity = activity.getActivityIntensity()
  insights.push(`Project shows ${activityIntensity} activity intensity`)
  
  // Health score insights
  if (summary.healthScore >= 80) {
    insights.push('Project health is excellent with strong contributor engagement')
  } else if (summary.healthScore >= 60) {
    insights.push('Project health is good but has room for improvement')
  } else {
    insights.push('Project health needs attention - low activity or unresolved issues')
  }
  
  // Repository distribution insights
  if (mostActiveRepos.length > 0) {
    insights.push(`Most active repository is ${mostActiveRepos[0]}`)
  }
  
  // Contributor insights
  if (activity.contributorsCount > 10) {
    insights.push('Good contributor diversity with multiple active developers')
  } else if (activity.contributorsCount > 3) {
    insights.push('Moderate contributor base - consider expanding the team')
  } else {
    insights.push('Limited contributor base - may indicate single-maintainer project')
  }
  
  // Issue/PR ratio insights
  const issuePrRatio = activity.totalPrsCount > 0 ? activity.totalIssuesCount / activity.totalPrsCount : 0
  if (issuePrRatio > 3) {
    insights.push('High issue-to-PR ratio suggests many requests but limited development')
  } else if (issuePrRatio < 1) {
    insights.push('Low issue-to-PR ratio indicates active development with fewer reported issues')
  }
  
  return insights
}

/**
 * Calculate analysis completeness score (0-100)
 */
function calculateAnalysisCompleteness(activity: ActivityMetricsDTO): number {
  let score = 0
  
  // Base score for having data
  if (activity.repositoriesCount > 0) score += 20
  
  // Activity data completeness
  if (activity.commitsCount > 0) score += 20
  if (activity.totalIssuesCount > 0) score += 15
  if (activity.totalPrsCount > 0) score += 15
  
  // Contributor data completeness
  if (activity.contributorsCount > 0) score += 15
  if (activity.mostActiveContributor) score += 10
  
  // Repository coverage
  if (activity.repositoriesCount >= 3) score += 5
  
  return Math.min(score, 100)
}