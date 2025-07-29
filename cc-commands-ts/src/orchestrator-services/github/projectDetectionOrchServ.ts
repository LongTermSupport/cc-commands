/**
 * @file GitHub Project Detection Orchestrator Service
 * 
 * Orchestrator service for detecting and validating GitHub Projects v2.
 * Handles project discovery from URLs, organizations, or git remotes.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError.js'
import { LLMInfo } from '../../core/LLMInfo.js'
import { TProjectDetectionServices } from './types/ServiceTypes.js'

/**
 * Typed arguments for project detection orchestrator service
 */
export interface IProjectDetectionArgs {
  input: string
  mode: 'auto' | 'owner' | 'url'
}

/**
 * Project Detection Orchestrator Service
 * 
 * This orchestrator service coordinates project detection operations across
 * multiple GitHub data sources. It handles argument parsing, authentication
 * validation, and project discovery with comprehensive error handling.
 * 
 * Supported input formats:
 * - Project URLs: https://github.com/orgs/ORG/projects/123
 * - Owner/org names: "myorg" (discovers recent projects)
 * - Auto-detection: empty string (uses git remote)
 * 
 * @param args - Typed arguments with input and detection mode
 * @param services - Project detection services (auth, graphql, project)
 * @returns LLMInfo with project metadata and discovery results
 */
export const projectDetectionOrchServ = async (
  args: IProjectDetectionArgs,
  services: TProjectDetectionServices
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  
  try {
    // Use typed arguments directly
    result.addData('DETECTION_MODE', args.mode)
    result.addData('INPUT_ARGS', args.input || 'auto-detect')
    
    // Validate GitHub authentication
    result.addAction('Validate GitHub authentication', 'success')
    const token = await services.authService.getGitHubToken()
    const isValidToken = await services.authService.validateToken(token)
    
    if (!isValidToken) {
      result.addAction('Validate GitHub authentication', 'failed', 'Invalid or expired token')
      throw new OrchestratorError(
        new Error('GitHub authentication failed'),
        [
          'Run "gh auth login" to authenticate with GitHub',
          'Verify your GitHub token has appropriate permissions',
          'Check if your token has expired and needs renewal'
        ],
        { args: args.input, mode: args.mode }
      )
    }
    
    const authenticatedUser = await services.authService.getAuthenticatedUser(token)
    result.addAction('Validate GitHub authentication', 'success', `Authenticated as ${authenticatedUser}`)
    result.addData('AUTHENTICATED_USER', authenticatedUser)
    
    // Execute project detection based on mode
    switch (args.mode) {
      case 'auto': {
        await detectProjectFromGitRemote(services, result)
        break
      }
        
      case 'owner': {
        await detectProjectFromOwner(args.input, services, result)
        break
      }
        
      case 'url': {
        await detectProjectFromUrl(args.input, services, result)
        break
      }
        
      default: {
        throw new OrchestratorError(
          new Error(`Unsupported detection mode: ${args.mode}`),
          [
            'Use a GitHub project URL (https://github.com/orgs/ORG/projects/123)',
            'Provide an organization name for project discovery',
            'Run from a git repository for auto-detection'
          ],
          { input: args.input, mode: args.mode }
        )
      }
    }
    
    result.addInstruction('Use the detected project information to proceed with data collection')
    result.addInstruction('Validate that the project contains repositories for analysis')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify GitHub authentication is set up correctly',
          'Check if the project or organization exists and is accessible',
          'Ensure you have proper permissions to access the project'
        ],
        { args: args.input, error: error instanceof Error ? error.message : String(error), mode: args.mode }
      ))
    }
    
    return result
  }
}


/**
 * Detect project from GitHub project URL
 */
async function detectProjectFromUrl(
  url: string,
  services: TProjectDetectionServices,
  result: LLMInfo
): Promise<void> {
  result.addAction('Parse project URL', 'success')
  
  // Extract project info from URL
  const urlMatch = url.match(/^https:\/\/github\.com\/(?:orgs|users)\/([^/]+)\/projects\/(\d+)/)
  if (!urlMatch) {
    result.addAction('Parse project URL', 'failed', 'Invalid project URL format')
    throw new OrchestratorError(
      new Error('Invalid GitHub project URL format'),
      [
        'Use format: https://github.com/orgs/ORG/projects/123',
        'Or: https://github.com/users/USER/projects/123',
        'Verify the URL is copied correctly from GitHub'
      ],
      { url }
    )
  }
  
  const [, owner, projectNumber] = urlMatch
  result.addAction('Parse project URL', 'success', `Parsed owner: ${owner}, project: ${projectNumber || 'unknown'}`)
  result.addData('PROJECT_OWNER', owner || 'unknown')
  result.addData('PROJECT_NUMBER', projectNumber || 'unknown')
  
  // Find project by owner and number
  result.addAction('Find project by URL', 'success')
  const projects = await services.projectService.findRecentProjects(owner || 'unknown')
  
  // Note: We would need project number to node ID mapping for exact match
  // For now, return the most recent project for the owner
  if (projects.length === 0) {
    result.addAction('Find project by URL', 'failed', 'No projects found for owner')
    throw new OrchestratorError(
      new Error(`No projects found for owner: ${owner}`),
      [
        'Verify the owner/organization name is correct',
        'Check if you have access to the organization\'s projects',
        'Ensure the project exists and is not private'
      ],
      { owner: owner || 'unknown', projectNumber: projectNumber || 'unknown' }
    )
  }
  
  const project = projects.at(0) // Use most recent project
  if (project) {
    result.addAction('Find project by URL', 'success', `Found project: ${project.title}`)
    result.addDataBulk(project.toLLMData())
  }
}

/**
 * Detect projects from owner/organization name
 */
async function detectProjectFromOwner(
  owner: string,
  services: TProjectDetectionServices,
  result: LLMInfo
): Promise<void> {
  result.addAction('Find projects by owner', 'success')
  result.addData('PROJECT_OWNER', owner)
  
  const projects = await services.projectService.findRecentProjects(owner)
  
  if (projects.length === 0) {
    result.addAction('Find projects by owner', 'failed', 'No projects found for owner')
    throw new OrchestratorError(
      new Error(`No projects found for owner: ${owner}`),
      [
        'Verify the owner/organization name is correct',
        'Check if you have access to the organization\'s projects',
        'Ensure projects exist and are not private'
      ],
      { owner }
    )
  }
  
  result.addAction('Find projects by owner', 'success', `Found ${projects.length} projects`)
  result.addData('PROJECTS_FOUND', String(projects.length))
  
  // Use the most recent project
  const selectedProject = projects.at(0)
  if (selectedProject) {
    result.addData('SELECTED_PROJECT', selectedProject.title)
    result.addDataBulk(selectedProject.toLLMData())
  }
  
  // Add information about other available projects
  if (projects.length > 1) {
    const otherProjects = projects.slice(1, 6).map(p => p.title).join(', ')
    result.addData('OTHER_PROJECTS', otherProjects)
  }
}

/**
 * Auto-detect project from git remote
 */
async function detectProjectFromGitRemote(
  services: TProjectDetectionServices,
  result: LLMInfo
): Promise<void> {
  result.addAction('Auto-detect project from git remote', 'success')
  
  const project = await services.projectService.detectProjectFromGitRemote()
  
  if (!project) {
    result.addAction('Auto-detect project from git remote', 'failed', 'No project found in git remote')
    throw new OrchestratorError(
      new Error('Could not detect GitHub project from git remote'),
      [
        'Ensure you are in a git repository directory',
        'Verify the git remote is set to a GitHub repository',
        'Check if the repository is associated with a GitHub project',
        'Consider specifying the project URL or organization manually'
      ]
    )
  }
  
  result.addAction('Auto-detect project from git remote', 'success', `Detected project: ${project.title}`)
  result.addDataBulk(project.toLLMData())
}