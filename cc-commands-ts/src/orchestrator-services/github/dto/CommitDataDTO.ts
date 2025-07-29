/**
 * @file GitHub Commit Data Transfer Object
 * 
 * Represents individual GitHub commits with transformation from GitHub API
 * responses to standardized LLM data format. Handles commit metadata,
 * author information, and change statistics.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'

/**
 * Data Transfer Object for GitHub commits
 * 
 * This DTO encapsulates information about individual GitHub commits,
 * including their metadata, author information, committer details,
 * and change statistics. It provides transformation from various
 * GitHub API formats to standardized LLM data format.
 */
export class CommitDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    COMMIT_ADDITIONS: 'COMMIT_ADDITIONS',
    COMMIT_AUTHOR_DATE: 'COMMIT_AUTHOR_DATE',
    COMMIT_AUTHOR_EMAIL: 'COMMIT_AUTHOR_EMAIL',
    COMMIT_AUTHOR_NAME: 'COMMIT_AUTHOR_NAME',
    COMMIT_COMMITTER_DATE: 'COMMIT_COMMITTER_DATE',
    COMMIT_COMMITTER_EMAIL: 'COMMIT_COMMITTER_EMAIL',
    COMMIT_COMMITTER_NAME: 'COMMIT_COMMITTER_NAME',
    COMMIT_DELETIONS: 'COMMIT_DELETIONS',
    COMMIT_FILES_CHANGED: 'COMMIT_FILES_CHANGED',
    COMMIT_MESSAGE: 'COMMIT_MESSAGE',
    COMMIT_PARENT_COUNT: 'COMMIT_PARENT_COUNT',
    COMMIT_REPOSITORY: 'COMMIT_REPOSITORY',
    COMMIT_SHA: 'COMMIT_SHA',
    COMMIT_SHA_SHORT: 'COMMIT_SHA_SHORT',
    COMMIT_TOTAL_CHANGES: 'COMMIT_TOTAL_CHANGES',
    COMMIT_URL: 'COMMIT_URL',
    COMMIT_VERIFICATION_REASON: 'COMMIT_VERIFICATION_REASON',
    COMMIT_VERIFICATION_SIGNATURE: 'COMMIT_VERIFICATION_SIGNATURE',
    COMMIT_VERIFICATION_VERIFIED: 'COMMIT_VERIFICATION_VERIFIED'
  } as const

  constructor(
    public readonly sha: string,
    public readonly shortSha: string,
    public readonly message: string,
    public readonly authorName: string,
    public readonly authorEmail: string,
    public readonly authorDate: Date,
    public readonly committerName: string,
    public readonly committerEmail: string,
    public readonly committerDate: Date,
    public readonly url: string,
    public readonly repository: string,
    public readonly additions: number,
    public readonly deletions: number,
    public readonly filesChanged: number,
    public readonly parentCount: number,
    public readonly verificationVerified: boolean,
    public readonly verificationReason: string,
    public readonly verificationSignature: null | string
  ) {}

  /**
   * Create CommitDataDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI commit commands
   * @returns New CommitDataDTO instance
   */
  static fromCliOutput(cliOutput: {
    additions?: number
    author?: { date?: string; email?: string; name?: string }
    committer?: { date?: string; email?: string; name?: string }
    deletions?: number
    files?: number
    message?: string
    oid?: string
    parents?: { totalCount?: number }
    repository?: string
    url?: string
    verification?: { reason?: string; signature?: null | string; verified?: boolean }
  }): CommitDataDTO {
    this.validateCliOutput(cliOutput)
    
    return this.createFromCliData(cliOutput)
  }

  /**
   * Create CommitDataDTO from GitHub REST API response
   * 
   * @param apiResponse - Raw response from GitHub REST API
   * @returns New CommitDataDTO instance
   */
  static fromGitHubApiResponse(apiResponse: {
    author?: { date?: string; email?: string; name?: string }
    commit?: {
      author?: { date?: string; email?: string; name?: string }
      committer?: { date?: string; email?: string; name?: string }
      message?: string
      url?: string
      verification?: { reason?: string; signature?: null | string; verified?: boolean }
    }
    committer?: { date?: string; email?: string; name?: string }
    html_url?: string
    parents?: unknown[]
    repository?: { full_name?: string }
    repository_url?: string
    sha?: string
    stats?: { additions?: number; deletions?: number; total?: number }
    url?: string
  }): CommitDataDTO {
    this.validateApiResponse(apiResponse)
    
    return this.createFromApiResponse(apiResponse)
  }

  /**
   * Create CommitDataDTO from GitHub GraphQL API response
   * 
   * @param apiResponse - Raw response from GitHub GraphQL API
   * @param repository - Repository name (owner/repo format)
   * @returns New CommitDataDTO instance
   */
  static fromGraphQLResponse(apiResponse: {
    additions?: number
    author?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
    authoredDate?: string
    changedFiles?: number
    committedDate?: string
    committer?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
    deletions?: number
    message?: string
    messageBody?: string
    messageHeadline?: string
    oid?: string
    parents?: { totalCount?: number }
    signature?: {
      isValid?: boolean
      payload?: string
      signature?: string
      state?: string
    }
    url?: string
  }, repository: string): CommitDataDTO {
    this.validateGraphQLResponse(apiResponse)
    
    return this.createFromGraphQLResponse(apiResponse, repository)
  }

  /**
   * Create CommitDataDTO from REST API response data
   */
  private static createFromApiResponse(apiResponse: {
    author?: { date?: string; email?: string; name?: string }
    commit?: {
      author?: { date?: string; email?: string; name?: string }
      committer?: { date?: string; email?: string; name?: string }
      message?: string
      url?: string
      verification?: { reason?: string; signature?: null | string; verified?: boolean }
    }
    committer?: { date?: string; email?: string; name?: string }
    html_url?: string
    parents?: unknown[]
    repository?: { full_name?: string }
    repository_url?: string
    sha?: string
    stats?: { additions?: number; deletions?: number; total?: number }
    url?: string
  }): CommitDataDTO {
    const basicData = this.extractApiBasicData(apiResponse)
    const people = this.extractApiPeople(apiResponse)
    const stats = this.extractApiStats(apiResponse)
    const verification = this.extractApiVerification(apiResponse)
    
    return new CommitDataDTO(
      basicData.sha,
      basicData.shortSha,
      basicData.message,
      people.authorName,
      people.authorEmail,
      people.authorDate,
      people.committerName,
      people.committerEmail,
      people.committerDate,
      basicData.url,
      basicData.repository,
      stats.additions,
      stats.deletions,
      stats.filesChanged,
      stats.parentCount,
      verification.verified,
      verification.reason,
      verification.signature
    )
  }

  /**
   * Create CommitDataDTO from processed CLI data
   */
  private static createFromCliData(cliOutput: {
    additions?: number
    author?: { date?: string; email?: string; name?: string }
    committer?: { date?: string; email?: string; name?: string }
    deletions?: number
    files?: number
    message?: string
    oid?: string
    parents?: { totalCount?: number }
    repository?: string
    url?: string
    verification?: { reason?: string; signature?: null | string; verified?: boolean }
  }): CommitDataDTO {
    const basicData = this.extractCliBasicData(cliOutput)
    const people = this.extractCliPeople(cliOutput)
    const stats = this.extractCliStats(cliOutput)
    const verification = this.extractCliVerification(cliOutput)
    
    return new CommitDataDTO(
      basicData.sha,
      basicData.shortSha,
      basicData.message,
      people.authorName,
      people.authorEmail,
      people.authorDate,
      people.committerName,
      people.committerEmail,
      people.committerDate,
      basicData.url,
      basicData.repository,
      stats.additions,
      stats.deletions,
      stats.filesChanged,
      stats.parentCount,
      verification.verified,
      verification.reason,
      verification.signature
    )
  }

  /**
   * Create CommitDataDTO from GraphQL response data
   */
  private static createFromGraphQLResponse(apiResponse: {
    additions?: number
    author?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
    authoredDate?: string
    changedFiles?: number
    committedDate?: string
    committer?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
    deletions?: number
    message?: string
    messageBody?: string
    messageHeadline?: string
    oid?: string
    parents?: { totalCount?: number }
    signature?: {
      isValid?: boolean
      payload?: string
      signature?: string
      state?: string
    }
    url?: string
  }, repository: string): CommitDataDTO {
    const basicData = this.extractGraphQLBasicData(apiResponse, repository)
    const people = this.extractGraphQLPeople(apiResponse)
    const stats = this.extractGraphQLStats(apiResponse)
    const verification = this.extractGraphQLVerification(apiResponse)
    
    return new CommitDataDTO(
      basicData.sha,
      basicData.shortSha,
      basicData.message,
      people.authorName,
      people.authorEmail,
      people.authorDate,
      people.committerName,
      people.committerEmail,
      people.committerDate,
      basicData.url,
      basicData.repository,
      stats.additions,
      stats.deletions,
      stats.filesChanged,
      stats.parentCount,
      verification.verified,
      verification.reason,
      verification.signature
    )
  }

  /**
   * Extract basic data from API response
   */
  private static extractApiBasicData(apiResponse: {
    commit?: { message?: string; url?: string }
    html_url?: string
    repository?: { full_name?: string }
    repository_url?: string
    sha?: string
    url?: string
  }): {
    message: string
    repository: string
    sha: string
    shortSha: string
    url: string
  } {
    const sha = apiResponse.sha || ''
    const repository = this.extractRepository(apiResponse.repository?.full_name, apiResponse.repository_url)
    
    return {
      message: apiResponse.commit?.message || 'No commit message',
      repository,
      sha,
      shortSha: sha.slice(0, 7),
      url: apiResponse.html_url || apiResponse.url || ''
    }
  }

  /**
   * Extract people data from API response
   */
  private static extractApiPeople(apiResponse: {
    author?: { date?: string; email?: string; name?: string }
    commit?: {
      author?: { date?: string; email?: string; name?: string }
      committer?: { date?: string; email?: string; name?: string }
    }
    committer?: { date?: string; email?: string; name?: string }
  }): {
    authorDate: Date
    authorEmail: string
    authorName: string
    committerDate: Date
    committerEmail: string
    committerName: string
  } {
    const extractedAuthor = this.extractAuthorFromApi(apiResponse)
    const extractedCommitter = this.extractCommitterFromApi(apiResponse, extractedAuthor)
    
    return {
      authorDate: new Date(extractedAuthor.date || Date.now()),
      authorEmail: extractedAuthor.email || 'unknown@example.com',
      authorName: extractedAuthor.name || 'unknown',
      committerDate: new Date(extractedCommitter.date || extractedAuthor.date || Date.now()),
      committerEmail: extractedCommitter.email || extractedAuthor.email || 'unknown@example.com',
      committerName: extractedCommitter.name || extractedAuthor.name || 'unknown'
    }
  }

  /**
   * Extract stats from API response
   */
  private static extractApiStats(apiResponse: {
    parents?: unknown[]
    stats?: { additions?: number; deletions?: number; total?: number }
  }): {
    additions: number
    deletions: number
    filesChanged: number
    parentCount: number
  } {
    return {
      additions: apiResponse.stats?.additions || 0,
      deletions: apiResponse.stats?.deletions || 0,
      filesChanged: apiResponse.stats?.total || 0,
      parentCount: apiResponse.parents?.length || 0
    }
  }

  /**
   * Extract verification from API response
   */
  private static extractApiVerification(apiResponse: {
    commit?: {
      verification?: { reason?: string; signature?: null | string; verified?: boolean }
    }
  }): {
    reason: string
    signature: null | string
    verified: boolean
  } {
    const verification = apiResponse.commit?.verification
    return {
      reason: verification?.reason || 'unsigned',
      signature: verification?.signature || null,
      verified: Boolean(verification?.verified)
    }
  }

  /**
   * Extract author from API response
   */
  private static extractAuthorFromApi(apiResponse: {
    author?: { date?: string; email?: string; name?: string }
    commit?: {
      author?: { date?: string; email?: string; name?: string }
    }
  }): { date?: string; email?: string; name?: string } {
    return apiResponse.commit?.author || apiResponse.author || {}
  }

  /**
   * Extract basic data from CLI output
   */
  private static extractCliBasicData(cliOutput: {
    message?: string
    oid?: string
    repository?: string
    url?: string
  }): {
    message: string
    repository: string
    sha: string
    shortSha: string
    url: string
  } {
    const sha = cliOutput.oid || ''
    return {
      message: cliOutput.message || 'No commit message',
      repository: cliOutput.repository || 'unknown/unknown',
      sha,
      shortSha: sha.slice(0, 7),
      url: cliOutput.url || ''
    }
  }

  /**
   * Extract people data from CLI output
   */
  private static extractCliPeople(cliOutput: {
    author?: { date?: string; email?: string; name?: string }
    committer?: { date?: string; email?: string; name?: string }
  }): {
    authorDate: Date
    authorEmail: string
    authorName: string
    committerDate: Date
    committerEmail: string
    committerName: string
  } {
    return {
      authorDate: new Date(cliOutput.author?.date || Date.now()),
      authorEmail: cliOutput.author?.email || 'unknown@example.com',
      authorName: cliOutput.author?.name || 'unknown',
      committerDate: new Date(cliOutput.committer?.date || cliOutput.author?.date || Date.now()),
      committerEmail: cliOutput.committer?.email || cliOutput.author?.email || 'unknown@example.com',
      committerName: cliOutput.committer?.name || cliOutput.author?.name || 'unknown'
    }
  }

  /**
   * Extract stats from CLI output
   */
  private static extractCliStats(cliOutput: {
    additions?: number
    deletions?: number
    files?: number
    parents?: { totalCount?: number }
  }): {
    additions: number
    deletions: number
    filesChanged: number
    parentCount: number
  } {
    return {
      additions: cliOutput.additions || 0,
      deletions: cliOutput.deletions || 0,
      filesChanged: cliOutput.files || 0,
      parentCount: cliOutput.parents?.totalCount || 0
    }
  }

  /**
   * Extract verification from CLI output
   */
  private static extractCliVerification(cliOutput: {
    verification?: { reason?: string; signature?: null | string; verified?: boolean }
  }): {
    reason: string
    signature: null | string
    verified: boolean
  } {
    return {
      reason: cliOutput.verification?.reason || 'unsigned',
      signature: cliOutput.verification?.signature || null,
      verified: Boolean(cliOutput.verification?.verified)
    }
  }

  /**
   * Extract committer from API response
   */
  private static extractCommitterFromApi(
    apiResponse: {
      commit?: {
        committer?: { date?: string; email?: string; name?: string }
      }
      committer?: { date?: string; email?: string; name?: string }
    },
    fallbackAuthor: { date?: string; email?: string; name?: string }
  ): { date?: string; email?: string; name?: string } {
    return apiResponse.commit?.committer || apiResponse.committer || fallbackAuthor
  }

  /**
   * Extract author data from GraphQL response
   */
  private static extractGraphQLAuthorData(apiResponse: {
    author?: {
      date?: string
      email?: string
      name?: string
    }
    authoredDate?: string
  }): {
    date: Date
    email: string
    name: string
  } {
    const {author} = apiResponse
    return {
      date: new Date(apiResponse.authoredDate || author?.date || Date.now()),
      email: author?.email || 'unknown@example.com',
      name: author?.name || 'unknown'
    }
  }

  /**
   * Extract basic data from GraphQL response
   */
  private static extractGraphQLBasicData(apiResponse: {
    message?: string
    messageBody?: string
    messageHeadline?: string
    oid?: string
    url?: string
  }, repository: string): {
    message: string
    repository: string
    sha: string
    shortSha: string
    url: string
  } {
    const sha = apiResponse.oid || ''
    const message = apiResponse.message || 
                   (apiResponse.messageHeadline && apiResponse.messageBody 
                     ? `${apiResponse.messageHeadline}\n\n${apiResponse.messageBody}`.trim()
                     : apiResponse.messageHeadline || 'No commit message')
    
    return {
      message,
      repository,
      sha,
      shortSha: sha.slice(0, 7),
      url: apiResponse.url || ''
    }
  }

  /**
   * Extract committer data from GraphQL response
   */
  private static extractGraphQLCommitterData(
    apiResponse: {
      authoredDate?: string
      committedDate?: string
      committer?: {
        date?: string
        email?: string
        name?: string
      }
    },
    authorData: { date: Date; email: string; name: string }
  ): {
    date: Date
    email: string
    name: string
  } {
    const {committer} = apiResponse
    const fallbackDate = apiResponse.committedDate || apiResponse.authoredDate || authorData.date.toISOString()
    
    return {
      date: new Date(apiResponse.committedDate || committer?.date || fallbackDate),
      email: committer?.email || authorData.email,
      name: committer?.name || authorData.name
    }
  }

  /**
   * Extract people data from GraphQL response
   */
  private static extractGraphQLPeople(apiResponse: {
    author?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
    authoredDate?: string
    committedDate?: string
    committer?: {
      date?: string
      email?: string
      name?: string
      user?: { login?: string }
    }
  }): {
    authorDate: Date
    authorEmail: string
    authorName: string
    committerDate: Date
    committerEmail: string
    committerName: string
  } {
    const authorData = this.extractGraphQLAuthorData(apiResponse)
    const committerData = this.extractGraphQLCommitterData(apiResponse, authorData)
    
    return {
      authorDate: authorData.date,
      authorEmail: authorData.email,
      authorName: authorData.name,
      committerDate: committerData.date,
      committerEmail: committerData.email,
      committerName: committerData.name
    }
  }

  /**
   * Extract stats from GraphQL response
   */
  private static extractGraphQLStats(apiResponse: {
    additions?: number
    changedFiles?: number
    deletions?: number
    parents?: { totalCount?: number }
  }): {
    additions: number
    deletions: number
    filesChanged: number
    parentCount: number
  } {
    return {
      additions: apiResponse.additions || 0,
      deletions: apiResponse.deletions || 0,
      filesChanged: apiResponse.changedFiles || 0,
      parentCount: apiResponse.parents?.totalCount || 0
    }
  }

  /**
   * Extract verification from GraphQL response
   */
  private static extractGraphQLVerification(apiResponse: {
    signature?: {
      isValid?: boolean
      payload?: string
      signature?: string
      state?: string
    }
  }): {
    reason: string
    signature: null | string
    verified: boolean
  } {
    const {signature} = apiResponse
    return {
      reason: signature?.state || 'unsigned',
      signature: signature?.signature || null,
      verified: Boolean(signature?.isValid)
    }
  }

  /**
   * Extract repository name from API response
   */
  private static extractRepository(fullName?: string, repositoryUrl?: string): string {
    if (fullName) return fullName
    
    if (repositoryUrl) {
      const match = repositoryUrl.match(/\/repos\/([^/]+\/[^/]+)/)
      if (match && match[1]) return match[1]
    }
    
    return 'unknown/unknown'
  }

  /**
   * Validate REST API response
   */
  private static validateApiResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub commit API response: response is null, undefined, or not an object')
    }
  }

  /**
   * Validate CLI output
   */
  private static validateCliOutput(cliOutput: unknown): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI commit output: output is null, undefined, or not an object')
    }
  }

  /**
   * Validate GraphQL API response
   */
  private static validateGraphQLResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub commit GraphQL response: response is null, undefined, or not an object')
    }
  }

  /**
   * Get age of commit in days
   * 
   * @returns Number of days since commit was authored
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.authorDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get net line changes (additions - deletions)
   * 
   * @returns Net change in lines of code
   */
  getNetChanges(): number {
    return this.additions - this.deletions
  }

  /**
   * Get a human-readable summary of the commit
   * 
   * @returns Brief commit description for logging/debugging
   */
  getSummary(): string {
    const firstLine = this.message.split('\n')[0] ?? ''
    const shortMessage = firstLine.slice(0, 50)
    const truncated = firstLine.length > 50 ? '...' : ''
    return `${this.shortSha}: ${shortMessage}${truncated}`
  }

  /**
   * Get total line changes (additions + deletions)
   * 
   * @returns Total lines changed in commit
   */
  getTotalChanges(): number {
    return this.additions + this.deletions
  }

  /**
   * Check if commit has multiple parents (is a merge commit)
   * 
   * @returns True if commit is a merge commit
   */
  isMergeCommit(): boolean {
    return this.parentCount > 1
  }

  /**
   * Check if commit is signed and verified
   * 
   * @returns True if commit is cryptographically verified
   */
  isVerified(): boolean {
    return this.verificationVerified
  }

  /**
   * Convert commit data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [CommitDataDTO.Keys.COMMIT_ADDITIONS]: String(this.additions),
      [CommitDataDTO.Keys.COMMIT_AUTHOR_DATE]: this.authorDate.toISOString(),
      [CommitDataDTO.Keys.COMMIT_AUTHOR_EMAIL]: this.authorEmail,
      [CommitDataDTO.Keys.COMMIT_AUTHOR_NAME]: this.authorName,
      [CommitDataDTO.Keys.COMMIT_COMMITTER_DATE]: this.committerDate.toISOString(),
      [CommitDataDTO.Keys.COMMIT_COMMITTER_EMAIL]: this.committerEmail,
      [CommitDataDTO.Keys.COMMIT_COMMITTER_NAME]: this.committerName,
      [CommitDataDTO.Keys.COMMIT_DELETIONS]: String(this.deletions),
      [CommitDataDTO.Keys.COMMIT_FILES_CHANGED]: String(this.filesChanged),
      [CommitDataDTO.Keys.COMMIT_MESSAGE]: this.message,
      [CommitDataDTO.Keys.COMMIT_PARENT_COUNT]: String(this.parentCount),
      [CommitDataDTO.Keys.COMMIT_REPOSITORY]: this.repository,
      [CommitDataDTO.Keys.COMMIT_SHA]: this.sha,
      [CommitDataDTO.Keys.COMMIT_SHA_SHORT]: this.shortSha,
      [CommitDataDTO.Keys.COMMIT_TOTAL_CHANGES]: String(this.getTotalChanges()),
      [CommitDataDTO.Keys.COMMIT_URL]: this.url,
      [CommitDataDTO.Keys.COMMIT_VERIFICATION_REASON]: this.verificationReason,
      [CommitDataDTO.Keys.COMMIT_VERIFICATION_SIGNATURE]: this.verificationSignature || '',
      [CommitDataDTO.Keys.COMMIT_VERIFICATION_VERIFIED]: String(this.verificationVerified)
    }
  }
}