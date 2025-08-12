/**
 * @file Structured Content Data Transfer Object
 * 
 * Represents structured content extracted from documentation files including
 * hierarchical sections, organized code examples, categorized links, and
 * content organization patterns for analysis and navigation.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'

/**
 * Represents a hierarchical content section
 */
export type TContentSection = {
  codeBlocks: string[]
  content: string
  level: number
  links: Array<{ text: string; url: string }>
  subsections: TContentSection[]
  title: string
}

/**
 * Data Transfer Object for structured document content
 * 
 * This DTO represents content organized into hierarchical sections with
 * extracted code examples, links, and structural patterns for analysis.
 */
export class StructuredContentDTO implements ILLMDataDTO {
  private static readonly Keys = {
    CONTENT_DEPTH: 'CONTENT_DEPTH',
    CONTENT_FILE_PATH: 'CONTENT_FILE_PATH',
    CONTENT_SECTIONS_COUNT: 'CONTENT_SECTIONS_COUNT',
    CONTENT_TOTAL_CODE_BLOCKS: 'CONTENT_TOTAL_CODE_BLOCKS',
    CONTENT_TOTAL_LINKS: 'CONTENT_TOTAL_LINKS'
  } as const

  constructor(
    public readonly filePath: string,
    public readonly sections: TContentSection[],
    public readonly tableOfContents: string[],
    public readonly codeExamples: Record<string, string[]>,
    public readonly linkCategories: Record<string, Array<{ text: string; url: string }>>,
    public readonly contentTags: string[],
    public readonly structuredAt: Date = new Date()
  ) {}

  /**
   * Create StructuredContentDTO from content analysis
   * 
   * @param filePath - Path to the analyzed file
   * @param structureResults - Results from content structuring
   * @returns New StructuredContentDTO instance
   */
  static fromContentStructure(
    filePath: string,
    structureResults: {
      codeExamples: Record<string, string[]>
      contentTags?: string[]
      linkCategories: Record<string, Array<{ text: string; url: string }>>
      sections: TContentSection[]
      tableOfContents: string[]
    }
  ): StructuredContentDTO {
    return new StructuredContentDTO(
      filePath,
      structureResults.sections,
      structureResults.tableOfContents,
      structureResults.codeExamples,
      structureResults.linkCategories,
      structureResults.contentTags || []
    )
  }

  /**
   * Get maximum depth of content hierarchy
   * 
   * @returns Maximum section nesting level
   */
  get maxDepth(): number {
    return this.calculateMaxDepth(this.sections)
  }

  /**
   * Get total number of code blocks across all sections
   * 
   * @returns Total code block count
   */
  get totalCodeBlocks(): number {
    return Object.values(this.codeExamples).reduce((sum, blocks) => sum + blocks.length, 0)
  }

  /**
   * Get total number of links across all categories
   * 
   * @returns Total link count
   */
  get totalLinks(): number {
    return Object.values(this.linkCategories).reduce((sum, links) => sum + links.length, 0)
  }

  /**
   * Get all sections flattened into a single array
   * 
   * @returns Flattened array of all sections and subsections
   */
  getAllSections(): TContentSection[] {
    return this.flattenSections(this.sections)
  }

  /**
   * Get comprehensive jq query hints for structured content data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw structured content
      { 
        description: 'File path of structured content', 
        query: '.raw.structured_content.file_path',
        scope: 'single_item'
      },
      { 
        description: 'Hierarchical content sections', 
        query: '.raw.structured_content.sections',
        scope: 'single_item'
      },
      { 
        description: 'Table of contents array', 
        query: '.raw.structured_content.table_of_contents',
        scope: 'single_item'
      },
      { 
        description: 'Code examples organized by language', 
        query: '.raw.structured_content.code_examples',
        scope: 'single_item'
      },
      { 
        description: 'Links categorized by type', 
        query: '.raw.structured_content.link_categories',
        scope: 'single_item'
      },
      { 
        description: 'Content tags for categorization', 
        query: '.raw.structured_content.content_tags',
        scope: 'single_item'
      },
      
      // Calculated structure analysis
      { 
        description: 'Content hierarchy depth (calculated)', 
        query: '.calculated.structure_analysis.max_depth',
        scope: 'single_item'
      },
      { 
        description: 'Section count at each level (calculated)', 
        query: '.calculated.structure_analysis.sections_by_level',
        scope: 'single_item'
      },
      { 
        description: 'Content organization patterns (calculated)', 
        query: '.calculated.structure_analysis.organization_patterns',
        scope: 'single_item'
      },
      { 
        description: 'Code distribution analysis (calculated)', 
        query: '.calculated.content_metrics.code_distribution',
        scope: 'single_item'
      },
      { 
        description: 'Link distribution analysis (calculated)', 
        query: '.calculated.content_metrics.link_distribution',
        scope: 'single_item'
      },
      
      // Specific content queries
      { 
        description: 'Top-level sections only', 
        query: '.raw.structured_content.sections[] | select(.level == 1)',
        scope: 'single_item'
      },
      { 
        description: 'Sections with code examples', 
        query: '.raw.structured_content.sections[] | select(.code_blocks | length > 0)',
        scope: 'single_item'
      },
      { 
        description: 'Most common programming language in examples', 
        query: '.calculated.content_metrics.code_distribution | to_entries | max_by(.value) | .key',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get content organization complexity
   * 
   * @returns Complexity score based on structure
   */
  getOrganizationComplexity(): number {
    let complexity = 0
    
    // Base complexity from depth
    complexity += Math.min(this.maxDepth / 5, 1) * 30
    
    // Complexity from section count
    const totalSections = this.getAllSections().length
    complexity += Math.min(totalSections / 20, 1) * 25
    
    // Complexity from code organization
    const codeLanguages = Object.keys(this.codeExamples).length
    complexity += Math.min(codeLanguages / 10, 1) * 20
    
    // Complexity from link organization
    const linkTypes = Object.keys(this.linkCategories).length
    complexity += Math.min(linkTypes / 5, 1) * 15
    
    // Complexity from content diversity
    complexity += Math.min(this.contentTags.length / 10, 1) * 10
    
    return Math.round(complexity)
  }

  /**
   * Get sections by level
   * 
   * @returns Sections organized by hierarchy level
   */
  getSectionsByLevel(): Record<number, TContentSection[]> {
    const byLevel: Record<number, TContentSection[]> = {}
    const allSections = this.getAllSections()
    
    for (const section of allSections) {
      if (!byLevel[section.level]) {
        byLevel[section.level] = []
      }

      byLevel[section.level]!.push(section)
    }
    
    return byLevel
  }

  /**
   * Get summary of structured content
   * 
   * @returns Brief content description for logging/debugging
   */
  getSummary(): string {
    const totalSections = this.getAllSections().length
    const languages = Object.keys(this.codeExamples).length
    return `${totalSections} sections, ${this.maxDepth} levels deep, ${languages} languages, ${this.totalLinks} links`
  }

  /**
   * Check if content has comprehensive structure
   * 
   * @returns True if content shows good organizational structure
   */
  hasComprehensiveStructure(): boolean {
    const totalSections = this.getAllSections().length
    
    return totalSections >= 3 && 
           this.maxDepth >= 2 && 
           this.tableOfContents.length >= 3 &&
           Object.keys(this.codeExamples).length > 0
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete structured content with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'content_metrics': this.calculateContentMetrics(),
        'structure_analysis': this.calculateStructureAnalysis()
      },
      raw: {
        'structured_content': this.buildRawStructuredData()
      }
    }
  }

  /**
   * Convert structured content to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [StructuredContentDTO.Keys.CONTENT_DEPTH]: String(this.maxDepth),
      [StructuredContentDTO.Keys.CONTENT_FILE_PATH]: this.filePath,
      [StructuredContentDTO.Keys.CONTENT_SECTIONS_COUNT]: String(this.getAllSections().length),
      [StructuredContentDTO.Keys.CONTENT_TOTAL_CODE_BLOCKS]: String(this.totalCodeBlocks),
      [StructuredContentDTO.Keys.CONTENT_TOTAL_LINKS]: String(this.totalLinks)
    }
  }

  /**
   * Build raw structured content data
   * 
   * @returns Raw structured content exactly as organized
   */
  private buildRawStructuredData(): JsonObject {
    return {
      'code_examples': this.codeExamples,
      'content_tags': this.contentTags,
      'file_path': this.filePath,
      'link_categories': this.linkCategories,
      'sections': this.sections,
      'structured_at': this.structuredAt.toISOString(),
      'table_of_contents': this.tableOfContents
    }
  }

  /**
   * Calculate comprehensive content metrics
   * 
   * @returns Metrics about content distribution and organization
   */
  private calculateContentMetrics(): JsonObject {
    // Code distribution analysis
    const codeDistribution: Record<string, number> = {}
    for (const [language, blocks] of Object.entries(this.codeExamples)) {
      codeDistribution[language] = blocks.length
    }
    
    // Link distribution analysis
    const linkDistribution: Record<string, number> = {}
    for (const [category, links] of Object.entries(this.linkCategories)) {
      linkDistribution[category] = links.length
    }
    
    // Content density analysis
    const allSections = this.getAllSections()
    const avgContentLength = allSections.length > 0 ? 
      Math.round(allSections.reduce((sum, section) => sum + section.content.length, 0) / allSections.length) : 0
    
    return {
      'average_section_length': avgContentLength,
      'code_distribution': codeDistribution,
      'link_distribution': linkDistribution,
      'total_code_blocks': this.totalCodeBlocks,
      'total_links': this.totalLinks,
      'total_sections': allSections.length
    }
  }

  /**
   * Calculate maximum depth in section hierarchy
   * 
   * @param sections - Array of content sections to analyze
   * @param currentDepth - Current recursion depth
   * @returns Maximum depth found
   */
  private calculateMaxDepth(sections: TContentSection[], currentDepth = 0): number {
    if (sections.length === 0) return currentDepth

    let maxDepth = currentDepth
    
    for (const section of sections) {
      if (section.subsections.length > 0) {
        const subDepth = this.calculateMaxDepth(section.subsections, currentDepth + 1)
        maxDepth = Math.max(maxDepth, subDepth)
      }
    }
    
    return maxDepth
  }

  /**
   * Calculate structural balance of the content hierarchy
   * 
   * @param sectionsByLevel - Sections organized by level
   * @returns Balance metrics for the content structure
   */
  private calculateStructuralBalance(sectionsByLevel: Record<number, TContentSection[]>): JsonObject {
    const levels = Object.keys(sectionsByLevel).map(Number).sort()
    if (levels.length === 0) return { balance_score: 0, is_balanced: false }
    
    // Calculate balance based on section distribution across levels
    const counts = levels.map(level => sectionsByLevel[level]?.length || 0)
    const totalSections = counts.reduce((sum, count) => sum + count, 0)
    
    // Balance score: how evenly distributed sections are across levels
    const averagePerLevel = totalSections / levels.length
    const variance = counts.reduce((sum, count) => sum + (count - averagePerLevel)**2, 0) / levels.length
    const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 10)
    
    return {
      'balance_score': Math.round(balanceScore),
      'is_balanced': balanceScore >= 70,
      'level_distribution': counts,
      'top_heavy': counts.length > 1 && (counts[0] || 0) > (counts[1] || 0) * 2,
      'well_distributed': variance < averagePerLevel
    }
  }

  /**
   * Calculate comprehensive structure analysis
   * 
   * @returns Analysis of content hierarchy and organization
   */
  private calculateStructureAnalysis(): JsonObject {
    const sectionsByLevel = this.getSectionsByLevel()
    const complexity = this.getOrganizationComplexity()
    
    // Organization patterns
    const organizationPatterns = {
      'has_balanced_hierarchy': this.hasBalancedHierarchy(sectionsByLevel),
      'has_comprehensive_structure': this.hasComprehensiveStructure(),
      'has_deep_nesting': this.maxDepth > 4,
      'has_flat_structure': this.maxDepth <= 2,
      'has_table_of_contents': this.tableOfContents.length > 0,
      'is_well_organized': complexity >= 50 && complexity <= 80
    }
    
    // Convert section counts for JSON serialization
    const sectionsCountByLevel: Record<string, number> = {}
    for (const [level, sections] of Object.entries(sectionsByLevel)) {
      if (sections) {
        sectionsCountByLevel[`level_${level}`] = sections.length
      }
    }
    
    return {
      'complexity_score': complexity,
      'max_depth': this.maxDepth,
      'organization_patterns': organizationPatterns,
      'sections_by_level': sectionsCountByLevel,
      'structural_balance': this.calculateStructuralBalance(sectionsByLevel)
    }
  }

  /**
   * Flatten sections recursively into a single array
   * 
   * @param sections - Sections to flatten
   * @returns Flattened array of all sections
   */
  private flattenSections(sections: TContentSection[]): TContentSection[] {
    const flattened: TContentSection[] = []
    
    for (const section of sections) {
      flattened.push(section)
      if (section.subsections.length > 0) {
        flattened.push(...this.flattenSections(section.subsections))
      }
    }
    
    return flattened
  }

  /**
   * Check if hierarchy has balanced distribution
   * 
   * @param sectionsByLevel - Sections organized by level
   * @returns True if hierarchy appears balanced
   */
  private hasBalancedHierarchy(sectionsByLevel: Record<number, TContentSection[]>): boolean {
    const levels = Object.keys(sectionsByLevel).map(Number)
    if (levels.length <= 1) return true
    
    // A balanced hierarchy has reasonable distribution across levels
    const counts = levels.map(level => sectionsByLevel[level]?.length || 0)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    
    // Balance if the ratio between max and min sections per level isn't too extreme
    return max / min <= 3
  }
}