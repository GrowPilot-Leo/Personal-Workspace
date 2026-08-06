# badge module

## Responsibility
Traceable badge journey: planned gray, active gray-to-gold, completed gold, verified gold with evidence marker. Every badge has an evidence page.

## Non-responsibility
- Clicking complete does not by itself prove ability
- Badges are not external qualifications

## Public API (`public.ts`)
- `BadgeState` type: planned | active | completed | verified
- `BadgeEvidence` type
- `advanceBadgeProgress()`: pure state transition

## Dependencies
- `core/identity`, `core/events`

## Data
Badge progress derives from real records: tasks, time, outputs, assessments, reviews, plan revisions and evidence links.
