/**
 * @file Interface for data collection service
 * 
 * Defines the contract for collecting comprehensive project data
 * from GitHub repositories.
 */

import type { ProjectDataDTO } from '../types/ProjectDataDTO.js'

/**
 * Options for data collection
 */
export interface DataCollectionOptionsDTO {
  /** Include recent activity data */
  includeActivity?: boolean
  /** Include contributor information */
  includeContributors?: boolean
  /** Include language statistics */
  includeLanguages?: boolean
  /** Include release information */
  includeReleases?: boolean
  /** Include workflow information */
  includeWorkflows?: boolean
  /** Date to collect activity since */
  since?: Date
}

/**
 * Service interface for collecting project data
 */
export interface IDataCollectionService {
  /**
   * Collect comprehensive data about a GitHub project
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - What data to collect
   * @returns Complete project data
   */
  collectData(
    owner: string,
    repo: string,
    options?: DataCollectionOptionsDTO
  ): Promise<ProjectDataDTO>
}