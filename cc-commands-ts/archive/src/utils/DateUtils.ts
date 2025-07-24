import { endOfDay, format, formatDistanceToNow, startOfDay, subHours } from 'date-fns'

/**
 * Utility functions for date handling
 */
export const DateUtils = {
  /**
   * Get the end of a day
   */
  endOfDay(date: Date): Date {
    return endOfDay(date)
  },
  
  /**
   * Format a date for display
   */
  formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  },
  
  /**
   * Format a relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true })
  },
  
  /**
   * Get a date that is a certain number of hours in the past
   */
  getDateHoursAgo(hours: number): Date {
    return subHours(new Date(), hours)
  },
  
  /**
   * Get a human-readable time period description
   */
  getTimePeriodDescription(hours: number): string {
    if (hours === 24) {
      return 'last 24 hours'
    }

 if (hours === 168) {
      return 'last week'
    }

 if (hours === 720 || hours === 744) {
      return 'last month'
    }
 
      return `last ${hours} hours`
    
  },
  
  /**
   * Check if a date string is within a time period
   */
  isWithinPeriod(dateString: string, startDate: Date): boolean {
    const date = new Date(dateString)
    return date >= startDate && date <= new Date()
  },
  
  /**
   * Get the start of a day
   */
  startOfDay(date: Date): Date {
    return startOfDay(date)
  },
  
  /**
   * Format a date in ISO format for API calls
   */
  toISOString(date: Date): string {
    return date.toISOString()
  },
};