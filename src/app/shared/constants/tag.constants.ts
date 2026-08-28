import { COMMA, ENTER } from '@angular/cdk/keycodes';

/** Tag entry behaviour and labels - no magic strings/numbers in the component. */
export const TAG_INPUT = {
    DEFAULT_LABEL: 'Tags',
    PLACEHOLDER: 'Add a tag...',
    /** The sheet stores tags comma-delimited, so comma also ends a chip. */
    SEPARATOR: ',',
    SEPARATOR_KEY_CODES: [ENTER, COMMA] as const,
} as const;
