/**
 * @file Data collection orchestration service
 * 
 * Wraps the DataCollectionService to return LLMInfo for orchestrator consumption.
 * Collects comprehensive project data and writes detailed information to files.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { IDataCollectionService } from '../../interfaces/IDataCollectionService.js'
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService.js'
import type { ContributorDTO } from '../../types/ProjectDataDTO.js'

import { CommandError } from '../../errors/CommandError.js'
import { LLMInfo } from '../../types/LLMInfo.js'

/**
 * Orchestration wrapper for data collection
 */
export class DataCollectionOrchestrationService implements IOrchestrationService {
  constructor(
    private dataCollector: IDataCollectionService
  ) {}
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    try {
      const owner = context.params['owner'] as string
      const repo = context.params['repo'] as string
      const audience = context.params['audience'] as string || 'dev'
      const daysSince = Number(context.params['days']) || 30
      
      // Calculate date range
      const since = new Date()
      since.setDate(since.getDate() - daysSince)
      
      // Collect all data
      const projectData = await this.dataCollector.collectData(owner, repo, {
        includeActivity: true,
        includeContributors: true,
        includeLanguages: true,
        includeReleases: true,
        includeWorkflows: true,
        since
      })
      
      // Add summary data to LLMInfo (KEY=value pairs)
      if (!projectData.project) {
        throw new Error('Project data is missing')
      }
      
      result.addData('REPOSITORY_NAME', projectData.project.name)
      result.addData('REPOSITORY_OWNER', projectData.project.owner)
      result.addData('DESCRIPTION', projectData.project.description || 'No description')
      result.addData('PRIMARY_LANGUAGE', projectData.project.primaryLanguage)
      result.addData('VISIBILITY', projectData.project.visibility)
      result.addData('DEFAULT_BRANCH', projectData.project.defaultBranch)
      result.addData('LICENSE', projectData.project.license || 'No license')
      result.addData('CREATED_AT', projectData.project.createdAt)
      result.addData('UPDATED_AT', projectData.project.updatedAt)
      result.addData('IS_FORK', String(projectData.project.isFork))
      result.addData('IS_ARCHIVED', String(projectData.project.isArchived))
      result.addData('TOPICS', projectData.project.topics.join(', ') || 'None')
      
      // Activity metrics
      result.addData('COMMIT_COUNT', String(projectData.activity.commitCount))
      result.addData('ISSUE_COUNT', String(projectData.activity.issueCount))
      result.addData('PR_COUNT', String(projectData.activity.prCount))
      result.addData('RELEASE_COUNT', String(projectData.activity.releaseCount))
      result.addData('CONTRIBUTOR_COUNT', String(projectData.activity.contributorCount))
      result.addData('DAYS_ANALYZED', String(daysSince))
      
      // Latest release info
      if (projectData.releases && projectData.releases.length > 0) {
        const latestRelease = projectData.releases[0]
        if (latestRelease) {
          result.addData('LATEST_RELEASE_VERSION', latestRelease.tagName)
          result.addData('LATEST_RELEASE_DATE', latestRelease.publishedAt)
          result.addData('LATEST_RELEASE_NAME', latestRelease.name || latestRelease.tagName)
          result.addData('LATEST_RELEASE_IS_PRERELEASE', String(latestRelease.isPrerelease))
        }
      } else {
        result.addData('LATEST_RELEASE_VERSION', 'No releases')
        result.addData('LAST_RELEASE_DATE', 'No releases')
      }
      
      // Top contributors
      if (projectData.contributors && projectData.contributors.length > 0) {
        const topContributors = projectData.contributors.slice(0, 5)
        result.addData('TOP_CONTRIBUTORS', topContributors.map((c: ContributorDTO) => `${c.login} (${c.contributions})`).join(', '))
      }
      
      // Pass through audience without interpretation
      result.addData('AUDIENCE', audience)
      
      // Write detailed data to file for optional LLM access
      const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
      const dataDir = join('var', 'project-data')
      mkdirSync(dataDir, { recursive: true })
      
      const detailFile = join(dataDir, `${owner}-${repo}-${timestamp}.json`)
      const detailData = {
        metadata: {
          collectedAt: new Date().toISOString(),
          daysSince,
          owner,
          repo
        },
        ...projectData
      }
      
      writeFileSync(detailFile, JSON.stringify(detailData, null, 2))
      result.addFile(detailFile, 'created', JSON.stringify(detailData).length)
      
      // Add action
      result.addAction('Data collection', 'success', 
        `Collected comprehensive data for ${owner}/${repo}`, Date.now() - since.getTime())
      
      // Add instructions for LLM
      result.addInstruction('Generate a project summary report using the collected data')
      result.addInstruction('Adapt the report style and detail level based on the AUDIENCE parameter')
      result.addInstruction('The detailed data file contains additional information if deeper analysis is needed')
      
    } catch (error) {
      const commandError = error instanceof CommandError 
        ? error 
        : CommandError.fromError(error, {
            action: 'collecting project data',
            service: 'DataCollectionOrchestrationService'
          })
      
      result.setError(commandError)
      result.addAction('Data collection', 'failed', commandError.message)
      result.addInstruction('Explain the error and provide troubleshooting steps')
    }
    
    return result
  }
}