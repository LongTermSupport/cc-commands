/**
 * @fileoverview Core return type for all cc-commands
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

import { CommandError } from '../errors/CommandError.js'

/**
 * Action performed by the command with its result
 */
export interface Action {
  /** Human-readable description of what was attempted */
  event: string
  /** Whether the action succeeded, failed, or was skipped */
  result: 'success' | 'failed' | 'skipped'
  /** Optional details about the result */
  details?: string
  /** How long the action took in milliseconds */
  duration?: number
}

/**
 * File operation performed by the command
 */
export interface FileOperation {
  /** Absolute or relative path to the file */
  path: string
  /** What was done to the file */
  operation: 'created' | 'modified' | 'deleted' | 'read'
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
  private readonly data: Map<string, string> = new Map()
  private readonly actions: Action[] = []
  private readonly files: FileOperation[] = []
  private readonly instructions: string[] = []
  private readonly debugLogPath?: string
  private error?: CommandError
  
  /**
   * Private constructor prevents extension and direct instantiation
   */
  private constructor(options: { debugLogPath?: string }) {
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
  addData(key: string, value: string | number | boolean): void {
    if (!this.isValidKey(key)) {
      throw new Error(`Invalid key format: ${key}. Must be UPPER_SNAKE_CASE (e.g., PROJECT_ID, USER_COUNT)`)
    }
    this.data.set(key, String(value))
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
  addDataBulk(data: Record<string, string | number | boolean>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.addData(key, value)
    })
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
  addAction(event: string, result: Action['result'], details?: string, duration?: number): void {
    this.actions.push({ event, result, details, duration })
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
  addFile(path: string, operation: FileOperation['operation'], size?: number): void {
    this.files.push({ path, operation, size })
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
  addInstruction(instruction: string): void {
    this.instructions.push(instruction)
  }
  
  /**
   * Set error details. This will cause STOP PROCESSING output.
   * Only accepts CommandError to ensure proper error structure.
   * 
   * @param error - CommandError with recovery instructions
   * 
   * @example
   * ```typescript
   * info.setError(new CommandError(
   *   new Error('Database connection failed'),
   *   ['Check database credentials', 'Verify network connectivity'],
   *   { host: 'localhost', port: 5432 }
   * ))
   * ```
   */
  setError(error: CommandError): void {
    this.error = error
  }
  
  /**
   * Check if this response contains an error
   */
  hasError(): boolean {
    return this.error !== undefined
  }
  
  /**
   * Get the raw data for testing or debugging
   * @internal
   */
  getData(): Record<string, string> {
    return Object.fromEntries(this.data)
  }
  
  /**
   * Get the actions for testing or debugging
   * @internal
   */
  getActions(): readonly Action[] {
    return [...this.actions]
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
    let output = ''
    
    // CRITICAL: Error handling must be first and unmissable
    if (this.error) {
      output += '================== COMMAND EXECUTION FAILED ==================\n'
      output += '⚠️  STOP PROCESSING - DO NOT CONTINUE WITH OPERATION  ⚠️\n'
      output += '==============================================================\n\n'
      
      output += '=== ERROR DETAILS ===\n'
      output += `ERROR_TYPE=${this.error.type}\n`
      output += `ERROR_MESSAGE=${this.error.message}\n`
      output += `ERROR_TIMESTAMP=${this.error.timestamp.toISOString()}\n`
      
      // Debug info
      if (Object.keys(this.error.debugInfo).length > 0) {
        output += '\n=== DEBUG INFO ===\n'
        Object.entries(this.error.debugInfo).forEach(([key, value]) => {
          output += `${key.toUpperCase()}=${JSON.stringify(value)}\n`
        })
      }
      
      // Context if any
      if (Object.keys(this.error.context).length > 0) {
        output += '\n=== ERROR CONTEXT ===\n'
        Object.entries(this.error.context).forEach(([key, value]) => {
          output += `${key.toUpperCase()}=${JSON.stringify(value)}\n`
        })
      }
      
      if (this.debugLogPath) {
        output += `\nDEBUG_LOG=${this.debugLogPath}\n`
        output += `To view full debug details: cat ${this.debugLogPath}\n`
      }
      
      if (this.error.stack) {
        output += '\n=== STACK TRACE ===\n'
        output += this.error.stack + '\n'
      }
      
      output += '\n=== RECOVERY INSTRUCTIONS ===\n'
      this.error.recoveryInstructions.forEach(instruction => {
        output += `- ${instruction}\n`
      })
      
      return output
    }
    
    // Normal output for successful execution
    output += '=== EXECUTION SUMMARY ===\n'
    output += `EXECUTION_STATUS=SUCCESS\n`
    if (this.debugLogPath) {
      output += `DEBUG_LOG=${this.debugLogPath}\n`
    }
    output += '\n'
    
    // Action log
    if (this.actions.length > 0) {
      output += '=== ACTION LOG ===\n'
      this.actions.forEach((action, index) => {
        output += `ACTION_${index}_EVENT=${action.event}\n`
        output += `ACTION_${index}_RESULT=${action.result}\n`
        if (action.details) {
          output += `ACTION_${index}_DETAILS=${action.details}\n`
        }
        if (action.duration !== undefined) {
          output += `ACTION_${index}_DURATION_MS=${action.duration}\n`
        }
      })
      output += `TOTAL_ACTIONS=${this.actions.length}\n`
      const successCount = this.actions.filter(a => a.result === 'success').length
      const failedCount = this.actions.filter(a => a.result === 'failed').length
      const skippedCount = this.actions.filter(a => a.result === 'skipped').length
      output += `ACTIONS_SUCCEEDED=${successCount}\n`
      output += `ACTIONS_FAILED=${failedCount}\n`
      output += `ACTIONS_SKIPPED=${skippedCount}\n`
      output += '\n'
    }
    
    // File operations
    if (this.files.length > 0) {
      output += '=== FILES AFFECTED ===\n'
      this.files.forEach((file, index) => {
        output += `FILE_${index}_PATH=${file.path}\n`
        output += `FILE_${index}_OPERATION=${file.operation}\n`
        if (file.size !== undefined) {
          output += `FILE_${index}_SIZE=${file.size}\n`
        }
      })
      output += `TOTAL_FILES=${this.files.length}\n`
      output += '\n'
    }
    
    // Data
    if (this.data.size > 0) {
      output += '=== DATA ===\n'
      for (const [key, value] of this.data) {
        output += `${key}=${value}\n`
      }
      output += '\n'
    }
    
    // Instructions
    if (this.instructions.length > 0) {
      output += '=== INSTRUCTIONS FOR LLM ===\n'
      this.instructions.forEach(instruction => {
        output += `- ${instruction}\n`
      })
    }
    
    return output
  }
  
  /**
   * Validate key format (UPPER_SNAKE_CASE)
   */
  private isValidKey(key: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(key)
  }
}