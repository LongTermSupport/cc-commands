/**
 * @file Data collection orchestration service
 *
 * Wraps the DataCollectionService to return LLMInfo for orchestrator consumption.
 * Collects comprehensive project data and writes detailed information to files.
 */
import type { IDataCollectionService } from '../../interfaces/IDataCollectionService';
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService';
import { LLMInfo } from '../../types/LLMInfo';
/**
 * Orchestration wrapper for data collection
 */
export declare class DataCollectionOrchestrationService implements IOrchestrationService {
    private dataCollector;
    constructor(dataCollector: IDataCollectionService);
    execute(context: ServiceContext): Promise<LLMInfo>;
}
