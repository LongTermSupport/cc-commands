/**
 * @file Interface for data file service
 */

import type { DataFileOptions, ProjectDataStructure } from '../services/DataFileService.js'

/**
 * Service for saving data to files
 */
export interface IDataFileService {
  /**
   * Save data to a JSON file
   * 
   * @param data - Data to save
   * @param options - File saving options
   * @returns Path to the saved file
   */
  saveDataFile(data: unknown, options: DataFileOptions): Promise<string>
  
  /**
   * Save GitHub Project data
   * 
   * @param projectData - Project and repository data
   * @param organization - Organization name
   * @param projectNumber - Optional project number
   * @returns Path to the saved file
   */
  saveProjectData(
    projectData: ProjectDataStructure,
    organization: string,
    projectNumber?: number
  ): Promise<string>
}