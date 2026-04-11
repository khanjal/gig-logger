# Zoneless Migration Tracker

This document tracks the longer-term fixes for a stable Angular zoneless migration.

GitHub issue: https://github.com/khanjal/gig-logger/issues/455

## Goal
Move from manual change-detection patching to robust, testable, and reactive state management.

## Tracking Legend
- [ ] Not started
- [~] In progress
- [x] Done

## Work Plan

### 1) Move high-churn page state to signals first
- [ ] Convert mutable page state and manual markForCheck calls to writable/computed signals.
- [ ] Prioritize pages:
  - src/app/pages/trips/trips.component.ts
  - src/app/pages/shifts/shifts.component.ts
  - src/app/pages/expenses/expenses.component.ts
  - src/app/pages/search/search.component.ts
- [ ] Define a repeatable migration pattern for other pages.

Progress updates:
- [~] Shifts reference migration started (signals for high-churn UI state and template signal bindings).
- [~] Search migration started (signals for high-churn UI state, filter state, and template signal bindings).
- [~] Trips migration started (signals for high-churn UI state, route/edit state, and template signal bindings).
- [~] Expenses migration started (signals for high-churn page state and template signal bindings).
- [ ] Validate runtime behavior and use Shifts as pattern for Search/Trips/Expenses.

### 2) Standardize async data flow with RxJS + async pipe or toSignal
- [ ] Replace imperative load chains with single reactive pipelines where practical.
- [ ] Prioritize pages:
  - src/app/pages/metrics/metrics.component.ts
  - src/app/pages/stats/stats.component.ts
  - src/app/pages/pending-changes/pending-changes.component.ts
- [ ] Reduce manual lifecycle and subscription boilerplate.

Progress updates:
- [~] Pending Changes refactored to signal-based state and `toSignal` query param handling.
- [~] Metrics refactored to lifecycle-safe reactive subscriptions with `takeUntilDestroyed` (removed manual subscription tracking).
- [~] Stats refactored to signal-backed page state and template bindings (removed manual `markForCheck` usage).
- [ ] Continue Step 2 conversion on metrics/stats where stream composition gives the biggest benefit.

### 3) Introduce a zoneless-safe UI state pattern
- [ ] Create a shared async state pattern for loading/success/error transitions.
- [ ] Apply first in setup and search flows:
  - src/app/pages/setup/setup.component.ts
  - src/app/pages/setup/sheet-link/sheet-link.component.ts
  - src/app/pages/search/search.component.ts
- [ ] Remove ad hoc boolean state toggles across components.

### 4) Remove template-invoked heavy methods from Search and Stats
- [ ] Precompute totals and aggregates on data changes.
- [ ] Minimize template function invocations in:
  - src/app/pages/search/search.component.ts
  - src/app/pages/stats/**
- [ ] Add notes in PRs for template performance-sensitive changes.

### 5) Fix type boundaries, especially date handling, once
- [ ] Formalize form model to domain model conversion helpers.
- [ ] Apply first to:
  - src/app/pages/expenses/expenses.component.ts
- [ ] Ensure stable Date/string boundaries for forms, storage, and rendering.

### 6) Add targeted zoneless regression tests
- [ ] Add tests for async state transitions and branch toggles that can trigger NG0100.
- [ ] Prioritize:
  - src/app/pages/shifts/shifts.component.ts
  - src/app/pages/expenses/expenses.component.ts
  - src/app/pages/search/search.component.ts
- [ ] Validate known failure modes before merge.

### 7) Clean up bootstrap/runtime migration debt
- [ ] Document the zoneless component update pattern for contributors.
- [ ] Enforce a single preferred approach in new component changes.
- [ ] Prevent reintroduction of zone-based assumptions.

## Current Focus
- [~] Complete signal-first migration for one reference page (Shifts started).

## Notes
- Keep commits small and build-validated.
- Keep page behavior validated on port 4200 due to auth callback constraints.
