/**
 * @file GitHub Project Summary Orchestrator
 * 
 * Main orchestrator for the GitHub project summary command.
 * Coordinates the multi-phase execution of project detection, data collection, and activity analysis.
 */

import { OrchestratorError } from '../../../../core/error/OrchestratorError.js'
import { LLMInfo } from '../../../../core/LLMInfo.js'
import { ensureXzAvailable } from '../../../../core/utils/CompressionUtils.js'
import { IActivityAnalysisArgs, IProjectDataCollectionArgs, IProjectDetectionArgs, ISummaryOrchestratorArgs } from '../../../../orchestrator-services/github/types/ArgumentTypes.js'

/**
 * Service collection for GitHub project summary orchestrator
 * 
 * Defines the specific orchestrator services needed for comprehensive
 * GitHub project analysis and summary generation.
 */
export type TSummaryOrchestratorServices = {
  /** Activity analysis orchestrator service */
  activityAnalysisOrchServ: (args: IActivityAnalysisArgs) => Promise<LLMInfo>
  
  /** Project data collection orchestrator service */
  projectDataCollectionOrchServ: (args: IProjectDataCollectionArgs) => Promise<LLMInfo>
  
  /** Project detection orchestrator service */
  projectDetectionOrchServ: (args: IProjectDetectionArgs) => Promise<LLMInfo>
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
 * @param args - Typed arguments from the command
 * @param services - Injected service dependencies
 * @returns LLMInfo with comprehensive project analysis data
 */
export const summaryOrch = async (
  args: ISummaryOrchestratorArgs,
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
    // Ensure XZ compression is available before starting
    ensureXzAvailable()
    
    // Add initial context
    result.addInstruction('Generate a comprehensive GitHub project summary report')
    result.addData('PROJECT_INPUT', args.projectArgs.input)
    result.addData('DETECTION_MODE', args.projectArgs.mode)
    result.addData('TIME_WINDOW_DAYS', String(args.timeWindowDays))
    result.addData('OUTPUT_FORMAT', args.format || 'technical')
    result.addData('EXECUTION_PHASE', 'initialization')
    
    // Phase 1: Project Detection
    const detectionResult = await projectDetectionOrchServ(args.projectArgs)
    
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
    
    const collectionArgs: IProjectDataCollectionArgs = { projectNodeId: projectId }
    const collectionResult = await projectDataCollectionOrchServ(collectionArgs)
    
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
    
    const analysisArgs = buildAnalysisArgs(repositories, args.timeWindowDays)
    const analysisResult = await activityAnalysisOrchServ(analysisArgs)
    
    result.merge(analysisResult)
    
    // Check if analysis failed
    if (analysisResult.getExitCode() !== 0) {
      result.addAction('Analyze project activity', 'failed', 'Activity analysis failed')
      return result
    }
    
    result.addAction('Analyze project activity', 'success')
    
    // Final instructions for LLM - Enhanced analytical guidance
    result.addData('EXECUTION_PHASE', 'complete')
    
    // Core analysis instructions based on mathematical facts
    result.addInstruction('Analyze project health using mathematical ratios: ISSUE_OPEN_CLOSE_RATIO, PR_MERGE_SUCCESS_RATE, and resolution time metrics')
    result.addInstruction('Evaluate development velocity using COMMITS_PER_DAY, COMMIT_GROWTH_RATE, and daily activity patterns from the provided facts')
    result.addInstruction('Assess project sustainability using CONTRIBUTOR_CONCENTRATION, CROSS_ACTIVITY_CONTRIBUTOR_RATIO, and contributor distribution metrics')
    result.addInstruction('Determine maintenance quality using DAYS_SINCE_LAST_PUSH, AVERAGE_RESOLUTION_TIME_DAYS, and MEDIAN_MERGE_TIME_DAYS')
    result.addInstruction('Identify trends using growth rate calculations and time-based activity patterns from the mathematical data')
    
    // Risk assessment instructions
    result.addInstruction('Identify potential risks using contributor concentration ratios and declining activity trends')
    result.addInstruction('Assess bus factor risk using TOP_CONTRIBUTOR_PERCENTAGE and CONTRIBUTOR_GINI_COEFFICIENT')
    result.addInstruction('Evaluate technical debt indicators through PR_SIZE metrics and increasing resolution times')
    
    // Audience-specific formatting instructions
    result.addInstruction('Adapt analysis depth based on OUTPUT_FORMAT: technical=detailed metrics, executive=business impact, comprehensive=full analysis')
    result.addInstruction('For technical audiences: include specific ratio values, percentiles, and statistical measures')
    result.addInstruction('For executive audiences: translate mathematical insights into business impact and strategic implications')
    result.addInstruction('For comprehensive reports: provide both technical details and business context')
    
    // Output structure guidance
    result.addInstruction('Structure analysis with clear sections: Project Overview, Activity Analysis, Health Assessment, Sustainability Review, Risk Factors, Recommendations')
    result.addInstruction('Support all conclusions with specific mathematical facts and ratios from the provided data')
    result.addInstruction('Provide actionable recommendations based on quantitative thresholds and trend analysis')
    result.addInstruction('Include confidence indicators based on data completeness and analysis period length')
    
    // Data interpretation guidance
    result.addInstruction('Base all quality assessments on numerical thresholds: PR merge rates >80% indicate good process, resolution times <7 days suggest active maintenance')
    result.addInstruction('Use statistical measures (mean, median, percentiles) to provide context for outliers and distribution patterns')
    result.addInstruction('Reference raw namespace for authoritative API data, calculated namespace for mathematical insights')
    
    return result
    
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      result.setError(new OrchestratorError(
        error,
        ['Review the error details', 'Check service availability'],
        { code: 'ORCHESTRATION_FAILED', mode: args.projectArgs.mode, projectInput: args.projectArgs.input }
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
  if (!data) return null
  
  if ('PROJECT_NODE_ID' in data && data['PROJECT_NODE_ID']) {
    return data['PROJECT_NODE_ID']
  }

  if ('PROJECT_ID' in data && data['PROJECT_ID']) {
    return data['PROJECT_ID']
  }

  if ('PROJECT_V2_ID' in data && data['PROJECT_V2_ID']) {
    return data['PROJECT_V2_ID']
  }
  
  return null
}

/**
 * Extract repository list from collection result
 */
function extractRepositories(collectionResult: LLMInfo): string[] {
  const data = collectionResult.getData()
  if (!data) return []
  
  const repoList = Object.hasOwn(data, 'REPOSITORIES_LIST') ? data['REPOSITORIES_LIST'] : undefined
  if (!repoList || typeof repoList !== 'string') {
    return []
  }
  
  return repoList.split(',').map(repo => repo.trim()).filter(Boolean)
}

/**
 * Build analysis arguments from repositories and time window
 */
function buildAnalysisArgs(repositories: string[], timeWindowDays: number): IActivityAnalysisArgs {
  // Extract owner from first repository
  const [owner] = repositories.at(0)?.split('/') ?? ['']
  if (!owner) {
    throw new OrchestratorError(
      new Error('Unable to extract owner from repository list'),
      ['Ensure repositories are in format: owner/repo'],
      { repositories }
    )
  }
  
  return {
    owner,
    repositories,
    timeWindowDays
  }
}