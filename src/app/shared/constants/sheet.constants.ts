/**
 * Sheet source constants and mappings
 * Maps backend source codes to user-friendly labels
 */
export const SHEET_CONSTANTS = {
    SOURCES: {
        LAMBDA: 'lambda',
        S3: 's3'
    }
} as const;

/**
 * Human-readable labels for sheet sources
 * Used for displaying data source information in the UI
 */
export const SHEET_SOURCE_LABELS: Record<string, string> = {
    [SHEET_CONSTANTS.SOURCES.LAMBDA]: 'Direct Service',
    [SHEET_CONSTANTS.SOURCES.S3]: 'Cloud Storage'
};
