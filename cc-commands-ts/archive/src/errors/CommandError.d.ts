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
import { DebugInfo, ErrorContext } from '../types/DataTypes';
export declare class CommandError {
    readonly originalError: Error | unknown;
    readonly recoveryInstructions: string[];
    readonly debugInfo: DebugInfo;
    readonly context: ErrorContext;
    readonly timestamp: Date;
    /**
     * Create a new CommandError
     *
     * @param originalError - The underlying error that occurred
     * @param recoveryInstructions - Steps the user can take to fix the issue (REQUIRED)
     * @param debugInfo - Additional information for debugging
     * @throws Error if no recovery instructions provided
     * @throws Error if attempting to extend this class
     */
    constructor(originalError: Error | unknown, recoveryInstructions: string[], debugInfo?: DebugInfo);
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
    static fromError(error: Error | unknown, context?: ErrorContext): CommandError;
    /**
     * Get generic recovery instructions based on common error patterns.
     * These are fallbacks when domain-specific error factories aren't used.
     *
     * @private
     */
    private static getGenericRecoveryInstructions;
    /**
     * Get the error message
     */
    get message(): string;
    /**
     * Get the stack trace if available
     */
    get stack(): string | undefined;
    /**
     * Get the error type/class name
     */
    get type(): string;
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
    addContext(key: string, value: boolean | null | number | string | string[] | undefined): void;
}
