/**
 * @file Command error handling with mandatory recovery instructions
 * 
 * ARCHITECTURAL PRINCIPLE:
 * All errors in cc-commands must include recovery instructions.
 * This ensures the LLM can always provide helpful guidance to users.
 * 
 * This class wraps all errors and enforces that they include:
 * - Recovery instructions (mandatory)
 * - Debug information
 * - Contextual data
 * - Timestamp
 * 
 * Use error factories (GitHubErrorFactory, ValidationErrorFactory, etc.)
 * to create domain-specific errors with appropriate recovery guidance.
 */

/**
 * The ONLY error type that can be set on LLMInfo.
 * 
 * This class is final and cannot be extended. Instead of extending,
 * use error factory classes to create domain-specific errors.
 * 
 * @example
 * ```typescript
 * // Direct creation
 * const error = new OrchestratorError(
 *   new Error('Connection failed'),
 *   ['Check network connectivity', 'Verify service is running'],
 *   { host: 'api.example.com', port: 443 }
 * )
 * 
 * // Using factory method
 * const error = OrchestratorError.fromError(originalError, {
 *   command: 'deploy',
 *   action: 'connecting to server'
 * })
 * ```
 */
import { DebugInfo, ErrorContext, JsonValue } from '../types/DataTypes.js'

export class OrchestratorError {
  public readonly context: ErrorContext = {}
  public readonly timestamp: Date = new Date()
  
  /**
   * Create a new OrchestratorError
   * 
   * @param originalError - The underlying error that occurred
   * @param recoveryInstructions - Steps the user can take to fix the issue (REQUIRED)
   * @param debugInfo - Additional information for debugging
   * @throws Error if no recovery instructions provided
   * @throws Error if attempting to extend this class
   */
  constructor(
    public readonly originalError: Error | unknown,
    public readonly recoveryInstructions: string[],
    public readonly debugInfo: DebugInfo = {}
  ) {
    // Prevent extension - this class is final
    if (new.target !== OrchestratorError) {
      throw new Error(
        'OrchestratorError is a final class and cannot be extended. ' +
        'Use error factory classes (e.g., GitHubErrorFactory) to create domain-specific errors.'
      )
    }
    
    // Enforce that recovery instructions are provided
    if (!recoveryInstructions || recoveryInstructions.length === 0) {
      throw new Error(
        'OrchestratorError must include at least one recovery instruction. ' +
        'Help users understand how to fix the problem.'
      )
    }
    
    // Validate recovery instructions are meaningful
    const invalidInstructions = recoveryInstructions.filter(
      instruction => !instruction || instruction.trim().length === 0
    )
    if (invalidInstructions.length > 0) {
      throw new Error('Recovery instructions cannot be empty strings')
    }
  }
  
  /**
   * Create a OrchestratorError from an unknown error with smart recovery suggestions.
   * This is useful when catching errors from third-party libraries.
   * 
   * @param error - The error that was caught
   * @param context - Additional context about where/how the error occurred
   * @returns OrchestratorError with context-aware recovery instructions
   * 
   * @example
   * ```typescript
   * try {
   *   await someOperation()
   * } catch (error) {
   *   throw OrchestratorError.fromError(error, {
   *     command: 'deploy',
   *     action: 'uploading files',
   *     targetPath: '/var/www'
   *   })
   * }
   * ```
   */
  static fromError(
    error: Error | unknown,
    context: ErrorContext = {}
  ): OrchestratorError {
    // Build debug info, filtering out undefined values
    const debugInfo: DebugInfo = {}
    
    // Add system info
    debugInfo['cwd'] = process.cwd()
    debugInfo['nodeVersion'] = process.version
    debugInfo['platform'] = process.platform
    debugInfo['timestamp'] = new Date().toISOString()
    
    // Add context info, filtering undefined
    if (context.action !== undefined) debugInfo['action'] = context.action
    if (context.command !== undefined) debugInfo['command'] = context.command
    
    // Add other context properties
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && !['action', 'command'].includes(key)) {
        debugInfo[key] = value as JsonValue
      }
    }
    
    // Get smart recovery instructions based on error type
    const recoveryInstructions = OrchestratorError.getGenericRecoveryInstructions(error, context)
    
    const orchestratorError = new OrchestratorError(error, recoveryInstructions, debugInfo)
    
    // Add any additional context
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && !['action', 'command'].includes(key)) {
        orchestratorError.addContext(key, value)
      }
    }
    
    return orchestratorError
  }
  
  private static getConnectionRefusedInstructions(context: ErrorContext): string[] {
    const host = context.host || context.url || 'the target service'
    const port = context.port ? `:${context.port}` : ''
    return [
      `Check if the service is running on: ${host}${port}`,
      'Verify network connectivity',
      'Check firewall settings',
      'Ensure the correct host and port are specified'
    ]
  }

  private static getFileExistsInstructions(): string[] {
    return [
      'The file or directory already exists',
      'Remove the existing file/directory or choose a different name',
      'Use --force flag if available to overwrite'
    ]
  }

  private static getFileNotFoundInstructions(context: ErrorContext): string[] {
    const path = context.path || context.file || context.directory || 'the specified path'
    return [
      `Check if the file/directory exists: ${path}`,
      'Verify you are in the correct working directory',
      'Check for typos in the path'
    ]
  }

  private static getGenericErrorInstructions(): string[] {
    return [
      'Check the error message above for specific details',
      'Verify all prerequisites are installed and configured',
      'Check the command syntax and arguments'
    ]
  }

  /**
   * Get generic recovery instructions based on common error patterns.
   * These are fallbacks when domain-specific error factories aren't used.
   * 
   * @private
   */
  private static getGenericRecoveryInstructions(
    error: Error | unknown, 
    context: ErrorContext
  ): string[] {
    const instructions: string[] = []
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorLower = errorMessage.toLowerCase()
    
    // Detect error type and get specific instructions
    if (errorMessage.includes('ENOENT')) {
      instructions.push(...this.getFileNotFoundInstructions(context))
    } 
    else if (errorMessage.includes('EACCES') || errorLower.includes('permission')) {
      instructions.push(...this.getPermissionErrorInstructions(context))
    }
    else if (errorMessage.includes('EEXIST')) {
      instructions.push(...this.getFileExistsInstructions())
    }
    else if (errorMessage.includes('ECONNREFUSED')) {
      instructions.push(...this.getConnectionRefusedInstructions(context))
    }
    else if (errorMessage.includes('ETIMEDOUT') || errorLower.includes('timeout')) {
      instructions.push(...this.getTimeoutInstructions())
    }
    else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      instructions.push(...this.getJsonErrorInstructions())
    }
    else if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
      instructions.push(...this.getModuleNotFoundInstructions(errorMessage))
    }
    else {
      instructions.push(...this.getGenericErrorInstructions())
    }
    
    // Add universal instructions
    instructions.push(...this.getUniversalInstructions(error, context))
    
    return instructions
  }

  private static getJsonErrorInstructions(): string[] {
    return [
      'Check that the data is valid JSON format',
      'Look for: trailing commas, unquoted keys, single quotes instead of double',
      'Use a JSON validator to check the syntax',
      'Ensure the file encoding is UTF-8'
    ]
  }

  private static getModuleNotFoundInstructions(errorMessage: string): string[] {
    const module = errorMessage.match(/Cannot find module '([^']+)'/)?.[1] || 'the required module'
    return [
      `Install missing dependency: npm install ${module}`,
      'Run: npm install (to install all dependencies)',
      'Check that you are in the correct directory',
      'Verify the module name is spelled correctly'
    ]
  }

  private static getPermissionErrorInstructions(context: ErrorContext): string[] {
    const resource = context.path || context.file || context.resource || 'the resource'
    return [
      `Check permissions on: ${resource}`,
      'You may need to run with elevated privileges (sudo)',
      `Try: chmod 755 ${resource} (adjust permissions as needed)`
    ]
  }

  private static getTimeoutInstructions(): string[] {
    return [
      'The operation timed out',
      'Check network connectivity',
      'Try increasing the timeout value',
      'Verify the remote service is responding'
    ]
  }

  private static getUniversalInstructions(error: Error | unknown, context: ErrorContext): string[] {
    const instructions = ['Review the debug log for full error context']
    
    if (error instanceof Error && error.stack) {
      instructions.push('Check the stack trace to identify where the error occurred')
    }
    
    if (context.command) {
      instructions.push(`Run: ${context.command} --help (for command usage)`)
    }
    
    return instructions
  }
  
  /**
   * Get the error message
   */
  get message(): string {
    if (this.originalError instanceof Error) {
      return this.originalError.message
    }

    return String(this.originalError)
  }
  
  /**
   * Get the stack trace if available
   */
  get stack(): string | undefined {
    if (this.originalError instanceof Error) {
      return this.originalError.stack
    }

    return undefined
  }
  
  /**
   * Get the error type/class name
   */
  get type(): string {
    if (this.originalError instanceof Error) {
      return this.originalError.constructor.name
    }

    return 'UnknownError'
  }
  
  /**
   * Add additional context that might help with debugging.
   * This can be called after creation to add more context as it becomes available.
   * 
   * @param key - Context key
   * @param value - Context value
   * 
   * @example
   * ```typescript
   * error.addContext('userId', currentUser.id)
   * error.addContext('requestId', req.id)
   * ```
   */
  addContext(key: string, value: boolean | null | number | string | string[] | undefined): void {
    if (value !== undefined) {
      this.context[key] = value
    }
  }
}