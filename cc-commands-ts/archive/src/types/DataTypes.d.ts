/**
 * Type definitions for data-only objects (no functions/methods)
 */
/**
 * Represents any valid JSON value
 */
export type JsonValue = boolean | JsonArray | JsonObject | null | number | string;
/**
 * JSON object (data only, no functions)
 */
export interface JsonObject {
    [key: string]: JsonValue;
}
/**
 * JSON array
 */
export type JsonArray = JsonValue[];
/**
 * Simple data object with only primitive values
 */
export type SimpleDataObject = Record<string, boolean | null | number | string>;
/**
 * Context data for errors and debugging
 * Enforces string values for most common cases
 */
export type ErrorContext = {
    [key: string]: boolean | null | number | string | string[] | undefined;
    action?: string;
    command?: string;
    directory?: string;
    errorDomain?: string;
    errorType?: string;
    file?: string;
    host?: string;
    path?: string;
    port?: number;
    resource?: string;
    url?: string;
};
/**
 * Debug info that should be serializable
 */
export type DebugInfo = JsonObject;
/**
 * Type guard to check if a value is a JsonObject
 */
export declare function isJsonObject(value: unknown): value is JsonObject;
/**
 * Type guard to ensure no functions in object
 */
export declare function isDataOnly(obj: unknown): obj is JsonObject;
