/**
 * @file Mathematical Calculator Helper
 * 
 * Domain-agnostic mathematical calculation utilities that perform statistical 
 * operations, ratio calculations, and data analysis computations without any 
 * interpretation or subjective analysis. All methods return numerical results 
 * based on mathematical formulas and statistical measures.
 * 
 * CRITICAL: This helper performs FACTS-ONLY calculations. No analysis,
 * interpretation, or quality judgments are made - only mathematical operations.
 */

/**
 * Time series data point for temporal analysis
 */
export interface TimeSeriesPoint {
  timestamp: Date
  type?: string
  value: number
}

/**
 * Time bin for aggregated temporal data
 */
export interface TimeBin {
  average: number
  count: number
  endTime: Date
  startTime: Date
}

/**
 * Pure mathematical calculation utilities
 * 
 * Provides statistical calculations, ratio computations, and mathematical
 * operations for fact collection services. All methods are deterministic
 * and produce the same output for the same input.
 */
export class MathematicalCalculator {
  /**
   * Bin time series data by specified time interval
   * 
   * @param data - Array of time series points
   * @param binSize - Size of each time bin ('hour', 'day', 'week')
   * @returns Array of time bins with aggregated data
   */
  static binDataByTime(data: TimeSeriesPoint[], binSize: 'day' | 'hour' | 'week'): TimeBin[] {
    if (data.length === 0) return []
    
    const bins = new Map<string, TimeBin>()
    
    for (const point of data) {
      const binKey = this.getBinKey(point.timestamp, binSize)
      
      if (!bins.has(binKey)) {
        const binStart = this.getBinStart(point.timestamp, binSize)
        const binEnd = this.getBinEnd(binStart, binSize)
        
        bins.set(binKey, {
          average: 0,
          count: 0,
          endTime: binEnd,
          startTime: binStart
        })
      }
      
      const bin = bins.get(binKey)
      if (bin) {
        bin.count += point.value
      }
    }
    
    // Calculate averages and sort by time
    const result = [...bins.values()]
    for (const bin of result) {
      bin.average = Math.round((bin.count / this.getBinDuration(binSize)) * 100) / 100
    }
    
    return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  /**
   * Calculate number of business days between two dates (excludes weekends)
   * 
   * @param start - Start date
   * @param end - End date
   * @returns Number of business days
   */
  static businessDaysBetween(start: Date, end: Date): number {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (startDate >= endDate) return 0
    
    let businessDays = 0
    let currentDate = new Date(startDate)
    
    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        businessDays++
      }

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
    }
    
    return businessDays
  }

  /**
   * Calculate Gini coefficient for measuring inequality in distribution
   * 
   * @param values - Array of numerical values (contributions, commits, etc.)
   * @returns Gini coefficient (0 = perfect equality, 1 = maximum inequality)
   */
  static calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0
    if (values.length === 1) return 0
    
    const sortedValues = [...values].sort((a, b) => a - b)
    const n = sortedValues.length
    const mean = this.calculateMean(sortedValues)
    
    if (mean === 0) return 0
    
    let sum = 0
    for (let i = 0; i < n; i++) {
      const value = sortedValues[i] ?? 0
      sum += (2 * (i + 1) - n - 1) * value
    }
    
    return Math.round((sum / (n * n * mean)) * 100) / 100
  }

  /**
   * Calculate growth rate between two periods
   * 
   * @param current - Current period value
   * @param previous - Previous period value
   * @returns Growth rate as decimal (-1.0 to +∞), 0 if previous is 0 and current is 0
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 1 : 0
    return Math.round(((current - previous) / previous) * 100) / 100
  }

  /**
   * Calculate arithmetic mean of an array of numbers
   * 
   * @param values - Array of numerical values
   * @returns Mean value rounded to 2 decimal places, 0 for empty array
   */
  static calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + val, 0)
    return Math.round((sum / values.length) * 100) / 100
  }

  /**
   * Calculate median of an array of numbers
   * 
   * @param values - Array of numerical values
   * @returns Median value, 0 for empty array
   */
  static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      const lowerValue = sorted[middle - 1] ?? 0
      const upperValue = sorted[middle] ?? 0
      return Math.round(((lowerValue + upperValue) / 2) * 100) / 100
    }
    
    return sorted[middle] ?? 0
  }

  /**
   * Calculate percentage with division by zero protection
   * 
   * @param part - The partial value
   * @param whole - The total value
   * @returns Percentage rounded to 2 decimal places, 0 if whole is 0
   */
  static calculatePercentage(part: number, whole: number): number {
    if (whole === 0) return 0
    return Math.round((part / whole) * 10_000) / 100 // 2 decimal places for percentage
  }

  /**
   * Calculate specified percentiles for array of values
   * 
   * @param values - Array of numerical values
   * @param percentiles - Array of percentile values (0-100)
   * @returns Object mapping percentile to calculated value
   */
  static calculatePercentiles(values: number[], percentiles: number[]): Record<string, number> {
    if (values.length === 0) return {}
    
    const sorted = [...values].sort((a, b) => a - b)
    const result: Record<string, number> = {}
    
    for (const percentile of percentiles) {
      if (percentile < 0 || percentile > 100) continue
      
      const index = (percentile / 100) * (sorted.length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      
      if (lower === upper) {
        result[`P${percentile}`] = sorted[lower] ?? 0
      } else {
        const weight = index - lower
        const lowerValue = sorted[lower] ?? 0
        const upperValue = sorted[upper] ?? 0
        result[`P${percentile}`] = Math.round((lowerValue * (1 - weight) + upperValue * weight) * 100) / 100
      }
    }
    
    return result
  }

  /**
   * Calculate ratio between two numbers with division by zero protection
   * 
   * @param numerator - The dividend
   * @param denominator - The divisor
   * @returns Ratio rounded to 2 decimal places, 0 if denominator is 0
   */
  static calculateRatio(numerator: number, denominator: number): number {
    if (denominator === 0) return 0
    return Math.round((numerator / denominator) * 100) / 100
  }

  /**
   * Calculate standard deviation of an array of numbers
   * 
   * @param values - Array of numerical values
   * @returns Standard deviation rounded to 2 decimal places
   */
  static calculateStandardDeviation(values: number[]): number {
    const variance = this.calculateVariance(values)
    return Math.round(Math.sqrt(variance) * 100) / 100
  }

  /**
   * Calculate variance of an array of numbers
   * 
   * @param values - Array of numerical values
   * @returns Variance rounded to 2 decimal places, 0 for empty array or single value
   */
  static calculateVariance(values: number[]): number {
    if (values.length <= 1) return 0
    
    const mean = this.calculateMean(values)
    const squaredDifferences = values.map(value => (value - mean)**2)
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length
    
    return Math.round(variance * 100) / 100
  }

  /**
   * Calculate number of days between two dates
   * 
   * @param start - Start date
   * @param end - End date  
   * @returns Number of days (can be fractional for sub-day precision)
   */
  static daysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.round((diffTime / (1000 * 60 * 60 * 24)) * 100) / 100
  }

  /**
   * Find top N items from array based on specified property
   * 
   * @param items - Array of items
   * @param n - Number of top items to return
   * @param sortBy - Property to sort by
   * @returns Top N items sorted in descending order
   */
  static findTopN<T>(items: T[], n: number, sortBy: keyof T): T[] {
    if (items.length === 0 || n <= 0) return []
    
    return [...items]
      .sort((a, b) => {
        const aVal = Number(a[sortBy]) || 0
        const bVal = Number(b[sortBy]) || 0
        return bVal - aVal // Descending order
      })
      .slice(0, n)
  }

  /**
   * Calculate number of hours between two dates
   * 
   * @param start - Start date
   * @param end - End date
   * @returns Number of hours (can be fractional)
   */
  static hoursBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.round((diffTime / (1000 * 60 * 60)) * 100) / 100
  }

  /**
   * Get bin duration for average calculation
   */
  private static getBinDuration(binSize: 'day' | 'hour' | 'week'): number {
    switch (binSize) {
      case 'day': {
        return 24
      }

      case 'hour': {
        return 1
      }

      case 'week': {
        return 168
      } // 24 * 7

      default: {
        return 1
      }
    }
  }

  /**
   * Get bin end time
   */
  private static getBinEnd(binStart: Date, binSize: 'day' | 'hour' | 'week'): Date {
    const result = new Date(binStart)
    
    switch (binSize) {
      case 'day': {
        result.setDate(result.getDate() + 1)
        break
      }

      case 'hour': {
        result.setHours(result.getHours() + 1)
        break
      }

      case 'week': {
        result.setDate(result.getDate() + 7)
        break
      }
    }
    
    return result
  }

  /**
   * Get bin key for time grouping
   */
  private static getBinKey(date: Date, binSize: 'day' | 'hour' | 'week'): string {
    switch (binSize) {
      case 'day': {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      }

      case 'hour': {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
      }

      case 'week': {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
      }

      default: {
        return date.toISOString()
      }
    }
  }

  /**
   * Get bin start time
   */
  private static getBinStart(date: Date, binSize: 'day' | 'hour' | 'week'): Date {
    const result = new Date(date)
    
    switch (binSize) {
      case 'day': {
        result.setHours(0, 0, 0, 0)
        break
      }

      case 'hour': {
        result.setMinutes(0, 0, 0)
        break
      }

      case 'week': {
        result.setDate(date.getDate() - date.getDay())
        result.setHours(0, 0, 0, 0)
        break
      }
    }
    
    return result
  }
}