/**
 * @file GitHub Project Summary Orchestrator
 * 
 * Main orchestrator for the GitHub project summary command.
 * Coordinates the multi-phase execution of project detection, data collection, and activity analysis.
 */

import { OrchestratorError } from '../../../../core/error/OrchestratorError'
import { IOrchestratorService } from '../../../../core/interfaces/IOrchestratorService'
import { LLMInfo } from '../../../../core/LLMInfo'
import { ArgumentParser, IActivityAnalysisArgs } from '../../../../orchestrator-services/github/types/ArgumentTypes'

/**
 * Service collection for GitHub project summary orchestrator
 * 
 * Defines the specific orchestrator services needed for comprehensive
 * GitHub project analysis and summary generation.
 */
export type TSummaryOrchestratorServices = {
  /** Activity analysis orchestrator service */
  activityAnalysisOrchServ: IOrchestratorService
  
  /** Project data collection orchestrator service */
  projectDataCollectionOrchServ: IOrchestratorService
  
  /** Project detection orchestrator service */
  projectDetectionOrchServ: IOrchestratorService
}

/**
 * GitHub Project Summary Orchestrator
 * 
 * This orchestrator coordinates the comprehensive analysis of GitHub Projects v2,
 * including project detection, repository discovery, data collection, and
 * activity analysis. It implements a phased approach to handle complex
 * multi-repository project analysis.
 * 
 * Execution phases:
 * 1. Project Detection - Identify and validate the target project
 * 2. Data Collection - Gather project and repository information
 * 3. Activity Analysis - Analyze activity patterns and generate insights
 * 
 * @param commandArgs - Raw arguments string from the command
 * @param services - Injected service dependencies
 * @returns LLMInfo with comprehensive project analysis data
 */
export const summaryOrch = async (
  commandArgs: string,
  services: TSummaryOrchestratorServices
): Promise<LLMInfo> => {
  // Extract required orchestrator services
  const { activityAnalysisOrchServ, projectDataCollectionOrchServ, projectDetectionOrchServ } = services
  
  // Validate all required services are present
  if (!projectDetectionOrchServ || !projectDataCollectionOrchServ || !activityAnalysisOrchServ) {
    throw new OrchestratorError(
      new Error('Required orchestrator services not found'),
      ['Ensure service factory provides all required orchestrator services'],
      { 
        code: 'INVALID_SERVICE_MAP',
        providedServices: Object.keys(services),
        requiredServices: ['projectDetectionOrchServ', 'projectDataCollectionOrchServ', 'activityAnalysisOrchServ']
      }
    )
  }

  const result = LLMInfo.create()
  
  try {
    // Add initial context
    result.addInstruction('Generate a comprehensive GitHub project summary report')
    result.addData('COMMAND_ARGS', commandArgs)
    result.addData('EXECUTION_PHASE', 'initialization')
    
    // Phase 1: Project Detection
    const detectionResult = await projectDetectionOrchServ(
      commandArgs,
      services
    )
    
    result.merge(detectionResult)
    
    // Check if detection failed
    if (detectionResult.getExitCode() !== 0) {
      result.addAction('Detect GitHub project', 'failed', 'Project detection failed')
      return result
    }
    
    result.addAction('Detect GitHub project', 'success')
    
    // Extract project ID from detection result
    const projectId = extractProjectId(detectionResult)
    if (!projectId) {
      throw new OrchestratorError(
        new Error('Failed to extract project ID from detection result'),
        ['Ensure project detection returned a valid PROJECT_NODE_ID'],
        { code: 'PROJECT_ID_MISSING', detectionData: detectionResult.getData() }
      )
    }
    
    // Phase 2: Data Collection
    result.addData('EXECUTION_PHASE', 'data_collection')
    
    const collectionArgs = `${projectId} ${commandArgs}`
    const collectionResult = await projectDataCollectionOrchServ(
      collectionArgs,
      services
    )
    
    result.merge(collectionResult)
    
    // Check if collection failed
    if (collectionResult.getExitCode() !== 0) {
      result.addAction('Collect project data', 'failed', 'Data collection failed')
      return result
    }
    
    result.addAction('Collect project data', 'success')
    
    // Phase 3: Activity Analysis
    result.addData('EXECUTION_PHASE', 'activity_analysis')
    
    // Extract repository list from collection result
    const repositories = extractRepositories(collectionResult)
    if (repositories.length === 0) {
      throw new OrchestratorError(
        new Error('No repositories found in project'),
        ['Ensure the project contains accessible repositories'],
        { code: 'NO_REPOSITORIES', projectId }
      )
    }
    
    const analysisArgs = buildAnalysisArgs(repositories, commandArgs)
    // Convert typed args to JSON string for service map compatibility during migration
    const analysisArgsString = JSON.stringify(analysisArgs)
    const analysisResult = await activityAnalysisOrchServ(
      analysisArgsString,
      services
    )
    
    result.merge(analysisResult)
    
    // Check if analysis failed
    if (analysisResult.getExitCode() !== 0) {
      result.addAction('Analyze project activity', 'failed', 'Activity analysis failed')
      return result
    }
    
    result.addAction('Analyze project activity', 'success')
    
    // Final instructions for LLM
    result.addData('EXECUTION_PHASE', 'complete')
    result.addInstruction('Synthesize the collected data into a comprehensive project summary')
    result.addInstruction('Adapt the report style based on the AUDIENCE parameter')
    result.addInstruction('Highlight key insights and actionable recommendations')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error,
        ['Review the error details', 'Check service availability'],
        { code: 'ORCHESTRATION_FAILED', commandArgs }
      ))
    }

    return result
  }
}

/**
 * Extract project ID from detection result
 */
function extractProjectId(detectionResult: LLMInfo): null | string {
  const data = detectionResult.getData()
  return data['PROJECT_NODE_ID'] || data['PROJECT_ID'] || null
}

/**
 * Extract repository list from collection result
 */
function extractRepositories(collectionResult: LLMInfo): string[] {
  const data = collectionResult.getData()
  const repoList = data['REPOSITORIES_LIST']
  
  if (!repoList) {
    return []
  }
  
  return repoList.split(',').map(repo => repo.trim()).filter(Boolean)
}

/**
 * Build analysis arguments from repositories and command args
 */
function buildAnalysisArgs(repositories: string[], originalArgs: string): IActivityAnalysisArgs {
  // Extract time window from original args
  const sinceMatch = originalArgs.match(/--since\s+(\S+)/)
  const since = sinceMatch ? sinceMatch[1] : '30d'
  
  // Extract owner from first repository
  const [owner] = repositories[0]?.split('/') || ['']
  if (!owner) {
    throw new OrchestratorError(
      new Error('Unable to extract owner from repository list'),
      ['Ensure repositories are in format: owner/repo'],
      { repositories }
    )
  }
  
  // Parse time window to days
  const timeWindowDays = ArgumentParser.parseTimeWindow(since)
  
  return {
    owner,
    repositories,
    timeWindowDays
  }
}