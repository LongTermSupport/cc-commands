/**
 * @file Statistical calculation utilities
 * 
 * Static utility methods for statistical calculations used by DTOs
 * to generate calculated data in the calculated namespace.
 */

/**
 * Static utility methods for statistical calculations
 * 
 * Provides deterministic mathematical operations for statistics.
 * All methods are pure functions with no side effects.
 */
export const StatisticsCalculator = {
  
  /**
   * Calculate Gini coefficient for distribution inequality
   * 
   * The Gini coefficient measures statistical dispersion.
   * 0 = perfect equality, 1 = maximal inequality.
   * 
   * @param values - Array of numeric values
   * @returns Gini coefficient rounded to 2 decimal places, or 0 if empty array
   */
  calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0
    
    const sortedValues = [...values].sort((a, b) => a - b)
    const n = sortedValues.length
    const mean = this.calculateMean(sortedValues)
    
    if (mean === 0) return 0
    
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * (sortedValues[i] || 0)
    }
    
    return Math.round((sum / (n * n * mean)) * 100) / 100
  },
  
  /**
   * Calculate growth rate between two values
   * 
   * @param current - Current value
   * @param previous - Previous value for comparison
   * @returns Growth rate as decimal (e.g., 0.15 = 15% growth)
   */
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 1 : 0
    return Math.round(((current - previous) / previous) * 100) / 100
  },
  
  /**
   * Calculate arithmetic mean (average) of numeric values
   * 
   * @param values - Array of numeric values
   * @returns Mean value rounded to 2 decimal places, or 0 if empty array
   */
  calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + val, 0)
    return Math.round((sum / values.length) * 100) / 100  // 2 decimal places
  },
  
  /**
   * Calculate median value of numeric values
   * 
   * @param values - Array of numeric values
   * @returns Median value rounded to 2 decimal places, or 0 if empty array
   */
  calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return Math.round((((sorted[mid - 1] || 0) + (sorted[mid] || 0)) / 2) * 100) / 100
    }
 
      return sorted[mid] || 0
    
  },
  
  /**
   * Calculate percentile value from numeric array
   * 
   * @param values - Array of numeric values
   * @param percentile - Percentile to calculate (0-100)
   * @returns Value at specified percentile, or 0 if empty array
   */
  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const index = (percentile / 100) * (sorted.length - 1)
    
    if (Number.isInteger(index)) {
      return sorted[index] || 0
    }
 
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index - lower
      return (sorted[lower] || 0) * (1 - weight) + (sorted[upper] || 0) * weight
    
  },
};