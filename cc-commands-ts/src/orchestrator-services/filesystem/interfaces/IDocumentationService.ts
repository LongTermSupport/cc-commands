/**
 * @file Documentation service interface
 *
 * Defines the contract for discovering and parsing documentation files.
 * CRITICAL: This service performs NO content interpretation - it only extracts
 * structured data. All content analysis and relevance determination is handled
 * by LLM commands.
 */

import type { DocumentationContentDTO } from '../dto/DocumentationContentDTO.js'
import type { DocumentationDiscoveryDTO } from '../dto/DocumentationDiscoveryDTO.js'
import type { DocumentationMetadataDTO } from '../dto/DocumentationMetadataDTO.js'
import type { FilePreviewDTO } from '../dto/FilePreviewDTO.js'
import type { StructuredContentDTO } from '../dto/StructuredContentDTO.js'

/**
 * Service interface for documentation discovery and parsing
 * 
 * ⚠️ ARCHITECTURAL BOUNDARY: This service extracts structured data only.
 * NO content interpretation, relevance assessment, or reading order suggestions.
 * LLM commands handle all content analysis and decision-making.
 */
export interface IDocumentationService {
  /**
   * Categorize documentation files by type
   * 
   * Classifies files as README, CLAUDE, docs directory, or other markdown
   * based on filename and location patterns.
   * 
   * @param paths - Array of documentation file paths
   * @returns Promise resolving to categorized file paths
   */
  categorizeDocumentationFiles(paths: string[]): Promise<{
    claudeFiles: string[]
    docsDirectoryFiles: string[]
    markdownFiles: string[]
    otherFiles: string[]
    readmeFiles: string[]
  }>

  /**
   * Extract frontmatter from markdown files
   * 
   * Parses YAML frontmatter from markdown files if present,
   * returning structured metadata without interpretation.
   * 
   * @param path - Path to the markdown file
   * @returns Promise resolving to frontmatter data or null
   */
  extractFrontmatter(path: string): Promise<null | Record<string, unknown>>

  /**
   * Extract structured content from markdown text
   * 
   * Parses markdown content to extract headings, code blocks, links,
   * and other structural elements for LLM processing.
   * 
   * @param path - File path for context
   * @param content - Raw markdown content to parse
   * @returns Promise resolving to structured content DTO
   */
  extractStructuredContent(path: string, content: string): Promise<StructuredContentDTO>

  /**
   * Discover all documentation files in project
   * 
   * Finds README, CLAUDE.md, docs/ files, and other markdown files
   * across the project structure (excluding cc-commands directories).
   * 
   * @param directory - Root directory to search from (defaults to current directory)
   * @returns Promise resolving to comprehensive documentation discovery results
   */
  findDocumentationFiles(directory?: string): Promise<DocumentationDiscoveryDTO>

  /**
   * Get metadata for a documentation file
   * 
   * Extracts file metadata and basic content statistics without
   * interpreting the content's meaning or importance.
   * 
   * @param path - Path to the documentation file
   * @returns Promise resolving to documentation metadata DTO
   */
  getDocumentationMetadata(path: string): Promise<DocumentationMetadataDTO>

  /**
   * Get file previews for multiple documentation files
   * 
   * Extracts first few lines from each file for quick overview
   * without assessing content relevance or quality.
   * 
   * @param paths - Array of documentation file paths
   * @param previewLines - Number of lines to include in preview (default: 5)
   * @returns Promise resolving to array of file preview DTOs
   */
  getDocumentationPreviews(paths: string[], previewLines?: number): Promise<FilePreviewDTO[]>

  /**
   * Get documentation file statistics
   * 
   * Provides basic statistics about documentation coverage and
   * distribution without quality assessment.
   * 
   * @param directory - Directory to analyze (defaults to current directory)
   * @returns Promise resolving to documentation statistics
   */
  getDocumentationStatistics(directory?: string): Promise<{
    averageSize: number
    claudeCount: number
    docsDirectoryCount: number
    lastModified: Date | null
    markdownCount: number
    readmeCount: number
    totalFiles: number
    totalSize: number
  }>

  /**
   * Parse a documentation file and extract structured content
   * 
   * Extracts headings, code blocks, links, and other structural elements
   * without interpreting their meaning or relevance.
   * 
   * @param path - Path to the documentation file
   * @returns Promise resolving to structured content DTO
   * @throws FileOperationError if file can't be read or parsed
   */
  parseDocumentationFile(path: string): Promise<DocumentationContentDTO>

  /**
   * Search for specific patterns in documentation content
   * 
   * Searches for text patterns across documentation files,
   * returning matches without interpreting their significance.
   * 
   * @param pattern - Regular expression pattern to search for
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to pattern match results
   */
  searchDocumentationContent(
    pattern: RegExp,
    directory?: string
  ): Promise<{
    filesWithMatches: number
    matches: Array<{
      context: string
      filePath: string
      lineNumber: number
      matchedText: string
    }>
    totalMatches: number
  }>

  /**
   * ❌ FORBIDDEN METHODS - Content interpretation is LLM responsibility:
   * 
   * - assessDocumentationRelevance() 
   * - suggestReadingOrder()
   * - evaluateDocumentationQuality()
   * - prioritizeDocumentationFiles()
   * - analyzeDocumentationImportance()
   * 
   * All content analysis and decision-making must be handled by LLM commands.
   */
}