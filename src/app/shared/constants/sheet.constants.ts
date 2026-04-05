/**
 * Sheet source constants and mappings
 * Maps backend source codes to user-friendly labels
 */
export const SHEET_CONSTANTS = {
    SOURCES: {
        LAMBDA: 'lambda',
        S3: 's3'
    },
    DEMO_NAME_PREFIX: 'RaptorGig Demo'
} as const;

/**
 * Human-readable labels for sheet sources
 * Used for displaying data source information in the UI
 */
export const SHEET_SOURCE_LABELS: Record<string, string> = {
    [SHEET_CONSTANTS.SOURCES.LAMBDA]: 'Direct Service',
    [SHEET_CONSTANTS.SOURCES.S3]: 'Cloud Storage'
};

/**
 * Determines whether a sheet name matches the demo sheet naming format.
 * @param sheetName The spreadsheet name to evaluate.
 * @returns True when the name uses the configured demo prefix.
 */
export function isDemoSheetName(sheetName?: string): boolean {
    return (sheetName ?? '').startsWith(SHEET_CONSTANTS.DEMO_NAME_PREFIX);
}
