/**
 * @file Documentation Metadata Data Transfer Object
 * 
 * Represents extracted metadata from documentation files including
 * title, description, tags, dates, and other structured information
 * found in documentation headers or front matter.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'

/**
 * Data Transfer Object for documentation file metadata
 * 
 * This DTO encapsulates metadata extracted from documentation files,
 * including front matter, header information, and derived properties.
 */
export class DocumentationMetadataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    DOC_AUTHOR: 'DOC_AUTHOR',
    DOC_CREATION_DATE: 'DOC_CREATION_DATE',
    DOC_DESCRIPTION: 'DOC_DESCRIPTION',
    DOC_LAST_MODIFIED: 'DOC_LAST_MODIFIED',
    DOC_TAGS: 'DOC_TAGS',
    DOC_TITLE: 'DOC_TITLE',
    DOC_TYPE: 'DOC_TYPE',
    DOC_VERSION: 'DOC_VERSION'
  } as const

  constructor(
    public readonly filePath: string,
    public readonly title: string,
    public readonly description: string,
    public readonly author: string,
    public readonly version: string,
    public readonly type: string,
    public readonly tags: string[],
    public readonly creationDate?: Date,
    public readonly lastModified?: Date,
    public readonly customMetadata: Record<string, string> = {},
    public readonly extractedAt: Date = new Date()
  ) {}

  /**
   * Create DocumentationMetadataDTO from extracted metadata
   * 
   * @param filePath - Path to the documentation file
   * @param metadata - Extracted metadata from file
   * @returns New DocumentationMetadataDTO instance
   */
  static fromExtractedMetadata(
    filePath: string,
    metadata: {
      author?: string
      creationDate?: Date
      customMetadata?: Record<string, string>
      description?: string
      lastModified?: Date
      tags?: string[]
      title?: string
      type?: string
      version?: string
    }
  ): DocumentationMetadataDTO {
    return new DocumentationMetadataDTO(
      filePath,
      metadata.title || 'Untitled',
      metadata.description || '',
      metadata.author || 'Unknown',
      metadata.version || '1.0.0',
      metadata.type || 'documentation',
      metadata.tags || [],
      metadata.creationDate,
      metadata.lastModified,
      metadata.customMetadata || {}
    )
  }

  /**
   * Get age of document in days (based on creation date)
   * 
   * @returns Age in days or null if no creation date
   */
  getAgeInDays(): null | number {
    if (!this.creationDate) return null
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.creationDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last modification
   * 
   * @returns Days since modification or null if no modification date
   */
  getDaysSinceModification(): null | number {
    if (!this.lastModified) return null
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.lastModified.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get document classification based on metadata
   * 
   * @returns Document classification
   */
  getDocumentClassification(): string {
    const typeLower = this.type.toLowerCase()
    const titleLower = this.title.toLowerCase()
    
    if (typeLower.includes('api') || titleLower.includes('api')) return 'api-documentation'
    if (typeLower.includes('guide') || titleLower.includes('guide')) return 'user-guide'
    if (typeLower.includes('readme') || titleLower.includes('readme')) return 'project-readme'
    if (typeLower.includes('tutorial') || titleLower.includes('tutorial')) return 'tutorial'
    if (typeLower.includes('reference') || titleLower.includes('reference')) return 'reference'
    if (typeLower.includes('spec') || titleLower.includes('specification')) return 'specification'
    
    return 'general-documentation'
  }

  /**
   * Get comprehensive jq query hints for documentation metadata
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw metadata
      { 
        description: 'Document title', 
        query: '.raw.documentation_metadata.title',
        scope: 'single_item'
      },
      { 
        description: 'Document description', 
        query: '.raw.documentation_metadata.description',
        scope: 'single_item'
      },
      { 
        description: 'Document author', 
        query: '.raw.documentation_metadata.author',
        scope: 'single_item'
      },
      { 
        description: 'Document version', 
        query: '.raw.documentation_metadata.version',
        scope: 'single_item'
      },
      { 
        description: 'Document type/category', 
        query: '.raw.documentation_metadata.type',
        scope: 'single_item'
      },
      { 
        description: 'Array of document tags', 
        query: '.raw.documentation_metadata.tags',
        scope: 'single_item'
      },
      { 
        description: 'Document file path', 
        query: '.raw.documentation_metadata.file_path',
        scope: 'single_item'
      },
      { 
        description: 'Custom metadata fields', 
        query: '.raw.documentation_metadata.custom_metadata',
        scope: 'single_item'
      },
      
      // Calculated analysis
      { 
        description: 'Document age in days (calculated)', 
        query: '.calculated.metadata_analysis.age_days',
        scope: 'single_item'
      },
      { 
        description: 'Metadata completeness score (calculated)', 
        query: '.calculated.metadata_analysis.completeness_score',
        scope: 'single_item'
      },
      { 
        description: 'Document classification analysis (calculated)', 
        query: '.calculated.metadata_analysis.document_classification',
        scope: 'single_item'
      },
      { 
        description: 'Metadata quality indicators (calculated)', 
        query: '.calculated.metadata_analysis.quality_indicators',
        scope: 'single_item'
      },
      
      // Specific field queries
      { 
        description: 'Check if document has author information', 
        query: '.calculated.metadata_analysis.quality_indicators.has_author',
        scope: 'single_item'
      },
      { 
        description: 'Check if document is recently created', 
        query: '.calculated.metadata_analysis.temporal_analysis.is_recent',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get metadata completeness score
   * 
   * @returns Completeness score from 0-100
   */
  getMetadataCompleteness(): number {
    let score = 0
    
    // Core fields (20 points each)
    if (this.title && this.title !== 'Untitled') score += 20
    if (this.description && this.description.length > 0) score += 20
    if (this.author && this.author !== 'Unknown') score += 20
    
    // Secondary fields (10 points each)
    if (this.version && this.version !== '1.0.0') score += 10
    if (this.type && this.type !== 'documentation') score += 10
    if (this.tags.length > 0) score += 10
    
    // Dates (5 points each)
    if (this.creationDate) score += 5
    if (this.lastModified) score += 5
    
    return Math.min(score, 100)
  }

  /**
   * Get summary of documentation metadata
   * 
   * @returns Brief metadata description for logging/debugging
   */
  getSummary(): string {
    const tagCount = this.tags.length > 0 ? ` (${this.tags.length} tags)` : ''
    const version = this.version === '1.0.0' ? '' : ` v${this.version}`
    return `${this.title}${version} by ${this.author}${tagCount}`
  }

  /**
   * Check if document has comprehensive metadata
   * 
   * @returns True if metadata appears complete
   */
  hasComprehensiveMetadata(): boolean {
    return this.getMetadataCompleteness() >= 80
  }

  /**
   * Check if document is recently created or modified
   * 
   * @returns True if document activity within last 30 days
   */
  isRecentDocument(): boolean {
    const age = this.getAgeInDays()
    const daysSinceModification = this.getDaysSinceModification()
    
    return (age !== null && age <= 30) || 
           (daysSinceModification !== null && daysSinceModification <= 30)
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete documentation metadata with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'metadata_analysis': this.calculateMetadataAnalysis()
      },
      raw: {
        'documentation_metadata': this.buildRawMetadataData()
      }
    }
  }

  /**
   * Convert documentation metadata to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [DocumentationMetadataDTO.Keys.DOC_AUTHOR]: this.author,
      [DocumentationMetadataDTO.Keys.DOC_CREATION_DATE]: this.creationDate ? this.creationDate.toISOString() : '',
      [DocumentationMetadataDTO.Keys.DOC_DESCRIPTION]: this.description,
      [DocumentationMetadataDTO.Keys.DOC_LAST_MODIFIED]: this.lastModified ? this.lastModified.toISOString() : '',
      [DocumentationMetadataDTO.Keys.DOC_TAGS]: this.tags.join(', '),
      [DocumentationMetadataDTO.Keys.DOC_TITLE]: this.title,
      [DocumentationMetadataDTO.Keys.DOC_TYPE]: this.type,
      [DocumentationMetadataDTO.Keys.DOC_VERSION]: this.version
    }
  }

  /**
   * Build raw documentation metadata structure
   * 
   * @returns Raw metadata exactly as extracted
   */
  private buildRawMetadataData(): JsonObject {
    return {
      'author': this.author,
      'creation_date': this.creationDate ? this.creationDate.toISOString() : null,
      'custom_metadata': this.customMetadata,
      'description': this.description,
      'extracted_at': this.extractedAt.toISOString(),
      'file_path': this.filePath,
      'last_modified': this.lastModified ? this.lastModified.toISOString() : null,
      'tags': this.tags,
      'title': this.title,
      'type': this.type,
      'version': this.version
    }
  }

  /**
   * Calculate comprehensive metadata analysis
   * 
   * @returns Analysis of metadata quality and characteristics
   */
  private calculateMetadataAnalysis(): JsonObject {
    const completenessScore = this.getMetadataCompleteness()
    const classification = this.getDocumentClassification()
    const age = this.getAgeInDays()
    const daysSinceModification = this.getDaysSinceModification()
    
    // Quality indicators
    const qualityIndicators = {
      'has_author': this.author !== 'Unknown',
      'has_comprehensive_metadata': this.hasComprehensiveMetadata(),
      'has_creation_date': this.creationDate !== undefined,
      'has_description': this.description.length > 0,
      'has_modification_date': this.lastModified !== undefined,
      'has_tags': this.tags.length > 0,
      'has_version': this.version !== '1.0.0',
      'is_well_documented': completenessScore >= 70
    }
    
    // Temporal analysis
    const temporalAnalysis = {
      'age_days': age,
      'days_since_modification': daysSinceModification,
      'is_recent': this.isRecentDocument(),
      'is_stale': age !== null && age > 365, // Over 1 year old
      'is_well_maintained': daysSinceModification !== null && daysSinceModification <= 90
    }
    
    return {
      'completeness_score': completenessScore,
      'document_classification': classification,
      'metadata_richness': {
        'custom_fields_count': Object.keys(this.customMetadata).length,
        'tag_count': this.tags.length,
        'total_metadata_fields': this.countNonEmptyFields()
      },
      'quality_indicators': qualityIndicators,
      'temporal_analysis': temporalAnalysis
    }
  }

  /**
   * Count non-empty metadata fields
   * 
   * @returns Number of fields with meaningful values
   */
  private countNonEmptyFields(): number {
    let count = 0
    
    if (this.title && this.title !== 'Untitled') count++
    if (this.description) count++
    if (this.author && this.author !== 'Unknown') count++
    if (this.version && this.version !== '1.0.0') count++
    if (this.type && this.type !== 'documentation') count++
    if (this.tags.length > 0) count++
    if (this.creationDate) count++
    if (this.lastModified) count++
    
    count += Object.keys(this.customMetadata).length
    
    return count
  }
}