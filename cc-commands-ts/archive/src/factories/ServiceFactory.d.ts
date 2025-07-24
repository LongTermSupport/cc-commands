/**
 * @file Service factory for dependency injection
 *
 * This factory creates all services with their dependencies properly wired.
 * Used by commands to get fully configured service instances.
 */
import type { IOrchestrationService } from '../interfaces/IOrchestrationService';
/**
 * Services needed for project summary command
 */
export interface ProjectSummaryServices {
    dataCollector: IOrchestrationService;
    dataFileService: IOrchestrationService;
    envValidator: IOrchestrationService;
    projectDetector: IOrchestrationService;
    projectDiscovery: IOrchestrationService;
}
/**
 * Factory for creating services with dependency injection
 */
export declare const ServiceFactory: {
    /**
     * Create services for project summary command
     */
    createProjectSummaryServices(token?: string): ProjectSummaryServices;
};
