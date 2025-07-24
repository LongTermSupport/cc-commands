/**
 * @file Environment validation orchestration service
 *
 * Validates that required tools and environment variables are present
 * before executing commands. Returns LLMInfo for orchestrator consumption.
 */
import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService';
import { LLMInfo } from '../../types/LLMInfo';
/**
 * Validates environment requirements for command execution
 */
export declare class EnvironmentValidationService implements IOrchestrationService {
    execute(context: ServiceContext): Promise<LLMInfo>;
    /**
     * Check if a command-line tool is available
     */
    private isToolAvailable;
}
