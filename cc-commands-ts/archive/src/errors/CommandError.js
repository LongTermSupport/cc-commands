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
export class CommandError {
    originalError;
    recoveryInstructions;
    debugInfo;
    context = {};
    timestamp = new Date();
    /**
     * Create a new CommandError
     *
     * @param originalError - The underlying error that occurred
     * @param recoveryInstructions - Steps the user can take to fix the issue (REQUIRED)
     * @param debugInfo - Additional information for debugging
     * @throws Error if no recovery instructions provided
     * @throws Error if attempting to extend this class
     */
    constructor(originalError, recoveryInstructions, debugInfo = {}) {
        this.originalError = originalError;
        this.recoveryInstructions = recoveryInstructions;
        this.debugInfo = debugInfo;
        // Prevent extension - this class is final
        if (new.target !== CommandError) {
            throw new Error('CommandError is a final class and cannot be extended. ' +
                'Use error factory classes (e.g., GitHubErrorFactory) to create domain-specific errors.');
        }
        // Enforce that recovery instructions are provided
        if (!recoveryInstructions || recoveryInstructions.length === 0) {
            throw new Error('CommandError must include at least one recovery instruction. ' +
                'Help users understand how to fix the problem.');
        }
        // Validate recovery instructions are meaningful
        const invalidInstructions = recoveryInstructions.filter(instruction => !instruction || instruction.trim().length === 0);
        if (invalidInstructions.length > 0) {
            throw new Error('Recovery instructions cannot be empty strings');
        }
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
    static fromError(error, context = {}) {
        // Build debug info, filtering out undefined values
        const debugInfo = {};
        // Add system info
        debugInfo['cwd'] = process.cwd();
        debugInfo['nodeVersion'] = process.version;
        debugInfo['platform'] = process.platform;
        debugInfo['timestamp'] = new Date().toISOString();
        // Add context info, filtering undefined
        if (context.action !== undefined)
            debugInfo['action'] = context.action;
        if (context.command !== undefined)
            debugInfo['command'] = context.command;
        // Add other context properties
        for (const [key, value] of Object.entries(context)) {
            if (value !== undefined && !['action', 'command'].includes(key)) {
                debugInfo[key] = value;
            }
        }
        // Get smart recovery instructions based on error type
        const recoveryInstructions = CommandError.getGenericRecoveryInstructions(error, context);
        const commandError = new CommandError(error, recoveryInstructions, debugInfo);
        // Add any additional context
        for (const [key, value] of Object.entries(context)) {
            if (value !== undefined && !['action', 'command'].includes(key)) {
                commandError.addContext(key, value);
            }
        }
        return commandError;
    }
    /**
     * Get generic recovery instructions based on common error patterns.
     * These are fallbacks when domain-specific error factories aren't used.
     *
     * @private
     */
    static getGenericRecoveryInstructions(error, context) {
        const instructions = [];
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorLower = errorMessage.toLowerCase();
        // File system errors
        if (errorMessage.includes('ENOENT')) {
            const path = context.path || context.file || context.directory || 'the specified path';
            instructions.push(`Check if the file/directory exists: ${path}`, 'Verify you are in the correct working directory', 'Check for typos in the path');
        }
        else if (errorMessage.includes('EACCES') || errorLower.includes('permission')) {
            const resource = context.path || context.file || context.resource || 'the resource';
            instructions.push(`Check permissions on: ${resource}`, 'You may need to run with elevated privileges (sudo)', `Try: chmod 755 ${resource} (adjust permissions as needed)`);
        }
        else if (errorMessage.includes('EEXIST')) {
            instructions.push('The file or directory already exists', 'Remove the existing file/directory or choose a different name', 'Use --force flag if available to overwrite');
        }
        // Network errors
        else if (errorMessage.includes('ECONNREFUSED')) {
            const host = context.host || context.url || 'the target service';
            const port = context.port ? `:${context.port}` : '';
            instructions.push(`Check if the service is running on: ${host}${port}`, 'Verify network connectivity', 'Check firewall settings', 'Ensure the correct host and port are specified');
        }
        else if (errorMessage.includes('ETIMEDOUT') || errorLower.includes('timeout')) {
            instructions.push('The operation timed out', 'Check network connectivity', 'Try increasing the timeout value', 'Verify the remote service is responding');
        }
        // JSON/parsing errors
        else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
            instructions.push('Check that the data is valid JSON format', 'Look for: trailing commas, unquoted keys, single quotes instead of double', 'Use a JSON validator to check the syntax', 'Ensure the file encoding is UTF-8');
        }
        // Module/dependency errors
        else if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
            const module = errorMessage.match(/Cannot find module '([^']+)'/)?.[1] || 'the required module';
            instructions.push(`Install missing dependency: npm install ${module}`, 'Run: npm install (to install all dependencies)', 'Check that you are in the correct directory', 'Verify the module name is spelled correctly');
        }
        // Generic catch-all
        else {
            instructions.push('Check the error message above for specific details', 'Verify all prerequisites are installed and configured', 'Check the command syntax and arguments');
        }
        // Always add these
        instructions.push('Review the debug log for full error context');
        if (error instanceof Error && error.stack) {
            instructions.push('Check the stack trace to identify where the error occurred');
        }
        // Add command-specific help if available
        if (context.command) {
            instructions.push(`Run: ${context.command} --help (for command usage)`);
        }
        return instructions;
    }
    /**
     * Get the error message
     */
    get message() {
        if (this.originalError instanceof Error) {
            return this.originalError.message;
        }
        return String(this.originalError);
    }
    /**
     * Get the stack trace if available
     */
    get stack() {
        if (this.originalError instanceof Error) {
            return this.originalError.stack;
        }
        return undefined;
    }
    /**
     * Get the error type/class name
     */
    get type() {
        if (this.originalError instanceof Error) {
            return this.originalError.constructor.name;
        }
        return 'UnknownError';
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
    addContext(key, value) {
        if (value !== undefined) {
            this.context[key] = value;
        }
    }
}
