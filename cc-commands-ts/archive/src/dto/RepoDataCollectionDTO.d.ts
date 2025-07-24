/**
 * @file DTO for complete repository data collection
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
import type { ProjectDataDTO } from '../types/ProjectDataDTO';
import { ActivityMetricsDTO } from './ActivityMetricsDTO';
import { ReleaseDataDTO } from './ReleaseDataDTO';
import { RepositoryDataDTO } from './RepositoryDataDTO';
/**
 * Data transfer object for complete repository data collection
 *
 * This DTO wraps all the collected data from a GitHub repository
 * and provides methods to convert it to LLMInfo format.
 */
export declare class RepoDataCollectionDTO implements ILLMDataDTO {
    readonly repositoryData: RepositoryDataDTO;
    readonly activityMetrics: ActivityMetricsDTO;
    readonly latestRelease: null | ReleaseDataDTO;
    readonly workflowCount: number;
    readonly activeWorkflowNames: string[];
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new repository data collection
     */
    constructor(repositoryData: RepositoryDataDTO, activityMetrics: ActivityMetricsDTO, latestRelease: null | ReleaseDataDTO, workflowCount: number, activeWorkflowNames: string[]);
    /**
     * Factory method to create from raw project data
     */
    static fromProjectData(projectData: ProjectDataDTO): RepoDataCollectionDTO;
    /**
     * Convert to LLMInfo data format
     *
     * This aggregates data from all sub-DTOs
     */
    toLLMData(): Record<string, string>;
}
