/**
 * @file Project Summary Orchestrator - THIN coordination layer
 *
 * This orchestrator follows the multi-step LLM interaction pattern:
 *
 * Step 1 (detect mode):
 *   - Input: URL or org/project identifiers
 *   - Process: Detect organization and find GitHub Project
 *   - Output: PROJECT_ID, PROJECT_TITLE, REPO_COUNT
 *   - Next: LLM decides whether to proceed
 *
 * Step 2 (collect mode):
 *   - Input: Project ID from step 1
 *   - Process: Collect all repository data
 *   - Output: DATA_FILE path with complete JSON
 *   - Next: LLM reads file to generate summary
 *
 * IMPORTANT: This orchestrator contains NO business logic.
 * All work is delegated to services. Think MVC controller.
 *
 * CRITICAL: This orchestrator ONLY collects raw data.
 * It does NOT:
 * - Generate summaries or reports
 * - Format output for humans
 * - Make decisions about importance
 * - Create any kind of narrative
 *
 * @see ProjectDataService - Finds GitHub Projects
 * @see RepoDataCollectionService - Collects repository data
 * @see DataFileService - Saves structured data to files
 */
import type { IOrchestrationService } from '../../../../interfaces/IOrchestrationService';
/**
 * Services required for project summary orchestration
 */
export interface ProjectSummaryServices {
    dataCollector: IOrchestrationService;
    dataFileService?: IOrchestrationService;
    envValidator: IOrchestrationService;
    projectDetector: IOrchestrationService;
    projectDiscovery?: IOrchestrationService;
}
/**
 * Parsed command arguments
 */
export interface ProjectSummaryArgs {
    mode?: 'collect' | 'detect';
    projectId?: string;
    url?: string;
}
/**
 * Parsed command flags
 */
export interface ProjectSummaryFlags {
    audience?: string;
    days?: number;
    org?: string;
    owner?: string;
    repo?: string;
    token?: string;
}
/**
 * Execute project summary orchestration
 *
 * This is a pure function that orchestrates the collection of GitHub
 * project data. All dependencies are injected, making it easy to test.
 *
 * @param services - All required services
 * @param args - Parsed command arguments
 * @param flags - Parsed command flags
 * @returns LLMInfo with collected project data
 */
export declare const executeProjectSummary: IExecuteProjectSummary;
