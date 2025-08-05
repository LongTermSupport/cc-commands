/**
 * @file GitHub Project Data Collection Orchestrator Service
 * 
 * Orchestrator service for collecting comprehensive project data.
 * Coordinates project details, repository discovery, and basic repository information.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError.js'
import { LLMInfo } from '../../core/LLMInfo.js'
import { createCompressedJsonFile } from '../../core/utils/CompressionUtils.js'
import { ensureResultsDirectory, generateResultFilePath } from '../../core/utils/ResultFileUtils.js'
import { ProjectSummaryDTO } from './dto/ProjectSummaryDTO.js'
import { RepositoryDataDTO } from './dto/RepositoryDataDTO.js'
import { IProjectDataCollectionArgs } from './types/ArgumentTypes.js'
import { TGitHubServices } from './types/ServiceTypes.js'

/**
 * Project Data Collection Orchestrator Service
 * 
 * This orchestrator service coordinates the collection of comprehensive
 * project data including project details, repository discovery, and
 * basic repository information. It serves as the foundation for activity analysis.
 * 
 * Expected input format:
 * - Project node ID (e.g., "PVT_kwHOABDmBM4AHJKL")
 * 
 * @param args - Typed arguments with project node ID
 * @param services - GitHub services including GraphQL, REST API, and repository services
 * @returns LLMInfo with comprehensive project and repository data
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
    
    // Collect basic repository data for each repository
    const repositoryDataResults: RepositoryDataDTO[] = []
    
    // Process repositories in parallel for better performance
    const repositoryPromises = repositories.map(async (repoFullName, index) => {
      const [owner, repo] = repoFullName.split('/')
      if (!owner || !repo) {
        result.addAction(`Validate repository name: ${repoFullName}`, 'failed', 'Invalid repository format')
        return null
      }
      
      try {
        // Start collecting repository data
        
        // Validate repository access first
        const hasAccess = await services.repositoryService.validateRepositoryAccess(owner, repo)
        if (!hasAccess) {
          result.addAction(`Collect repository data: ${repoFullName}`, 'failed', 'Repository not accessible')
          return null
        }
        
        // Collect repository data
        const repoData = await services.repositoryService.getRepositoryData(owner, repo)
        
        result.addAction(`Collect repository data: ${repoFullName}`, 'success', `Collected data for ${repoFullName}`)
        
        // Add repository data to result
        const repoPrefix = `REPO_${index}_`
        const repoLLMData = repoData.toLLMData()
        
        for (const [key, value] of Object.entries(repoLLMData)) {
          result.addData(`${repoPrefix}${key}`, value)
        }
        
        return repoData
        
      } catch (error) {
        result.addAction(`Collect repository data: ${repoFullName}`, 'failed', 
          error instanceof Error ? error.message : 'Unknown error')
        
        // Return null for failed repositories
        return null
      }
    })
    
    // Wait for all repository data collection to complete
    const repositoryResults = await Promise.all(repositoryPromises)
    
    // Filter out null results (failed repositories)
    for (const repoData of repositoryResults) {
      if (repoData !== null) {
        repositoryDataResults.push(repoData)
      }
    }
    
    if (repositoryDataResults.length === 0) {
      throw new OrchestratorError(
        new Error('Failed to collect data from any repositories'),
        [
          'Verify you have read access to the project repositories',
          'Check if the repositories exist and are not private',
          'Ensure your GitHub token has appropriate permissions'
        ],
        { projectNodeId: args.projectNodeId, repositories }
      )
    }
    
    result.addData('ACCESSIBLE_REPOSITORIES_COUNT', String(repositoryDataResults.length))
    result.addData('DATA_COLLECTION_STATUS', 'success')
    
    // Calculate summary statistics
    const totalStars = repositoryDataResults.reduce((sum, repo) => sum + repo.stargazersCount, 0)
    const totalForks = repositoryDataResults.reduce((sum, repo) => sum + repo.forksCount, 0)
    const languages = [...new Set(repositoryDataResults.map(repo => repo.language).filter(Boolean))]
    
    result.addData('TOTAL_STARS', String(totalStars))
    result.addData('TOTAL_FORKS', String(totalForks))
    result.addData('LANGUAGES', languages.join(', '))
    result.addData('PRIMARY_LANGUAGE', languages.at(0) ?? 'Unknown')
    
    // Create comprehensive project summary DTO with collected data
    const executionEndTime = new Date()
    const projectSummary = ProjectSummaryDTO.fromAggregatedData({
      activeContributors: 0, // Will be populated by activity analysis
      activeRepositories: repositoryDataResults.filter(repo => {
        const daysSinceLastPush = repo.getDaysSinceLastPush()
        return daysSinceLastPush !== null && daysSinceLastPush <= 90  // Consider repos active if pushed within 90 days
      }).length,
      commitsLast30Days: 0, // Will be populated by activity analysis
      createdAt: projectData.createdAt,
      description: projectData.description || 'No description available',
      issuesOpenCount: repositoryDataResults.reduce((sum, repo) => sum + repo.openIssuesCount, 0),
      issuesTotalCount: repositoryDataResults.reduce((sum, repo) => sum + repo.openIssuesCount, 0), // Only open issues available from basic data
      languages: languages.filter(lang => lang !== null),
      name: projectData.title,
      owner: projectData.owner,
      primaryLanguage: languages.find(lang => lang !== null) ?? 'Unknown',
      prsOpenCount: 0, // Will be populated by activity analysis
      prsTotalCount: 0, // Will be populated by activity analysis
      repositoryCount: repositoryDataResults.length,
      starsTotal: totalStars,
      // Basic repository data available - other metrics will be calculated by activity analysis
      totalCommits: 0, // Will be populated by activity analysis
      totalContributors: 0, // Will be populated by activity analysis  
      updatedAt: projectData.updatedAt,
      url: projectData.url
    })
    
    // Generate JSON result file
    try {
      const resultFilePath = generateResultFilePath('project_summary')
      const projectJsonData = projectSummary.toJsonData()
      
      // Add execution metadata
      const completeJsonData = {
        metadata: {
          arguments: args.projectNodeId,
          command: 'g-gh-project-summary',
          // eslint-disable-next-line camelcase
          execution_time_ms: executionEndTime.getTime() - executionStartTime.getTime(),
          // eslint-disable-next-line camelcase
          generated_at: executionEndTime.toISOString()
        },
        ...projectJsonData,
        repositories: Object.fromEntries(
          repositoryDataResults.map(repo => [repo.name, repo.toJsonData()])
        )
      }
      
      // Write compressed JSON file
      ensureResultsDirectory()
      await createCompressedJsonFile(completeJsonData, resultFilePath)
      
      // Set JSON data and result path in LLMInfo
      result.setJsonData(completeJsonData)
      result.setResultPath(resultFilePath)
      
      // Add all jq hints from project summary and repositories
      const allHints = projectSummary.getJqHints()
      // Add repository-level hints from first repository (they'll be transformed during merge)
      // eslint-disable-next-line cc-commands/require-typed-data-access
      const repoHints = repositoryDataResults[0]?.getJqHints()
      if (repoHints) {
        allHints.push(...repoHints)
      }
      
      for (const hint of allHints) {
        result.addJqHint(hint.query, hint.description, hint.scope)
      }
      
      result.addAction('Generate JSON result file', 'success', `Created: ${resultFilePath}`)
      
    } catch (jsonError) {
      // JSON generation failed - log but don't fail the entire operation
      result.addAction('Generate JSON result file', 'failed', 
        jsonError instanceof Error ? jsonError.message : 'JSON generation failed')
    }
    
    // Add project summary data to result for LLM consumption
    result.addDataBulk(projectSummary.toLLMData())
    
    result.addInstruction('Use the collected repository data for activity analysis')
    result.addInstruction('Focus on repositories with recent activity for meaningful insights')
    result.addInstruction('Consider the primary languages when generating summaries')
    result.addInstruction('Reference RESULT_FILE for detailed programmatic data access and complex queries')
    result.addInstruction('Use raw namespace for exact API data, calculated namespace for computed insights')
    
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

