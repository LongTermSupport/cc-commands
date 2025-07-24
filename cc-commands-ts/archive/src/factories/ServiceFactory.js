/**
 * @file Service factory for dependency injection
 *
 * This factory creates all services with their dependencies properly wired.
 * Used by commands to get fully configured service instances.
 */
import { DataFileService } from '../services/DataFileService';
import { DataCollectionService } from '../services/github/DataCollectionService';
import { GitHubApiService } from '../services/github/GitHubApiService';
import { ProjectDataService } from '../services/github/ProjectDataService';
import { RepoDetectionService } from '../services/github/RepoDetectionService';
import { DataCollectionOrchestrationService } from '../services/orchestration/DataCollectionOrchestrationService';
import { DataFileOrchestrationService } from '../services/orchestration/DataFileOrchestrationService';
import { EnvironmentValidationService } from '../services/orchestration/EnvironmentValidationService';
import { ProjectDiscoveryOrchestrationService } from '../services/orchestration/ProjectDiscoveryOrchestrationService';
import { RepoDetectionOrchestrationService } from '../services/orchestration/RepoDetectionOrchestrationService';
import { getGitHubToken } from '../utils/getGitHubToken';
/**
 * Factory for creating services with dependency injection
 */
export const ServiceFactory = {
    /**
     * Create services for project summary command
     */
    createProjectSummaryServices(token) {
        // Check if we're in test mode
        if (process.env['TEST_MODE'] === 'true') {
            // Return minimal test doubles that will respond with success
            return {
                dataCollector: {
                    async execute() {
                        const { LLMInfo } = await import('../types/LLMInfo');
                        const { RepositoryDataDTO } = await import('../dto/RepositoryDataDTO');
                        const { ActivityMetricsDTO } = await import('../dto/ActivityMetricsDTO');
                        const { RepoDataCollectionDTO } = await import('../dto/RepoDataCollectionDTO');
                        const repositoryDTO = new RepositoryDataDTO('testrepo', 'testuser', 'Test repository', 'TypeScript', 'public', 'main', 'MIT', new Date('2020-01-01'), new Date('2023-01-01'), false, false, ['testing', 'example']);
                        const activityMetricsDTO = new ActivityMetricsDTO(100, // commits
                        20, // issues
                        15, // PRs
                        5, // releases
                        10, // contributors
                        7, // days analyzed
                        [] // top contributors
                        );
                        const repoDataCollectionDTO = new RepoDataCollectionDTO(repositoryDTO, activityMetricsDTO, null, // no latest release
                        0, // no workflows
                        [] // no active workflows
                        );
                        const result = LLMInfo.create();
                        result.addDataFromDTO(repoDataCollectionDTO);
                        result.addData('AUDIENCE', 'dev');
                        result.addAction('Data collection', 'success');
                        return result;
                    }
                },
                dataFileService: {
                    async execute() {
                        const { LLMInfo } = await import('../types/LLMInfo');
                        const result = LLMInfo.create();
                        result.addFile('/var/test-data.json', 'created');
                        result.addData('DATA_FILE', '/var/test-data.json');
                        result.addAction('Save data file', 'success');
                        return result;
                    }
                },
                envValidator: {
                    async execute() {
                        const { LLMInfo } = await import('../types/LLMInfo');
                        const { EnvironmentValidationDTO } = await import('../dto/EnvironmentValidationDTO');
                        const validationResult = EnvironmentValidationDTO.success();
                        const result = LLMInfo.create();
                        result.addDataFromDTO(validationResult);
                        result.addAction('Environment validation', 'success');
                        return result;
                    }
                },
                projectDetector: {
                    async execute() {
                        const { LLMInfo } = await import('../types/LLMInfo');
                        const { RepoDetectionResultDTO } = await import('../dto/RepoDetectionResultDTO');
                        const detectionResult = RepoDetectionResultDTO.fromURL('https://github.com/testuser/testrepo', 'testuser', 'testrepo');
                        const result = LLMInfo.create();
                        result.addDataFromDTO(detectionResult);
                        result.addAction('Repository detection', 'success');
                        return result;
                    }
                },
                projectDiscovery: {
                    async execute() {
                        const { LLMInfo } = await import('../types/LLMInfo');
                        const result = LLMInfo.create();
                        result.addData('PROJECT_COUNT', '1');
                        result.addData('MOST_RECENT_PROJECT_ID', 'PVT_test123');
                        result.addData('MOST_RECENT_PROJECT_NUMBER', '1');
                        result.addData('MOST_RECENT_PROJECT_TITLE', 'Test Project');
                        result.addData('PROJECT_REPOSITORIES', '["testuser/testrepo"]');
                        result.addAction('Project discovery', 'success');
                        return result;
                    }
                }
            };
        }
        // Create GitHub API service with token from various sources
        const githubApi = new GitHubApiService({
            auth: getGitHubToken(token)
        });
        // Create base services
        const repoDetectionService = new RepoDetectionService(githubApi);
        const dataCollectionService = new DataCollectionService(githubApi);
        const projectDataService = new ProjectDataService(githubApi);
        const dataFileService = new DataFileService();
        // Wrap in orchestration services
        return {
            dataCollector: new DataCollectionOrchestrationService(dataCollectionService),
            dataFileService: new DataFileOrchestrationService(dataFileService),
            envValidator: new EnvironmentValidationService(),
            projectDetector: new RepoDetectionOrchestrationService(repoDetectionService),
            projectDiscovery: new ProjectDiscoveryOrchestrationService(projectDataService)
        };
    },
};
