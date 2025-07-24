/**
 * Type definitions for GitHub API responses
 */
import { JsonObject } from './DataTypes';
/**
 * GitHub GraphQL project response
 */
export interface GitHubProjectResponse {
    organization: {
        projectV2: {
            closed: boolean;
            createdAt: string;
            field: null | {
                name: string;
            };
            id: string;
            items: {
                nodes: Array<{
                    content?: {
                        repository?: {
                            defaultBranchRef?: {
                                name: string;
                            };
                            isPrivate: boolean;
                            name: string;
                            nameWithOwner: string;
                            updatedAt: string;
                        };
                    };
                }>;
                totalCount: number;
            };
            number: number;
            public: boolean;
            readme: null | string;
            shortDescription: null | string;
            title: string;
            updatedAt: string;
            url: string;
        };
    };
}
/**
 * GitHub GraphQL project list response
 */
export interface GitHubProjectListResponse {
    organization: {
        projectsV2: {
            nodes: Array<{
                closed: boolean;
                createdAt?: string;
                id: string;
                items: {
                    totalCount: number;
                };
                number: number;
                public: boolean;
                shortDescription?: null | string;
                title: string;
                updatedAt: string;
                url: string;
            }>;
            totalCount: number;
        };
    };
}
/**
 * GitHub GraphQL repository response
 */
export interface GitHubRepositoryResponse extends JsonObject {
    archived: boolean;
    created_at: string;
    default_branch: string;
    description: null | string;
    disabled: boolean;
    fork: boolean;
    forks_count: number;
    full_name: string;
    has_downloads: boolean;
    has_pages: boolean;
    has_wiki: boolean;
    homepage: null | string;
    language: null | string;
    name: string;
    open_issues_count: number;
    owner: {
        login: string;
        type: string;
    };
    private: boolean;
    pushed_at: string;
    stargazers_count: number;
    topics: string[];
    updated_at: string;
    visibility: string;
    watchers_count: number;
}
/**
 * GitHub contributor
 */
export interface GitHubContributor {
    avatar_url: string;
    contributions: number;
    html_url: string;
    id: number;
    login: string;
    type: string;
}
/**
 * GitHub release
 */
export interface GitHubRelease {
    created_at: string;
    draft: boolean;
    html_url: string;
    id: number;
    name: null | string;
    prerelease: boolean;
    published_at: null | string;
    tag_name: string;
}
/**
 * GitHub workflow
 */
export interface GitHubWorkflow {
    created_at: string;
    html_url: string;
    id: number;
    name: string;
    path: string;
    state: string;
    updated_at: string;
}
/**
 * GitHub workflows response
 */
export interface GitHubWorkflowsResponse {
    total_count: number;
    workflows: GitHubWorkflow[];
}
/**
 * Simplified project info
 */
export interface ProjectInfo {
    closed: boolean;
    createdAt: string;
    number: number;
    public: boolean;
    shortDescription: null | string;
    title: string;
    updatedAt: string;
}
/**
 * Simplified repository info
 */
export interface RepositoryBasics {
    createdAt: string;
    defaultBranch: string;
    description: null | string;
    forks: number;
    language: null | string;
    name: string;
    stargazers: number;
    topics: string[];
    updatedAt: string;
    visibility: string;
}
