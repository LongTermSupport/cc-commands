/**
 * @file Documentation Content Data Transfer Object
 * 
 * Represents parsed content from a documentation file including raw text,
 * extracted headings, code blocks, links, and metadata. Provides structured
 * access to documentation content without interpretation.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'

/**
 * Data Transfer Object for documentation file content
 * 
 * This DTO represents the parsed content of a documentation file with
 * structured extraction of headings, code blocks, and other elements.
 */
export class DocumentationContentDTO implements ILLMDataDTO {
  private static readonly Keys = {
    DOC_CODE_BLOCKS_COUNT: 'DOC_CODE_BLOCKS_COUNT',
    DOC_FILE_PATH: 'DOC_FILE_PATH',
    DOC_HEADINGS_COUNT: 'DOC_HEADINGS_COUNT',
    DOC_LINKS_COUNT: 'DOC_LINKS_COUNT',
    DOC_WORD_COUNT: 'DOC_WORD_COUNT'
  } as const

  constructor(
    public readonly filePath: string,
    public readonly rawContent: string,
    public readonly headings: string[],
    public readonly codeBlocks: string[],
    public readonly links: Array<{ text: string; url: string }>,
    public readonly metadata: Record<string, string>,
    public readonly parsedAt: Date = new Date()
  ) {}

  /**
   * Create DocumentationContentDTO from file parsing
   * 
   * @param filePath - Path to the documentation file
   * @param content - Raw file content
   * @param parseResults - Results from content parsing
   * @returns New DocumentationContentDTO instance
   */
  static fromParsedContent(
    filePath: string,
    content: string,
    parseResults: {
      codeBlocks: string[]
      headings: string[]
      links: Array<{ text: string; url: string }>
      metadata?: Record<string, string>
    }
  ): DocumentationContentDTO {
    return new DocumentationContentDTO(
      filePath,
      content,
      parseResults.headings,
      parseResults.codeBlocks,
      parseResults.links,
      parseResults.metadata || {}
    )
  }

  /**
   * Get word count from raw content
   * 
   * @returns Number of words in the document
   */
  get wordCount(): number {
    return this.rawContent.split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Get code blocks by language
   * 
   * @returns Code blocks grouped by programming language
   */
  getCodeBlocksByLanguage(): Record<string, string[]> {
    const byLanguage: Record<string, string[]> = {}
    
    for (const block of this.codeBlocks) {
      // Extract language from code fence (e.g., ```typescript)
      const languageMatch = block.match(/^```(\w+)/)
      const language = languageMatch?.[1] ?? 'unknown'
      
      if (!byLanguage[language]) {
        byLanguage[language] = []
      }
      
      // Remove the language identifier from the block
      const cleanBlock = block.replace(/^```\w*\n?/, '').replace(/```$/, '')
      byLanguage[language].push(cleanBlock)
    }
    
    return byLanguage
  }

  /**
   * Get content statistics
   * 
   * @returns Statistical analysis of document content
   */
  getContentStatistics(): {
    characters: number
    codeBlocks: number
    headings: number
    links: number
    paragraphs: number
    words: number
  } {
    const paragraphs = this.rawContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    
    return {
      characters: this.rawContent.length,
      codeBlocks: this.codeBlocks.length,
      headings: this.headings.length,
      links: this.links.length,
      paragraphs,
      words: this.wordCount
    }
  }

  /**
   * Get document complexity score
   * 
   * @returns Complexity score based on structure and content
   */
  getDocumentComplexity(): number {
    const stats = this.getContentStatistics()
    
    // Base complexity from word count
    let complexity = Math.min(stats.words / 1000, 1) * 30
    
    // Add complexity from structure
    complexity += Math.min(stats.headings / 10, 1) * 20
    complexity += Math.min(stats.codeBlocks / 5, 1) * 25
    complexity += Math.min(stats.links / 20, 1) * 15
    
    // Metadata adds to complexity
    complexity += Math.min(Object.keys(this.metadata).length / 5, 1) * 10
    
    return Math.round(complexity)
  }

  /**
   * Get comprehensive jq query hints for documentation content data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw content data
      { 
        description: 'Documentation file path', 
        query: '.raw.documentation_content.file_path',
        scope: 'single_item'
      },
      { 
        description: 'Raw documentation content text', 
        query: '.raw.documentation_content.raw_content',
        scope: 'single_item'
      },
      { 
        description: 'Array of extracted headings', 
        query: '.raw.documentation_content.headings',
        scope: 'single_item'
      },
      { 
        description: 'Array of code blocks found', 
        query: '.raw.documentation_content.code_blocks',
        scope: 'single_item'
      },
      { 
        description: 'Array of links with text and URLs', 
        query: '.raw.documentation_content.links',
        scope: 'single_item'
      },
      { 
        description: 'Document metadata key-value pairs', 
        query: '.raw.documentation_content.metadata',
        scope: 'single_item'
      },
      
      // Calculated content analysis
      { 
        description: 'Content statistics (calculated)', 
        query: '.calculated.content_analysis.statistics',
        scope: 'single_item'
      },
      { 
        description: 'Word count (calculated)', 
        query: '.calculated.content_analysis.statistics.word_count',
        scope: 'single_item'
      },
      { 
        description: 'Code blocks organized by language (calculated)', 
        query: '.calculated.content_analysis.code_analysis.by_language',
        scope: 'single_item'
      },
      { 
        description: 'Document structure analysis (calculated)', 
        query: '.calculated.content_analysis.structure_analysis',
        scope: 'single_item'
      },
      { 
        description: 'Link analysis and categorization (calculated)', 
        query: '.calculated.content_analysis.link_analysis',
        scope: 'single_item'
      },
      
      // Specific content queries
      { 
        description: 'Top-level headings only', 
        query: '.raw.documentation_content.headings[] | select(startswith("# "))',
        scope: 'single_item'
      },
      { 
        description: 'External links only', 
        query: '.calculated.content_analysis.link_analysis.external_links',
        scope: 'single_item'
      },
      { 
        description: 'Code blocks count by language', 
        query: '.calculated.content_analysis.code_analysis.by_language | to_entries | map({language: .key, count: (.value | length)})',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get external vs internal links analysis
   * 
   * @returns Analysis of link types
   */
  getLinkAnalysis(): {
    external: Array<{ text: string; url: string }>
    internal: Array<{ text: string; url: string }>
    total: number
  } {
    const external: Array<{ text: string; url: string }> = []
    const internal: Array<{ text: string; url: string }> = []
    
    for (const link of this.links) {
      if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
        external.push(link)
      } else {
        internal.push(link)
      }
    }
    
    return {
      external,
      internal,
      total: this.links.length
    }
  }

  /**
   * Get summary of documentation content
   * 
   * @returns Brief content description for logging/debugging
   */
  getSummary(): string {
    const stats = this.getContentStatistics()
    return `${stats.words} words, ${stats.headings} headings, ${stats.codeBlocks} code blocks, ${stats.links} links`
  }

  /**
   * Check if document appears to be comprehensive
   * 
   * @returns True if document shows signs of being comprehensive
   */
  isComprehensiveDocument(): boolean {
    const stats = this.getContentStatistics()
    
    // Comprehensive docs typically have:
    // - Good word count (>500 words)
    // - Clear structure (>3 headings)
    // - Examples or code (>1 code block)
    // - References or links (>2 links)
    
    return stats.words > 500 && 
           stats.headings > 3 && 
           stats.codeBlocks > 0 && 
           stats.links > 1
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete documentation content with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'content_analysis': this.calculateContentAnalysis()
      },
      raw: {
        'documentation_content': this.buildRawContentData()
      }
    }
  }

  /**
   * Convert documentation content to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [DocumentationContentDTO.Keys.DOC_CODE_BLOCKS_COUNT]: String(this.codeBlocks.length),
      [DocumentationContentDTO.Keys.DOC_FILE_PATH]: this.filePath,
      [DocumentationContentDTO.Keys.DOC_HEADINGS_COUNT]: String(this.headings.length),
      [DocumentationContentDTO.Keys.DOC_LINKS_COUNT]: String(this.links.length),
      [DocumentationContentDTO.Keys.DOC_WORD_COUNT]: String(this.wordCount)
    }
  }

  /**
   * Build raw documentation content data structure
   * 
   * @returns Raw content data exactly as parsed
   */
  private buildRawContentData(): JsonObject {
    return {
      'code_blocks': this.codeBlocks,
      'file_path': this.filePath,
      'headings': this.headings,
      'links': this.links,
      'metadata': this.metadata,
      'parsed_at': this.parsedAt.toISOString(),
      'raw_content': this.rawContent
    }
  }

  /**
   * Calculate comprehensive content analysis
   * 
   * @returns Analysis of documentation content structure and characteristics
   */
  private calculateContentAnalysis(): JsonObject {
    const stats = this.getContentStatistics()
    const codeAnalysis = this.getCodeBlocksByLanguage()
    const linkAnalysis = this.getLinkAnalysis()
    const complexity = this.getDocumentComplexity()
    
    // Structure analysis
    const structureAnalysis = {
      'has_clear_structure': stats.headings > 2,
      'has_code_examples': stats.codeBlocks > 0,
      'has_external_references': linkAnalysis.external.length > 0,
      'has_metadata': Object.keys(this.metadata).length > 0,
      'is_comprehensive': this.isComprehensiveDocument(),
      'is_substantial_content': stats.words > 200
    }
    
    return {
      'code_analysis': {
        'by_language': codeAnalysis,
        'languages_used': Object.keys(codeAnalysis),
        'total_code_blocks': stats.codeBlocks
      },
      'complexity_score': complexity,
      'link_analysis': {
        'external_links': linkAnalysis.external,
        'external_links_count': linkAnalysis.external.length,
        'internal_links': linkAnalysis.internal,
        'internal_links_count': linkAnalysis.internal.length,
        'total_links': linkAnalysis.total
      },
      'statistics': {
        'character_count': stats.characters,
        'paragraph_count': stats.paragraphs,
        'word_count': stats.words
      },
      'structure_analysis': structureAnalysis
    }
  }
}