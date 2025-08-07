/**
 * @file Rate Limit Service Implementation
 * 
 * Handles GitHub API rate limit monitoring, estimation, and intelligent backoff strategies.
 * Essential for comprehensive data collection operations that make many API calls.
 */

/* eslint-disable camelcase */
/* eslint-disable no-warning-comments */
/* eslint-disable no-promise-executor-return */

import { CollectionOptions, RateLimitUsage } from '../../../core/types/JsonResultTypes.js'
import { GitHubApiError } from '../errors/GitHubApiError.js'
import { CallEstimate, IRateLimitService } from '../interfaces/IComprehensiveDataCollectionService.js'
import { IGitHubRestApiService } from '../interfaces/IGitHubRestApiService.js'

/**
 * Rate limit service implementation
 * 
 * Provides intelligent rate limit management for comprehensive data collection operations.
 * Monitors both REST API and GraphQL API limits and provides backoff strategies.
 */
export class RateLimitService implements IRateLimitService {
  constructor(
    private readonly githubRestApi: IGitHubRestApiService
  ) {}

  /**
   * Check current rate limit status for both REST and GraphQL APIs
   */
  async checkCurrentLimits(): Promise<RateLimitUsage> {
    try {
      // Get REST API rate limit info
      const restLimits = await this.githubRestApi.getRateLimit()
      
      // TODO: Get GraphQL API rate limit info when GraphQL service supports it
      // For now, provide default GraphQL limits
      const graphqlLimits = {
        limit: 5000,
        points_used: 0,
        remaining: 5000,
        reset_time: new Date(Date.now() + 3_600_000).toISOString() // 1 hour from now
      }
      
      return {
        github_graphql_api: graphqlLimits,
        github_rest_api: {
          calls_made: restLimits.limit - restLimits.remaining,
          limit: restLimits.limit,
          remaining: restLimits.remaining,
          reset_time: new Date(restLimits.reset * 1000).toISOString()
        }
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        'check GitHub API rate limits',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Estimate API calls required for a collection operation
   */
  async estimateRequiredCalls(
    repos: readonly string[],
    options: CollectionOptions
  ): Promise<CallEstimate> {
    try {
      let estimatedCalls = 0
      
      // Base calls per repository
      estimatedCalls += repos.length // Repository metadata
      
      if (options.includeIssues) {
        // Estimate issues pagination (assuming average of 3 pages per repo)
        estimatedCalls += repos.length * 3
        
        if (options.includeComments) {
          // Estimate comment calls (1 call per 30 comments, average 50 comments per repo)
          estimatedCalls += repos.length * 2
        }
      }
      
      if (options.includePullRequests) {
        // Estimate PR pagination (assuming average of 2 pages per repo)
        estimatedCalls += repos.length * 2
        
        if (options.includeReviews) {
          // Estimate review calls (1 call per PR, assuming average 10 PRs per repo)
          estimatedCalls += repos.length * 10
          // Review comments (1 call per PR)
          estimatedCalls += repos.length * 10
        }
      }
      
      if (options.includeCommits) {
        // Estimate commit pagination (assuming average of 5 pages per repo)
        estimatedCalls += repos.length * 5
      }
      
      // Add 20% buffer for API overhead and retries
      estimatedCalls = Math.ceil(estimatedCalls * 1.2)
      
      // Get current rate limits to determine feasibility
      const currentLimits = await this.checkCurrentLimits()
      const feasible = estimatedCalls <= currentLimits.github_rest_api.remaining
      
      // Estimate duration (assuming 1 second per API call on average)
      const estimatedDurationMinutes = Math.ceil(estimatedCalls / 60)
      
      // Recommend batch size based on available rate limit
      const recommendedBatchSize = Math.max(1, Math.floor(repos.length / 4))
      
      return {
        estimated_calls: estimatedCalls,
        estimated_duration_minutes: estimatedDurationMinutes,
        estimated_graphql_points: 0, // Not using GraphQL for comprehensive collection yet
        feasible_within_limits: feasible,
        recommended_batch_size: recommendedBatchSize
      }
      
    } catch (error) {
      throw GitHubApiError.networkError(
        'estimate required API calls',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Implement intelligent backoff strategy after rate limit error
   */
  async implementSmartBackoff(error: Error): Promise<void> {
    // Check if this is a rate limit error
    const isRateLimitError = error.message.includes('rate limit') ||
                            error.message.includes('403') ||
                            error.message.includes('429')
    
    if (!isRateLimitError) {
      // For non-rate-limit errors, just wait a short time
      await this.sleep(1000)
      return
    }
    
    try {
      // Get current rate limit status
      const limits = await this.checkCurrentLimits()
      
      // If we have remaining calls, it might be a secondary rate limit
      if (limits.github_rest_api.remaining > 0) {
        // Secondary rate limit - wait 60 seconds
        await this.sleep(60 * 1000)
        return
      }
      
      // Primary rate limit exceeded - wait until reset
      const resetTime = new Date(limits.github_rest_api.reset_time)
      const waitTime = Math.max(0, resetTime.getTime() - Date.now())
      
      // Add 30 seconds buffer to ensure reset has occurred
      const totalWaitTime = waitTime + 30 * 1000
      
      console.log(`Rate limit exceeded. Waiting ${Math.ceil(totalWaitTime / 1000)} seconds until reset.`)
      await this.sleep(totalWaitTime)
      
    } catch {
      // If we can't check limits, use exponential backoff
      const backoffTime = Math.min(300 * 1000, 60 * 1000) // Wait 1-5 minutes
      console.log(`Rate limit error detected. Waiting ${backoffTime / 1000} seconds.`)
      await this.sleep(backoffTime)
    }
  }

  /**
   * Monitor rate limit usage during collection
   */
  async monitorUsageDuringCollection(
    operation: string,
    callsMade: number
  ): Promise<RateLimitUsage> {
    try {
      const limits = await this.checkCurrentLimits()
      
      // Log warning if approaching rate limit
      if (limits.github_rest_api.remaining < 100) {
        console.warn(`Rate limit warning: Only ${limits.github_rest_api.remaining} calls remaining during ${operation}`)
      }
      
      // Log progress every 100 calls
      if (callsMade > 0 && callsMade % 100 === 0) {
        console.log(`${operation}: Made ${callsMade} calls, ${limits.github_rest_api.remaining} remaining`)
      }
      
      return limits
      
    } catch (error) {
      // If monitoring fails, continue but log the error
      console.warn(`Failed to monitor rate limits during ${operation}:`, error)
      
      // Return default limits to avoid blocking collection
      return {
        github_graphql_api: {
          limit: 5000,
          points_used: 0,
          remaining: 5000,
          reset_time: new Date(Date.now() + 3_600_000).toISOString()
        },
        github_rest_api: {
          calls_made: callsMade,
          limit: 5000,
          remaining: 4000, // Conservative estimate
          reset_time: new Date(Date.now() + 3_600_000).toISOString()
        }
      }
    }
  }

  /**
   * Validate that a collection operation is feasible within current rate limits
   */
  async validateCollectionFeasible(estimate: CallEstimate): Promise<boolean> {
    try {
      const currentLimits = await this.checkCurrentLimits()
      
      // Check if we have enough REST API calls remaining
      const restApiFeasible = estimate.estimated_calls <= currentLimits.github_rest_api.remaining
      
      // Check if we have enough GraphQL points remaining (if applicable)
      const graphqlFeasible = estimate.estimated_graphql_points <= currentLimits.github_graphql_api.remaining
      
      return restApiFeasible && graphqlFeasible
      
    } catch {
      // If we can't check limits, assume not feasible to be safe
      return false
    }
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private async sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}