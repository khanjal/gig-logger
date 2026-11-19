import { ENTER } from '@angular/cdk/keycodes';

/** Tag entry behaviour and labels - no magic strings/numbers in the component. */
export const TAG_INPUT = {
    DEFAULT_LABEL: 'Tags',
    PLACEHOLDER: 'Add a tag...',
    /**
     * The sheet stores tags comma-delimited, but that is our encoding - a user should never have
     * to type one, and a tag containing a comma would corrupt the column. Stripped on input.
     */
    SEPARATOR: ',',
    SEPARATOR_KEY_CODES: [ENTER] as const,
} as const;
