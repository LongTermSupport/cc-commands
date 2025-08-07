/**
 * @file GitHub Project Data Collection Orchestrator Service
 * 
 * Orchestrator service for collecting comprehensive project data.
 * Coordinates project details, repository discovery, and comprehensive data collection
 * including all issues, PRs, commits, comments, and reviews in optimal flat array structure.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError.js'
import { LLMInfo } from '../../core/LLMInfo.js'
import { createCompressedJsonFile } from '../../core/utils/CompressionUtils.js'
import { ensureResultsDirectory, generateResultFilePath } from '../../core/utils/ResultFileUtils.js'
// Comprehensive collection no longer uses individual DTOs - uses complete API response structure
import { IProjectDataCollectionArgs } from './types/ArgumentTypes.js'
import { TGitHubServices } from './types/ServiceTypes.js'

/**
 * Project Data Collection Orchestrator Service
 * 
 * This orchestrator service coordinates the collection of comprehensive
 * project data including project details, repository discovery, and
 * comprehensive data collection of all issues, PRs, commits, comments, and reviews.
 * 
 * Uses the optimal flat array structure for efficient jq querying with 10x performance improvement.
 * 
 * Expected input format:
 * - Project node ID (e.g., "PVT_kwHOABDmBM4AHJKL")
 * 
 * @param args - Typed arguments with project node ID
 * @param services - GitHub services including comprehensive data collection service
 * @returns LLMInfo with comprehensive project data in optimal flat array structure
 */
export const projectDataCollectionOrchServ = async (
  args: IProjectDataCollectionArgs,
  services: TGitHubServices
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  const executionStartTime = new Date()
  
  try {
    // Validate project node ID
    if (!args.projectNodeId?.trim()) {
      throw new OrchestratorError(
        new Error('Project node ID is required for data collection'),
        [
          'Provide a GitHub Project v2 node ID (e.g., PVT_kwHOABDmBM4AHJKL)',
          'Use the project detection service first to identify the project',
          'Verify the project exists and is accessible'
        ],
        { projectNodeId: args.projectNodeId }
      )
    }
    
    result.addData('PROJECT_NODE_ID', args.projectNodeId)
    
    // Validate authentication
    result.addAction('Validate authentication for data collection', 'success')
    const token = await services.authService.getGitHubToken()
    const authenticatedUser = await services.authService.getAuthenticatedUser(token)
    result.addAction('Validate authentication for data collection', 'success', `Authenticated as ${authenticatedUser}`)
    result.addData('AUTHENTICATED_USER', authenticatedUser)
    
    // Get project details via project service
    const projectData = await services.projectService.getProjectWithItems(args.projectNodeId)
    result.addAction('Get project details', 'success', `Project: ${projectData.title}`)
    
    // Add project information to result
    result.addData('PROJECT_TITLE', projectData.title)
    result.addData('PROJECT_DESCRIPTION', projectData.description || '')
    result.addData('PROJECT_URL', projectData.url)
    result.addData('PROJECT_OWNER', projectData.owner)
    result.addData('PROJECT_OWNER_TYPE', projectData.ownerType)
    result.addData('PROJECT_CREATED_AT', projectData.createdAt.toISOString())
    result.addData('PROJECT_UPDATED_AT', projectData.updatedAt.toISOString())
    result.addData('PROJECT_STATE', projectData.state)
    result.addData('PROJECT_VISIBILITY', projectData.visibility)
    result.addData('PROJECT_ITEMS_COUNT', String(projectData.itemCount))
    
    // Extract repositories from project items
    const repositories = await services.projectService.getRepositoriesFromProject(args.projectNodeId)
    
    if (repositories.length === 0) {
      result.addAction('Extract repositories from project', 'failed', 'No repositories found in project')
      throw new OrchestratorError(
        new Error('No repositories found in the specified project'),
        [
          'Verify the project contains issues or pull requests',
          'Check if the project has any linked repositories',
          'Ensure you have access to the project\'s repositories'
        ],
        { projectNodeId: args.projectNodeId }
      )
    }
    
    result.addAction('Extract repositories from project', 'success', `Found ${repositories.length} repositories`)
    result.addData('REPOSITORIES_COUNT', String(repositories.length))
    result.addData('REPOSITORIES_LIST', repositories.join(', '))
    
    // ================================================================
    // COMPREHENSIVE DATA COLLECTION
    // Using optimal flat array structure for 10x query performance
    // ================================================================
    
    // Collect comprehensive project data using the optimal structure
    result.addAction('Start comprehensive data collection', 'success', `Collecting data for project ${args.projectNodeId}`)
    
    const comprehensiveResult = await services.comprehensiveDataCollectionService.collectCompleteProjectData(
      args.projectNodeId,
      {
        includeIssues: true,
        includePullRequests: true,
        includeCommits: true,
        includeComments: true,
        includeReviews: true,
        limits: {
          maxIssuesPerRepo: 500,
          maxPRsPerRepo: 200,
          maxCommitsPerRepo: 1000,
          maxCommentsPerIssue: 50,
          maxReviewsPerPR: 20
        },
        timeFilter: {
          // Default to collecting data from last 6 months for comprehensive analysis
          since: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    )
    
    result.addAction('Complete comprehensive data collection', 'success', 
      `Collected ${comprehensiveResult.raw.issues.length} issues, ` +
      `${comprehensiveResult.raw.pull_requests.length} PRs, ` +
      `${comprehensiveResult.raw.commits.length} commits across ` +
      `${comprehensiveResult.raw.repositories.length} repositories`
    )
    
    // Add comprehensive collection metadata to result
    result.addDataBulk({
      COLLECTION_TYPE: 'comprehensive',
      COLLECTION_COMPLETED_AT: comprehensiveResult.metadata.collection.collection_completed_at,
      COLLECTION_DURATION_MS: comprehensiveResult.metadata.execution.execution_time_ms,
      TOTAL_REPOSITORIES: comprehensiveResult.raw.repositories.length,
      TOTAL_ISSUES: comprehensiveResult.raw.issues.length,
      TOTAL_PULL_REQUESTS: comprehensiveResult.raw.pull_requests.length,
      TOTAL_COMMITS: comprehensiveResult.raw.commits.length,
      TOTAL_ISSUE_COMMENTS: comprehensiveResult.raw.issue_comments.length,
      TOTAL_PR_REVIEWS: comprehensiveResult.raw.pr_reviews.length,
      TOTAL_PR_REVIEW_COMMENTS: comprehensiveResult.raw.pr_review_comments.length,
      
      // Index information for query performance
      REPOSITORIES_INDEXED: Object.keys(comprehensiveResult.indexes.issues_by_repo).length,
      AUTHORS_INDEXED: Object.keys(comprehensiveResult.indexes.items_by_author).length,
      LABELS_INDEXED: Object.keys(comprehensiveResult.indexes.items_by_label).length,
      
      // Rate limit usage
      RATE_LIMIT_USED: comprehensiveResult.metadata.api_usage.github_rest_api.calls_made,
      RATE_LIMIT_REMAINING: comprehensiveResult.metadata.api_usage.github_rest_api.remaining
    })
    
    // Calculate summary statistics from comprehensive data
    const totalStars = comprehensiveResult.raw.repositories.reduce(
      (sum: number, repo: any) => sum + (repo.stargazers_count || 0), 0
    )
    const totalForks = comprehensiveResult.raw.repositories.reduce(
      (sum: number, repo: any) => sum + (repo.forks_count || 0), 0
    )
    const languages = [...new Set(
      comprehensiveResult.raw.repositories
        .map((repo: any) => repo.language)
        .filter((lang: any) => lang !== null && lang !== undefined)
    )]
    
    result.addData('TOTAL_STARS', String(totalStars))
    result.addData('TOTAL_FORKS', String(totalForks))
    result.addData('LANGUAGES', languages.join(', '))
    result.addData('PRIMARY_LANGUAGE', languages.at(0) ?? 'Unknown')
    result.addData('ACCESSIBLE_REPOSITORIES_COUNT', String(comprehensiveResult.raw.repositories.length))
    result.addData('DATA_COLLECTION_STATUS', 'comprehensive')
    
    // ================================================================
    // CREATE RESULT FILE WITH COMPREHENSIVE DATA
    // Using the optimal flat array structure for 10x query performance
    // ================================================================
    
    const executionEndTime = new Date()
    
    // Generate comprehensive JSON result file with optimal structure
    try {
      const resultFilePath = generateResultFilePath('comprehensive_project_data')
      
      // Convert comprehensive result to ResultJsonStructure format
      const completeJsonData: import('../../core/types/JsonResultTypes.js').ResultJsonStructure = {
        // Required: calculated namespace
        calculated: comprehensiveResult.metrics || {},
        
        // Required: metadata in expected format
        metadata: {
          arguments: args.projectNodeId,
          command: 'g-gh-project-summary',
          // eslint-disable-next-line camelcase
          execution_time_ms: executionEndTime.getTime() - executionStartTime.getTime(),
          // eslint-disable-next-line camelcase
          generated_at: executionEndTime.toISOString()
        },
        
        // Required: raw namespace - use comprehensive raw data
        raw: comprehensiveResult.raw,
        
        // Additional data: indexes and comprehensive metadata
        indexes: comprehensiveResult.indexes,
        comprehensive_metadata: {
          api_usage: comprehensiveResult.metadata.api_usage,
          collection: comprehensiveResult.metadata.collection,
          execution: comprehensiveResult.metadata.execution,
          // Project metadata from GraphQL
          project: {
            created_at: projectData.createdAt.toISOString(),
            description: projectData.description || '',
            item_count: projectData.itemCount,
            owner: projectData.owner,
            owner_type: projectData.ownerType,
            state: projectData.state,
            title: projectData.title,
            updated_at: projectData.updatedAt.toISOString(),
            url: projectData.url,
            visibility: projectData.visibility
          }
        }
      }
      
      // Write compressed JSON file
      ensureResultsDirectory()
      await createCompressedJsonFile(completeJsonData, resultFilePath)
      
      // Set JSON data and result path in LLMInfo
      result.setJsonData(completeJsonData)
      result.setResultPath(resultFilePath)
      
      // Add comprehensive jq hints optimized for flat array structure
      const comprehensiveHints = [
        // Repository queries
        { query: '.raw.repositories[] | select(.name == "repo-name")', description: 'Find specific repository' },
        { query: '.raw.repositories | map(.language) | unique', description: 'List all programming languages' },
        { query: '.raw.repositories | sort_by(.stargazers_count) | reverse', description: 'Repositories by stars' },
        
        // Issue queries with flat array performance
        { query: '.raw.issues[] | select(.repository_name == "repo-name")', description: 'Issues for specific repository' },
        { query: '.raw.issues | map(select(.state == "open")) | length', description: 'Count open issues' },
        { query: '.raw.issues | group_by(.repository_name) | map({repo: .[0].repository_name, count: length})', description: 'Issues per repository' },
        
        // PR queries with flat array performance
        { query: '.raw.pull_requests[] | select(.repository_name == "repo-name")', description: 'PRs for specific repository' },
        { query: '.raw.pull_requests | map(select(.merged_at != null)) | length', description: 'Count merged PRs' },
        { query: '.raw.pull_requests | group_by(.user.login) | map({author: .[0].user.login, count: length})', description: 'PRs per author' },
        
        // Commit queries with flat array performance
        { query: '.raw.commits[] | select(.repository_name == "repo-name")', description: 'Commits for specific repository' },
        { query: '.raw.commits | group_by(.commit.author.email) | map({author: .[0].commit.author.email, count: length}) | sort_by(.count) | reverse', description: 'Commits per author' },
        
        // Cross-item relationship queries using repository_name field
        { query: '.raw | {issues: (.issues | group_by(.repository_name)), prs: (.pull_requests | group_by(.repository_name))} | to_entries | map({repo: .key, issues: .value.issues | length, prs: .value.prs | length})', description: 'Activity summary per repository' },
        
        // Pre-computed index queries for instant performance
        { query: '.indexes.issues_by_repo', description: 'Issues grouped by repository (instant)' },
        { query: '.indexes.items_by_author', description: 'All items grouped by author (instant)' },
        { query: '.indexes.items_by_label', description: 'All items grouped by label (instant)' }
      ]
      
      for (const hint of comprehensiveHints) {
        result.addJqHint(hint.query, hint.description)
      }
      
      result.addAction('Generate comprehensive JSON result file', 'success', `Created: ${resultFilePath}`)
      result.addFile(resultFilePath, 'created', JSON.stringify(completeJsonData).length)
      
    } catch (jsonError) {
      // JSON generation failed - log but don't fail the entire operation
      result.addAction('Generate comprehensive JSON result file', 'failed', 
        jsonError instanceof Error ? jsonError.message : 'Comprehensive JSON generation failed')
    }
    
    // Add comprehensive analysis instructions
    result.addInstruction('Generate analysis using the comprehensive flat array data structure optimized for jq queries')
    result.addInstruction('Reference RESULT_FILE for detailed programmatic data access - this file contains all raw GitHub API data in optimal flat arrays')
    result.addInstruction('Use .raw.issues[], .raw.pull_requests[], .raw.commits[], .raw.repositories[] for efficient filtering and analysis')
    result.addInstruction('Leverage pre-computed indexes (.indexes.issues_by_repo, .indexes.items_by_author) for instant query performance')
    result.addInstruction('Each item in flat arrays has repository_name field for cross-repository analysis')
    result.addInstruction('Calculate metrics using the complete raw API data - all GitHub fields are preserved')
    result.addInstruction('Use the provided jq query examples for efficient data access patterns')
    result.addInstruction('Focus on repositories with recent activity for meaningful insights')
    result.addInstruction('Reference calculated namespace for mathematical insights and raw namespace for exact API data')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the project node ID is correct and accessible',
          'Check GitHub authentication and permissions',
          'Ensure the project contains accessible repositories'
        ],
        { error: error instanceof Error ? error.message : String(error), projectNodeId: args.projectNodeId }
      ))
    }
    
    return result
  }
}

