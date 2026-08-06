# learning module

## Responsibility
Provides configurable learning spaces. Each space is a data-owned instance of the learning engine: template version + field schema + knowledge scope + plan + records.

## Non-responsibility
- Does not hard-code AI/product learning as permanent modules
- Does not import another module's internal files

## Public API (`public.ts`)
- `LearningSpaceSummary` type: id, name, status, planHorizon
- `LearningTaskSummary` type: id, title, dueAt, status
- `summarizeTasksForToday()`: pure mapping for Today aggregation

## Dependencies
- `core/identity`, `core/goals`, `core/tasks`, `core/plans`, `core/events`

## Data
Learning spaces reference template versions. Editing a template creates a new version.
