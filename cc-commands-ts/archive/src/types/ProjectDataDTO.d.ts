/**
 * @file Project data transfer objects (DTOs)
 *
 * These are pure data structures with no behavior, used for
 * transferring data between services and orchestrators.
 */
/**
 * Project metadata DTO
 */
export interface ProjectInfoDTO {
    createdAt: string;
    defaultBranch: string;
    description: null | string;
    fullName: string;
    isArchived: boolean;
    isFork: boolean;
    license: null | string;
    name: string;
    owner: string;
    primaryLanguage: string;
    topics: string[];
    updatedAt: string;
    visibility: string;
}
/**
 * Repository activity data transfer object
 */
export interface RepositoryActivityDTO {
    commitCount: number;
    contributorCount: number;
    forks: number;
    issueCount: number;
    lastCommitDate: string;
    lastReleaseDate: null | string;
    openIssues: number;
    prCount: number;
    recentCommits: number;
    recentIssues: number;
    recentPullRequests: number;
    releaseCount: number;
    stars: number;
    watchers: number;
}
/**
 * Contributor data transfer object
 */
export interface ContributorDTO {
    contributions: number;
    login: string;
}
/**
 * Release data transfer object
 */
export interface ReleaseDTO {
    isPrerelease: boolean;
    name: null | string;
    publishedAt: string;
    tagName: string;
}
/**
 * Workflow data transfer object
 */
export interface WorkflowDTO {
    id: number;
    name: string;
    path: string;
    state: string;
}
/**
 * Language statistics DTO
 */
export interface LanguageStatsDTO {
    [language: string]: number;
}
/**
 * Collected project data transfer object
 */
export interface ProjectDataDTO {
    activity: RepositoryActivityDTO;
    contributors: ContributorDTO[];
    languages?: LanguageStatsDTO;
    project?: ProjectInfoDTO;
    releases: ReleaseDTO[];
    workflows: WorkflowDTO[];
}
