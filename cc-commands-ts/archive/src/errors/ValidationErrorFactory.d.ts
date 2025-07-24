/**
 * @file Factory for creating validation-specific CommandErrors
 *
 * This factory creates CommandError instances for input validation failures
 * with helpful recovery instructions specific to the validation problem.
 *
 * @example
 * ```typescript
 * // Validate a URL
 * if (!isValidUrl(input)) {
 *   throw ValidationErrorFactory.invalidUrl('projectUrl', input)
 * }
 * ```
 */
import { JsonValue } from '../types/DataTypes';
import { CommandError } from './CommandError';
/**
 * Factory for creating validation-related errors with appropriate recovery instructions
 */
export declare class ValidationErrorFactory {
    /**
     * Create a dependent arguments error (A requires B)
     *
     * @param providedArg - The argument that was provided
     * @param requiredArg - The argument that is required when using providedArg
     * @returns CommandError with dependency instructions
     */
    static dependentArgument(providedArg: string, requiredArg: string): CommandError;
    /**
     * Create an invalid argument format error
     *
     * @param argName - Name of the argument
     * @param providedValue - What the user provided
     * @param expectedFormat - What format was expected
     * @param examples - Optional examples of valid values
     * @returns CommandError with format correction instructions
     */
    static invalidArgument(argName: string, providedValue: JsonValue, expectedFormat: string, examples?: string[]): CommandError;
    /**
     * Create an invalid choice error (value not in allowed set)
     *
     * @param argName - Name of the argument
     * @param value - The invalid value provided
     * @param validChoices - List of valid choices
     * @returns CommandError with valid choices listed
     */
    static invalidChoice(argName: string, value: string, validChoices: string[]): CommandError;
    /**
     * Create an invalid URL error
     *
     * @param argName - Name of the URL argument
     * @param providedValue - The invalid URL provided
     * @param expectedPattern - Optional pattern description
     * @returns CommandError with URL format instructions
     */
    static invalidUrl(argName: string, providedValue: string, expectedPattern?: string): CommandError;
    /**
     * Create a missing required argument error
     *
     * @param argName - Name of the missing argument
     * @param purpose - What this argument is used for
     * @param position - Optional position in command (1st, 2nd, etc)
     * @returns CommandError with argument provision instructions
     */
    static missingRequiredArgument(argName: string, purpose: string, position?: number): CommandError;
    /**
     * Create a mutually exclusive arguments error
     *
     * @param args - The conflicting arguments
     * @returns CommandError with conflict resolution instructions
     */
    static mutuallyExclusiveArgs(...args: string[]): CommandError;
    /**
     * Create an out of range error for numeric values
     *
     * @param argName - Name of the argument
     * @param value - The provided value
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @returns CommandError with range correction instructions
     */
    static outOfRange(argName: string, value: number, min?: number, max?: number): CommandError;
    /**
     * Helper to get ordinal suffix (1st, 2nd, 3rd, etc)
     * @private
     */
    private static getOrdinalSuffix;
}
