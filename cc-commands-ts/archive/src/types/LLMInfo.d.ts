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
import { CommandError } from '../errors/CommandError';
/**
 * Action performed by the command with its result
 */
export interface Action {
    /** Optional details about the result */
    details?: string;
    /** How long the action took in milliseconds */
    duration?: number;
    /** Human-readable description of what was attempted */
    event: string;
    /** Whether the action succeeded, failed, or was skipped */
    result: 'failed' | 'skipped' | 'success';
}
/**
 * File operation performed by the command
 */
export interface FileOperation {
    /** What was done to the file */
    operation: 'created' | 'deleted' | 'modified' | 'read';
    /** Absolute or relative path to the file */
    path: string;
    /** Size in bytes (for created/modified files) */
    size?: number;
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
export declare class LLMInfo {
    private readonly actions;
    private readonly data;
    private readonly debugLogPath?;
    private error?;
    private readonly files;
    private readonly instructions;
    /**
     * Private constructor prevents extension and direct instantiation
     */
    private constructor();
    /**
     * Factory method to create LLMInfo instances
     *
     * @param options - Optional configuration
     * @param options.debugLogPath - Path where debug logs will be written
     * @returns New LLMInfo instance
     */
    static create(options?: {
        debugLogPath?: string;
    }): LLMInfo;
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
    addAction(event: string, result: Action['result'], details?: string, duration?: number): this;
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
    addData(key: string, value: boolean | number | string): this;
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
    addDataBulk(data: Record<string, boolean | number | string>): void;
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
    addFile(path: string, operation: FileOperation['operation'], size?: number): this;
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
    addInstruction(instruction: string): this;
    /**
     * Get the actions for testing or debugging
     * @internal
     */
    getActions(): readonly Action[];
    /**
     * Get the raw data for testing or debugging
     * @internal
     */
    getData(): Record<string, string>;
    /**
     * Check if this response contains an error
     */
    hasError(): boolean;
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
    merge(other: LLMInfo): this;
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
    setError(error: CommandError): this;
    /**
     * Convert to string format for LLM consumption.
     * This is the primary output method.
     *
     * Format varies based on whether an error occurred:
     * - Error: STOP PROCESSING header with error details and recovery
     * - Success: Structured sections for actions, files, data, and instructions
     */
    toString(): string;
    /**
     * Validate key format (UPPER_SNAKE_CASE)
     */
    private isValidKey;
}
