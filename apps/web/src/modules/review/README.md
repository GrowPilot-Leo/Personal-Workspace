# review module

## Responsibility
Daily, weekly and monthly review views across modules. Continues using real V1 daily reviews where possible.

## Non-responsibility
- Does not own another module's review content

## Public API (`public.ts`)
- `ReviewSummary` type: periodKey, horizon, wins/blockers/adjustment
- `isReviewDue()`: pure scheduling check

## Dependencies
- `core/identity`, `core/reviews`, `core/events`

## Data
Reviews are versioned records owned by their source module; review module only reads them.
