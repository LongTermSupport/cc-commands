/**
 * @file File Preview Data Transfer Object
 * 
 * Represents a preview of file content including first lines, readability
 * status, encoding detection, and basic content analysis for quick
 * file assessment without full content loading.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'

/**
 * Data Transfer Object for file content preview
 * 
 * This DTO provides a quick preview of file content including the first
 * few lines, basic characteristics, and readability assessment.
 */
export class FilePreviewDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PREVIEW_ENCODING: 'PREVIEW_ENCODING',
    PREVIEW_FILE_PATH: 'PREVIEW_FILE_PATH',
    PREVIEW_FIRST_LINES: 'PREVIEW_FIRST_LINES',
    PREVIEW_IS_EMPTY: 'PREVIEW_IS_EMPTY',
    PREVIEW_IS_READABLE: 'PREVIEW_IS_READABLE',
    PREVIEW_LINES_COUNT: 'PREVIEW_LINES_COUNT'
  } as const

  constructor(
    public readonly path: string,
    public readonly firstLines: string[],
    public readonly isEmpty: boolean,
    public readonly isReadable: boolean,
    public readonly encoding: string,
    public readonly totalLines: number,
    public readonly previewedAt: Date = new Date()
  ) {}

  /**
   * Create FilePreviewDTO from file preview operation
   * 
   * @param path - Path to the previewed file
   * @param previewResults - Results from file preview operation
   * @returns New FilePreviewDTO instance
   */
  static fromPreviewOperation(
    path: string,
    previewResults: {
      encoding?: string
      firstLines: string[]
      isEmpty: boolean
      isReadable: boolean
      totalLines?: number
    }
  ): FilePreviewDTO {
    return new FilePreviewDTO(
      path,
      previewResults.firstLines,
      previewResults.isEmpty,
      previewResults.isReadable,
      previewResults.encoding || 'unknown',
      previewResults.totalLines || (Math.max(previewResults.firstLines.length, 0))
    )
  }

  /**
   * Get number of lines in the preview
   * 
   * @returns Count of preview lines
   */
  get previewLineCount(): number {
    return this.firstLines.length
  }

  /**
   * Get content type based on file analysis
   * 
   * @returns Detected content type
   */
  getContentType(): string {
    if (this.isEmpty) return 'empty'
    if (!this.isReadable) return 'binary'
    
    const content = this.firstLines.join('\n').toLowerCase()
    
    return this.detectWebContentType(content) ||
           this.detectDataFormatType(content) ||
           this.detectProgrammingLanguage(content) ||
           'text'
  }

  /**
   * Get estimated file size based on preview
   * 
   * @returns Estimated file size in bytes
   */
  getEstimatedSize(): number {
    if (this.isEmpty) return 0
    if (this.firstLines.length === 0) return 0
    
    // Estimate based on average line length and total lines
    const avgLineLength = this.firstLines.reduce((sum, line) => sum + line.length, 0) / this.firstLines.length
    return Math.round(avgLineLength * this.totalLines)
  }

  /**
   * Get comprehensive jq query hints for file preview data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw preview data
      { 
        description: 'File path being previewed', 
        query: '.raw.file_preview.path',
        scope: 'single_item'
      },
      { 
        description: 'Array of first lines from file', 
        query: '.raw.file_preview.first_lines',
        scope: 'single_item'
      },
      { 
        description: 'File readability status', 
        query: '.raw.file_preview.is_readable',
        scope: 'single_item'
      },
      { 
        description: 'File emptiness status', 
        query: '.raw.file_preview.is_empty',
        scope: 'single_item'
      },
      { 
        description: 'Detected file encoding', 
        query: '.raw.file_preview.encoding',
        scope: 'single_item'
      },
      { 
        description: 'Total lines in file', 
        query: '.raw.file_preview.total_lines',
        scope: 'single_item'
      },
      
      // Calculated preview analysis
      { 
        description: 'Detected content type (calculated)', 
        query: '.calculated.preview_analysis.content_type',
        scope: 'single_item'
      },
      { 
        description: 'Content characteristics analysis (calculated)', 
        query: '.calculated.preview_analysis.content_characteristics',
        scope: 'single_item'
      },
      { 
        description: 'File size estimation (calculated)', 
        query: '.calculated.preview_analysis.size_estimation',
        scope: 'single_item'
      },
      { 
        description: 'Preview completeness ratio (calculated)', 
        query: '.calculated.preview_analysis.completeness_ratio',
        scope: 'single_item'
      },
      
      // Content analysis queries
      { 
        description: 'First line of file content', 
        query: '.raw.file_preview.first_lines[0]',
        scope: 'single_item'
      },
      { 
        description: 'Check if file has shebang', 
        query: '.calculated.preview_analysis.content_characteristics.has_shebang',
        scope: 'single_item'
      },
      { 
        description: 'Estimated reading time', 
        query: '.calculated.preview_analysis.reading_metrics.estimated_reading_time_minutes',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get preview completeness ratio
   * 
   * @returns Ratio of preview lines to total lines (0-1)
   */
  getPreviewCompleteness(): number {
    if (this.totalLines === 0) return 1
    return Math.min(this.firstLines.length / this.totalLines, 1)
  }

  /**
   * Get summary of file preview
   * 
   * @returns Brief preview description for logging/debugging
   */
  getSummary(): string {
    if (this.isEmpty) return `${this.path}: empty file`
    if (!this.isReadable) return `${this.path}: binary/unreadable file`
    
    const contentType = this.getContentType()
    const completeness = Math.round(this.getPreviewCompleteness() * 100)
    return `${this.path}: ${contentType} (${this.previewLineCount}/${this.totalLines} lines, ${completeness}% preview)`
  }

  /**
   * Check if file appears to be a configuration file
   * 
   * @returns True if file shows configuration patterns
   */
  isConfigurationFile(): boolean {
    if (!this.isReadable || this.isEmpty) return false
    
    const content = this.firstLines.join('\n').toLowerCase()
    const path = this.path.toLowerCase()
    
    // Check file extension
    if (/\.(conf|config|ini|env|properties|yaml|yml|toml)$/.test(path)) {
      return true
    }
    
    // Check content patterns
    return content.includes('=') && (
      Boolean(/^\w+\s*=/.test(content)) ||
      content.includes('[') ||
      content.includes('---')
    )
  }

  /**
   * Check if file appears to be documentation
   * 
   * @returns True if file shows documentation patterns
   */
  isDocumentationFile(): boolean {
    if (!this.isReadable || this.isEmpty) return false
    
    const path = this.path.toLowerCase()
    const content = this.firstLines.join('\n')
    
    // Check file extension
    if (/\.(md|txt|rst|doc|docx|pdf|readme)$/.test(path)) {
      return true
    }
    
    // Check for markdown patterns
    return content.includes('#') || 
           content.includes('##') || 
           content.includes('```') ||
           path.includes('readme')
  }

  /**
   * Check if file appears to be source code
   * 
   * @returns True if file shows source code patterns
   */
  isSourceCodeFile(): boolean {
    if (!this.isReadable || this.isEmpty) return false
    
    const path = this.path.toLowerCase()
    const content = this.firstLines.join('\n')
    
    // Check file extension
    if (/\.(js|ts|py|php|java|cpp|c|go|rs|rb|html|css|sql)$/.test(path)) {
      return true
    }
    
    // Check for code patterns
    return content.includes('function') ||
           content.includes('class ') ||
           content.includes('import ') ||
           content.includes('#include') ||
           content.includes('<?php') ||
           content.includes('def ')
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete file preview with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'preview_analysis': this.calculatePreviewAnalysis()
      },
      raw: {
        'file_preview': this.buildRawPreviewData()
      }
    }
  }

  /**
   * Convert file preview to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [FilePreviewDTO.Keys.PREVIEW_ENCODING]: this.encoding,
      [FilePreviewDTO.Keys.PREVIEW_FILE_PATH]: this.path,
      [FilePreviewDTO.Keys.PREVIEW_FIRST_LINES]: this.firstLines.join('\n'),
      [FilePreviewDTO.Keys.PREVIEW_IS_EMPTY]: String(this.isEmpty),
      [FilePreviewDTO.Keys.PREVIEW_IS_READABLE]: String(this.isReadable),
      [FilePreviewDTO.Keys.PREVIEW_LINES_COUNT]: String(this.previewLineCount)
    }
  }

  /**
   * Build raw file preview data structure
   * 
   * @returns Raw preview data exactly as collected
   */
  private buildRawPreviewData(): JsonObject {
    return {
      'encoding': this.encoding,
      'first_lines': this.firstLines,
      'is_empty': this.isEmpty,
      'is_readable': this.isReadable,
      'path': this.path,
      'previewed_at': this.previewedAt.toISOString(),
      'total_lines': this.totalLines
    }
  }

  /**
   * Calculate comprehensive preview analysis
   * 
   * @returns Analysis of file preview characteristics and content type
   */
  private calculatePreviewAnalysis(): JsonObject {
    const contentType = this.getContentType()
    const estimatedSize = this.getEstimatedSize()
    const completeness = this.getPreviewCompleteness()
    
    // Content characteristics analysis
    const contentCharacteristics = {
      'appears_to_be_config': this.isConfigurationFile(),
      'appears_to_be_documentation': this.isDocumentationFile(),
      'appears_to_be_source_code': this.isSourceCodeFile(),
      'has_content': !this.isEmpty && this.firstLines.length > 0,
      'has_long_lines': this.firstLines.some(line => line.length > 120),
      'has_shebang': this.firstLines.length > 0 && (this.firstLines[0]?.startsWith('#!') || false),
      'is_small_file': this.totalLines < 50,
      'uses_common_encoding': ['ascii', 'utf8', 'utf8'].includes(this.encoding.toLowerCase())
    }
    
    // Reading metrics
    const avgLineLength = this.firstLines.length > 0 ? 
      this.firstLines.reduce((sum, line) => sum + line.length, 0) / this.firstLines.length : 0
    const estimatedWords = Math.round((estimatedSize / 5)) // Rough estimate: 5 chars per word
    const readingTimeMinutes = Math.max(1, Math.round(estimatedWords / 200)) // 200 words per minute
    
    const readingMetrics = {
      'average_line_length': Math.round(avgLineLength || 0),
      'estimated_reading_time_minutes': readingTimeMinutes,
      'estimated_words': estimatedWords
    }
    
    return {
      'completeness_ratio': Math.round(completeness * 100) / 100,
      'content_characteristics': contentCharacteristics,
      'content_type': contentType,
      'preview_lines_count': this.previewLineCount,
      'reading_metrics': readingMetrics,
      'size_estimation': {
        'estimated_size_bytes': estimatedSize,
        'estimated_size_kb': Math.round(estimatedSize / 1024 * 100) / 100
      }
    }
  }

  /**
   * Detect data format types
   */
  private detectDataFormatType(content: string): null | string {
    if (/^{\s*["']/.test(content) || /^\[\s*{/.test(content)) {
      return 'json'
    }
    
    if (content.includes('---\n') || /^\w+:\s+/.test(content)) {
      return 'yaml'
    }

    return null
  }

  /**
   * Detect programming language types
   */
  private detectProgrammingLanguage(content: string): null | string {
    if (content.includes('#!/bin/') || content.includes('#!/usr/bin/')) {
      return 'script'
    }
    
    if (content.includes('#include') || content.includes('int main(')) {
      return 'c-cpp'
    }
    
    if (content.includes('function') || content.includes('const') || content.includes('let ')) {
      return 'javascript'
    }
    
    if (content.includes('<?php') || content.includes('<?=')) {
      return 'php'
    }
    
    if (content.includes('def ') || content.includes('import ') || content.includes('from ')) {
      return 'python'
    }

    return null
  }

  /**
   * Detect web-related content types
   */
  private detectWebContentType(content: string): null | string {
    if (content.includes('<!doctype html') || content.includes('<html')) {
      return 'html'
    }
    
    if (content.includes('<?xml') || content.includes('<xml')) {
      return 'xml'
    }

    return null
  }
}