/**
 * @file Test service factory for integration tests
 * 
 * Creates test doubles instead of real service implementations.
 * This allows integration tests to run without external dependencies.
 */

import type { ProjectSummaryServices } from '../../src/orchestrators/g/gh/project/executeProjectSummary'

import { TestDataCollector } from '../doubles/TestDataCollector'
import { TestEnvironmentValidator } from '../doubles/TestEnvironmentValidator'
import { TestProjectDetector } from '../doubles/TestProjectDetector'

export interface TestProjectSummaryServices extends ProjectSummaryServices {
  dataCollector: TestDataCollector
  envValidator: TestEnvironmentValidator
  projectDetector: TestProjectDetector
}

/**
 * Factory for creating test service implementations
 */
export const TestServiceFactory = {
  /**
   * Create test services for project summary command
   */
  createProjectSummaryServices(): TestProjectSummaryServices {
    return {
      dataCollector: new TestDataCollector(),
      envValidator: new TestEnvironmentValidator(),
      projectDetector: new TestProjectDetector(),
    }
  },
};