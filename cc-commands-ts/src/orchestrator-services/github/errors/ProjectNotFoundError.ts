/**
 * @file Project Not Found Error Factory
 * 
 * Factory functions for creating project detection and access related
 * OrchestratorErrors, including auto-detection failures and invalid project references.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * Factory class for creating project-related errors
 * 
 * Handles scenarios where project detection fails, projects don't exist,
 * or project references are invalid. Provides specific recovery guidance
 * based on the detection method used.
 * 
 * @example
 * ```typescript
 * throw ProjectNotFoundError.autoDetectionFailed('/path/to/repo')
 * throw ProjectNotFoundError.projectNotFound('owner', '123')
 * ```
 */
export class ProjectNotFoundError {
  /**
   * Create error for access denied to projects
   * 
   * @param owner - Project owner
   * @param projectId - Project ID
   * @returns OrchestratorError for access denied
   */
  static accessDenied(owner: string, projectId: string): OrchestratorError {
    const accessError = new Error(`Access denied to project ${projectId} owned by ${owner}`)
    
    return new OrchestratorError(
      accessError,
      [
        `Request access to ${owner}'s organization or projects`,
        'Verify your GitHub token has org:read permissions', 
        'Check that project is not private or restricted',
        'Ensure you are a member of the organization if required'
      ],
      {
        detectionMethod: 'manual',
        membershipCheck: `Verify membership in ${owner} organization`,
        owner,
        permissionsRequired: ['read:org', 'read:project'],
        projectId,
        projectReference: { owner, projectId },
        type: 'PROJECT_ACCESS_DENIED'
      }
    )
  }

  /**
   * Create error for auto-detection failures
   * 
   * @param remotePath - Path where git remote detection was attempted
   * @param remoteUrl - Git remote URL that was found (if any)
   * @returns OrchestratorError for auto-detection failure
   */
  static autoDetectionFailed(
    remotePath?: string,
    remoteUrl?: string
  ): OrchestratorError {
    const pathInfo = remotePath || 'current directory'
    const autoDetectionError = new Error(`Could not auto-detect GitHub project from git remote in ${pathInfo}`)
    
    return new OrchestratorError(
      autoDetectionError,
      [
        'Ensure you are in a git repository with GitHub remote',
        'Check that git remote origin points to GitHub',
        'Use explicit project URL: https://github.com/orgs/ORG/projects/123',
        'Or specify owner/project-id format: owner/123'
      ],
      {
        detectionMethod: 'auto',
        gitRemoteInfo: remoteUrl ? this.parseGitRemote(remoteUrl) || null : null,
        gitStatus: 'Run `git remote -v` to check remotes',
        remotePath: pathInfo,
        remoteUrl: remoteUrl || 'No git remote found',
        type: 'PROJECT_AUTO_DETECTION_FAILED'
      }
    )
  }

  /**
   * Create error for invalid project URLs
   * 
   * @param url - Invalid project URL
   * @param expectedFormat - Expected URL format
   * @returns OrchestratorError for invalid URL
   */
  static invalidProjectUrl(
    url: string, 
    expectedFormat = 'https://github.com/orgs/ORG/projects/123 or https://github.com/users/USER/projects/123'
  ): OrchestratorError {
    const format = expectedFormat
    const urlError = new Error(`Invalid GitHub project URL format: ${url}`)
    
    return new OrchestratorError(
      urlError,
      [
        `Use correct format: ${format}`,
        'Ensure project ID is numeric',
        'Verify the URL is copied correctly from GitHub',
        'Check that project exists and is accessible'
      ],
      {
        detectionMethod: 'url',
        expectedFormat: format,
        providedUrl: url,
        suggestion: 'Copy URL directly from GitHub project page',
        type: 'PROJECT_INVALID_URL'
      }
    )
  }

  /**
   * Create error for malformed project identifiers
   * 
   * @param identifier - Malformed identifier
   * @param expectedFormats - Expected formats
   * @returns OrchestratorError for malformed identifier
   */
  static malformedIdentifier(
    identifier: string,
    expectedFormats = ['owner/123', 'https://github.com/orgs/owner/projects/123']
  ): OrchestratorError {
    const malformedError = new Error(`Malformed project identifier: ${identifier}`)
    
    return new OrchestratorError(
      malformedError,
      [
        `Use one of these formats:`,
        ...expectedFormats.map(format => `  - ${format}`),
        'Ensure project ID is numeric',
        'Double-check spelling of owner/organization name'
      ],
      {
        detectionMethod: 'manual',
        expectedFormats,
        parsingRules: 'Owner must be alphanumeric, project ID must be numeric',
        providedIdentifier: identifier,
        type: 'PROJECT_MALFORMED_IDENTIFIER'
      }
    )
  }

  /**
   * Create error for organizations with no projects
   * 
   * @param owner - Organization owner
   * @returns OrchestratorError for no projects found
   */
  static noProjectsFound(owner: string): OrchestratorError {
    const noProjectsError = new Error(`No GitHub projects found for ${owner}`)
    
    return new OrchestratorError(
      noProjectsError,
      [
        `Verify ${owner} has GitHub Projects enabled`,
        'Check that projects exist and are not archived',
        'Ensure your token has access to view organization projects',
        'Try specifying a specific project ID if you know it exists'
      ],
      {
        detectionMethod: 'auto',
        owner,
        searchScope: 'Organization projects',
        suggestion: `Visit https://github.com/orgs/${owner}/projects to see available projects`,
        type: 'NO_PROJECTS_FOUND'
      }
    )
  }

  /**
   * Create error for projects that don't exist
   * 
   * @param owner - Project owner
   * @param projectId - Project ID
   * @param url - Project URL if provided
   * @returns OrchestratorError for non-existent project
   */
  static projectNotFound(
    owner: string,
    projectId: string,
    url?: string
  ): OrchestratorError {
    const projectError = new Error(`GitHub project ${projectId} not found for ${owner}`)
    
    return new OrchestratorError(
      projectError,
      [
        `Verify project ${projectId} exists under ${owner}`,
        'Check that the project is not private or restricted',
        'Ensure your GitHub token has access to the organization',
        'Confirm project ID is correct (numeric value)'
      ],
      {
        accessCheck: 'Verify project visibility and permissions',
        detectionMethod: url ? 'url' : 'manual',
        owner,
        projectId,
        projectReference: { owner, projectId, url: url || '' },
        type: 'PROJECT_NOT_FOUND',
        url: url || `https://github.com/orgs/${owner}/projects/${projectId}`
      }
    )
  }

  /**
   * Parse git remote URL for context information
   * 
   * @param remoteUrl - Git remote URL
   * @returns Parsed remote information
   */
  private static parseGitRemote(remoteUrl: string): undefined | { owner: string; remoteUrl: string; repo: string } {
    // HTTPS format: https://github.com/owner/repo.git
    const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/)
    if (httpsMatch && httpsMatch[1] && httpsMatch[2]) {
      return {
        owner: httpsMatch[1],
        remoteUrl,
        repo: httpsMatch[2]
      }
    }

    // SSH format: git@github.com:owner/repo.git
    const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/([^/]+)\.git$/)
    if (sshMatch && sshMatch[1] && sshMatch[2]) {
      return {
        owner: sshMatch[1],
        remoteUrl,
        repo: sshMatch[2]
      }
    }

    // Unable to parse
    return undefined
  }
}