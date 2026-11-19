/** Data handed to the tags dialog. Returns the edited list, or undefined when cancelled. */
export interface ITagsDialog {
    /** Tags currently on the trip or shift being edited. */
    tags: string[];
}
