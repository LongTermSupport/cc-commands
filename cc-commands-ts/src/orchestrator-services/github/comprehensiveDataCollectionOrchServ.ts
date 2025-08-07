/**
 * @file Comprehensive Data Collection Orchestrator Service
 * 
 * Orchestrator service for collecting comprehensive GitHub project data
 * using the optimal flat array structure for efficient jq querying.
 * 
 * This service coordinates the new comprehensive data collection approach
 * that preserves complete raw API data and generates optimized result files.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError.js'
import { LLMInfo } from '../../core/LLMInfo.js'
import { CollectionOptions, OptimalGitHubResult } from '../../core/types/JsonResultTypes.js'
import { createCompressedJsonFile } from '../../core/utils/CompressionUtils.js'
import { ensureResultsDirectory, generateResultFilePath } from '../../core/utils/ResultFileUtils.js'
import { IComprehensiveDataCollectionService, IRateLimitService } from './interfaces/IComprehensiveDataCollectionService.js'
import { IProjectDataCollectionArgs } from './types/ArgumentTypes.js'
import { TGitHubServices } from './types/ServiceTypes.js'

/**
 * Comprehensive Data Collection Service Type
 * Extends existing GitHub services with comprehensive collection capabilities
 */
export type TComprehensiveGitHubServices = TGitHubServices & {
  comprehensiveDataCollector: IComprehensiveDataCollectionService
  rateLimitService: IRateLimitService
}

/**
 * Default collection options optimized for comprehensive analysis
 * while respecting GitHub API rate limits
 */
const DEFAULT_COMPREHENSIVE_OPTIONS: CollectionOptions = {
  includeComments: true,
  includeCommits: true,
  includeIssues: true,
  includePullRequests: true,
  includeReviews: true,
  limits: {
    maxCommentsPerIssue: 50,
    maxCommitsPerRepo: 500,  // Reduced from 1000 to manage rate limits
    maxIssuesPerRepo: 300,   // Reduced from 500 to manage rate limits
    maxPRsPerRepo: 150,      // Reduced from 200 to manage rate limits
    maxReviewsPerPR: 15      // Reduced from 20 to manage rate limits
  },
  timeFilter: {
    // Default to last 6 months to balance completeness with rate limits
    since: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Comprehensive Data Collection Orchestrator Service
 * 
 * This orchestrator service coordinates the collection of comprehensive
 * GitHub project data using the optimal flat array structure. It generates
 * complete result files with all individual items, comments, and relationships
 * preserved for sophisticated jq querying and LLM analysis.
 * 
 * Expected input format:
 * - Project node ID (e.g., "PVT_kwHOABDmBM4AHJKL")
 * - Optional collection options for customizing data gathering
 * 
 * @param args - Typed arguments with project node ID and optional options
 * @param services - GitHub services including comprehensive data collector
 * @returns LLMInfo with comprehensive data and optimal result file
 */
export const comprehensiveDataCollectionOrchServ = async (
  args: IProjectDataCollectionArgs & { 
    collectionOptions?: Partial<CollectionOptions> 
  },
  services: TComprehensiveGitHubServices
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  const executionStartTime = new Date()
  
  try {
    // Validate project node ID
    if (!args.projectNodeId?.trim()) {
      throw new OrchestratorError(
        new Error('Project node ID is required for comprehensive data collection'),
        [
          'Provide a GitHub Project v2 node ID (e.g., PVT_kwHOABDmBM4AHJKL)',
          'Use the project detection service first to identify the project',
          'Verify the project exists and is accessible'
        ],
        { projectNodeId: args.projectNodeId }
      )
    }
    
    result.addData('PROJECT_NODE_ID', args.projectNodeId)
    result.addAction('Validate project node ID', 'success')
    
    // Merge collection options with defaults
    const collectionOptions: CollectionOptions = {
      ...DEFAULT_COMPREHENSIVE_OPTIONS,
      ...args.collectionOptions,
      limits: {
        ...DEFAULT_COMPREHENSIVE_OPTIONS.limits,
        ...args.collectionOptions?.limits
      },
      timeFilter: {
        ...DEFAULT_COMPREHENSIVE_OPTIONS.timeFilter,
        ...args.collectionOptions?.timeFilter
      }
    }
    
    result.addData('COLLECTION_INCLUDES_ISSUES', String(collectionOptions.includeIssues))
    result.addData('COLLECTION_INCLUDES_PRS', String(collectionOptions.includePullRequests))
    result.addData('COLLECTION_INCLUDES_COMMITS', String(collectionOptions.includeCommits))
    result.addData('COLLECTION_INCLUDES_COMMENTS', String(collectionOptions.includeComments))
    result.addData('COLLECTION_INCLUDES_REVIEWS', String(collectionOptions.includeReviews))
    result.addData('MAX_ISSUES_PER_REPO', String(collectionOptions.limits.maxIssuesPerRepo))
    result.addData('MAX_PRS_PER_REPO', String(collectionOptions.limits.maxPRsPerRepo))
    
    // Check rate limits before starting comprehensive collection
    result.addAction('Check GitHub API rate limits', 'success')
    const initialRateLimits = await services.rateLimitService.checkCurrentLimits()
    result.addData('INITIAL_REST_API_REMAINING', String(initialRateLimits.github_rest_api.remaining))
    result.addData('INITIAL_GRAPHQL_REMAINING', String(initialRateLimits.github_graphql_api.remaining))
    
    // Validate authentication
    result.addAction('Validate authentication for comprehensive collection', 'success')
    const token = await services.authService.getGitHubToken()
    const authenticatedUser = await services.authService.getAuthenticatedUser(token)
    result.addAction('Validate authentication', 'success', `Authenticated as ${authenticatedUser}`)
    result.addData('AUTHENTICATED_USER', authenticatedUser)
    
    // Collect comprehensive project data using the optimal structure
    result.addAction('Start comprehensive project data collection', 'success')
    const comprehensiveData: OptimalGitHubResult = await services.comprehensiveDataCollector.collectCompleteProjectData(
      args.projectNodeId,
      collectionOptions
    )
    
    const dataCollectionEndTime = new Date()
    result.addAction('Collect comprehensive project data', 'success', 
      `Collected ${comprehensiveData.raw.repositories.length} repos, ` +
      `${comprehensiveData.raw.issues.length} issues, ` +
      `${comprehensiveData.raw.pull_requests.length} PRs, ` +
      `${comprehensiveData.raw.commits.length} commits`
    )
    
    // Add comprehensive metrics to LLMInfo
    result.addData('REPOSITORIES_PROCESSED', String(comprehensiveData.metadata.collection.repositories_processed))
    result.addData('TOTAL_ISSUES_COLLECTED', String(comprehensiveData.metadata.collection.items_collected.issues))
    result.addData('TOTAL_PRS_COLLECTED', String(comprehensiveData.metadata.collection.items_collected.pull_requests))
    result.addData('TOTAL_COMMITS_COLLECTED', String(comprehensiveData.metadata.collection.items_collected.commits))
    result.addData('TOTAL_ISSUE_COMMENTS_COLLECTED', String(comprehensiveData.metadata.collection.items_collected.issue_comments))
    result.addData('TOTAL_PR_REVIEWS_COLLECTED', String(comprehensiveData.metadata.collection.items_collected.pr_reviews))
    result.addData('COLLECTION_DURATION_MS', String(dataCollectionEndTime.getTime() - executionStartTime.getTime()))
    
    // Add project summary data
    const projectSummary = comprehensiveData.metrics.project_summary
    result.addData('PROJECT_TITLE', comprehensiveData.raw.project['title'] as string)
    result.addData('PROJECT_DESCRIPTION', (comprehensiveData.raw.project['description'] as string) || '')
    result.addData('PROJECT_URL', comprehensiveData.raw.project['url'] as string)
    result.addData('PROJECT_OWNER', comprehensiveData.raw.project['owner'] as string)
    result.addData('TOTAL_REPOSITORIES', String(projectSummary.total_repositories))
    result.addData('TOTAL_CONTRIBUTORS', String(projectSummary.total_contributors))
    result.addData('TOTAL_STARS', String(projectSummary.total_stars))
    result.addData('TOTAL_FORKS', String(projectSummary.total_forks))
    result.addData('PRIMARY_LANGUAGE', projectSummary.primary_language)
    result.addData('ALL_LANGUAGES', projectSummary.languages.join(', '))
    
    // Generate comprehensive JSON result file
    try {
      result.addAction('Start generating comprehensive JSON result file', 'success')
      const resultFilePath = generateResultFilePath('comprehensive_project_summary')
      
      // Write compressed JSON file with optimal structure
      ensureResultsDirectory()
      await createCompressedJsonFile(comprehensiveData, resultFilePath)
      
      result.addAction('Generate comprehensive JSON result file', 'success', `Created: ${resultFilePath}`)
      result.addFile(resultFilePath, 'created')
      result.addData('RESULT_FILE_PATH', resultFilePath)
      
      // Calculate result file size for metrics
      const fs = await import('node:fs')
      const fileStats = await fs.promises.stat(resultFilePath)
      result.addData('RESULT_FILE_SIZE_BYTES', String(fileStats.size))
      result.addData('RESULT_FILE_SIZE_MB', String((fileStats.size / (1024 * 1024)).toFixed(2)))
      
    } catch (jsonError) {
      result.addAction('Generate comprehensive JSON result file', 'failed', 
        jsonError instanceof Error ? jsonError.message : 'JSON generation failed')
      // Don't fail the entire operation for JSON generation issues
    }
    
    // Add comprehensive jq query examples for the optimal structure
    result.addInstruction('The result file uses an optimal flat array structure for efficient jq querying')
    result.addInstruction('All individual items (issues, PRs, commits, comments) are preserved with complete API data')
    result.addInstruction('Use the pre-computed indexes for instant access to common query patterns')
    result.addInstruction('Query examples:')
    result.addInstruction('- All issues: jq \'.raw.issues[] | {title, state, author: .user.login}\' result.json')
    result.addInstruction('- Issues by repository: jq \'.raw.issues[] | select(.repository_name == "owner/repo")\' result.json')
    result.addInstruction('- Contributor activity: jq \'(.raw.issues[] + .raw.pull_requests[]) | group_by(.user.login) | map({author: .[0].user.login, count: length})\' result.json')
    result.addInstruction('- Comments for specific issue: jq \'.raw.issue_comments[] | select(.issue_id == 123)\' result.json')
    result.addInstruction('- PR reviews by state: jq \'.raw.pr_reviews[] | group_by(.state) | map({state: .[0].state, count: length})\' result.json')
    result.addInstruction('- Monthly commit activity: jq \'.raw.commits[] | group_by(.commit.author.date[:7]) | map({month: .[0].commit.author.date[:7], commits: length})\' result.json')
    result.addInstruction('- Most active repositories: jq \'.indexes.issues_by_repo | to_entries | map({repo: .key, issues: (.value | length)}) | sort_by(.issues) | reverse\' result.json')
    result.addInstruction('- Use indexes for efficient filtering: jq \'.raw.issues[.indexes.issues_by_repo["owner/repo"][]] | {title, state}\' result.json')
    
    // Final rate limit check
    const finalRateLimits = await services.rateLimitService.checkCurrentLimits()
    result.addData('FINAL_REST_API_REMAINING', String(finalRateLimits.github_rest_api.remaining))
    result.addData('REST_API_CALLS_USED', String(
      initialRateLimits.github_rest_api.remaining - finalRateLimits.github_rest_api.remaining
    ))
    
    const executionEndTime = new Date()
    result.addData('TOTAL_EXECUTION_TIME_MS', String(executionEndTime.getTime() - executionStartTime.getTime()))
    result.addData('EXECUTION_STATUS', 'success')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the project node ID is correct and accessible',
          'Check GitHub authentication and rate limit status',
          'Consider reducing collection limits if rate limited',
          'Ensure the project contains accessible repositories with data',
          'Try collecting data for a smaller time window (e.g., last 3 months)'
        ],
        { 
          error: error instanceof Error ? error.message : String(error), 
          projectNodeId: args.projectNodeId
        }
      ))
    }
    
    return result
  }
}