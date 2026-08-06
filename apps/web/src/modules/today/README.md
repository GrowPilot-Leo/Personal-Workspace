# today module

## Responsibility
Aggregates public summaries from other modules into the daily action view. Owns no other module's task or plan data.

## Non-responsibility
- Does not own task or plan data of learning/career/english/fitness
- Does not mutate other modules directly

## Public API (`public.ts`)
- `TodayItem` type: id, sourceModule, title, dueAt, status
- `aggregateTodayItems()`: pure aggregation over provided summaries

## Dependencies
- `core/identity`, `core/events`

## Data
None persisted. Derived view only.
