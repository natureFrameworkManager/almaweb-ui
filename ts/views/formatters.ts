/**
 * Format an ISO date for the German interface.
 * @param date - ISO date value.
 * @returns The localized date string.
 */
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("de-DE");
}

/**
 * Format a pair of time values for display.
 * @param start - Start time.
 * @param end - End time.
 * @returns The formatted time range.
 */
export function formatTimeRange(start: string, end: string): string {
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}
