/**
 * @file GitHub API response type definitions
 * 
 * Defines raw GitHub API response structures exactly as received from the API.
 * These types represent unmodified data in the 'raw.github_api' namespace.
 * 
 * CRITICAL: These types must match actual GitHub API responses exactly.
 * No calculations or transformations should be applied to this data.
 */

import { JsonObject } from './JsonResultTypes.js'

// Raw GitHub API response structures (unmodified)
export interface GitHubApiRawData extends JsonObject {
  readonly commits: readonly GitHubCommitData[]
  readonly created_at: string
  readonly forks_count: number
  readonly issues: readonly GitHubIssueData[]
  readonly language: null | string
  readonly name: string
  readonly open_issues_count: number
  readonly owner: string
  readonly pull_requests: readonly GitHubPullRequestData[]
  readonly pushed_at: string
  readonly size_kb: number
  readonly stars_count: number
  readonly updated_at: string
  readonly watchers_count: number
}

export interface GitHubCommitData extends JsonObject {
  readonly additions?: null | number
  readonly author: string
  readonly date: string
  readonly deletions?: null | number
  readonly message: string
  readonly sha: string
}

export interface GitHubIssueData extends JsonObject {
  readonly closed_at: null | string
  readonly created_at: string
  readonly labels: readonly string[]
  readonly number: number
  readonly state: 'closed' | 'open'
  readonly title: string
}

export interface GitHubPullRequestData extends JsonObject {
  readonly additions?: null | number
  readonly closed_at: null | string
  readonly created_at: string
  readonly deletions?: null | number
  readonly merged_at: null | string
  readonly number: number
  readonly state: 'closed' | 'merged' | 'open'
  readonly title: string
}