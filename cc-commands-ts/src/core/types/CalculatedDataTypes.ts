/**
 * @file Calculated data type definitions
 * 
 * Defines structures for TypeScript mathematical computations in the 'calculated' namespace.
 * These types represent data that has been computed, transformed, or analyzed by TypeScript code.
 * 
 * CRITICAL: This data never comes directly from APIs - it's always computed by TypeScript.
 * All calculations use deterministic mathematical functions and helper utilities.
 */

import { JsonObject } from './JsonResultTypes.js'

// TypeScript calculation results (never from API)
export interface TimeCalculations extends JsonObject {
  readonly age_days: number
  readonly business_days_since_activity: number
  readonly days_since_created: number
  readonly days_since_last_commit: number
  readonly days_since_pushed: number
  readonly days_since_updated: number
}

export interface ActivityMetrics extends JsonObject {
  readonly commits_7d: number
  readonly commits_30d: number
  readonly commits_90d: number
  readonly commits_per_day_7d: number
  readonly commits_per_day_30d: number
  readonly issues_closed_30d: number
  readonly issues_opened_30d: number
  readonly prs_closed_30d: number
  readonly prs_merged_30d: number
}

export interface MathematicalRatios extends JsonObject {
  readonly commits_to_issues_ratio: number
  readonly commits_to_prs_ratio: number
  readonly forks_to_stars_ratio: number
  readonly issue_open_close_ratio: number
  readonly pr_merge_success_rate: number
  readonly watchers_to_stars_ratio: number
}

export interface StatisticalMeasures extends JsonObject {
  readonly average_issue_resolution_days: number
  readonly average_pr_merge_time_hours: number
  readonly commit_size_average_lines: number
  readonly median_issue_resolution_days: number
  readonly median_pr_merge_time_hours: number
  readonly pr_size_average_lines: number
}

export interface DistributionAnalysis extends JsonObject {
  readonly commit_timing_most_active_hour: number
  readonly commit_timing_weekend_percentage: number
  readonly contributor_count_30d: number
  readonly contributor_gini_coefficient: number
  readonly top_contributor_commit_percentage: number
}