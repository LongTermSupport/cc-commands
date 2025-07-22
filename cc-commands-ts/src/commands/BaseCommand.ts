/**
 * @fileoverview Base class for all cc-commands
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Commands do deterministic work and return raw data (LLMInfo)
 * 2. Commands NEVER generate rich text or formatted reports
 * 3. All errors include recovery instructions
 * 4. Every command execution is debuggable via logs
 * 
 * This base class enforces these principles through:
 * - Final run() method that cannot be overridden
 * - Mandatory execute() method returning LLMInfo
 * - Automatic debug logging for all operations
 * - Structured error handling with CommandError
 * 
 * @see LLMInfo for return type details
 * @see CommandError for error handling
 */

import { Command } from '@oclif/core'
import { LLMInfo } from '../types/LLMInfo.js'
import { CommandError } from '../errors/CommandError.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { format } from 'date-fns'

/**
 * Debug logger that captures all command operations
 */
class CommandDebugger {
  private logs: string[] = []
  private startTime: number = Date.now()
  
  /**
   * Log a debug message with optional data
   * 
   * @param message - The message to log
   * @param data - Optional structured data to include
   */
  log(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const elapsed = Date.now() - this.startTime
    
    let entry = `[${timestamp}] [+${elapsed}ms] ${message}`
    if (data !== undefined) {
      entry += '\n' + JSON.stringify(data, null, 2)
    }
    
    this.logs.push(entry)
  }
  
  /**
   * Write debug logs to file
   * 
   * @param filepath - Where to write the debug log
   */
  writeToFile(filepath: string): void {
    const dir = dirname(filepath)
    mkdirSync(dir, { recursive: true })
    writeFileSync(filepath, this.getContent())
  }
  
  /**
   * Get the debug log content
   */
  getContent(): string {
    return this.logs.join('\n\n')
  }
}

/**
 * Base class for ALL cc-commands.
 * 
 * This class is designed to be extended by specific commands.
 * It enforces architectural principles through its structure.
 * 
 * @example
 * ```typescript
 * export default class MyCommand extends BaseCommand {
 *   static description = 'Does something deterministic'
 *   
 *   async execute(): Promise<LLMInfo> {
 *     const info = LLMInfo.create()
 *     
 *     // Do work
 *     const result = await this.doSomething()
 *     info.addData('RESULT', result)
 *     info.addAction('Did something', 'success')
 *     
 *     // Provide instructions for LLM
 *     info.addInstruction('Generate a report based on RESULT')
 *     
 *     return info
 *   }
 * }
 * ```
 */
export abstract class BaseCommand extends Command {
  protected debugger: CommandDebugger
  protected debugLogPath: string
  
  constructor(argv: string[], config: any) {
    super(argv, config)
    this.debugger = new CommandDebugger()
    
    // Generate debug log path: var/debug/[command-name]-[timestamp].log
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss')
    const commandName = this.constructor.name.toLowerCase()
    this.debugLogPath = join('var', 'debug', `${commandName}-${timestamp}.log`)
  }
  
  /**
   * The ONLY method subclasses must implement.
   * 
   * This method should:
   * 1. Parse and validate arguments
   * 2. Perform deterministic operations
   * 3. Return structured data via LLMInfo
   * 
   * This method should NOT:
   * - Generate formatted text
   * - Make display decisions
   * - Call this.log() or console.log()
   * 
   * @returns LLMInfo containing data and instructions for the LLM
   */
  abstract execute(): Promise<LLMInfo>
  
  /**
   * Final run method - cannot be overridden by subclasses.
   * 
   * This method:
   * 1. Sets up debug logging
   * 2. Calls execute() 
   * 3. Handles all errors properly
   * 4. Outputs LLMInfo to stdout
   * 5. Writes debug logs
   * 
   * @final
   */
  async run(): Promise<void> {
    const llmInfo = LLMInfo.create({ debugLogPath: this.debugLogPath })
    
    try {
      // Log startup information
      this.debugger.log('Command started', {
        command: this.id || this.constructor.name,
        args: this.argv,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DEBUG: process.env.DEBUG,
        }
      })
      
      // Parse arguments using oclif
      const parsed = await this.parse(this.constructor as any)
      this.debugger.log('Arguments parsed', parsed)
      
      // Track execution
      const startTime = Date.now()
      llmInfo.addAction('Command initialization', 'success')
      
      // Execute the command implementation
      this.debugger.log('Calling execute()')
      const result = await this.execute()
      
      // Validate that execute() returned LLMInfo
      if (!(result instanceof LLMInfo)) {
        throw new Error('execute() must return an LLMInfo instance')
      }
      
      // Merge the execution result into our info
      // (This is a bit hacky but maintains the single LLMInfo instance)
      const resultString = result.toString()
      const hasResultError = resultString.includes('COMMAND EXECUTION FAILED')
      
      if (hasResultError) {
        // If the result contains an error, use it as-is
        this.log(resultString)
        this.exit(1)
        return
      }
      
      // Otherwise, add execution complete action
      const duration = Date.now() - startTime
      llmInfo.addAction('Command execution', 'success', `Completed in ${duration}ms`, duration)
      
      // Output the result
      this.log(result.toString())
      
      this.debugger.log('Command completed successfully', {
        duration,
        hasError: false
      })
      
    } catch (error) {
      // Log the error
      this.debugger.log('Command failed with error', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name,
        } : error,
      })
      
      // Ensure error is a CommandError
      const commandError = error instanceof CommandError 
        ? error 
        : CommandError.fromError(error, {
            command: this.id || this.constructor.name,
            args: this.argv
          })
      
      // Set error on LLMInfo
      llmInfo.setError(commandError)
      llmInfo.addAction('Command execution', 'failed', commandError.message)
      
      // Output error info
      this.log(llmInfo.toString())
      
    } finally {
      // Always write debug log
      try {
        this.debugger.writeToFile(this.debugLogPath)
        
        // Don't add file operation if we already have an error
        // (to avoid modifying error output)
        if (!llmInfo.hasError()) {
          llmInfo.addFile(this.debugLogPath, 'created')
        }
        
      } catch (logError) {
        // If we can't write the debug log, note it but don't fail
        this.debugger.log('Failed to write debug log', logError)
        
        if (!llmInfo.hasError()) {
          llmInfo.addData('DEBUG_LOG_ERROR', logError instanceof Error ? logError.message : 'Failed to write debug log')
        }
      }
      
      // Exit with error code if there was an error
      if (llmInfo.hasError()) {
        this.exit(1)
      }
    }
  }
  
  /**
   * Helper method for tracking actions with timing and error handling.
   * This makes it easy to track what the command is doing.
   * 
   * @param llmInfo - The LLMInfo instance to record the action in
   * @param eventName - Human-readable name of the action
   * @param action - The async action to perform
   * @returns The result of the action
   * 
   * @example
   * ```typescript
   * const data = await this.trackAction(info, 'Fetch user data', async () => {
   *   return await this.userService.getUser(userId)
   * })
   * ```
   */
  protected async trackAction<T>(
    llmInfo: LLMInfo,
    eventName: string,
    action: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    this.debugger.log(`Starting action: ${eventName}`)
    
    try {
      const result = await action()
      const duration = Date.now() - startTime
      
      llmInfo.addAction(eventName, 'success', undefined, duration)
      this.debugger.log(`Action completed: ${eventName}`, { duration, result })
      
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      llmInfo.addAction(eventName, 'failed', errorMessage, duration)
      this.debugger.log(`Action failed: ${eventName}`, { duration, error })
      
      throw error
    }
  }
  
  /**
   * Helper method for tracking actions that might be skipped.
   * 
   * @param llmInfo - The LLMInfo instance
   * @param eventName - Name of the action
   * @param condition - Whether to run the action
   * @param action - The action to run if condition is true
   * @param skipReason - Reason for skipping if condition is false
   * 
   * @example
   * ```typescript
   * await this.trackConditionalAction(
   *   info,
   *   'Send notification',
   *   user.wantsNotifications,
   *   async () => await this.notify(user),
   *   'User has disabled notifications'
   * )
   * ```
   */
  protected async trackConditionalAction<T>(
    llmInfo: LLMInfo,
    eventName: string,
    condition: boolean,
    action: () => Promise<T>,
    skipReason: string
  ): Promise<T | undefined> {
    if (!condition) {
      llmInfo.addAction(eventName, 'skipped', skipReason)
      this.debugger.log(`Action skipped: ${eventName}`, { reason: skipReason })
      return undefined
    }
    
    return this.trackAction(llmInfo, eventName, action)
  }
}