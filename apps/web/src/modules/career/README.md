# career module

## Responsibility
Turns a target role into a skills-and-evidence roadmap. Links skill gaps to learning spaces without duplicating their course content.

## Non-responsibility
- Does not guarantee employment or readiness as an offer
- Does not duplicate learning-space course content

## Public API (`public.ts`)
- `SkillGap` type: skill, currentState, targetState, linkedSpaceId
- `CareerTaskSummary` type for Today aggregation
- `skillGapTaskSummaries()`: pure mapping

## Dependencies
- `core/identity`, `core/tasks`, `core/plans`, `core/events`

## Data
Career links to learning spaces through stable IDs only.
