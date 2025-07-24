/**
 * @file Generic data keys used across the application
 *
 * This file contains only truly generic keys that are reused across
 * multiple contexts. Domain-specific keys should be defined within
 * their respective DTO classes.
 */
/**
 * Generic data keys for common concepts
 *
 * These keys represent generic concepts that appear across multiple
 * domains. For domain-specific keys (e.g., REPOSITORY_NAME, COMMIT_COUNT),
 * define them within the relevant DTO class as private static constants.
 */
export declare const DataKeys: {
    readonly ANALYZED_AT: "ANALYZED_AT";
    readonly COUNT: "COUNT";
    readonly CREATED_AT: "CREATED_AT";
    readonly DATE: "DATE";
    readonly DESCRIPTION: "DESCRIPTION";
    readonly ERROR_CONTEXT: "ERROR_CONTEXT";
    readonly ERROR_MESSAGE: "ERROR_MESSAGE";
    readonly ERROR_RECOVERY: "ERROR_RECOVERY";
    readonly ERROR_TYPE: "ERROR_TYPE";
    readonly ID: "ID";
    readonly LANGUAGE: "LANGUAGE";
    readonly MESSAGE: "MESSAGE";
    readonly MODE: "MODE";
    readonly NAME: "NAME";
    readonly OWNER: "OWNER";
    readonly STATUS: "STATUS";
    readonly TOTAL: "TOTAL";
    readonly TYPE: "TYPE";
    readonly UPDATED_AT: "UPDATED_AT";
    readonly URL: "URL";
    readonly VALID: "VALID";
    readonly VERSION: "VERSION";
};
/**
 * Type-safe data key type
 */
export type DataKey = typeof DataKeys[keyof typeof DataKeys];
