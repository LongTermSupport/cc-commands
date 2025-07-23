/**
 * @file Pure orchestration function for project summary
 * 
 * This function contains all the orchestration logic for collecting
 * GitHub project data. It accepts services as parameters, making it
 * easy to test with mocked dependencies.
 */

import type { IOrchestrationService } from '../../../../interfaces/IOrchestrationService.js'

import { LLMInfo } from '../../../../types/LLMInfo.js'
import { hasGitHubAuth } from '../../../../utils/hasGitHubAuth.js'

/**
 * Services required for project summary orchestration
 */
export interface ProjectSummaryServices {
  dataCollector: IOrchestrationService
  envValidator: IOrchestrationService
  projectDetector: IOrchestrationService
}

/**
 * Parsed command arguments
 */
export interface ProjectSummaryArgs {
  url?: string
}

/**
 * Parsed command flags
 */
export interface ProjectSummaryFlags {
  audience?: string
  days?: number
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
  
  // Step 1: Validate environment
  const envResult = await services.envValidator.execute({
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
  
  // Step 2: Detect project
  const detectResult = await services.projectDetector.execute({
    params: {
      owner: flags.owner,
      repo: flags.repo,
      url: args.url
    }
  })
  
  result.merge(detectResult)
  if (detectResult.hasError()) {
    return result
  }
  
  // Extract detected project info from the data
  const detectedData = detectResult.getData()
  const repoOwner = detectedData['REPO_OWNER']
  const repoName = detectedData['REPO_NAME']
  
  if (!repoOwner || !repoName) {
    throw new Error('Project detection did not return owner/name')
  }
  
  // Step 3: Collect project data
  const collectResult = await services.dataCollector.execute({
    params: {
      audience: flags.audience,
      days: flags.days,
      owner: repoOwner,
      repo: repoName
    }
  })
  
  result.merge(collectResult)
  
  // Add final orchestration metadata
  result.addAction('Orchestration complete', 'success', 
    'All data collection steps completed successfully')
  
  // Final instruction to tie it all together
  if (!result.hasError()) {
    result.addInstruction('Create a comprehensive project summary report based on all the collected data')
  }
  
  return result
}