/**
 * @file Comprehensive Data Collection Orchestrator Service
 * 
 * Orchestrates comprehensive GitHub project data collection using the optimal
 * flat array structure designed for efficient jq querying and complete raw
 * API data preservation.
 */

 
/* eslint-disable complexity */

import { LLMInfo } from '../../core/LLMInfo.js'
import { CollectionOptions } from '../../core/types/JsonResultTypes.js'

/**
 * Arguments for comprehensive data collection
 */
export interface IComprehensiveDataCollectionArgs {
  readonly options?: Partial<CollectionOptions>
  readonly projectId: string
}

/**
 * Service dependencies for comprehensive data collection
 */
export type TComprehensiveDataCollectionServices = {
  readonly comprehensiveDataCollectionService: import('./interfaces/IComprehensiveDataCollectionService.js').IComprehensiveDataCollectionService
}

/**
 * Comprehensive data collection orchestrator service
 * 
 * This orchestrator service coordinates the collection of complete GitHub project data
 * including all individual items (issues, PRs, commits, comments, reviews) organized
 * in the optimal flat array structure for efficient jq querying.
 * 
 * Key features:
 * - Complete raw API data preservation
 * - Flat array structure optimized for jq queries
 * - Pre-computed indexes for common query patterns
 * - Intelligent rate limit management
 * - Configurable collection limits and time filters
 * 
 * @param args - Collection arguments with project ID and options
 * @param services - Service dependencies
 * @returns LLMInfo with comprehensive project data and collection metadata
 */
export const comprehensiveDataCollectionOrchServ = async (
  args: IComprehensiveDataCollectionArgs,
  services: TComprehensiveDataCollectionServices
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  
  try {
    // Parse collection options
    const collectionOptions: CollectionOptions = {
      includeComments: true,
      includeCommits: true,
      includeIssues: true,
      includePullRequests: true,
      includeReviews: true,
      limits: {
        maxCommentsPerIssue: args.options?.limits?.maxCommentsPerIssue || 50,
        maxCommitsPerRepo: args.options?.limits?.maxCommitsPerRepo || 1000,
        maxIssuesPerRepo: args.options?.limits?.maxIssuesPerRepo || 500,
        maxPRsPerRepo: args.options?.limits?.maxPRsPerRepo || 200,
        maxReviewsPerPR: args.options?.limits?.maxReviewsPerPR || 20
      },
      timeFilter: {
        since: args.options?.timeFilter?.since,
        until: args.options?.timeFilter?.until
      },
      ...args.options
    }
    
    result.addAction('Parse collection options', 'success', `Configured collection with ${JSON.stringify(collectionOptions.limits)} limits`)
    
    // Collect comprehensive project data
    const comprehensiveResult = await services.comprehensiveDataCollectionService.collectCompleteProjectData(
      args.projectId,
      collectionOptions
    )
    
    result.addAction('Collect comprehensive project data', 'success', 
      `Collected ${comprehensiveResult.raw.issues.length} issues, ${comprehensiveResult.raw.pull_requests.length} PRs, ` +
      `${comprehensiveResult.raw.commits.length} commits across ${comprehensiveResult.raw.repositories.length} repositories`
    )
    
    // Add comprehensive data to result
    result.addDataBulk({
      AUTHORS_INDEXED: Object.keys(comprehensiveResult.indexes.items_by_author).length,
      COLLECTION_COMPLETED_AT: comprehensiveResult.metadata.collection.collection_completed_at,
      
      COLLECTION_DURATION_MS: comprehensiveResult.metadata.execution.execution_time_ms,
      // Collection metadata
      COLLECTION_STARTED_AT: comprehensiveResult.metadata.collection.collection_started_at,
      COLLECTION_TYPE: 'comprehensive',
      LABELS_INDEXED: Object.keys(comprehensiveResult.indexes.items_by_label).length,
      PROJECT_ID: args.projectId,
      // Rate limit usage
      RATE_LIMIT_REMAINING: comprehensiveResult.metadata.api_usage.github_rest_api.remaining,
      RATE_LIMIT_USED: comprehensiveResult.metadata.api_usage.github_rest_api.calls_made,
      
      // Index information
      REPOSITORIES_INDEXED: Object.keys(comprehensiveResult.indexes.issues_by_repo).length,
      TOTAL_COMMITS: comprehensiveResult.raw.commits.length,
      TOTAL_ISSUE_COMMENTS: comprehensiveResult.raw.issue_comments.length,
      
      TOTAL_ISSUES: comprehensiveResult.raw.issues.length,
      TOTAL_PR_REVIEW_COMMENTS: comprehensiveResult.raw.pr_review_comments.length,
      
      TOTAL_PR_REVIEWS: comprehensiveResult.raw.pr_reviews.length,
      TOTAL_PULL_REQUESTS: comprehensiveResult.raw.pull_requests.length,
      // Collection summary
      TOTAL_REPOSITORIES: comprehensiveResult.raw.repositories.length
    })
    
    // Add the comprehensive result as a file (this will be the main output)
    result.addFile('comprehensive_project_data.json', 'created', JSON.stringify(comprehensiveResult).length)
    
    // Add instructions for the LLM
    result.addInstruction('Generate a comprehensive project summary from the collected data')
    result.addInstruction('Focus on the flat array structure in the raw section for efficient jq querying')
    result.addInstruction('Use the pre-computed indexes for common query patterns (issues_by_repo, items_by_author, items_by_label)')
    result.addInstruction('Highlight the complete raw API data preservation and relationship mapping')
    result.addInstruction('Include performance metrics and rate limit usage in the summary')
    
    return result
    
  } catch (error) {
    result.addAction('Collect comprehensive project data', 'failed', 
      error instanceof Error ? error.message : String(error))
    
    throw error
  }
}