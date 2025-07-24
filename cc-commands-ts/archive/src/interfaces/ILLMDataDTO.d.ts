/**
 * @file Interface for Data Transfer Objects that provide data to LLMInfo
 *
 * All DTOs that need to contribute data to LLM responses must implement
 * this interface. This ensures consistent data transformation and type safety.
 */
/**
 * Interface for all DTOs that provide data to LLMInfo
 *
 * This interface enforces a consistent pattern for converting
 * structured data objects into the key-value format required by LLMInfo.
 */
export interface ILLMDataDTO {
    /**
     * Convert the DTO to key-value pairs for LLMInfo
     *
     * @returns Record of data keys to string values. All values must be strings.
     *          Complex data should be serialized appropriately (e.g., arrays as comma-separated).
     *
     * @example
     * ```typescript
     * toLLMData(): Record<string, string> {
     *   return {
     *     REPOSITORY_NAME: this.name,
     *     REPOSITORY_OWNER: this.owner,
     *     TOPICS: this.topics.join(', ')
     *   }
     * }
     * ```
     */
    toLLMData(): Record<string, string>;
}
