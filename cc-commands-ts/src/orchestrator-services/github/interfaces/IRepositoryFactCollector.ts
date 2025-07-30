/**
 * @file Repository Fact Collector Interface
 * 
 * Interface for pure fact collection from GitHub repositories.
 * All methods return raw mathematical data without any interpretation,
 * analysis, or subjective assessment.
 */

/**
 * Repository fact collector interface
 * 
 * Defines methods for collecting pure mathematical facts from GitHub repositories.
 * All methods return key-value pairs of factual data that can be directly
 * consumed by LLMInfo without any interpretation layer.
 */
export interface IRepositoryFactCollector {
  /**
   * Collect repository activity facts for a given time period
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for activity analysis
   * @returns Promise of activity facts (commits, issues, PRs, ratios, etc.)
   */
  collectActivityFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>>

  /**
   * Collect basic repository metadata facts
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Promise of basic metadata facts (name, creation date, language, etc.)
   */
  collectBasicFacts(owner: string, repo: string): Promise<Record<string, string>>

  /**
   * Collect contributor-related facts
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for contributor analysis
   * @returns Promise of contributor facts (counts, distribution metrics, etc.)
   */
  collectContributorFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>>

  /**
   * Collect detailed issue analysis facts
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for issue analysis
   * @returns Promise of issue facts (resolution times, age metrics, ratios)
   */
  collectIssueAnalysisFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>>

  /**
   * Collect pull request facts
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for PR analysis
   * @returns Promise of PR facts (merge times, success rates, size metrics)
   */
  collectPullRequestFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>>

  /**
   * Collect timing pattern facts from repository activity
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for timing analysis
   * @returns Promise of timing facts (patterns, frequencies, time-based metrics)
   */
  collectTimingPatternFacts(owner: string, repo: string, since: Date): Promise<Record<string, string>>
}