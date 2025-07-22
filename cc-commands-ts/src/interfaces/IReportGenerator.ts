import { IGitHubProject } from './IGitHubProject.js'
import { IProjectActivity } from './IProjectActivity.js'
import { AudienceType } from '../types/AudienceTypes.js'

/**
 * Interface for report generators
 */
export interface IReportGenerator {
  /**
   * The audience type this generator targets
   */
  audience: AudienceType
  
  /**
   * Generate a report for the given project and activity data
   */
  generate(activity: IProjectActivity, project: IGitHubProject): string
  
  /**
   * Get a short description of what this report includes
   */
  getDescription(): string
}