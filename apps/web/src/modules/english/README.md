# english module

## Responsibility
Fixed general English experience for fluent listening, speaking, reading and writing in daily life and work. Not limited to job-search English.

## Non-responsibility
- Not job-search/interview/technical English only
- Does not own learning-space curriculum

## Public API (`public.ts`)
- `EnglishSkillDimension` type: listening | speaking | reading | writing
- `EnglishTaskSummary` type for Today aggregation
- `englishTaskSummaries()`: pure mapping

## Dependencies
- `core/identity`, `core/tasks`, `core/plans`, `core/events`

## Data
Evidence per skill dimension stays separate so one dimension cannot hide another.
