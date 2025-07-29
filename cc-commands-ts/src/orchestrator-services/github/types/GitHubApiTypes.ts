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
  has_issues: boolean
  has_pages?: boolean
  has_projects: boolean
  has_wiki: boolean
  homepage?: null | string
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
  visibility?: string
  watchers_count: number
}

/**
 * GitHub CLI repository output structure
 */
export interface GitHubCliRepositoryOutput {
  createdAt?: string
  defaultBranch?: string
  description?: string
  forksCount?: number
  hasIssues?: boolean
  hasProjects?: boolean
  hasWiki?: boolean
  homepage?: string
  id?: number
  isArchived?: boolean
  isFork?: boolean
  isPrivate?: boolean
  languages?: string[]
  license?: string
  name: string
  nameWithOwner?: string
  openIssuesCount?: number
  owner?: string
  ownerType?: 'Organization' | 'User'
  primaryLanguage?: string
  pushedAt?: string
  size?: number
  stargazersCount?: number
  topics?: string[]
  updatedAt?: string
  url?: string
  visibility?: 'PRIVATE' | 'PUBLIC'
  watchersCount?: number
}

/**
 * GitHub issue API response structure
 */
export interface GitHubIssueResponse {
  assignee?: GitHubOwner | null
  assignees?: GitHubOwner[]
  author_association?: string
  body?: null | string
  closed_at?: null | string
  comments: number
  created_at: string
  draft?: boolean
  html_url: string
  id: number
  labels?: Array<{
    color: string
    description?: null | string
    id: number
    name: string
  }>
  locked?: boolean
  milestone?: null | { 
    id: number
    state: 'closed' | 'open'
    title: string
  }
  node_id?: string
  number: number
  pull_request?: null | {
    diff_url?: null | string
    html_url: null | string
    merged_at?: null | string
    number?: number
    patch_url?: null | string
    url?: null | string
  }
  repository_url?: string
  state: 'closed' | 'open'
  state_reason?: null | string
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
  author_association?: string
  base: {
    ref: string
    repo?: GitHubRepositoryResponse | null
    sha: string
  }
  body?: null | string
  changed_files?: number
  closed_at?: null | string
  comments?: number
  commits?: number
  created_at: string
  deletions?: number
  diff_url: string
  draft?: boolean
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
  locked?: boolean
  merge_commit_sha?: null | string
  mergeable?: boolean | null
  mergeable_state?: string
  merged?: boolean
  merged_at?: null | string
  merged_by?: GitHubOwner | null
  milestone?: null | { 
    id: number
    state: 'closed' | 'open'
    title: string
  }
  node_id?: string
  number: number
  patch_url: string
  pull_request?: null | {
    diff_url?: null | string
    html_url: null | string
    merged_at?: null | string
    number?: number
    patch_url?: null | string
    url?: null | string
  }
  requested_reviewers?: GitHubOwner[]
  requested_teams?: {
    id: number
    name: string
    slug: string
  }[]
  review_comments?: number
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