/**
 * @file Orchestrator Service Interfaces
 * 
 * Core interfaces for orchestrator services and service dependency injection.
 * Defines the contracts for service coordination and data collection.
 */

import { LLMInfo } from '../LLMInfo'

/**
 * Orchestrator service function type - coordinates regular services
 * 
 * Orchestrator services sit between orchestrators and regular services.
 * They follow the same functional pattern as orchestrators but focus on
 * specific domains and return LLMInfo objects.
 */
export type IOrchestratorService = (
  args: string,
  services: TOrchestratorServiceMap
) => Promise<LLMInfo>

/**
 * Regular orchestrator function type
 * 
 * Main orchestrator functions coordinate multiple orchestrator services
 * and return LLMInfo for CLI consumption.
 */
export type IOrchestrator = (
  commandArgs: string,
  services: TOrchestratorServiceMap
) => Promise<LLMInfo>

/**
 * Collection of orchestrator services
 * 
 * Generic service map that allows dynamic access to orchestrator services.
 * Each service implements IOrchestratorService and returns LLMInfo.
 * MUST be extended, never used directly
 */
export type TOrchestratorServiceMap = {
  [serviceName: string]: IOrchestratorService
}