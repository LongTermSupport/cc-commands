/**
 * @file Project Summary Orchestrator - THIN coordination layer
 * 
 * This orchestrator follows the multi-step LLM interaction pattern:
 * 
 * Step 1 (detect mode):
 *   - Input: URL or org/project identifiers
 *   - Process: Detect organization and find GitHub Project
 *   - Output: PROJECT_ID, PROJECT_TITLE, REPO_COUNT
 *   - Next: LLM decides whether to proceed
 * 
 * Step 2 (collect mode):
 *   - Input: Project ID from step 1
 *   - Process: Collect all repository data
 *   - Output: DATA_FILE path with complete JSON
 *   - Next: LLM reads file to generate summary
 * 
 * IMPORTANT: This orchestrator contains NO business logic.
 * All work is delegated to services. Think MVC controller.
 * 
 * CRITICAL: This orchestrator ONLY collects raw data.
 * It does NOT:
 * - Generate summaries or reports
 * - Format output for humans
 * - Make decisions about importance
 * - Create any kind of narrative
 * 
 * @see ProjectDataService - Finds GitHub Projects
 * @see RepoDataCollectionService - Collects repository data
 * @see DataFileService - Saves structured data to files
 */

import type { IOrchestrationService } from '../../../../interfaces/IOrchestrationService.js'

import { LLMInfo } from '../../../../types/LLMInfo.js'
import { hasGitHubAuth } from '../../../../utils/hasGitHubAuth.js'

/**
 * Services required for project summary orchestration
 */
export interface ProjectSummaryServices {
  dataCollector: IOrchestrationService
  dataFileService?: IOrchestrationService   // For saving full data to files
  envValidator: IOrchestrationService
  projectDetector: IOrchestrationService    // Detects repo from git/URL
  projectDiscovery?: IOrchestrationService  // Finds GitHub Projects v2
}

/**
 * Parsed command arguments
 */
export interface ProjectSummaryArgs {
  mode?: 'collect' | 'detect'  // Multi-step execution mode
  projectId?: string            // For collect mode
  url?: string
}

/**
 * Parsed command flags
 */
export interface ProjectSummaryFlags {
  audience?: string
  days?: number
  org?: string      // Organization for project detection
  owner?: string
  repo?: string
  token?: string
}

/**
 * Execute project summary orchestration
 * 
 * This is a pure function that orchestrates the collection of GitHub
 * project data. All dependencies are injected, making it easy to test.
 * 
 * @param services - All required services
 * @param args - Parsed command arguments
 * @param flags - Parsed command flags
 * @returns LLMInfo with collected project data
 */
export async function executeProjectSummary(
  services: ProjectSummaryServices,
  args: ProjectSummaryArgs,
  flags: ProjectSummaryFlags
): Promise<LLMInfo> {
  const result = LLMInfo.create()
  const mode = args.mode || 'detect'
  
  // Always validate environment first
  const envResult = await services.envValidator.execute({
    flags: {},
    params: {
      // Only require GITHUB_TOKEN env var if no auth is available
      requiredEnvVars: hasGitHubAuth(flags.token) ? [] : ['GITHUB_TOKEN'],
      requiredTools: ['git']
    }
  })
  
  result.merge(envResult)
  if (envResult.hasError()) {
    return result
  }
  
  // Ensure required services are available
  if (!services.projectDiscovery || !services.dataFileService) {
    result.addData('ERROR', 'Required services not configured')
    result.addData('MISSING_SERVICES', 'projectDiscovery, dataFileService')
    return result
  }
  
  // Mode-based execution
  if (mode === 'detect') {
    // Step 1: Detect mode - find organization and GitHub Project
    result.addAction('Execution mode', 'success', 'Running in detect mode')
    
    // If org is provided, use it; otherwise detect from git/URL
    let organization: string | undefined = flags.org
    
    if (!organization && (args.url || flags.repo)) {
      // Try to detect from URL or git remote
      const detectResult = await services.projectDetector.execute({
        flags: {},
        params: {
          owner: flags.owner,
          repo: flags.repo,
          url: args.url
        }
      })
      
      result.merge(detectResult)
      if (!detectResult.hasError()) {
        const detectedData = detectResult.getData()
        organization = detectedData['REPO_OWNER']
      }
    }
    
    if (!organization) {
      result.addData('MODE', 'detect')
      result.addData('DETECTION_FAILED', 'true')
      result.addData('ERROR_REASON', 'Could not determine organization')
      result.addInstruction('Ask user to provide organization name using --org flag')
      return result
    }
    
    // Use projectDiscovery service to find GitHub Projects v2
    const projectsResult = await services.projectDiscovery.execute({
      flags: {},
      params: {
        includeArchived: false,
        limit: 10,
        organization
      }
    })
    
    result.merge(projectsResult)
    if (projectsResult.hasError()) {
      return result
    }
    
    // Return detection results
    result.addData('MODE', 'detect')
    result.addData('ORGANIZATION', organization)
    result.addInstruction('Show the user the list of GitHub Projects found')
    result.addInstruction('Ask which project to analyze, or if they want the most recent one')
    
  } else if (mode === 'collect') {
    // Step 2: Collect mode - gather data from all repos in the project
    result.addAction('Execution mode', 'success', 'Running in collect mode')
    
    if (!args.projectId) {
      result.addData('MODE', 'collect')
      result.addData('ERROR', 'Missing required projectId for collect mode')
      result.addInstruction('Project ID is required for collect mode. Run detect mode first.')
      return result
    }
    
    // Get project items to find all repositories
    const projectItemsResult = await services.projectDiscovery.execute({
      flags: {},
      params: {
        fetchItems: true,
        limit: 100,
        projectId: args.projectId
      }
    })
    
    result.merge(projectItemsResult)
    if (projectItemsResult.hasError()) {
      return result
    }
    
    const projectData = projectItemsResult.getData()
    const repositoriesJson = projectData['PROJECT_REPOSITORIES']
    
    if (!repositoriesJson) {
      result.addData('MODE', 'collect')
      result.addData('ERROR', 'No repositories found in project')
      return result
    }
    
    // Parse repository list - it's already an array of full names
    const repositories: string[] = JSON.parse(repositoriesJson)
    result.addData('REPOSITORY_COUNT', String(repositories.length))
    
    // Collect data for each repository
    const repoDataPromises = repositories.map(async repoFullName => {
      const [owner, repo] = repoFullName.split('/')
      
      result.addAction(`Collecting data for ${repoFullName}`, 'success')
      
      const repoResult = await services.dataCollector.execute({
        flags: {},
        params: {
          audience: flags.audience,
          days: flags.days || 30,
          owner,
          repo
        }
      })
      
      if (!repoResult.hasError()) {
        const repoData = repoResult.getData()
        return {
          activity: {
            commits: {
              authors: Number.parseInt(repoData['CONTRIBUTOR_COUNT'] || '0', 10),
              total: Number.parseInt(repoData['COMMIT_COUNT'] || '0', 10)
            },
            daysAnalyzed: Number.parseInt(repoData['DAYS_ANALYZED'] || '0', 10),
            issues: {
              closed: Number.parseInt(repoData['CLOSED_ISSUES'] || '0', 10),
              open: Number.parseInt(repoData['OPEN_ISSUES'] || '0', 10),
              total: Number.parseInt(repoData['ISSUE_COUNT'] || '0', 10)
            },
            pullRequests: {
              closed: Number.parseInt(repoData['CLOSED_PRS'] || '0', 10),
              draft: Number.parseInt(repoData['DRAFT_PRS'] || '0', 10),
              merged: Number.parseInt(repoData['MERGED_PRS'] || '0', 10),
              open: Number.parseInt(repoData['OPEN_PRS'] || '0', 10),
              total: Number.parseInt(repoData['PR_COUNT'] || '0', 10)
            },
            releases: {
              total: Number.parseInt(repoData['RELEASE_COUNT'] || '0', 10)
            }
          },
          fullName: repoFullName,
          id: `${owner}/${repo}`,
          metadata: {
            createdAt: repoData['CREATED_AT'] || '',
            defaultBranch: repoData['DEFAULT_BRANCH'] || 'main',
            description: repoData['DESCRIPTION'] || undefined,
            isArchived: repoData['IS_ARCHIVED'] === 'true',
            isFork: repoData['IS_FORK'] === 'true',
            license: repoData['LICENSE'] || undefined,
            primaryLanguage: repoData['PRIMARY_LANGUAGE'] || undefined,
            topics: repoData['TOPICS']?.split(', ') || [],
            updatedAt: repoData['UPDATED_AT'] || '',
            visibility: repoData['VISIBILITY'] || 'unknown'
          },
          name: repo,
          owner
        }
      }
      
      return null
    })
    
    // Wait for all repository data collection to complete
    const repoDataResults = await Promise.all(repoDataPromises)
    const repoDataArray = repoDataResults.filter((data): data is NonNullable<typeof data> => data !== null)
    
    // Build complete project data structure
    const projectStructure = {
      aggregated: {
        mostActiveRepository: repoDataArray.sort((a, b) => 
          b.activity.commits.total - a.activity.commits.total)[0]?.fullName,
        repositoryCount: repoDataArray.length,
        totalCommits: repoDataArray.reduce((sum, r) => sum + r.activity.commits.total, 0),
        totalIssues: repoDataArray.reduce((sum, r) => sum + r.activity.issues.total, 0),
        totalPullRequests: repoDataArray.reduce((sum, r) => sum + r.activity.pullRequests.total, 0)
      },
      metadata: {
        generator: 'cc-commands-ts',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      project: {
        closed: projectData['PROJECT_CLOSED'] === 'true',
        description: projectData['PROJECT_DESCRIPTION'],
        id: args.projectId,
        itemCount: Number.parseInt(projectData['PROJECT_ITEM_COUNT'] || '0', 10),
        number: Number.parseInt(projectData['PROJECT_NUMBER'] || '0', 10),
        repositories,
        title: projectData['PROJECT_TITLE'] || 'Unknown Project',
        url: projectData['PROJECT_URL'] || ''
      },
      repositories: repoDataArray
    }
    
    // Save to file
    const fileResult = await services.dataFileService.execute({
      flags: {},
      params: {
        data: projectStructure,
        dataType: 'project',
        organization: projectData['PROJECT_ORGANIZATION'] || flags.org || 'unknown',
        projectNumber: Number.parseInt(projectData['PROJECT_NUMBER'] || '0', 10)
      }
    })
    
    result.merge(fileResult)
    
    // Add summary data
    result.addData('MODE', 'collect')
    result.addData('PROJECT_ID', args.projectId)
    result.addData('REPOSITORIES_ANALYZED', String(repoDataArray.length))
    result.addData('TOTAL_COMMITS', String(projectStructure.aggregated.totalCommits))
    result.addData('TOTAL_ISSUES', String(projectStructure.aggregated.totalIssues))
    result.addData('TOTAL_PULL_REQUESTS', String(projectStructure.aggregated.totalPullRequests))
    
    result.addInstruction('Read the complete project data from the saved JSON file')
    result.addInstruction('Generate a comprehensive GitHub Project summary based on the aggregated data')
    result.addInstruction('Highlight cross-repository patterns and insights')
  }
  
  // Add final orchestration metadata
  result.addAction('Orchestration complete', 'success', 
    `Completed ${mode} mode execution`)
  
  return result
}