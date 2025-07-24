/**
 * @file GitHub API Response Types
 * 
 * TypeScript interfaces for GitHub API responses to eliminate `any` types
 * and provide proper type safety throughout the GitHub domain services.
 */

/**
 * GitHub user or organization owner structure
 */
export interface GitHubOwner {
  avatar_url?: string
  id: number
  login: string
  node_id?: string
  type: 'Organization' | 'User'
  url?: string
}

/**
 * GitHub repository reference in project responses
 */
export interface GitHubProjectRepository {
  full_name?: string
  id?: number
  name?: string
  nameWithOwner?: string
  owner?: GitHubOwner
  url?: string
}

/**
 * GitHub Projects v2 API response structure
 */
export interface GitHubProjectV2Response {
  closed?: boolean
  createdAt: string
  description?: null | string
  id: string
  items?: {
    nodes?: unknown[]
    totalCount: number
  }
  owner: GitHubOwner
  public?: boolean
  readme?: null | string
  repositories?: GitHubProjectRepository[]
  shortDescription?: null | string
  title: string
  updatedAt: string
  url: string
}

/**
 * GitHub CLI project output structure
 */
export interface GitHubCliProjectOutput {
  body?: string
  createdAt?: string
  description?: string
  id?: string
  items?: unknown[]
  name?: string
  number?: number | string
  owner?: GitHubOwner | string
  readme?: string
  repositories?: string[]
  shortDescription?: string
  state?: 'CLOSED' | 'OPEN'
  title?: string
  updatedAt?: string
  url?: string
  visibility?: 'PRIVATE' | 'PUBLIC'
}

/**
 * GitHub repository API response structure
 */
export interface GitHubRepositoryResponse {
  archived: boolean
  clone_url: string
  created_at: string
  default_branch: string
  description?: null | string
  disabled: boolean
  fork: boolean
  forks_count: number
  full_name: string
  html_url: string
  id: number
  language?: null | string
  license?: null | {
    key: string
    name: string
    spdx_id: string
  }
  name: string
  open_issues_count: number
  owner: GitHubOwner
  private: boolean
  pushed_at?: string
  size: number
  ssh_url: string
  stargazers_count: number
  topics?: string[]
  updated_at: string
  url: string
  watchers_count: number
}

/**
 * GitHub issue API response structure
 */
export interface GitHubIssueResponse {
  assignee?: GitHubOwner | null
  assignees?: GitHubOwner[]
  body?: null | string
  closed_at?: null | string
  comments: number
  created_at: string
  html_url: string
  id: number
  labels?: Array<{
    color: string
    description?: null | string
    id: number
    name: string
  }>
  number: number
  repository_url?: string
  state: 'closed' | 'open'
  title: string
  updated_at: string
  url: string
  user: GitHubOwner
}

/**
 * GitHub pull request API response structure
 */
export interface GitHubPullRequestResponse {
  additions?: number
  assignee?: GitHubOwner | null
  assignees?: GitHubOwner[]
  base: {
    ref: string
    repo: GitHubRepositoryResponse
    sha: string
  }
  body?: null | string
  changed_files?: number
  closed_at?: null | string
  comments: number
  commits?: number
  created_at: string
  deletions?: number
  diff_url: string
  head: {
    ref: string
    repo?: GitHubRepositoryResponse | null
    sha: string
  }
  html_url: string
  id: number
  labels?: Array<{
    color: string
    description?: null | string
    id: number
    name: string
  }>
  mergeable?: boolean | null
  merged: boolean
  merged_at?: null | string
  number: number
  patch_url: string
  requested_reviewers?: GitHubOwner[]
  review_comments: number
  state: 'closed' | 'open'
  title: string
  updated_at: string
  url: string
  user: GitHubOwner
}

/**
 * GitHub commit API response structure
 */
export interface GitHubCommitResponse {
  author?: GitHubOwner | null
  commit: {
    author?: {
      date?: string
      email?: string
      name?: string
    }
    committer?: {
      date?: string
      email?: string
      name?: string
    }
    message: string
    tree: {
      sha: string
      url: string
    }
    verification?: {
      payload?: null | string
      reason: string
      signature?: null | string
      verified: boolean
    }
  }
  committer?: GitHubOwner | null
  files?: Array<{
    additions: number
    blob_url?: string
    changes: number
    contents_url?: string
    deletions: number
    filename: string
    patch?: string
    raw_url?: string
    status: 'added' | 'modified' | 'removed' | 'renamed'
  }>
  html_url: string
  parents: Array<{
    html_url: string
    sha: string
    url: string
  }>
  sha: string
  stats?: {
    additions: number
    deletions: number
    total: number
  }
  url: string
}