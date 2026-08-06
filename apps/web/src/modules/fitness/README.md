# fitness module

## Responsibility
Creates and adapts fitness plans from confirmed personal data. Body-image analysis is observational and non-diagnostic.

## Non-responsibility
- No medical diagnosis or rehabilitation prescription
- No guaranteed fitness outcomes
- No exhaustive equipment enumeration during profile setup

## Public API (`public.ts`)
- `ConfirmedObservation` type: original, finalValue, decision, decidedAt
- `FitnessSessionSummary` type for Today aggregation
- `observationMayInfluencePlan()`: pure guard

## Dependencies
- `core/identity`, `core/plans`, `core/events`

## Data
Only confirmed or user-edited observations may influence plans. Pending/rejected observations never do.
