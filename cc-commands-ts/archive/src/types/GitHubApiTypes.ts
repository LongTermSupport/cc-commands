/**
 * @file Type definitions for GitHub API responses
 * 
 * These types represent the structure of responses from GitHub's REST API.
 * They are used to provide type safety when working with API responses.
 */

/**
 * GitHub user information in API responses
 */
export interface GitHubUser {
  avatar_url: string
  events_url: string
  followers_url: string
  following_url: string
  gists_url: string
  gravatar_id: string
  html_url: string
  id: number
  login: string
  node_id: string
  organizations_url: string
  received_events_url: string
  repos_url: string
  site_admin: boolean
  starred_url: string
  subscriptions_url: string
  type: string
  url: string
}

/**
 * GitHub label information
 */
export interface GitHubLabel {
  color: string
  default: boolean
  description: null | string
  id: number
  name: string
  node_id: string
  url: string
}

/**
 * GitHub issue response
 */
export interface GitHubIssue {
  active_lock_reason?: null | string
  assignee?: GitHubUser | null
  assignees?: GitHubUser[]
  author_association: string
  body?: null | string
  closed_at: null | string
  comments: number
  comments_url: string
  created_at: string
  events_url: string
  html_url: string
  id: number
  labels: GitHubLabel[]
  labels_url: string
  locked: boolean
  milestone?: null | unknown
  node_id: string
  number: number
  performed_via_github_app?: null | unknown
  pull_request?: {
    diff_url: string
    html_url: string
    patch_url: string
    url: string
  }
  reactions?: {
    '-1': number
    '+1': number
    confused: number
    eyes: number
    heart: number
    hooray: number
    laugh: number
    rocket: number
    total_count: number
    url: string
  }
  repository_url: string
  state: 'closed' | 'open'
  state_reason?: null | string
  timeline_url: string
  title: string
  updated_at: string
  url: string
  user: GitHubUser | null
}

/**
 * GitHub pull request response
 */
export interface GitHubPullRequest {
  _links: {
    comments: { href: string }
    commits: { href: string }
    html: { href: string }
    issue: { href: string }
    review_comment: { href: string }
    review_comments: { href: string }
    self: { href: string }
    statuses: { href: string }
  }
  active_lock_reason?: null | string
  additions?: number
  assignee?: GitHubUser | null
  assignees?: GitHubUser[]
  author_association: string
  auto_merge?: null | unknown
  base: {
    label: string
    ref: string
    repo: unknown
    sha: string
    user: GitHubUser
  }
  body?: null | string
  changed_files?: number
  closed_at: null | string
  comments: number
  comments_url: string
  commits?: number
  commits_url: string
  created_at: string
  deletions?: number
  diff_url: string
  draft: boolean
  head: {
    label: string
    ref: string
    repo: unknown
    sha: string
    user: GitHubUser
  }
  html_url: string
  id: number
  issue_url: string
  labels: GitHubLabel[]
  locked: boolean
  maintainer_can_modify?: boolean
  merge_commit_sha?: null | string
  mergeable?: boolean | null
  mergeable_state?: string
  merged?: boolean
  merged_at: null | string
  merged_by?: GitHubUser | null
  milestone?: null | unknown
  node_id: string
  number: number
  patch_url: string
  rebaseable?: boolean | null
  requested_reviewers?: GitHubUser[]
  requested_teams?: unknown[]
  review_comment_url: string
  review_comments?: number
  review_comments_url: string
  state: 'closed' | 'open'
  statuses_url: string
  title: string
  updated_at: string
  url: string
  user: GitHubUser | null
}

/**
 * Parameters for GitHub API list endpoints
 */
export interface GitHubListParams {
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
  since?: string
  sort?: string
  state?: 'all' | 'closed' | 'open'
}

/**
 * Parameters for issue-specific list endpoints
 */
export interface GitHubIssueListParams extends GitHubListParams {
  assignee?: string
  creator?: string
  labels?: string
  mentioned?: string
  milestone?: number | string
}

/**
 * Parameters for pull request list endpoints
 */
export interface GitHubPullRequestListParams extends GitHubListParams {
  base?: string
  draft?: boolean
  head?: string
}

/**
 * GitHub repository info from GraphQL
 */
export interface GitHubGraphQLRepository {
  createdAt: string
  defaultBranchRef?: {
    name: string
  }
  description?: string
  homepageUrl?: string
  isArchived: boolean
  isEmpty: boolean
  isFork: boolean
  isPrivate: boolean
  languages?: {
    edges: Array<{
      node: {
        name: string
      }
      size: number
    }>
  }
  licenseInfo?: {
    name: string
  }
  name: string
  owner: {
    login: string
  }
  primaryLanguage?: {
    name: string
  }
  pushedAt?: string
  repositoryTopics?: {
    edges: Array<{
      node: {
        topic: {
          name: string
        }
      }
    }>
  }
  updatedAt: string
  url: string
}

/**
 * GitHub Project v2 from GraphQL
 */
export interface GitHubGraphQLProject {
  closed: boolean
  closedAt?: string
  createdAt: string
  creator?: {
    login: string
  }
  id: string
  items?: {
    totalCount: number
  }
  number: number
  public: boolean
  readme?: string
  shortDescription?: string
  title: string
  updatedAt: string
  url: string
}

/**
 * GitHub Project v2 item field value
 */
export interface GitHubProjectFieldValue {
  field?: {
    name: string
  }
  name?: string
}

/**
 * GitHub Project v2 item from GraphQL
 */
export interface GitHubProjectItem {
  content?: {
    assignees?: {
      nodes?: Array<{
        login: string
      }>
    }
    number?: number
    repository?: {
      name: string
      owner: {
        login: string
      }
    }
    title?: string
    url?: string
  }
  fieldValues?: {
    nodes?: GitHubProjectFieldValue[]
  }
  id: string
  type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST'
}

/**
 * GraphQL response structure
 */
export interface GitHubGraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    path?: string[]
  }>
}