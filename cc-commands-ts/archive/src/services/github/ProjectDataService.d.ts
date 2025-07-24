/**
 * @file Service for fetching GitHub Project (kanban board) data
 *
 * This service works with GitHub Projects v2, which are the kanban board
 * project management features, NOT repositories.
 */
import type { IGitHubApiService } from '../../interfaces/IGitHubApiService';
/**
 * GitHub Project data
 */
export interface GitHubProjectData {
    closed: boolean;
    createdAt: Date;
    description?: string;
    id: string;
    itemCount: number;
    number: number;
    public: boolean;
    title: string;
    updatedAt: Date;
    url: string;
}
/**
 * Project item data
 */
export interface ProjectItemData {
    assignees: string[];
    id: string;
    repository?: {
        name: string;
        owner: string;
    };
    status?: string;
    title: string;
    type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST';
    url?: string;
}
/**
 * Service for fetching GitHub Project data
 */
export declare class ProjectDataService {
    private githubApi;
    constructor(githubApi: IGitHubApiService);
    /**
     * Extract unique repositories from project items
     *
     * @param items - Array of project items
     * @returns Array of unique repository references
     */
    extractRepositories(items: ProjectItemData[]): Array<{
        name: string;
        owner: string;
    }>;
    /**
     * Fetch items from a GitHub Project
     *
     * @param projectId - Project node ID
     * @param options - Query options
     * @param options.limit - Maximum number of items to fetch
     * @returns Array of project items
     */
    fetchProjectItems(projectId: string, options?: {
        limit?: number;
    }): Promise<ProjectItemData[]>;
    /**
     * Find GitHub Projects for an organization
     *
     * @param org - Organization name
     * @param options - Query options
     * @param options.includeArchived - Whether to include archived projects
     * @param options.limit - Maximum number of projects to fetch
     * @returns Array of project data
     */
    findOrganizationProjects(org: string, options?: {
        includeArchived?: boolean;
        limit?: number;
    }): Promise<GitHubProjectData[]>;
    /**
     * Get the most recently updated project for an organization
     *
     * @param org - Organization name
     * @returns Most recent project or null
     */
    getMostRecentProject(org: string): Promise<GitHubProjectData | null>;
}
