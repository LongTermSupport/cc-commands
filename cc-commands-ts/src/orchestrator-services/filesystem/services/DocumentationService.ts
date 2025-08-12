/**
 * @file Documentation Service Implementation
 * 
 * Provides documentation discovery and parsing capabilities WITHOUT content
 * interpretation. Extracts only structured data - all content analysis and
 * decision-making is handled by LLM commands.
 */

// import { promises as fs } from 'node:fs' // Not used directly in this service
import { basename, dirname, extname, resolve } from 'node:path'

import { DocumentationContentDTO } from '../dto/DocumentationContentDTO.js'
import { DocumentationDiscoveryDTO } from '../dto/DocumentationDiscoveryDTO.js'
import { DocumentationMetadataDTO } from '../dto/DocumentationMetadataDTO.js'
import { FilePreviewDTO } from '../dto/FilePreviewDTO.js'
import { StructuredContentDTO, TContentSection } from '../dto/StructuredContentDTO.js'
import { FileOperationError } from '../errors/FileOperationError.js'
import { IDocumentationService } from '../interfaces/IDocumentationService.js'
import { IFileDiscoveryService } from '../interfaces/IFileDiscoveryService.js'
import { IFileOperationsService } from '../interfaces/IFileOperationsService.js'
import { TDocumentationType } from '../types/FilesystemTypes.js'

/**
 * Implementation of documentation service
 * 
 * ARCHITECTURAL BOUNDARY: This service extracts structured data only.
 * NO content interpretation, relevance assessment, or reading order suggestions.
 * LLM commands handle all content analysis and decision-making.
 */
export class DocumentationService implements IDocumentationService {
  
  constructor(
    private readonly fileOperations: IFileOperationsService,
    private readonly fileDiscovery: IFileDiscoveryService
  ) {}

  /**
   * Categorize documentation files by type
   */
  async categorizeDocumentationFiles(paths: string[]): Promise<{
    claudeFiles: string[]
    docsDirectoryFiles: string[]
    markdownFiles: string[]
    otherFiles: string[]
    readmeFiles: string[]
  }> {
    const categorization = {
      claudeFiles: [] as string[],
      docsDirectoryFiles: [] as string[],
      markdownFiles: [] as string[],
      otherFiles: [] as string[],
      readmeFiles: [] as string[]
    }
    
    for (const filePath of paths) {
      const fileName = basename(filePath).toLowerCase()
      const dirName = dirname(filePath).toLowerCase()
      const extension = extname(filePath).toLowerCase()
      
      // Categorize by filename patterns
      if (fileName.startsWith('readme')) {
        categorization.readmeFiles.push(filePath)
      } else if (fileName === 'claude.md' || fileName.startsWith('claude')) {
        categorization.claudeFiles.push(filePath)
      } else if (dirName.includes('docs') || dirName.includes('documentation')) {
        categorization.docsDirectoryFiles.push(filePath)
      } else if (extension === '.md' || extension === '.markdown') {
        categorization.markdownFiles.push(filePath)
      } else {
        categorization.otherFiles.push(filePath)
      }
    }
    
    return categorization
  }

  /**
   * Extract frontmatter from markdown files
   */
  async extractFrontmatter(path: string): Promise<null | Record<string, unknown>> {
    try {
      if (!(await this.fileOperations.pathExists(path))) {
        throw FileOperationError.fileNotFound(path)
      }
      
      const content = await this.fileOperations.readFile(path)
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      
      if (!frontmatterMatch) {
        return null
      }
      
      try {
        // Simple YAML-like parsing for basic frontmatter
        const frontmatterText = frontmatterMatch?.[1]
        if (!frontmatterText) return null
        const frontmatter: Record<string, unknown> = {}
        
        const lines = frontmatterText.split('\n')
        for (const line of lines) {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.slice(0, Math.max(0, colonIndex)).trim()
            const value = line.slice(Math.max(0, colonIndex + 1)).trim()
            
            // Basic type conversion
            if (value === 'true' || value === 'false') {
              frontmatter[key] = value === 'true'
            } else if (/^\d+$/.test(value)) {
              frontmatter[key] = Number.parseInt(value, 10)
            } else if (/^\d+\.\d+$/.test(value)) {
              frontmatter[key] = Number.parseFloat(value)
            } else {
              frontmatter[key] = value.replaceAll(/^["']|["']$/g, '') // Remove quotes
            }
          }
        }
        
        return frontmatter
      } catch (error) {
        throw FileOperationError.contentParseError(path, 'frontmatter', error as Error)
      }
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Extract structured content from markdown text
   */
  async extractStructuredContent(path: string, content: string): Promise<StructuredContentDTO> {
    try {
      const headings = this.extractHeadings(content)
      const codeBlocks = this.extractCodeBlocks(content)
      const links = this.extractLinks(content)
      
      // Create proper content sections from headings
      const sections: TContentSection[] = headings.map((heading) => ({
        codeBlocks: [], // Could be enhanced to extract per-section code blocks
        content: `Section content for ${heading}`,
        level: 1, // Simplified for now
        links: [], // Could be enhanced to extract per-section links
        subsections: [],
        title: heading
      }))
      
      // Create code examples categorized by language
      const codeExamples: Record<string, string[]> = {
        'general': codeBlocks
      }
      
      // Create link categories
      const linkCategories: Record<string, Array<{ text: string; url: string }>> = {
        'general': links
      }
      
      return new StructuredContentDTO(
        path,
        sections,
        headings, // Table of contents from headings
        codeExamples,
        linkCategories,
        [] // content tags - can be enhanced later
      )
    } catch (error) {
      throw FileOperationError.contentParseError(path, 'structured content', error as Error)
    }
  }

  /**
   * Discover all documentation files in project
   */
  async findDocumentationFiles(directory = '.'): Promise<DocumentationDiscoveryDTO> {
    const startTime = Date.now()
    const searchDirectory = resolve(directory)
    
    try {
      // Find markdown files and common documentation files
      const mdFiles = await this.fileDiscovery.findFilesByExtension(['.md', '.markdown'], directory)
      
      // Find README files (case insensitive)
      const readmeFiles = await this.fileDiscovery.findFiles('**/README*', directory)
      
      // Find text files that might be documentation
      const txtFiles = await this.fileDiscovery.findFilesByExtension(['.txt'], directory)
      
      // Combine all potential documentation files
      const allFiles = new Set<string>()
      
      // Add markdown files
      for (const file of mdFiles.files) allFiles.add(file.path)
      
      // Add README files
      for (const file of readmeFiles.files) allFiles.add(file.path)
      
      // Add text files in docs directories or with documentation-related names
      for (const file of txtFiles.files) {
        const filePath = file.path.toLowerCase()
        if (filePath.includes('docs') || 
            filePath.includes('documentation') ||
            filePath.includes('guide') ||
            filePath.includes('help')) {
          allFiles.add(file.path)
        }
      }
      
      const allDocPaths = [...allFiles]
      
      // Filter out cc-commands directories and other exclusions
      const filteredPaths = allDocPaths.filter(filePath => {
        const pathLower = filePath.toLowerCase()
        return !pathLower.includes('node_modules') &&
               !pathLower.includes('.git') &&
               !pathLower.includes('cc-commands-ts') // Exclude this project itself
      })
      
      // Categorize the files
      const categorization = await this.categorizeDocumentationFiles(filteredPaths)
      
      // Convert file paths to FileMetadataDTO
      const readmeMetadata = await this.fileDiscovery.getMultipleFileMetadata(categorization.readmeFiles)
      const claudeMetadata = await this.fileDiscovery.getMultipleFileMetadata(categorization.claudeFiles)
      const docsMetadata = await this.fileDiscovery.getMultipleFileMetadata(categorization.docsDirectoryFiles)
      const markdownMetadata = await this.fileDiscovery.getMultipleFileMetadata(categorization.markdownFiles)
      
      const duration = Date.now() - startTime
      
      return new DocumentationDiscoveryDTO(
        readmeMetadata,
        claudeMetadata,
        docsMetadata,
        markdownMetadata,
        duration,
        searchDirectory
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Get metadata for a documentation file
   */
  async getDocumentationMetadata(path: string): Promise<DocumentationMetadataDTO> {
    try {
      if (!(await this.fileOperations.pathExists(path))) {
        throw FileOperationError.fileNotFound(path)
      }
      
      const fileMetadata = await this.fileDiscovery.getFileMetadata(path)
      const content = await this.fileOperations.readFile(path)
      
      // Determine documentation type
      const docType = this.determineDocumentationType(path)
      
      // Extract basic content statistics and components
      const headings = this.extractHeadings(content)
      const wordCount = this.calculateWordCount(content)
      const headingCount = headings.length
      
      // Extract frontmatter
      const frontmatter = await this.extractFrontmatter(path)
      
      return new DocumentationMetadataDTO(
        fileMetadata.path,
        headingCount > 0 ? headings?.[0] || 'Untitled' : 'Untitled',
        `${docType} file with ${wordCount} words`,
        frontmatter?.['author'] as string || 'Unknown',
        frontmatter?.['version'] as string || '1.0',
        docType,
        frontmatter?.['tags'] as string[] || [],
        fileMetadata.created,
        fileMetadata.modified,
        frontmatter ? 
          Object.fromEntries(Object.entries(frontmatter).map(([k, v]) => [k, String(v)])) :
          {}
      )
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Get file previews for multiple documentation files
   */
  async getDocumentationPreviews(paths: string[], previewLines = 5): Promise<FilePreviewDTO[]> {
    const previews: FilePreviewDTO[] = []
    
    for (const filePath of paths) {
      try {
        const preview = await this.createFilePreview(filePath, previewLines)
        previews.push(preview)
      } catch (error) {
        // Continue with other files if one fails
        console.warn(`Warning: Could not create preview for ${filePath}:`, error)
      }
    }
    
    return previews
  }

  /**
   * Get documentation file statistics
   */
  async getDocumentationStatistics(directory = '.'): Promise<{
    averageSize: number
    claudeCount: number
    docsDirectoryCount: number
    lastModified: Date | null
    markdownCount: number
    readmeCount: number
    totalFiles: number
    totalSize: number
  }> {
    try {
      const discovery = await this.findDocumentationFiles(directory)
      
      const allPaths = [
        ...discovery.readmeFiles.map(f => f.path),
        ...discovery.claudeFiles.map(f => f.path), 
        ...discovery.docsDirectory.map(f => f.path),
        ...discovery.markdownFiles.map(f => f.path)
      ]
      
      let totalSize = 0
      let lastModified: Date | null = null
      
      // Get file metadata for all files
      for (const filePath of allPaths) {
        try {
          const metadata = await this.fileDiscovery.getFileMetadata(filePath)
          totalSize += metadata.size
          
          if (!lastModified || metadata.modified > lastModified) {
            lastModified = metadata.modified
          }
        } catch {
          // Continue if we can't get metadata for a file
        }
      }
      
      const totalFiles = allPaths.length
      const averageSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0
      
      return {
        averageSize,
        claudeCount: discovery.claudeFiles.length,
        docsDirectoryCount: discovery.docsDirectory.length,
        lastModified,
        markdownCount: discovery.markdownFiles.length,
        readmeCount: discovery.readmeFiles.length,
        totalFiles,
        totalSize
      }
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Parse a documentation file and extract structured content
   */
  async parseDocumentationFile(path: string): Promise<DocumentationContentDTO> {
    try {
      if (!(await this.fileOperations.pathExists(path))) {
        throw FileOperationError.fileNotFound(path)
      }
      
      const content = await this.fileOperations.readFile(path)
      
      // Extract content components
      const headings = this.extractHeadings(content)
      const codeBlocks = this.extractCodeBlocks(content)
      const links = this.extractLinks(content)
      const frontmatter = this.extractFrontmatterFromContent(content)
      
      return new DocumentationContentDTO(
        path,
        content, // raw content
        headings,
        codeBlocks,
        links,
        frontmatter ? 
          Object.fromEntries(Object.entries(frontmatter).map(([k, v]) => [k, String(v)])) :
          {} // Convert frontmatter to Record<string, string>
      )
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Search for specific patterns in documentation content
   */
  async searchDocumentationContent(
    pattern: RegExp,
    directory = '.'
  ): Promise<{
    filesWithMatches: number
    matches: Array<{
      context: string
      filePath: string
      lineNumber: number
      matchedText: string
    }>
    totalMatches: number
  }> {
    try {
      const discovery = await this.findDocumentationFiles(directory)
      const allPaths = [
        ...discovery.readmeFiles.map(f => f.path),
        ...discovery.claudeFiles.map(f => f.path),
        ...discovery.docsDirectory.map(f => f.path),
        ...discovery.markdownFiles.map(f => f.path)
      ]
      
      const matches: Array<{
        context: string
        filePath: string
        lineNumber: number
        matchedText: string
      }> = []
      
      const filesWithMatches = new Set<string>()
      
      for (const filePath of allPaths) {
        try {
          const content = await this.fileOperations.readFile(filePath)
          const lines = content.split('\n')
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (!line) continue
            const matchResult = line.match(pattern)
            
            if (matchResult) {
              filesWithMatches.add(filePath)
              
              // Create context (line before and after)
              const contextLines = []
              if (i > 0 && lines[i - 1] !== undefined) contextLines.push(lines[i - 1])
              contextLines.push(line)
              if (i < lines.length - 1 && lines[i + 1] !== undefined) contextLines.push(lines[i + 1])
              
              matches.push({
                context: contextLines.join('\n'),
                filePath,
                lineNumber: i + 1,
                matchedText: matchResult?.[0] || ''
              })
            }
          }
        } catch {
          // Continue if we can't read a file
        }
      }
      
      return {
        filesWithMatches: filesWithMatches.size,
        matches,
        totalMatches: matches.length
      }
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Calculate word count in content
   * 
   * @private
   * @param content - Text content to count
   * @returns Word count
   */
  private calculateWordCount(content: string): number {
    // Remove code blocks and other non-prose content for more accurate count
    const textContent = content
      .replaceAll(/```[\s\S]*?```/g, '') // Remove code blocks
      .replaceAll(/`[^`]+`/g, '')        // Remove inline code
      .replaceAll(/^\s*#+\s+/gm, '')     // Remove heading markers
      .replaceAll(/^\s*[-*+]\s+/gm, '')  // Remove list markers
      .replaceAll(/^\s*\d+\.\s+/gm, '')  // Remove numbered list markers
    
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0)
    return words.length
  }

  /**
   * Create file preview DTO
   * 
   * @private
   * @param filePath - Path to file
   * @param previewLines - Number of lines to preview
   * @returns FilePreviewDTO instance
   */
  private async createFilePreview(filePath: string, previewLines: number): Promise<FilePreviewDTO> {
    try {
      const content = await this.fileOperations.readFile(filePath)
      const lines = content.split('\n')
      const firstLines = lines.slice(0, previewLines)
      const isEmpty = content.trim().length === 0
      const isReadable = true // If we got here, it's readable
      const encoding = 'utf8' // Assume UTF-8 for text files
      
      return FilePreviewDTO.fromPreviewOperation(filePath, {
        encoding,
        firstLines,
        isEmpty,
        isReadable,
        totalLines: lines.length
      })
    } catch (error) {
      // Return error preview
      return FilePreviewDTO.fromPreviewOperation(filePath, {
        encoding: 'unknown',
        firstLines: [`Error reading file: ${error}`],
        isEmpty: false,
        isReadable: false
      })
    }
  }

  /**
   * Determine documentation type from file path
   * 
   * @private
   * @param filePath - File path to analyze
   * @returns Documentation type
   */
  private determineDocumentationType(filePath: string): TDocumentationType {
    const fileName = basename(filePath).toLowerCase()
    const dirPath = dirname(filePath).toLowerCase()
    
    if (fileName.startsWith('readme')) {
      return 'readme'
    }
    
    if (fileName === 'claude.md' || fileName.startsWith('claude')) {
      return 'claude'
    }
    
    if (dirPath.includes('docs') || dirPath.includes('documentation')) {
      return 'docs'
    }
    
    if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      return 'markdown'
    }
    
    return 'other'
  }

  /**
   * Extract code blocks from markdown content
   * 
   * @private
   * @param content - Markdown content
   * @returns Array of code block contents
   */
  private extractCodeBlocks(content: string): string[] {
    const codeBlocks: string[] = []
    
    // Match fenced code blocks
    const fencedBlocks = content.match(/```[\s\S]*?```/g)
    if (fencedBlocks) {
      for (const block of fencedBlocks) {
        // Remove the fences and get the content
        const codeContent = block.replaceAll(/^```.*?\n|```$/g, '')
        codeBlocks.push(codeContent.trim())
      }
    }
    
    // Match indented code blocks (4+ spaces)
    const lines = content.split('\n')
    let inCodeBlock = false
    let currentBlock = ''
    
    for (const line of lines) {
      if (line.startsWith('    ') || /^\t/.test(line)) {
        // Line is indented - part of code block
        if (!inCodeBlock) {
          inCodeBlock = true
          currentBlock = ''
        }

        currentBlock += line.replace(/^ {4}|^\t/, '') + '\n'
      } else if (line.trim() === '' && inCodeBlock) {
        // Empty line in code block
        currentBlock += '\n'
      } else if (inCodeBlock) {
        // End of code block
        if (currentBlock.trim()) {
          codeBlocks.push(currentBlock.trim())
        }

        inCodeBlock = false
        currentBlock = ''
      }
    }
    
    // Don't forget the last block
    if (inCodeBlock && currentBlock.trim()) {
      codeBlocks.push(currentBlock.trim())
    }
    
    return codeBlocks
  }

  /**
   * Extract frontmatter from content string
   * 
   * @private
   * @param content - File content
   * @returns Frontmatter object or null
   */
  private extractFrontmatterFromContent(content: string): null | Record<string, unknown> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    
    if (!frontmatterMatch) {
      return null
    }
    
    try {
      const frontmatterText = frontmatterMatch?.[1]
      if (!frontmatterText) return null
      const frontmatter: Record<string, unknown> = {}
      
      const lines = frontmatterText.split('\n')
      for (const line of lines) {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.slice(0, Math.max(0, colonIndex)).trim()
          const value = line.slice(Math.max(0, colonIndex + 1)).trim()
          
          // Basic type conversion
          if (value === 'true' || value === 'false') {
            frontmatter[key] = value === 'true'
          } else if (/^\d+$/.test(value)) {
            frontmatter[key] = Number.parseInt(value, 10)
          } else if (/^\d+\.\d+$/.test(value)) {
            frontmatter[key] = Number.parseFloat(value)
          } else {
            frontmatter[key] = value.replaceAll(/^["']|["']$/g, '') // Remove quotes
          }
        }
      }
      
      return frontmatter
    } catch {
      return null
    }
  }

  /**
   * Extract headings from markdown content
   * 
   * @private
   * @param content - Markdown content
   * @returns Array of heading texts
   */
  private extractHeadings(content: string): string[] {
    const headings: string[] = []
    const headingMatches = content.match(/^#+\s+(.+)$/gm)
    
    if (headingMatches) {
      for (const match of headingMatches) {
        const headingText = match.replace(/^#+\s+/, '').trim()
        headings.push(headingText)
      }
    }
    
    return headings
  }

  /**
   * Extract links from markdown content
   * 
   * @private
   * @param content - Markdown content
   * @returns Array of link objects
   */
  private extractLinks(content: string): Array<{ text: string; url: string }> {
    const links: Array<{ text: string; url: string }> = []
    
    // Match markdown links [text](url)
    const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g)
    
    if (linkMatches) {
      for (const match of linkMatches) {
        const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/)
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
          links.push({
            text: linkMatch?.[1] || '',
            url: linkMatch?.[2] || ''
          })
        }
      }
    }
    
    return links
  }
}