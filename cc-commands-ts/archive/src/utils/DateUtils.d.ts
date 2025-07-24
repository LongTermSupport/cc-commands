/**
 * Utility functions for date handling
 */
export declare const DateUtils: {
    /**
     * Get the end of a day
     */
    endOfDay(date: Date): Date;
    /**
     * Format a date for display
     */
    formatDate(date: Date): string;
    /**
     * Format a relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date: Date): string;
    /**
     * Get a date that is a certain number of hours in the past
     */
    getDateHoursAgo(hours: number): Date;
    /**
     * Get a human-readable time period description
     */
    getTimePeriodDescription(hours: number): string;
    /**
     * Check if a date string is within a time period
     */
    isWithinPeriod(dateString: string, startDate: Date): boolean;
    /**
     * Get the start of a day
     */
    startOfDay(date: Date): Date;
    /**
     * Format a date in ISO format for API calls
     */
    toISOString(date: Date): string;
};
