/**
 * @fileoverview TypeScript orchestrator for g:gh:project:summary command
 * 
 * This orchestrator collects raw GitHub repository data for the LLM to process.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. This orchestrator does NOT generate reports - only collects data
 * 2. This orchestrator does NOT make formatting decisions
 * 3. This orchestrator does NOT interpret audience types
 * 4. Returns raw data as LLMInfo with KEY=value pairs
 * 5. The LLM (interpreting the command markdown) decides how to use the data
 * 
 * @see https://github.com/Strajk/cc-commands/issues/18
 */

import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../BaseCommand.js'
import { LLMInfo } from '../../../../types/LLMInfo.js'
import { GitHubApiService } from '../../../../services/github/GitHubApiService.js'
import { ProjectDetectionService } from '../../../../services/github/ProjectDetectionService.js'
import { DataCollectionService } from '../../../../services/github/DataCollectionService.js'
import { GitHubErrorFactory } from '../../../../errors/GitHubErrorFactory.js'
import { ValidationErrorFactory } from '../../../../errors/ValidationErrorFactory.js'
import { CommandError } from '../../../../errors/CommandError.js'

export default class Summary extends BaseCommand {
  static description = 'Collect GitHub repository data for LLM processing'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --url https://github.com/user/repo',
    '<%= config.bin %> <%= command.id %> --owner user --repo repo',
    '<%= config.bin %> <%= command.id %> --audience pm',
  ]

  static flags = {
    // Input mode flags
    url: Flags.string({
      char: 'u',
      description: 'GitHub repository URL',
      exclusive: ['owner', 'repo'],
    }),
    owner: Flags.string({
      char: 'o',
      description: 'GitHub repository owner',
      dependsOn: ['repo'],
    }),
    repo: Flags.string({
      char: 'r',
      description: 'GitHub repository name',
      dependsOn: ['owner'],
    }),
    
    // Audience flag - just passed through as raw data
    audience: Flags.string({
      char: 'a',
      description: 'Target audience (passed to LLM for report generation)',
      default: 'dev',
    }),

    // GitHub token flag
    token: Flags.string({
      char: 't',
      description: 'GitHub personal access token',
      env: 'GITHUB_TOKEN',
    }),
  }

  /**
   * Main execution method - collects repository data and returns LLMInfo
   * 
   * IMPORTANT: This method only collects data. It does NOT:
   * - Generate reports
   * - Format output
   * - Make decisions based on audience
   * 
   * The LLM will use the returned data to generate appropriate reports.
   */
  async execute(): Promise<LLMInfo> {
    const { flags } = await this.parse(Summary)
    const result = LLMInfo.create()

    try {
      // Step 1: Validate and determine input mode
      const { mode, owner, repo } = await this.determineInputMode(flags, result)
      result.addData('INPUT_MODE', mode)
      result.addData('REPOSITORY_OWNER', owner)
      result.addData('REPOSITORY_NAME', repo)

      // Step 2: Pass through audience as raw data (LLM will interpret)
      result.addData('AUDIENCE', flags.audience)

      // Step 3: Initialize GitHub API service
      const githubService = this.initializeGitHubService(flags.token, result)

      // Step 4: Detect repository type and gather metadata
      const detectionService = new ProjectDetectionService(githubService)
      const projectInfo = await detectionService.detectProject(owner, repo)
      
      result.addAction(
        'Repository detection',
        'success',
        `Type: ${projectInfo.type}, Language: ${projectInfo.primaryLanguage}`
      )

      // Add repository metadata to result
      result.addData('REPOSITORY_TYPE', projectInfo.type)
      result.addData('PRIMARY_LANGUAGE', projectInfo.primaryLanguage)
      result.addData('DESCRIPTION', projectInfo.description || 'No description')
      result.addData('TOPICS', projectInfo.topics.join(', ') || 'None')
      result.addData('LICENSE', projectInfo.license || 'No license')
      result.addData('IS_FORK', String(projectInfo.isFork))
      result.addData('IS_ARCHIVED', String(projectInfo.isArchived))
      result.addData('VISIBILITY', projectInfo.visibility)

      // Step 5: Collect comprehensive repository data
      const collectionService = new DataCollectionService(githubService)
      const projectData = await collectionService.collectData(owner, repo, {
        includeActivity: true,
        includeContributors: true,
        includeReleases: true,
        includeWorkflows: true,
        includeIssues: true,
        includePullRequests: true,
      })

      result.addAction(
        'Data collection',
        'success',
        'Collected comprehensive repository data'
      )

      // Add activity metrics
      const activity = projectData.activity
      result.addData('STARS_COUNT', String(activity.stars))
      result.addData('FORKS_COUNT', String(activity.forks))
      result.addData('WATCHERS_COUNT', String(activity.watchers))
      result.addData('OPEN_ISSUES_COUNT', String(activity.openIssues))
      result.addData('RECENT_COMMITS_7D', String(activity.recentCommits))
      result.addData('RECENT_ISSUES_7D', String(activity.recentIssues))
      result.addData('RECENT_PRS_7D', String(activity.recentPullRequests))
      result.addData('LAST_COMMIT_DATE', activity.lastCommitDate)
      result.addData('LAST_RELEASE_DATE', activity.lastReleaseDate || 'No releases')

      // Add contributor data
      result.addData('CONTRIBUTOR_COUNT', String(projectData.contributors.length))
      result.addData('TOP_CONTRIBUTORS', projectData.contributors
        .slice(0, 5)
        .map(c => `${c.login}(${c.contributions})`)
        .join(', '))

      // Add release information
      if (projectData.releases.length > 0) {
        const latestRelease = projectData.releases[0]
        result.addData('LATEST_RELEASE_VERSION', latestRelease.tagName)
        result.addData('LATEST_RELEASE_NAME', latestRelease.name || latestRelease.tagName)
        result.addData('LATEST_RELEASE_PRERELEASE', String(latestRelease.isPrerelease))
      }

      // Add workflow status
      if (projectData.workflows.length > 0) {
        result.addData('CI_WORKFLOWS_COUNT', String(projectData.workflows.length))
        const activeWorkflows = projectData.workflows.filter(w => w.state === 'active')
        result.addData('ACTIVE_WORKFLOWS', activeWorkflows.map(w => w.name).join(', '))
      }

      // Just return the raw data - no instructions, no formatting hints
      return result

    } catch (error) {
      // Handle errors appropriately based on type
      if (error instanceof CommandError) {
        throw error
      }
      
      // Wrap unexpected errors
      throw new CommandError(
        error as Error,
        [
          'Check your network connection',
          'Verify GitHub token is valid',
          'Ensure repository exists and is accessible',
        ],
        { command: 'g:gh:project:summary' }
      )
    }
  }

  /**
   * Determines the input mode and extracts owner/repo information
   */
  private async determineInputMode(
    flags: any,
    result: LLMInfo
  ): Promise<{ mode: string; owner: string; repo: string }> {
    // URL mode
    if (flags.url) {
      const match = flags.url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        throw ValidationErrorFactory.invalidArgument(
          'url',
          flags.url,
          'GitHub repository URL',
          ['https://github.com/owner/repo']
        )
      }
      
      result.addAction(
        'Parse GitHub URL',
        'success',
        flags.url
      )
      
      return {
        mode: 'url',
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      }
    }

    // Manual mode
    if (flags.owner && flags.repo) {
      return {
        mode: 'manual',
        owner: flags.owner,
        repo: flags.repo,
      }
    }

    // Auto mode - detect from current directory
    try {
      const detectionService = new ProjectDetectionService()
      const detected = await detectionService.detectFromDirectory()
      
      result.addAction(
        'Auto-detect repository',
        'success',
        `${detected.owner}/${detected.repo}`
      )
      
      return {
        mode: 'auto',
        owner: detected.owner,
        repo: detected.repo,
      }
    } catch (error) {
      throw ValidationErrorFactory.invalidArgument(
        'repository',
        'current directory',
        'Git repository with GitHub remote',
        ['Use --url or --owner/--repo flags']
      )
    }
  }

  /**
   * Initializes GitHub API service with authentication
   */
  private initializeGitHubService(token: string | undefined, result: LLMInfo): GitHubApiService {
    if (!token) {
      result.addAction(
        'GitHub authentication',
        'skipped',
        'No token provided, using unauthenticated access (rate limits apply)'
      )
    } else {
      result.addAction(
        'GitHub authentication',
        'success',
        'Using provided token'
      )
    }

    return new GitHubApiService({ auth: token })
  }
}