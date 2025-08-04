/**
 * @file Compression utilities for JSON result files
 * 
 * Provides XZ compression functionality for JSON result files to reduce storage
 * and improve performance. Includes error handling for missing XZ installation
 * with clear recovery instructions.
 */

import { execSync } from 'node:child_process'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'

/**
 * Check for xz availability and fail fast with instructions
 * 
 * @throws Error with installation instructions if xz is not available
 */
export function ensureXzAvailable(): void {
  try {
    execSync('which xz', { stdio: 'ignore' })
  } catch {
    throw new Error(`
XZ compression tool not found. Please install:

Ubuntu/Debian: sudo apt-get install xz-utils  
macOS: brew install xz
RHEL/CentOS: sudo yum install xz
Alpine: apk add xz

After installation, restart your terminal and try again.
`)
  }
}

/**
 * Write JSON data and compress with xz
 * 
 * @param data - JSON data to compress
 * @param outputPath - Path for the compressed .xz file
 * @throws Error if compression fails or xz is not available
 */
export async function createCompressedJsonFile(data: unknown, outputPath: string): Promise<void> {
  // Ensure xz is available
  ensureXzAvailable()
  
  // Write uncompressed JSON temporarily
  const tempJsonPath = outputPath.replace(/\.xz$/, '')
  const jsonContent = JSON.stringify(data, null, 2)
  
  try {
    writeFileSync(tempJsonPath, jsonContent, 'utf8')
    
    // Compress with xz (removes original)
    execSync(`xz -z -6 "${tempJsonPath}"`, { stdio: 'pipe' })
    
    // Verify compressed file exists
    const compressedPath = `${tempJsonPath}.xz`
    if (!existsSync(compressedPath)) {
      throw new Error(`Compression failed: ${compressedPath} not created`)
    }
    
  } catch (error) {
    // Clean up temp file if it exists
    try {
      if (existsSync(tempJsonPath)) {
        unlinkSync(tempJsonPath)
      }
    } catch {
      // Ignore cleanup errors
    }
    
    throw new Error(`Failed to create compressed JSON file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validate that a compressed JSON file exists and is readable
 * 
 * @param filePath - Path to the compressed .xz file
 * @returns True if file exists and can be decompressed
 */
export function validateCompressedFile(filePath: string): boolean {
  try {
    ensureXzAvailable()
    
    if (!existsSync(filePath)) {
      return false
    }
    
    // Test decompression (outputs to stdout, doesn't save)
    execSync(`xzcat "${filePath}" | head -1`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Get uncompressed size of a compressed JSON file
 * 
 * @param filePath - Path to the compressed .xz file
 * @returns Size in bytes of uncompressed data, or null if file invalid
 */
export function getUncompressedSize(filePath: string): null | number {
  try {
    ensureXzAvailable()
    
    if (!existsSync(filePath)) {
      return null
    }
    
    // Use xz --list to get uncompressed size
    const output = execSync(`xz --list --verbose "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' })
    
    // Parse the uncompressed size from xz output
    const match = output.match(/Uncompressed size:\s+(\d+)/)
    return match && match[1] ? Number.parseInt(match[1], 10) : null
  } catch {
    return null
  }
}