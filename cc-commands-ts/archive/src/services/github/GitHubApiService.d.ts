import { IComment, ICommit, IGitHubApiService, IGitHubProject, IIssue, IRepository } from '../../interfaces';
import { GitHubRepositoryResponse } from '../../types/GitHubTypes';
/**
 * Implementation of GitHub API service using Octokit
 */
export declare class GitHubApiService implements IGitHubApiService {
    private octokit;
    constructor(options?: {
        auth?: string;
    });
    getAuthenticatedUser(): Promise<null | string>;
    getProject(org: string, projectNumber: number): Promise<IGitHubProject>;
    getProjectRepositories(org: string, projectNumber: number): Promise<IRepository[]>;
    /**
     * Get repository information
     */
    getRepository(owner: string, name: string): Promise<GitHubRepositoryResponse>;
    getRepositoryComments(owner: string, repo: string, since: Date): Promise<IComment[]>;
    getRepositoryCommits(owner: string, repo: string, since: Date): Promise<ICommit[]>;
    getRepositoryIssues(owner: string, repo: string, since: Date): Promise<IIssue[]>;
    isAuthenticated(): Promise<boolean>;
    listOrganizationProjects(org: string): Promise<IGitHubProject[]>;
}
