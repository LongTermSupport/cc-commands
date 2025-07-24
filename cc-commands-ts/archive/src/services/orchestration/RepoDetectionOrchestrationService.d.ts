/**
 * @file Repository detection orchestration service
 *
 * Wraps the RepoDetectionService to return LLMInfo for orchestrator consumption.
 * Handles different input modes: auto-detection, URL, or manual owner/repo.
 */
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService';
import type { IRepoDetectionService } from '../../interfaces/IRepoDetectionService';
import { LLMInfo } from '../../types/LLMInfo';
/**
 * Orchestration wrapper for repository detection
 */
export declare class RepoDetectionOrchestrationService implements IOrchestrationService {
    private repoDetector;
    constructor(repoDetector: IRepoDetectionService);
    execute(context: ServiceContext): Promise<LLMInfo>;
}
