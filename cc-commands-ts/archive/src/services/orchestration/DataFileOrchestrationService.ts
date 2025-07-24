/**
 * @file Orchestration service for saving data files
 */

import type { IDataFileService } from '../../interfaces/IDataFileService'
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService'
import type { ProjectDataStructure } from '../DataFileService'

import { CommandError } from '../../errors/CommandError'
import { LLMInfo } from '../../types/LLMInfo'

/**
 * Parameters for data file orchestration
 */
export interface DataFileParams {
  /** Data to save */
  data: ProjectDataStructure | unknown
  /** Type of data being saved */
  dataType?: 'generic' | 'project'
  /** Filename for the data */
  filename?: string
  /** Organization name (for project data) */
  organization?: string
  /** Project number (for project data) */
  projectNumber?: number
}

/**
 * Orchestration service for saving data files
 */
export class DataFileOrchestrationService implements IOrchestrationService {
  /**
   * Create a new data file orchestration service
   * 
   * @param dataFileService - Service for saving data files
   */
  constructor(
    private readonly dataFileService: IDataFileService
  ) {}
  
  /**
   * Execute data file saving
   * 
   * @param context - Service context
   * @returns LLMInfo with file path
   */
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    // Validate required params
    if (!context.params['data']) {
      throw new Error('Missing required parameter: data')
    }
    
    const params = context.params as unknown as DataFileParams
    const { data, dataType = 'generic', filename, organization, projectNumber } = params
    
    try {
      let filepath: string
      
      if (dataType === 'project' && organization) {
        // Save as project data with structured format
        filepath = await this.dataFileService.saveProjectData(
          data as ProjectDataStructure,
          organization,
          projectNumber
        )
        
        result.addAction('Save project data', 'success', 
          `Saved project data for ${organization}${projectNumber ? ` project #${projectNumber}` : ''}`)
      } else {
        // Save generic data
        if (!filename) {
          throw new Error('Filename required for generic data')
        }
        
        filepath = await this.dataFileService.saveDataFile(data, {
          filename,
          includeTimestamp: true,
          subdirectory: 'data'
        })
        
        result.addAction('Save data file', 'success', 
          `Saved data to ${filename}`)
      }
      
      // Add file information
      result.addFile(filepath, 'created')
      result.addData('DATA_FILE', filepath)
      result.addData('DATA_FILE_TYPE', 'json')
      
      // Add instructions for the LLM
      result.addInstruction(`Data has been saved to ${filepath}`)
      result.addInstruction('The file contains complete, unabridged data in JSON format')
      result.addInstruction('The data is structured for easy querying with jq')
      result.addInstruction('Use Read tool to access the full data when generating summaries')
      
    } catch (error) {
      result.setError(new CommandError(
        error as Error,
        ['Ensure var/ directory is writable', 'Check disk space'],
        { 
          dataType: dataType as string, 
          ...(filename && { filename }),
          ...(organization && { organization })
        }
      ))
    }
    
    return result
  }
}