/**
 * @fileoverview Command error handling with mandatory recovery instructions
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
 * const error = new CommandError(
 *   new Error('Connection failed'),
 *   ['Check network connectivity', 'Verify service is running'],
 *   { host: 'api.example.com', port: 443 }
 * )
 * 
 * // Using factory method
 * const error = CommandError.fromError(originalError, {
 *   command: 'deploy',
 *   action: 'connecting to server'
 * })
 * ```
 */
export class CommandError {
  public readonly timestamp: Date = new Date()
  public readonly context: Record<string, any> = {}
  
  /**
   * Create a new CommandError
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
    public readonly debugInfo: Record<string, any> = {}
  ) {
    // Prevent extension - this class is final
    if (new.target !== CommandError) {
      throw new Error(
        'CommandError is a final class and cannot be extended. ' +
        'Use error factory classes (e.g., GitHubErrorFactory) to create domain-specific errors.'
      )
    }
    
    // Enforce that recovery instructions are provided
    if (!recoveryInstructions || recoveryInstructions.length === 0) {
      throw new Error(
        'CommandError must include at least one recovery instruction. ' +
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
   * Get the error message
   */
  get message(): string {
    if (this.originalError instanceof Error) {
      return this.originalError.message
    }
    return String(this.originalError)
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
   * Get the stack trace if available
   */
  get stack(): string | undefined {
    if (this.originalError instanceof Error) {
      return this.originalError.stack
    }
    return undefined
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
  addContext(key: string, value: any): void {
    this.context[key] = value
  }
  
  /**
   * Create a CommandError from an unknown error with smart recovery suggestions.
   * This is useful when catching errors from third-party libraries.
   * 
   * @param error - The error that was caught
   * @param context - Additional context about where/how the error occurred
   * @returns CommandError with context-aware recovery instructions
   * 
   * @example
   * ```typescript
   * try {
   *   await someOperation()
   * } catch (error) {
   *   throw CommandError.fromError(error, {
   *     command: 'deploy',
   *     action: 'uploading files',
   *     targetPath: '/var/www'
   *   })
   * }
   * ```
   */
  static fromError(
    error: Error | unknown,
    context: { 
      command?: string
      action?: string
      [key: string]: any 
    } = {}
  ): CommandError {
    // Build debug info
    const debugInfo = {
      command: context.command,
      action: context.action,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      ...context
    }
    
    // Get smart recovery instructions based on error type
    const recoveryInstructions = CommandError.getGenericRecoveryInstructions(error, context)
    
    const commandError = new CommandError(error, recoveryInstructions, debugInfo)
    
    // Add any additional context
    Object.entries(context).forEach(([key, value]) => {
      if (!['command', 'action'].includes(key)) {
        commandError.addContext(key, value)
      }
    })
    
    return commandError
  }
  
  /**
   * Get generic recovery instructions based on common error patterns.
   * These are fallbacks when domain-specific error factories aren't used.
   * 
   * @private
   */
  private static getGenericRecoveryInstructions(
    error: Error | unknown, 
    context: Record<string, any>
  ): string[] {
    const instructions: string[] = []
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorLower = errorMessage.toLowerCase()
    
    // File system errors
    if (errorMessage.includes('ENOENT')) {
      const path = context.path || context.file || context.directory || 'the specified path'
      instructions.push(`Check if the file/directory exists: ${path}`)
      instructions.push('Verify you are in the correct working directory')
      instructions.push('Check for typos in the path')
    } 
    else if (errorMessage.includes('EACCES') || errorLower.includes('permission')) {
      const resource = context.path || context.file || context.resource || 'the resource'
      instructions.push(`Check permissions on: ${resource}`)
      instructions.push('You may need to run with elevated privileges (sudo)')
      instructions.push(`Try: chmod 755 ${resource} (adjust permissions as needed)`)
    }
    else if (errorMessage.includes('EEXIST')) {
      instructions.push('The file or directory already exists')
      instructions.push('Remove the existing file/directory or choose a different name')
      instructions.push('Use --force flag if available to overwrite')
    }
    // Network errors
    else if (errorMessage.includes('ECONNREFUSED')) {
      const host = context.host || context.url || 'the target service'
      const port = context.port ? `:${context.port}` : ''
      instructions.push(`Check if the service is running on: ${host}${port}`)
      instructions.push('Verify network connectivity')
      instructions.push('Check firewall settings')
      instructions.push('Ensure the correct host and port are specified')
    }
    else if (errorMessage.includes('ETIMEDOUT') || errorLower.includes('timeout')) {
      instructions.push('The operation timed out')
      instructions.push('Check network connectivity')
      instructions.push('Try increasing the timeout value')
      instructions.push('Verify the remote service is responding')
    }
    // JSON/parsing errors
    else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      instructions.push('Check that the data is valid JSON format')
      instructions.push('Look for: trailing commas, unquoted keys, single quotes instead of double')
      instructions.push('Use a JSON validator to check the syntax')
      instructions.push('Ensure the file encoding is UTF-8')
    }
    // Module/dependency errors
    else if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
      const module = errorMessage.match(/Cannot find module '([^']+)'/)?.[1] || 'the required module'
      instructions.push(`Install missing dependency: npm install ${module}`)
      instructions.push('Run: npm install (to install all dependencies)')
      instructions.push('Check that you are in the correct directory')
      instructions.push('Verify the module name is spelled correctly')
    }
    // Generic catch-all
    else {
      instructions.push('Check the error message above for specific details')
      instructions.push('Verify all prerequisites are installed and configured')
      instructions.push('Check the command syntax and arguments')
    }
    
    // Always add these
    instructions.push('Review the debug log for full error context')
    if (error instanceof Error && error.stack) {
      instructions.push('Check the stack trace to identify where the error occurred')
    }
    
    // Add command-specific help if available
    if (context.command) {
      instructions.push(`Run: ${context.command} --help (for command usage)`)
    }
    
    return instructions
  }
}