/**
 * @file Documentation Discovery Data Transfer Object
 * 
 * Represents the result of documentation file discovery operations including
 * README files, CLAUDE.md files, docs directories, and other documentation
 * resources with comprehensive categorization and analysis.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { FileMetadataDTO } from './FileMetadataDTO.js'

/**
 * Data Transfer Object for documentation discovery results
 * 
 * This DTO encapsulates comprehensive documentation discovery results,
 * categorized by documentation type for organized analysis and processing.
 */
export class DocumentationDiscoveryDTO implements ILLMDataDTO {
  private static readonly Keys = {
    CLAUDE_FILES: 'CLAUDE_FILES',
    DOCS_DIRECTORY_FILES: 'DOCS_DIRECTORY_FILES',
    MARKDOWN_FILES: 'MARKDOWN_FILES',
    README_FILES: 'README_FILES',
    TOTAL_DOCUMENTATION: 'TOTAL_DOCUMENTATION'
  } as const

  constructor(
    public readonly readmeFiles: FileMetadataDTO[],
    public readonly claudeFiles: FileMetadataDTO[],
    public readonly docsDirectory: FileMetadataDTO[],
    public readonly markdownFiles: FileMetadataDTO[],
    public readonly discoveryDuration: number,
    public readonly searchDirectory: string,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Create DocumentationDiscoveryDTO from discovery operation
   * 
   * @param discoveryResults - Categorized documentation files
   * @param searchDirectory - Directory where documentation was searched
   * @param discoveryDuration - Time taken for discovery in milliseconds
   * @returns New DocumentationDiscoveryDTO instance
   */
  static fromDiscoveryResults(
    discoveryResults: {
      claudeFiles: FileMetadataDTO[]
      docsDirectory: FileMetadataDTO[]
      markdownFiles: FileMetadataDTO[]
      readmeFiles: FileMetadataDTO[]
    },
    searchDirectory: string,
    discoveryDuration: number
  ): DocumentationDiscoveryDTO {
    return new DocumentationDiscoveryDTO(
      discoveryResults.readmeFiles,
      discoveryResults.claudeFiles,
      discoveryResults.docsDirectory,
      discoveryResults.markdownFiles,
      discoveryDuration,
      searchDirectory
    )
  }

  /**
   * Get total number of documentation files discovered
   * 
   * @returns Sum of all documentation file types
   */
  get totalDocumentationFiles(): number {
    return this.readmeFiles.length + 
           this.claudeFiles.length + 
           this.docsDirectory.length + 
           this.markdownFiles.length
  }

  /**
   * Get all documentation files as a single array
   * 
   * @returns Combined array of all documentation files
   */
  getAllDocumentationFiles(): FileMetadataDTO[] {
    return [
      ...this.readmeFiles,
      ...this.claudeFiles,
      ...this.docsDirectory,
      ...this.markdownFiles
    ]
  }

  /**
   * Get documentation coverage analysis
   * 
   * @returns Analysis of documentation coverage and completeness
   */
  getDocumentationCoverage(): {
    coverageScore: number
    hasClaudeInstructions: boolean
    hasMainReadme: boolean
    hasProjectDocs: boolean
    hasStructuredDocs: boolean
  } {
    const hasMainReadme = this.readmeFiles.some(file => 
      file.name.toLowerCase() === 'readme.md' || file.path.endsWith('/README.md')
    )
    
    const hasProjectDocs = this.docsDirectory.length > 0
    const hasClaudeInstructions = this.claudeFiles.length > 0
    const hasStructuredDocs = this.docsDirectory.length > 3 // Multiple doc files
    
    // Calculate coverage score
    let score = 0
    if (hasMainReadme) score += 30
    if (hasProjectDocs) score += 25
    if (hasClaudeInstructions) score += 20
    if (hasStructuredDocs) score += 15
    if (this.markdownFiles.length > 5) score += 10 // Rich markdown content
    
    return {
      coverageScore: Math.min(score, 100),
      hasClaudeInstructions,
      hasMainReadme,
      hasProjectDocs,
      hasStructuredDocs
    }
  }

  /**
   * Get comprehensive jq query hints for documentation discovery data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw documentation discovery data
      { 
        description: 'Array of README files discovered', 
        query: '.raw.documentation_discovery.readme_files',
        scope: 'single_item'
      },
      { 
        description: 'Array of CLAUDE.md files discovered', 
        query: '.raw.documentation_discovery.claude_files',
        scope: 'single_item'
      },
      { 
        description: 'Array of docs directory files', 
        query: '.raw.documentation_discovery.docs_directory',
        scope: 'single_item'
      },
      { 
        description: 'Array of markdown files found', 
        query: '.raw.documentation_discovery.markdown_files',
        scope: 'single_item'
      },
      { 
        description: 'Directory where documentation was searched', 
        query: '.raw.documentation_discovery.search_directory',
        scope: 'single_item'
      },
      { 
        description: 'Documentation file names by category', 
        query: '.raw.documentation_discovery | to_entries | map({category: .key, files: .value | map(.name)})',
        scope: 'single_item'
      },
      
      // Calculated documentation analysis
      { 
        description: 'Total documentation files count (calculated)', 
        query: '.calculated.documentation_analysis.total_files',
        scope: 'single_item'
      },
      { 
        description: 'Documentation coverage analysis (calculated)', 
        query: '.calculated.documentation_analysis.coverage_analysis',
        scope: 'single_item'
      },
      { 
        description: 'Documentation organization patterns (calculated)', 
        query: '.calculated.documentation_analysis.organization_patterns',
        scope: 'single_item'
      },
      { 
        description: 'Discovery performance metrics (calculated)', 
        query: '.calculated.discovery_performance.files_per_second',
        scope: 'single_item'
      },
      
      // Category-specific queries
      { 
        description: 'README file paths only', 
        query: '.raw.documentation_discovery.readme_files[].path',
        scope: 'single_item'
      },
      { 
        description: 'Largest documentation files', 
        query: '.raw.documentation_discovery | [.readme_files[], .claude_files[], .docs_directory[], .markdown_files[]] | sort_by(.size) | reverse | .[0:5]',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get most recently modified documentation file
   * 
   * @returns Most recent documentation file or null if none exist
   */
  getMostRecentlyModified(): FileMetadataDTO | null {
    const allFiles = this.getAllDocumentationFiles()
    if (allFiles.length === 0) return null
    
    let mostRecent = allFiles[0]
    if (!mostRecent) return null
    
    for (const file of allFiles) {
      if (file.modified > mostRecent.modified) {
        mostRecent = file
      }
    }

    return mostRecent
  }

  /**
   * Get summary of documentation discovery
   * 
   * @returns Brief discovery summary for logging/debugging
   */
  getSummary(): string {
    const duration = this.discoveryDuration > 1000 ? 
      `${Math.round(this.discoveryDuration / 1000)}s` : 
      `${this.discoveryDuration}ms`
    
    return `Found ${this.totalDocumentationFiles} docs (${this.readmeFiles.length} README, ` +
           `${this.claudeFiles.length} CLAUDE, ${this.docsDirectory.length} docs/, ` +
           `${this.markdownFiles.length} markdown) in ${duration}`
  }

  /**
   * Check if project has comprehensive documentation
   * 
   * @returns True if documentation appears comprehensive
   */
  hasComprehensiveDocumentation(): boolean {
    const coverage = this.getDocumentationCoverage()
    return coverage.coverageScore >= 70 && coverage.hasMainReadme
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete documentation discovery with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'discovery_performance': this.calculateDiscoveryPerformance(),
        'documentation_analysis': this.calculateDocumentationAnalysis()
      },
      raw: {
        'documentation_discovery': this.buildRawDocumentationData()
      }
    }
  }

  /**
   * Convert documentation discovery to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [DocumentationDiscoveryDTO.Keys.CLAUDE_FILES]: String(this.claudeFiles.length),
      [DocumentationDiscoveryDTO.Keys.DOCS_DIRECTORY_FILES]: String(this.docsDirectory.length),
      [DocumentationDiscoveryDTO.Keys.MARKDOWN_FILES]: String(this.markdownFiles.length),
      [DocumentationDiscoveryDTO.Keys.README_FILES]: String(this.readmeFiles.length),
      [DocumentationDiscoveryDTO.Keys.TOTAL_DOCUMENTATION]: String(this.totalDocumentationFiles)
    }
  }

  /**
   * Build raw documentation discovery data structure
   * 
   * @returns Raw documentation data exactly as discovered
   */
  private buildRawDocumentationData(): JsonObject {
    return {
      'claude_files': this.claudeFiles.map(file => file.toJsonData().raw['filesystem_metadata']),
      'created_at': this.createdAt.toISOString(),
      'discovery_duration_ms': this.discoveryDuration,
      'docs_directory': this.docsDirectory.map(file => file.toJsonData().raw['filesystem_metadata']),
      'markdown_files': this.markdownFiles.map(file => file.toJsonData().raw['filesystem_metadata']),
      'readme_files': this.readmeFiles.map(file => file.toJsonData().raw['filesystem_metadata']),
      'search_directory': this.searchDirectory,
      'total_files': this.totalDocumentationFiles
    }
  }

  /**
   * Calculate discovery performance metrics
   * 
   * @returns Performance statistics for documentation discovery operation
   */
  private calculateDiscoveryPerformance(): JsonObject {
    const filesPerSecond = this.discoveryDuration > 0 ? 
      Math.round((this.totalDocumentationFiles / this.discoveryDuration) * 1000 * 100) / 100 : 0

    return {
      'discovery_duration_ms': this.discoveryDuration,
      'discovery_efficiency_score': Math.min(filesPerSecond * 10, 1),
      'files_per_second': filesPerSecond
    }
  }

  /**
   * Calculate comprehensive documentation analysis
   * 
   * @returns Analysis of documentation completeness and organization
   */
  private calculateDocumentationAnalysis(): JsonObject {
    const coverage = this.getDocumentationCoverage()
    const mostRecent = this.getMostRecentlyModified()
    
    // File size analysis
    const allFiles = this.getAllDocumentationFiles()
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
    const averageSize = allFiles.length > 0 ? Math.round(totalSize / allFiles.length) : 0
    
    // Organization patterns
    const organizationPatterns = {
      'centralized_docs': this.docsDirectory.length > this.readmeFiles.length,
      'distributed_docs': this.readmeFiles.length > this.docsDirectory.length,
      'has_project_instructions': this.claudeFiles.length > 0,
      'mixed_organization': this.readmeFiles.length > 0 && this.docsDirectory.length > 0
    }
    
    return {
      'coverage_analysis': {
        'coverage_score': coverage.coverageScore,
        'has_claude_instructions': coverage.hasClaudeInstructions,
        'has_comprehensive_docs': this.hasComprehensiveDocumentation(),
        'has_main_readme': coverage.hasMainReadme,
        'has_project_docs': coverage.hasProjectDocs,
        'has_structured_docs': coverage.hasStructuredDocs
      },
      'file_size_analysis': {
        'average_file_size': averageSize,
        'largest_file_size': Math.max(...allFiles.map(f => f.size), 0),
        'smallest_file_size': allFiles.length > 0 ? Math.min(...allFiles.map(f => f.size)) : 0,
        'total_size_bytes': totalSize
      },
      'most_recent_modification': mostRecent ? mostRecent.modified.toISOString() : null,
      'organization_patterns': organizationPatterns,
      'total_files': this.totalDocumentationFiles,
      'type_distribution': {
        'claude_files_count': this.claudeFiles.length,
        'docs_directory_count': this.docsDirectory.length,
        'markdown_files_count': this.markdownFiles.length,
        'readme_files_count': this.readmeFiles.length
      }
    }
  }
}