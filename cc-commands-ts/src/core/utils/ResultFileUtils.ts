/**
 * @file Result file management utilities
 * 
 * Provides utilities for managing JSON result files, including path generation,
 * directory management, and jq query example generation for CLI usage.
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

import { JqHint } from '../interfaces/JqHint.js'

/**
 * Generate timestamped result file path
 * 
 * @param command - Command name (e.g., 'g-gh-project-summary')
 * @param timestamp - Timestamp for filename (defaults to now)
 * @returns Absolute path to result file with .json.xz extension
 * 
 * @example
 * ```typescript
 * const path = generateResultFilePath('g-gh-project-summary')
 * // Returns: /project/var/results/g-gh-project-summary_2025-01-29_14-30-25.json.xz
 * ```
 */
export function generateResultFilePath(command: string, timestamp: Date = new Date()): string {
  const dateStr = timestamp.toISOString().split('T')?.[0] || '1970-01-01'  // YYYY-MM-DD
  const timeStr = timestamp.toTimeString().split(' ')?.[0]?.replace(/:/g, '-') || '00-00-00'  // HH-mm-ss
  const filename = `${command}_${dateStr}_${timeStr}.json.xz`
  
  return join(process.cwd(), 'var', 'results', filename)
}

/**
 * Ensure results directory exists
 * 
 * Creates the var/results directory if it doesn't exist.
 * Uses recursive creation to handle missing parent directories.
 * 
 * @throws Error if directory cannot be created
 */
export function ensureResultsDirectory(): void {
  const resultsDir = join(process.cwd(), 'var', 'results')
  
  if (!existsSync(resultsDir)) {
    try {
      mkdirSync(resultsDir, { recursive: true })
    } catch (error) {
      throw new Error(`Failed to create results directory: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Generate CLI examples for jq queries
 * 
 * @param hints - Array of jq query hints
 * @param filePath - Path to the compressed result file
 * @returns Array of formatted CLI examples with descriptions
 * 
 * @example
 * ```typescript
 * const examples = generateJqExamples(hints, '/path/to/result.json.xz')
 * // Returns: [
 * //   "xzcat /path/to/result.json.xz | jq '.raw.github_api.name'  # Repository name",
 * //   "xzcat /path/to/result.json.xz | jq '.calculated.time_calculations.age_days'  # Days old"
 * // ]
 * ```
 */
export function generateJqExamples(hints: JqHint[], filePath: string): string[] {
  return hints.map(hint => {
    const command = `xzcat ${filePath} | jq '${hint.query}'`
    return `${command}  # ${hint.description}`
  })
}

/**
 * Clean old result files based on retention policy
 * 
 * @param maxAgeHours - Maximum age in hours (default: 168 = 7 days)
 * @param maxFiles - Maximum number of files to keep (default: 50)
 * @returns Number of files cleaned up
 */
export function cleanOldResultFiles(maxAgeHours: number = 168, maxFiles: number = 50): number {
  const resultsDir = join(process.cwd(), 'var', 'results')
  
  if (!existsSync(resultsDir)) {
    return 0
  }
  
  try {
    const files = readdirSync(resultsDir)
      .filter((file: string) => file.endsWith('.json.xz'))
      .map((file: string) => {
        const filePath = join(resultsDir, file)
        const stats = statSync(filePath)
        return { file, mtime: stats.mtime, path: filePath }
      })
      .sort((a: { mtime: Date }, b: { mtime: Date }) => b.mtime.getTime() - a.mtime.getTime())
    
    let cleaned = 0
    const now = new Date()
    const cutoffTime = new Date(now.getTime() - (maxAgeHours * 60 * 60 * 1000))
    
    // Remove files older than maxAgeHours
    for (const file of files) {
      if (file.mtime < cutoffTime) {
        unlinkSync(file.path)
        cleaned++
      }
    }
    
    // Remove excess files beyond maxFiles limit
    const remainingFiles = files.filter(file => file.mtime >= cutoffTime)
    if (remainingFiles.length > maxFiles) {
      const filesToRemove = remainingFiles.slice(maxFiles)
      for (const file of filesToRemove) {
        unlinkSync(file.path)
        cleaned++
      }
    }
    
    return cleaned
  } catch (error) {
    // Log error but don't fail the main operation
    console.warn(`Warning: Failed to clean old result files: ${error instanceof Error ? error.message : String(error)}`)
    return 0
  }
}

/**
 * Get summary statistics about result files
 * 
 * @returns Statistics about the result files directory
 */
export function getResultFileStats(): {
  newestFile: Date | null
  oldestFile: Date | null
  totalFiles: number
  totalSizeBytes: number
} {
  const resultsDir = join(process.cwd(), 'var', 'results')
  
  const defaultStats = {
    newestFile: null,
    oldestFile: null,
    totalFiles: 0,
    totalSizeBytes: 0
  }
  
  if (!existsSync(resultsDir)) {
    return defaultStats
  }
  
  try {
    const files = readdirSync(resultsDir)
      .filter((file: string) => file.endsWith('.json.xz'))
    
    if (files.length === 0) {
      return defaultStats
    }
    
    let totalSize = 0
    let oldestTime = Infinity
    let newestTime = -Infinity
    
    for (const file of files) {
      const filePath = join(resultsDir, file)
      const stats = statSync(filePath)
      totalSize += stats.size
      oldestTime = Math.min(oldestTime, stats.mtime.getTime())
      newestTime = Math.max(newestTime, stats.mtime.getTime())
    }
    
    return {
      newestFile: new Date(newestTime),
      oldestFile: new Date(oldestTime),
      totalFiles: files.length,
      totalSizeBytes: totalSize
    }
  } catch (error) {
    console.warn(`Warning: Failed to get result file stats: ${error instanceof Error ? error.message : String(error)}`)
    return defaultStats
  }
}