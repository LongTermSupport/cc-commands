/**
 * @file Base class for all cc-commands
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
import { Command, Config } from '@oclif/core';
import { LLMInfo } from '../types/LLMInfo';
/**
 * Debug logger that captures all command operations
 */
declare class CommandDebugger {
    private logs;
    private startTime;
    /**
     * Get the debug log content
     */
    getContent(): string;
    /**
     * Log a debug message with optional data
     *
     * @param message - The message to log
     * @param data - Optional data to include (will be serialized)
     */
    log(message: string, data?: unknown): void;
    /**
     * Write debug logs to file
     *
     * @param filepath - Where to write the debug log
     */
    writeToFile(filepath: string): void;
    /**
     * Serialize data for logging, handling complex types
     */
    private serializeData;
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
export declare abstract class BaseCommand extends Command {
    protected debugger: CommandDebugger;
    protected debugLogPath: string;
    constructor(argv: string[], config: Config);
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
    abstract execute(): Promise<LLMInfo>;
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
    run(): Promise<void>;
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
    protected trackAction<T>(llmInfo: LLMInfo, eventName: string, action: () => Promise<T>): Promise<T>;
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
    protected trackConditionalAction<T>(llmInfo: LLMInfo, eventName: string, condition: boolean, action: () => Promise<T>, skipReason: string): Promise<T | undefined>;
}
export {};
