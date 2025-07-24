/**
 * @file DTO for complete repository data collection
 */
import { ActivityMetricsDTO } from './ActivityMetricsDTO';
import { ReleaseDataDTO } from './ReleaseDataDTO';
import { RepositoryDataDTO } from './RepositoryDataDTO';
/**
 * Data transfer object for complete repository data collection
 *
 * This DTO wraps all the collected data from a GitHub repository
 * and provides methods to convert it to LLMInfo format.
 */
export class RepoDataCollectionDTO {
    repositoryData;
    activityMetrics;
    latestRelease;
    workflowCount;
    activeWorkflowNames;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        ACTIVE_WORKFLOWS: 'ACTIVE_WORKFLOWS',
        HAS_ACTIVITY_DATA: 'HAS_ACTIVITY_DATA',
        HAS_CONTRIBUTOR_DATA: 'HAS_CONTRIBUTOR_DATA',
        HAS_RELEASE_DATA: 'HAS_RELEASE_DATA',
        HAS_WORKFLOW_DATA: 'HAS_WORKFLOW_DATA',
        WORKFLOW_COUNT: 'WORKFLOW_COUNT',
    };
    /**
     * Create a new repository data collection
     */
    constructor(repositoryData, activityMetrics, latestRelease, workflowCount, activeWorkflowNames) {
        this.repositoryData = repositoryData;
        this.activityMetrics = activityMetrics;
        this.latestRelease = latestRelease;
        this.workflowCount = workflowCount;
        this.activeWorkflowNames = activeWorkflowNames;
    }
    /**
     * Factory method to create from raw project data
     */
    static fromProjectData(projectData) {
        // Create repository data DTO
        let repositoryData;
        if (projectData.project) {
            // Create from project info
            repositoryData = new RepositoryDataDTO(projectData.project.name, projectData.project.owner, projectData.project.description, projectData.project.primaryLanguage === 'Unknown' ? null : projectData.project.primaryLanguage, projectData.project.visibility, projectData.project.defaultBranch, projectData.project.license, new Date(projectData.project.createdAt), new Date(projectData.project.updatedAt), projectData.project.isFork, projectData.project.isArchived, projectData.project.topics);
        }
        else {
            throw new Error('Project info is required in ProjectDataDTO');
        }
        // Create activity metrics DTO
        const contributors = projectData.contributors.map(c => ({
            contributions: c.contributions,
            login: c.login
        }));
        const activityMetrics = new ActivityMetricsDTO(projectData.activity.commitCount, projectData.activity.issueCount, projectData.activity.prCount, projectData.activity.releaseCount, projectData.activity.contributorCount, 7, // Default to 7 days analyzed
        contributors.slice(0, 5) // Top 5 contributors
        );
        // Create latest release DTO if available
        let latestRelease = null;
        if (projectData.releases.length > 0) {
            const release = projectData.releases[0];
            if (release) {
                // Calculate download count (would need asset data for real count)
                latestRelease = new ReleaseDataDTO(release.tagName, new Date(release.publishedAt), release.name, release.isPrerelease, 0 // Download count not available in current DTO
                );
            }
        }
        // Extract workflow information
        const activeWorkflows = projectData.workflows.filter(w => w.state === 'active');
        const workflowNames = activeWorkflows.map(w => w.name);
        return new RepoDataCollectionDTO(repositoryData, activityMetrics, latestRelease, projectData.workflows.length, workflowNames);
    }
    /**
     * Convert to LLMInfo data format
     *
     * This aggregates data from all sub-DTOs
     */
    toLLMData() {
        const data = {
            ...this.repositoryData.toLLMData(),
            ...this.activityMetrics.toLLMData(),
            [RepoDataCollectionDTO.Keys.ACTIVE_WORKFLOWS]: this.activeWorkflowNames.join(', ') || 'None',
            [RepoDataCollectionDTO.Keys.HAS_ACTIVITY_DATA]: 'true',
            [RepoDataCollectionDTO.Keys.HAS_CONTRIBUTOR_DATA]: String(this.activityMetrics.contributorCount > 0),
            [RepoDataCollectionDTO.Keys.HAS_RELEASE_DATA]: String(this.latestRelease !== null),
            [RepoDataCollectionDTO.Keys.HAS_WORKFLOW_DATA]: String(this.workflowCount > 0),
            [RepoDataCollectionDTO.Keys.WORKFLOW_COUNT]: String(this.workflowCount),
        };
        // Add release data if available
        if (this.latestRelease) {
            Object.assign(data, this.latestRelease.toLLMData());
        }
        else {
            Object.assign(data, ReleaseDataDTO.noReleases());
        }
        return data;
    }
}
