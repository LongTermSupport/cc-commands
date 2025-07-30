/**
 * @file Core return type for all cc-commands
 *
 * ARCHITECTURAL PRINCIPLE:
 * Commands do deterministic work and return raw data for LLM processing.
 * This file defines the ONLY allowed return type for commands.
 *
 * Commands MUST NOT:
 * - Generate rich text or markdown
 * - Make formatting decisions
 * - Create human-readable reports
 *
 * Commands MUST:
 * - Do deterministic operations
 * - Return structured data via LLMInfo
 * - Provide clear instructions for the LLM
 * - Include comprehensive error recovery information
 */

import { OrchestratorError } from './error/OrchestratorError.js';

/**
 * Action performed by the command with its result
 */
export interface Action {
  /** Optional details about the result */
  details?: string
  /** How long the action took in milliseconds */
  duration?: number
  /** Human-readable description of what was attempted */
  event: string
  /** Whether the action succeeded, failed, or was skipped */
  result: 'failed' | 'skipped' | 'success'
}

/**
 * File operation performed by the command
 */
export interface FileOperation {
  /** What was done to the file */
  operation: 'created' | 'deleted' | 'modified' | 'read'
  /** Absolute or relative path to the file */
  path: string
  /** Size in bytes (for created/modified files) */
  size?: number
}

/**
 * The ONLY return type allowed for cc-commands.
 *
 * This class is final and cannot be extended. It provides a structured
 * way to return data from commands that the LLM can process.
 *
 * @example
 * ```typescript
 * const info = LLMInfo.create({ debugLogPath: '/tmp/debug.log' })
 * info.addData('PROJECT_ID', '123')
 * info.addAction('Fetched project data', 'success', undefined, 1250)
 * info.addInstruction('Generate a client-friendly report from the project data')
 * return info
 * ```
 */
export class LLMInfo {
  private readonly actions: Action[] = []
  private readonly data: Map<string, string> = new Map()
  private readonly debugLogPath?: string
  private error?: OrchestratorError
  private readonly files: FileOperation[] = []
  private readonly instructions: string[] = []

  /**
   * Private constructor prevents extension and direct instantiation
   */
  private constructor(options: { debugLogPath?: string }) {
    if (new.target !== LLMInfo) {
      throw new Error(
        'LLMInfo is a final class and cannot be extended. Use LLMInfo.create() to instantiate.'
      )
    }

    this.debugLogPath = options.debugLogPath
  }

  /**
   * Factory method to create LLMInfo instances
   *
   * @param options - Optional configuration
   * @param options.debugLogPath - Path where debug logs will be written
   * @returns New LLMInfo instance
   */
  static create(options?: { debugLogPath?: string }): LLMInfo {
    return new LLMInfo(options || {})
  }

  /**
   * Record an action taken by the command.
   * This creates an audit trail of what the command did.
   *
   * @param event - Description of what was attempted
   * @param result - Whether it succeeded, failed, or was skipped
   * @param details - Optional additional information
   * @param duration - How long it took in milliseconds
   *
   * @example
   * ```typescript
   * info.addAction('Connect to database', 'success', 'Connected to prod DB', 150)
   * info.addAction('Fetch user data', 'failed', 'Timeout after 30s', 30000)
   * info.addAction('Send email', 'skipped', 'Email disabled in config')
   * ```
   */
  addAction(event: string, result: Action['result'], details?: string, duration?: number): this {
    this.actions.push({ details, duration, event, result })
    return this
  }

  /**
   * Add a key-value data pair.
   * Keys must be UPPER_SNAKE_CASE to ensure consistency.
   *
   * @param key - The data key (must be UPPER_SNAKE_CASE)
   * @param value - The value (will be converted to string)
   * @throws Error if key format is invalid
   *
   * @example
   * ```typescript
   * info.addData('USER_COUNT', 42)
   * info.addData('IS_ACTIVE', true)
   * info.addData('PROJECT_NAME', 'My Project')
   * ```
   */
  addData(key: string, value: boolean | number | string): this {
    if (!this.isValidKey(key)) {
      throw new Error(
        `Invalid key format: ${key}. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)`
      )
    }

    this.data.set(key, String(value))
    return this
  }

  /**
   * Add multiple key-value pairs at once
   *
   * @param data - Object with key-value pairs
   *
   * @example
   * ```typescript
   * info.addDataBulk({
   *   PROJECT_ID: 123,
   *   PROJECT_NAME: 'My Project',
   *   IS_PUBLIC: true
   * })
   * ```
   */
  addDataBulk(data: Record<string, boolean | number | string>): void {
    for (const [key, value] of Object.entries(data)) {
      this.addData(key, value)
    }
  }

  /**
   * Record a file operation performed by the command
   *
   * @param path - Path to the file
   * @param operation - What was done to the file
   * @param size - Optional file size in bytes
   *
   * @example
   * ```typescript
   * info.addFile('/tmp/output.json', 'created', 1024)
   * info.addFile('config.yaml', 'modified')
   * info.addFile('old-data.csv', 'deleted')
   * ```
   */
  addFile(path: string, operation: FileOperation['operation'], size?: number): this {
    this.files.push({ operation, path, size })
    return this
  }

  /**
   * Add an instruction for the LLM.
   * These guide how the LLM should process the data.
   *
   * @param instruction - Clear instruction for the LLM
   *
   * @example
   * ```typescript
   * info.addInstruction('Generate a technical report focusing on performance metrics')
   * info.addInstruction('Include recommendations for optimization')
   * info.addInstruction('Highlight any critical issues in red')
   * ```
   */
  addInstruction(instruction: string): this {
    this.instructions.push(instruction)
    return this
  }

  /**
   * Get the actions for testing or debugging
   * @internal
   */
  getActions(): readonly Action[] {
    return [...this.actions]
  }

  /**
   * Get the raw data for testing or debugging
   * @internal
   */
  getData(): Record<string, string> {
    return Object.fromEntries(this.data)
  }

  /**
   * Returns 0 if no error, 1 if error is set.
   */
  getExitCode(): 0 | 1 {
    return this.error ? 1 : 0
  }

  /**
   * Check if this response contains an error
   */
  hasError(): boolean {
    return this.error !== undefined
  }

  /**
   * Merge another LLMInfo instance into this one.
   * Used by orchestrators to combine results from multiple services.
   *
   * @param other - The LLMInfo instance to merge
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const result = LLMInfo.create()
   * const serviceResult = await service.execute()
   * result.merge(serviceResult)
   * ```
   */
  merge(other: LLMInfo): this {
    // If the other has an error, this should also have an error
    if (other.hasError() && other.error) {
      this.setError(other.error)
      return this
    }

    // Merge actions
    for (const action of other.actions) {
      this.actions.push(action)
    }

    // Merge data
    for (const [key, value] of other.data) {
      this.data.set(key, value)
    }

    // Merge files
    for (const file of other.files) {
      this.files.push(file)
    }

    // Merge instructions
    for (const instruction of other.instructions) {
      this.instructions.push(instruction)
    }

    return this
  }

  /**
   * Set error details. This will cause STOP PROCESSING output.
   * Only accepts OrchestratorError to ensure proper error structure.
   *
   * @param error - OrchestratorError with recovery instructions
   *
   * ```
   */
  setError(error: OrchestratorError): this {
    this.error = error
    return this
  }

  /**
   * Convert to string format for LLM consumption.
   * This is the primary output method.
   *
   * Format varies based on whether an error occurred:
   * - Error: STOP PROCESSING header with error details and recovery
   * - Success: Structured sections for actions, files, data, and instructions
   */
  toString(): string {
    return this.error ? this.formatErrorOutput() : this.formatSuccessOutput()
  }

  /**
   * Format action log section
   */
  private formatActionLog(): string {
    if (this.actions.length === 0) return ''
    
    let output = '=== ACTION LOG ===\n'
    for (const [index, action] of this.actions.entries()) {
      output += `ACTION_${index}_EVENT=${action.event}\n`
      output += `ACTION_${index}_RESULT=${action.result}\n`
      if (action.details) {
        output += `ACTION_${index}_DETAILS=${action.details}\n`
      }

      if (action.duration !== undefined) {
        output += `ACTION_${index}_DURATION_MS=${action.duration}\n`
      }
    }

    output += this.formatActionSummary()
    return output
  }

  /**
   * Format action summary statistics
   */
  private formatActionSummary(): string {
    const successCount = this.actions.filter((a) => a.result === 'success').length
    const failedCount = this.actions.filter((a) => a.result === 'failed').length
    const skippedCount = this.actions.filter((a) => a.result === 'skipped').length
    
    let output = `TOTAL_ACTIONS=${this.actions.length}\n`
    output += `ACTIONS_SUCCEEDED=${successCount}\n`
    output += `ACTIONS_FAILED=${failedCount}\n`
    output += `ACTIONS_SKIPPED=${skippedCount}\n`
    output += '\n'
    return output
  }

  /**
   * Format data section
   */
  private formatDataSection(): string {
    if (this.data.size === 0) return ''
    
    let output = '=== DATA ===\n'
    for (const [key, value] of this.data) {
      output += `${key}=${value}\n`
    }

    output += '\n'
    return output
  }

  /**
   * Format error context information
   */
  private formatErrorContext(): string {
    if (!this.error || Object.keys(this.error.context).length === 0) return ''
    
    let output = '\n=== ERROR CONTEXT ===\n'
    for (const [key, value] of Object.entries(this.error.context)) {
      output += `${key.toUpperCase()}=${JSON.stringify(value)}\n`
    }

    return output
  }

  /**
   * Format error debug information
   */
  private formatErrorDebugInfo(): string {
    if (!this.error || Object.keys(this.error.debugInfo).length === 0) return ''
    
    let output = '\n=== DEBUG INFO ===\n'
    for (const [key, value] of Object.entries(this.error.debugInfo)) {
      output += `${key.toUpperCase()}=${JSON.stringify(value)}\n`
    }

    return output
  }

  /**
   * Format error debug log information
   */
  private formatErrorDebugLog(): string {
    if (!this.debugLogPath) return ''
    
    let output = `\nDEBUG_LOG=${this.debugLogPath}\n`
    output += `To view full debug details: cat ${this.debugLogPath}\n`
    return output
  }

  /**
   * Format error details section
   */
  private formatErrorDetails(): string {
    if (!this.error) return ''
    
    let output = '=== ERROR DETAILS ===\n'
    output += `ERROR_TYPE=${this.error.type}\n`
    output += `ERROR_MESSAGE=${this.error.message}\n`
    output += `ERROR_TIMESTAMP=${this.error.timestamp.toISOString()}\n`
    return output
  }

  /**
   * Format output for error scenarios
   */
  private formatErrorOutput(): string {
    let output = ''
    output += '================== COMMAND EXECUTION FAILED ==================\n'
    output += '⚠️  STOP PROCESSING - DO NOT CONTINUE WITH OPERATION  ⚠️\n'
    output += '==============================================================\n\n'

    output += this.formatErrorDetails()
    output += this.formatErrorDebugInfo()
    output += this.formatErrorContext()
    output += this.formatErrorDebugLog()
    output += this.formatErrorStackTrace()
    
    // Include data collected before error occurred
    output += this.formatDataSection()
    output += this.formatActionLog()
    output += this.formatFileOperations()
    
    output += this.formatRecoveryInstructions()

    return output
  }

  /**
   * Format error stack trace
   */
  private formatErrorStackTrace(): string {
    if (!this.error?.stack) return ''
    
    let output = '\n=== STACK TRACE ===\n'
    output += this.error.stack + '\n'
    return output
  }

  /**
   * Format file operations section
   */
  private formatFileOperations(): string {
    if (this.files.length === 0) return ''
    
    let output = '=== FILES AFFECTED ===\n'
    for (const [index, file] of this.files.entries()) {
      output += `FILE_${index}_PATH=${file.path}\n`
      output += `FILE_${index}_OPERATION=${file.operation}\n`
      if (file.size !== undefined) {
        output += `FILE_${index}_SIZE=${file.size}\n`
      }
    }
    
    output += `TOTAL_FILES=${this.files.length}\n`
    output += '\n'
    return output
  }

  /**
   * Format instructions section
   */
  private formatInstructions(): string {
    if (this.instructions.length === 0) return ''
    
    let output = '=== INSTRUCTIONS FOR LLM ===\n'
    for (const instruction of this.instructions) {
      output += `- ${instruction}\n`
    }

    return output
  }

  /**
   * Format recovery instructions
   */
  private formatRecoveryInstructions(): string {
    if (!this.error) return ''
    
    let output = '\n=== RECOVERY INSTRUCTIONS ===\n'
    for (const instruction of this.error.recoveryInstructions) {
      output += `- ${instruction}\n`
    }

    return output
  }

  /**
   * Format output for successful execution
   */
  private formatSuccessOutput(): string {
    let output = ''
    output += '=== EXECUTION SUMMARY ===\n'
    output += `EXECUTION_STATUS=SUCCESS\n`
    if (this.debugLogPath) {
      output += `DEBUG_LOG=${this.debugLogPath}\n`
    }

    output += '\n'

    output += this.formatActionLog()
    output += this.formatFileOperations()
    output += this.formatDataSection()
    output += this.formatInstructions()

    return output
  }

  /**
   * Validate key format (UPPER_SNAKE_CASE)
   */
  private isValidKey(key: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(key)
  }
}
