/**
 * @file Core JSON result type system with recursive structure support
 * 
 * Defines the fundamental types for the JSON result file system, including:
 * - Recursive JSON value types
 * - Data provenance namespace structure (raw vs calculated)
 * - Complete result file structure with metadata
 * - Optimal GitHub result structure for efficient jq querying
 * 
 * These types enforce clear separation between raw API data and calculated values,
 * ensuring LLMs can easily distinguish data sources during analysis.
 */

// Scalar leaf values in JSON
export type JsonScalar = boolean | null | number | string | undefined

// Recursive JSON structure - can contain scalars, arrays, or objects
export type JsonValue = 
  | JsonObject
  | JsonScalar
  | JsonValue[]
  | readonly JsonValue[]

// Object with string keys to any JsonValue
export interface JsonObject {
  readonly [key: string]: JsonValue
}

// Enforced namespace structure for data provenance
export interface DataNamespaceStructure extends JsonObject {
  readonly calculated: {
    readonly [calculationType: string]: JsonObject  // 'time_calculations', 'mathematical_ratios', etc.
  }
  readonly raw: {
    readonly [dataSource: string]: JsonObject  // 'github_api', 'git_remote', 'filesystem'
  }
}

// Complete result file structure
export interface ResultJsonStructure extends JsonObject {
  readonly calculated: JsonObject
  readonly metadata: {
    readonly arguments: string
    readonly command: string
    readonly execution_time_ms: number
    readonly generated_at: string
  }
  readonly raw: JsonObject
  readonly [additionalKeys: string]: JsonValue  // Allow 'repositories', etc.
}

// GitHub API response types for complete raw data preservation
export interface GitHubRepositoryApiResponse extends JsonObject {
  readonly allow_auto_merge: boolean
  readonly allow_merge_commit: boolean
  readonly allow_rebase_merge: boolean
  readonly allow_squash_merge: boolean
  readonly allow_update_branch: boolean
  readonly archive_url: string
  readonly archived: boolean
  readonly assignees_url: string
  readonly blobs_url: string
  readonly branches_url: string
  readonly clone_url: string
  readonly collaborators_url: string
  readonly comments_url: string
  readonly commits_url: string
  readonly compare_url: string
  readonly contents_url: string
  readonly contributors_url: string
  readonly created_at: string
  readonly default_branch: string
  readonly delete_branch_on_merge: boolean
  readonly deployments_url: string
  readonly description: null | string
  readonly disabled: boolean
  readonly downloads_url: string
  readonly events_url: string
  readonly fork: boolean
  readonly forks_count: number
  readonly forks_url: string
  readonly full_name: string
  readonly git_commits_url: string
  readonly git_refs_url: string
  readonly git_tags_url: string
  readonly git_url: string
  readonly has_discussions: boolean
  readonly has_downloads: boolean
  readonly has_issues: boolean
  readonly has_pages: boolean
  readonly has_projects: boolean
  readonly has_wiki: boolean
  readonly homepage: null | string
  readonly hooks_url: string
  readonly html_url: string
  readonly id: number
  readonly is_template: boolean
  readonly issue_comment_url: string
  readonly issue_events_url: string
  readonly issues_url: string
  readonly keys_url: string
  readonly labels_url: string
  readonly language: null | string
  readonly languages_url: string
  readonly license: null | {
    readonly key: string
    readonly name: string
    readonly node_id: string
    readonly spdx_id: string
    readonly url: null | string
  }
  readonly merge_commit_message: string
  readonly merge_commit_title: string
  readonly merges_url: string
  readonly milestones_url: string
  readonly mirror_url: null | string
  readonly name: string
  readonly network_count: number
  readonly node_id: string
  readonly notifications_url: string
  readonly open_issues_count: number
  readonly owner: {
    readonly id: number
    readonly login: string
    readonly node_id: string
    readonly type: string
  }
  readonly permissions?: {
    readonly admin: boolean
    readonly maintain: boolean
    readonly pull: boolean
    readonly push: boolean
    readonly triage: boolean
  }
  readonly private: boolean
  readonly pulls_url: string
  readonly pushed_at: null | string
  // Ensure this type can be extended for complete API responses
  readonly [key: string]: JsonValue
  readonly releases_url: string
  readonly size: number
  readonly squash_merge_commit_message: string
  readonly squash_merge_commit_title: string
  readonly ssh_url: string
  readonly stargazers_count: number
  readonly stargazers_url: string
  readonly statuses_url: string
  readonly subscribers_count: number
  readonly subscribers_url: string
  readonly subscription_url: string
  readonly svn_url: string
  readonly tags_url: string
  readonly teams_url: string
  readonly temp_clone_token: null | string
  readonly template_repository: JsonObject | null
  readonly topics: readonly string[]
  readonly trees_url: string
  readonly updated_at: string
  readonly url: string
  readonly use_squash_pr_title_as_default: boolean
  readonly visibility: string
  readonly watchers_count: number
}

export interface GitHubIssueApiResponse extends JsonObject {
  readonly active_lock_reason: null | string
  readonly assignee: JsonObject | null
  readonly assignees: readonly JsonObject[]
  readonly body: null | string
  readonly body_html: null | string
  readonly body_text: null | string
  readonly closed_at: null | string
  readonly closed_by: JsonObject | null
  readonly comments: number
  readonly comments_url: string
  readonly created_at: string
  readonly draft: boolean
  readonly events_url: string
  readonly html_url: string
  readonly id: number
  readonly labels: readonly {
    readonly color: string
    readonly default: boolean
    readonly description: null | string
    readonly id: number
    readonly name: string
    readonly node_id: string
    readonly url: string
  }[]
  readonly labels_url: string
  readonly locked: boolean
  readonly milestone: JsonObject | null
  readonly node_id: string
  readonly number: number
  readonly pull_request?: {
    readonly diff_url: string
    readonly html_url: string
    readonly merged_at: null | string
    readonly patch_url: string
    readonly url: string
  }
  readonly [key: string]: JsonValue
  readonly repository_name?: string // Added for flat array structure
  readonly repository_url: string
  readonly state: string
  readonly state_reason: null | string
  readonly timeline_url: string
  readonly title: string
  readonly updated_at: string
  readonly url: string
  readonly user: {
    readonly avatar_url: string
    readonly events_url: string
    readonly followers_url: string
    readonly following_url: string
    readonly gists_url: string
    readonly gravatar_id: null | string
    readonly html_url: string
    readonly id: number
    readonly login: string
    readonly node_id: string
    readonly organizations_url: string
    readonly received_events_url: string
    readonly repos_url: string
    readonly site_admin: boolean
    readonly starred_url: string
    readonly subscriptions_url: string
    readonly type: string
    readonly url: string
  }
}

export interface GitHubPullRequestApiResponse extends JsonObject {
  readonly _links: {
    readonly comments: { readonly href: string }
    readonly commits: { readonly href: string }
    readonly html: { readonly href: string }
    readonly issue: { readonly href: string }
    readonly review_comment: { readonly href: string }
    readonly review_comments: { readonly href: string }
    readonly self: { readonly href: string }
    readonly statuses: { readonly href: string }
  }
  readonly active_lock_reason: null | string
  readonly additions: number
  readonly assignee: JsonObject | null
  readonly assignees: readonly JsonObject[]
  readonly author_association: string
  readonly auto_merge: JsonObject | null
  readonly base: {
    readonly label: string
    readonly ref: string
    readonly repo: JsonObject
    readonly sha: string
    readonly user: JsonObject
  }
  readonly body: null | string
  readonly changed_files: number
  readonly closed_at: null | string
  readonly comments: number
  readonly comments_url: string
  readonly commits: number
  readonly commits_url: string
  readonly created_at: string
  readonly deletions: number
  readonly diff_url: string
  readonly draft: boolean
  readonly head: {
    readonly label: string
    readonly ref: string
    readonly repo: JsonObject | null
    readonly sha: string
    readonly user: JsonObject
  }
  readonly html_url: string
  readonly id: number
  readonly issue_url: string
  readonly labels: readonly JsonObject[]
  readonly locked: boolean
  readonly maintainer_can_modify: boolean
  readonly merge_commit_sha: null | string
  readonly mergeable: boolean | null
  readonly mergeable_state: string
  readonly merged: boolean
  readonly merged_at: null | string
  readonly merged_by: JsonObject | null
  readonly milestone: JsonObject | null
  readonly node_id: string
  readonly number: number
  readonly patch_url: string
  readonly [key: string]: JsonValue
  readonly rebaseable: boolean | null
  readonly repository_name?: string // Added for flat array structure
  readonly requested_reviewers: readonly JsonObject[]
  readonly requested_teams: readonly JsonObject[]
  readonly review_comment_url: string
  readonly review_comments: number
  readonly review_comments_url: string
  readonly state: string
  readonly statuses_url: string
  readonly title: string
  readonly updated_at: string
  readonly url: string
  readonly user: JsonObject
}

export interface GitHubCommitApiResponse extends JsonObject {
  readonly author: JsonObject | null
  readonly comments_url: string
  readonly commit: {
    readonly author: null | {
      readonly date: string
      readonly email: string
      readonly name: string
    }
    readonly comment_count: number
    readonly committer: null | {
      readonly date: string
      readonly email: string
      readonly name: string
    }
    readonly message: string
    readonly tree: {
      readonly sha: string
      readonly url: string
    }
    readonly url: string
    readonly verification: {
      readonly payload: null | string
      readonly reason: string
      readonly signature: null | string
      readonly verified: boolean
    }
  }
  readonly committer: JsonObject | null
  readonly files?: readonly JsonObject[]
  readonly html_url: string
  readonly node_id: string
  readonly parents: readonly {
    readonly html_url: string
    readonly sha: string
    readonly url: string
  }[]
  readonly [key: string]: JsonValue
  readonly repository_name?: string // Added for flat array structure
  readonly sha: string
  readonly stats?: {
    readonly additions: number
    readonly deletions: number
    readonly total: number
  }
  readonly url: string
}

export interface GitHubCommentApiResponse extends JsonObject {
  readonly author_association: string
  readonly body: string
  readonly body_html: null | string
  readonly body_text: null | string
  readonly created_at: string
  readonly html_url: string
  readonly id: number
  readonly issue_id?: number // Added for relationship mapping
  readonly issue_url: string
  readonly node_id: string
  readonly performed_via_github_app: JsonObject | null
  readonly reactions: {
    readonly '-1': number
    readonly '+1': number
    readonly confused: number
    readonly eyes: number
    readonly heart: number
    readonly hooray: number
    readonly laugh: number
    readonly rocket: number
    readonly total_count: number
    readonly url: string
  }
  readonly [key: string]: JsonValue
  readonly repository_name?: string // Added for flat array structure
  readonly updated_at: string
  readonly url: string
  readonly user: JsonObject
}

export interface GitHubReviewApiResponse extends JsonObject {
  readonly _links: {
    readonly html: { readonly href: string }
    readonly pull_request: { readonly href: string }
  }
  readonly author_association: string
  readonly body: null | string
  readonly commit_id: string
  readonly html_url: string
  readonly id: number
  readonly node_id: string
  readonly pull_request_id?: number // Added for relationship mapping
  readonly pull_request_url: string
  readonly [key: string]: JsonValue
  readonly repository_name?: string // Added for flat array structure
  readonly state: string
  readonly submitted_at: null | string
  readonly user: JsonObject | null
}

export interface GitHubReviewCommentApiResponse extends JsonObject {
  readonly _links: {
    readonly html: { readonly href: string }
    readonly pull_request: { readonly href: string }
    readonly self: { readonly href: string }
  }
  readonly author_association: string
  readonly body: string
  readonly commit_id: string
  readonly created_at: string
  readonly diff_hunk: string
  readonly html_url: string
  readonly id: number
  readonly in_reply_to_id: null | number
  readonly line: null | number
  readonly node_id: string
  readonly original_commit_id: string
  readonly original_line: null | number
  readonly original_position: null | number
  readonly original_start_line: null | number
  readonly path: string
  readonly position: null | number
  readonly pull_request_id?: number // Added for relationship mapping
  readonly pull_request_review_id: null | number
  readonly pull_request_url: string
  readonly reactions: JsonObject
  readonly [key: string]: JsonValue
  readonly repository_name?: string // Added for flat array structure
  readonly side: string
  readonly start_line: null | number
  readonly start_side: null | string
  readonly updated_at: string
  readonly url: string
  readonly user: JsonObject
}

// Collection configuration for optimal data gathering
export interface CollectionOptions extends JsonObject {
  readonly includeComments: boolean
  readonly includeCommits: boolean
  readonly includeIssues: boolean
  readonly includePullRequests: boolean
  readonly includeReviews: boolean
  readonly limits: {
    readonly maxCommentsPerIssue: number  // Default: 50
    readonly maxCommitsPerRepo: number    // Default: 1000
    readonly maxIssuesPerRepo: number     // Default: 500
    readonly maxPRsPerRepo: number        // Default: 200
    readonly maxReviewsPerPR: number      // Default: 20
  }
  readonly timeFilter: {
    readonly since?: string  // ISO date string - only collect items after this date
    readonly until?: string  // ISO date string - only collect items before this date
  }
}

// Rate limit tracking for API usage
export interface RateLimitUsage extends JsonObject {
  readonly github_graphql_api: {
    readonly limit: number
    readonly points_used: number
    readonly remaining: number
    readonly reset_time: string
  }
  readonly github_rest_api: {
    readonly calls_made: number
    readonly limit: number
    readonly remaining: number
    readonly reset_time: string
  }
}

// Data collection summary for metadata
export interface DataCollectionSummary extends JsonObject {
  readonly collection_completed_at: string
  readonly collection_options: CollectionOptions
  readonly collection_started_at: string
  readonly errors_encountered: number
  readonly items_collected: {
    readonly commits: number
    readonly issue_comments: number
    readonly issues: number
    readonly pr_review_comments: number
    readonly pr_reviews: number
    readonly pull_requests: number
  }
  readonly repositories_processed: number
}

// Execution metadata
export interface ExecutionMetadata extends JsonObject {
  readonly arguments: string
  readonly command: string
  readonly execution_time_ms: number
  readonly generated_at: string
  readonly version: string
}

// Pre-computed indexes for efficient querying
export interface OptimalIndexes extends JsonObject {
  readonly comments_by_issue: Record<string, readonly number[]>    // issue_id -> comment indices
  readonly commits_by_repo: Record<string, readonly number[]>     // repo -> commit indices
  readonly issues_by_repo: Record<string, readonly number[]>      // repo -> issue indices
  readonly items_by_author: Record<string, readonly ItemReference[]> // author -> all their items
  readonly items_by_label: Record<string, readonly ItemReference[]>  // label -> all labeled items
  readonly prs_by_repo: Record<string, readonly number[]>         // repo -> PR indices
  readonly reviews_by_pr: Record<string, readonly number[]>       // pr_id -> review indices
}

// Reference to items in flat arrays
export interface ItemReference extends JsonObject {
  readonly index: number
  readonly repository_name: string
  readonly type: 'comment' | 'commit' | 'issue' | 'pull_request' | 'review'
}

// Project-level summary metrics for quick access
export interface ProjectSummaryMetrics extends JsonObject {
  readonly activity_summary: {
    readonly active_contributors_last_30_days: number
    readonly commits_last_30_days: number
    readonly issues_opened_last_30_days: number
    readonly prs_opened_last_30_days: number
  }
  readonly health_metrics: {
    readonly avg_issue_resolution_days: null | number
    readonly avg_pr_merge_days: null | number
    readonly issue_response_rate: number
    readonly pr_review_coverage: number
  }
  readonly languages: readonly string[]
  readonly primary_language: string
  readonly total_commits: number
  readonly total_contributors: number
  readonly total_forks: number
  readonly total_issues: number
  readonly total_pull_requests: number
  readonly total_repositories: number
  readonly total_stars: number
}

// Per-repository calculated metrics
export interface RepositoryMetrics {
  readonly activity_score: number
  readonly contributor_count: number
  readonly forks: number
  readonly full_name: string
  readonly health_score: number
  readonly language: null | string
  readonly last_push: null | string
  readonly name: string
  readonly open_issues: number
  readonly [key: string]: JsonValue
  readonly stars: number
}

// Contributor analysis metrics
export interface ContributorMetrics {
  readonly activity_timeline: Record<string, number> // month -> activity count
  readonly contributions: {
    readonly comments_posted: number
    readonly commits_authored: number
    readonly issues_created: number
    readonly prs_created: number
    readonly reviews_submitted: number
  }
  readonly first_contribution: string
  readonly last_contribution: string
  readonly login: string
  readonly [key: string]: JsonValue
  readonly repositories: readonly string[]
}

// Timeline-based metrics for trend analysis
export interface TimelineMetrics extends JsonObject {
  readonly activity_trends: {
    readonly commits_trend: 'decreasing' | 'increasing' | 'stable'
    readonly issues_trend: 'decreasing' | 'increasing' | 'stable'
    readonly prs_trend: 'decreasing' | 'increasing' | 'stable'
  }
  readonly monthly_activity: Record<string, {
    readonly commits: number
    readonly contributors: number
    readonly issues: number
    readonly pull_requests: number
  }>
  readonly weekly_activity: Record<string, {
    readonly commits: number
    readonly issues: number
    readonly pull_requests: number
  }>
}

// Optimal GitHub Result structure designed for efficient jq querying
export interface OptimalGitHubResult extends JsonObject {
  // Optimized indexes for common queries
  readonly indexes: OptimalIndexes
  
  readonly metadata: {
    readonly api_usage: RateLimitUsage
    readonly collection: DataCollectionSummary
    readonly execution: ExecutionMetadata
  }
  
  // Calculated metrics for quick access
  readonly metrics: {
    readonly contributor_metrics: readonly ContributorMetrics[]
    readonly project_summary: ProjectSummaryMetrics
    readonly repository_metrics: readonly RepositoryMetrics[]
    readonly timeline_metrics: TimelineMetrics
  }
  
  // Raw API data organized for efficient jq access
  readonly raw: {
    readonly commits: readonly GitHubCommitApiResponse[]
    
    // Comments structured for relationship queries
    readonly issue_comments: readonly GitHubCommentApiResponse[]
    readonly issues: readonly GitHubIssueApiResponse[]
    readonly pr_review_comments: readonly GitHubReviewCommentApiResponse[]
    readonly pr_reviews: readonly GitHubReviewApiResponse[]
    
    readonly project: JsonObject
    readonly pull_requests: readonly GitHubPullRequestApiResponse[]
    // Flat structure for easy filtering and grouping
    readonly repositories: readonly GitHubRepositoryApiResponse[]
  }
}