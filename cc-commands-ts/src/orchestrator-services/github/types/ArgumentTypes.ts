/**
 * @file GitHub Orchestrator Service Argument Types
 * 
 * Type-safe argument definitions for GitHub orchestrator services.
 * Replaces error-prone string parsing with structured objects.
 */

/**
 * Arguments for project detection operations
 */
export interface IProjectDetectionArgs {
  /**
   * Input value based on mode:
   * - For 'url': Full GitHub project URL
   * - For 'owner': Organization or user name
   * - For 'auto': Not used (empty string)
   */
  input: string
  
  /** 
   * Detection mode - determines how to find the project
   * - 'auto': Auto-detect from git remote
   * - 'url': Parse from GitHub project URL
   * - 'owner': Find from organization/owner name
   */
  mode: 'auto' | 'owner' | 'url'
}

/**
 * Arguments for project data collection operations
 */
export interface IProjectDataCollectionArgs {
  /** Index signature for LLMInfo context compatibility */
  [key: string]: boolean | null | number | string
  /** GitHub Project v2 node ID (e.g., "PVT_kwHOABDmBM4AHJKL") */
  projectNodeId: string
}

/**
 * Arguments for activity analysis operations
 */
export interface IActivityAnalysisArgs {
  /** Repository owner (user or organization) */
  owner: string
  
  /** List of repository names (without owner prefix) */
  repositories: string[]
  
  /** Time window for analysis in days (1-365) */
  timeWindowDays: number
}

/**
 * Combined arguments for the main summary orchestrator
 */
export interface ISummaryOrchestratorArgs {
  /** Output format preference */
  format?: 'detailed' | 'executive' | 'technical'
  
  /** Project detection arguments */
  projectArgs: IProjectDetectionArgs
  
  /** Time window for analysis in days */
  timeWindowDays: number
}

/**
 * Argument parser utilities
 */
export const ArgumentParser = {
  /**
   * Parse project detection arguments from command input
   */
  parseProjectDetection(input: string): IProjectDetectionArgs {
    const trimmed = input.trim()
    
    // Auto-detect mode (empty input)
    if (!trimmed) {
      return { input: '', mode: 'auto' }
    }
    
    // URL mode (starts with http)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { input: trimmed, mode: 'url' }
    }
    
    // Check if input looks like "owner/repo" - extract just the owner for project lookup
    const repoMatch = trimmed.match(/^([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\/([a-zA-Z0-9._-]+)$/)
    if (repoMatch && repoMatch[1]) {
      // Input like "LongTermSupport/cc-commands" -> extract "LongTermSupport"
      return { input: repoMatch[1], mode: 'owner' }
    }
    
    // Owner mode (organization or user name)
    return { input: trimmed, mode: 'owner' }
  },
  
  /**
   * Parse activity analysis time window
   */
  parseTimeWindow(since?: string): number {
    if (!since) return 30 // default
    
    // Handle formats like "7d", "30d", "90d"
    const match = since.match(/^(\d+)d?$/)
    if (match && match[1]) {
      const days = Number.parseInt(match[1], 10)
      if (days >= 1 && days <= 365) {
        return days
      }
    }
    
    // Default to 30 days for invalid input
    return 30
  },
};