/**
 * @file Orchestration service for saving data files
 */
import type { IDataFileService } from '../../interfaces/IDataFileService';
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService';
import type { ProjectDataStructure } from '../DataFileService';
import { LLMInfo } from '../../types/LLMInfo';
/**
 * Parameters for data file orchestration
 */
export interface DataFileParams {
    /** Data to save */
    data: ProjectDataStructure | unknown;
    /** Type of data being saved */
    dataType?: 'generic' | 'project';
    /** Filename for the data */
    filename?: string;
    /** Organization name (for project data) */
    organization?: string;
    /** Project number (for project data) */
    projectNumber?: number;
}
/**
 * Orchestration service for saving data files
 */
export declare class DataFileOrchestrationService implements IOrchestrationService {
    private readonly dataFileService;
    /**
     * Create a new data file orchestration service
     *
     * @param dataFileService - Service for saving data files
     */
    constructor(dataFileService: IDataFileService);
    /**
     * Execute data file saving
     *
     * @param context - Service context
     * @returns LLMInfo with file path
     */
    execute(context: ServiceContext): Promise<LLMInfo>;
}
