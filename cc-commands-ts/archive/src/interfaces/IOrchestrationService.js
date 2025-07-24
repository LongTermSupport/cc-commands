/**
 * @file Standard interface for orchestration services
 *
 * ARCHITECTURAL PRINCIPLE:
 * Orchestration services are the building blocks used by orchestrators.
 * They MUST return LLMInfo to maintain the paradigm that TypeScript
 * provides tools and data for the LLM, not intelligence or formatting.
 *
 * These services can internally use any other services with any return
 * types, but their contract with orchestrators is always LLMInfo.
 */
export {};
