/**
 * @file Orchestration service for GitHub Projects v2 discovery
 */
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService';
import { LLMInfo } from '../../types/LLMInfo';
import { ProjectDataService } from '../github/ProjectDataService';
/**
 * Parameters for project discovery
 */
export interface ProjectDiscoveryParams {
    /** Whether to fetch project items */
    fetchItems?: boolean;
    /** Include archived projects */
    includeArchived?: boolean;
    /** Maximum number of projects/items to fetch */
    limit?: number;
    /** Organization to search for projects */
    organization?: string;
    /** Project ID for fetching specific project */
    projectId?: string;
}
/**
 * Orchestration service for discovering GitHub Projects v2
 */
export declare class ProjectDiscoveryOrchestrationService implements IOrchestrationService {
    private readonly projectDataService;
    /**
     * Create a new project discovery orchestration service
     *
     * @param projectDataService - Service for fetching project data
     */
    constructor(projectDataService: ProjectDataService);
    /**
     * Execute project discovery
     *
     * @param context - Service context
     * @returns LLMInfo with project data
     */
    execute(context: ServiceContext): Promise<LLMInfo>;
}
