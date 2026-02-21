# Add user-defined tags for trips and shifts

## Summary
Allow users to add free-form tags to trips and shifts (e.g. `weather`, `temperature`, `pay type`, `busy`, etc.). Tags can be entered as a comma-delimited string or via a chips-style UI. Tags should be stored and searchable/filterable.

## Motivation
Users need a lightweight way to attach custom metadata to trips and shifts for filtering, reporting and ad-hoc notes. Common examples: weather conditions, temperature, pay type (per-order vs per-hour), special events, or custom categories.

## Proposed changes
- Data model
  - Add a `tags` field to trip and shift entities (persisted as a string of comma-separated values or as an array in domain models).
  - Dexie/local DB: add column to `trips` and `shifts` tables (nullable string).
  - Backend/Sheets mapping: add an optional `Tags` column to export/import flows (omit if empty).

- UI
  - Trip/Shift form: add an input supporting either comma-delimited entry or chips (Angular Material chips) with validation to trim whitespace and deduplicate.
  - Trip/Shift list and detail views: show tags as chips; support quick filter by tag.
  - Provide ability to search/filter trips/shifts by tag in main lists.

- UX details
  - Store tags in lowercase or normalize on save to improve matching.
  - Limit: optional soft limit (e.g., max 10 tags or 64 chars per tag) — can be decided in implementation.

- Tests
  - Unit tests for parsing/normalizing tag strings, saving/loading from Dexie, and mapper functions to/from Sheets.
  - E2E or integration tests for form entry and list filtering.

## Acceptance criteria
- Users can add/edit tags on trips and shifts via forms.
- Tags persist across reloads and sync with backend/export flows (empty tags omitted from exports).
- Tags are visible on trip/shift list items and usable as filters.
- Basic validation/normalization in place (trim, dedupe).

## Notes / Implementation suggestions
- Keep Sheets column optional — don't break existing sheets if column absent.
- Consider storing tags as array in the app domain model but serialize to comma-delimited string for legacy storage and Sheets.
- Label suggestion: `enhancement`, `feature`, `needs-discussion`.

## RaptorSheets impact
- This change requires adding two optional columns in RaptorSheets: a `Tags` column on the `Trips` sheet and a `Tags` column on the `Shifts` sheet.
- The Sheets columns should be optional and omitted from exports when empty to avoid breaking existing users.
- Update mappers in `RaptorSheets.Gig` to map the new columns to/from the domain `tags` field (serialize as comma-delimited string when writing to Sheets, parse into an array when reading).
- Add corresponding entries to `SheetsConfig` and any `Entity`/`Mapper` helpers so automated header generation and `UpdateColumns()` work correctly.

---

If preferred, I can open a draft PR that adds the field to the domain model, updates Dexie schema, and adds the UI input + tests.
