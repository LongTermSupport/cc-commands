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
      
      // Add all data from the DTO
      result.addDataFromDTO(projectData)
      
      // Pass through audience without interpretation
      result.addData('AUDIENCE', audience)
      
      // Write detailed data to file for optional LLM access
      const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
      const dataDir = join('var', 'project-data')
      mkdirSync(dataDir, { recursive: true })
      
      const detailFile = join(dataDir, `${owner}-${repo}-${timestamp}.json`)
      const detailData = {
        activeWorkflowNames: projectData.activeWorkflowNames,
        activityMetrics: projectData.activityMetrics,
        latestRelease: projectData.latestRelease,
        metadata: {
          collectedAt: new Date().toISOString(),
          daysSince,
          owner,
          repo
        },
        repositoryData: projectData.repositoryData,
        workflowCount: projectData.workflowCount
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