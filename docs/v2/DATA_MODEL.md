# GrowPilot V2 data model

## 1. Principles

- Structured facts use structured storage.
- Files use private object storage.
- Search indexes are derived data and may be rebuilt.
- AI proposals and user-confirmed values are separate.
- Templates, plans and important assessments are versioned.
- V1 migration is tested and reversible.
- Deleting a feature does not silently delete its records.

## 2. Core

```text
UserProfile
Goal
Task
Plan
PlanVersion
PlanRevisionProposal
Review
DomainEvent
AuditEntry
```

## 3. Learning

```text
LearningTemplate
TemplateVersion
FieldDefinition
LearningSpace
LearningStage
LearningPlan
LearningTask
LearningSession
LearningOutput
Assessment
KnowledgePoint
LearningReview
```

A learning space references a template version. Editing a template creates a new version instead of rewriting historical records.

## 4. Career

```text
CareerProfile
CareerGoal
TargetRole
JobDescription
Competency
CompetencyAssessment
SkillGap
CareerRoadmap
CareerMilestone
CareerTask
CareerEvidence
PortfolioItem
InterviewRecord
CareerReview
```

Career links to learning spaces through stable IDs. It does not copy their content.

## 5. English

```text
EnglishProfile
EnglishGoal
EnglishSkill
EnglishScenario
EnglishTask
EnglishSession
EnglishOutput
EnglishAssessment
EnglishReview
```

Listening, speaking, reading and writing evidence remains separate so one dimension cannot hide another.

## 6. Fitness

```text
FitnessProfile
BodyMeasurement
BodyImage
VisionObservation
ConfirmedBodyObservation
FitnessGoal
WorkoutPlan
WorkoutPlanVersion
WorkoutWeek
WorkoutDay
WorkoutExercise
WorkoutSession
ExerciseRecord
WorkoutFeedback
RecoveryCheck
```

`VisionObservation` stores model output and confidence. `ConfirmedBodyObservation` stores the user's decision and edited value. Only the latter may be read by plan generation.

## 7. Knowledge

```text
KnowledgeResource
ResourceVersion
ResourceScope
ProcessingJob
KnowledgeChunk
EmbeddingRecord
SearchCitation
RetrievalTrace
UserRetrievalFeedback
```

Raw resources and normalized text are authoritative. Chunks and embeddings are derived and replaceable.

## 8. Badges

```text
BadgeDefinition
BadgeRuleVersion
UserBadge
BadgeEvidence
BadgeProgress
```

Suggested states:

```text
planned -> active -> completed -> verified
```

A manual task completion may advance progress but does not automatically create a verified badge.

## 9. Appearance

```text
ThemePreference
ChartPalettePreference
WallpaperAsset
WallpaperPreference
MotionPreference
```

User media stores ownership, type, size, processing state and deletion state. Never treat uploaded content as executable code.

## 10. AI platform

```text
ProviderConfiguration
ModelCapability
HarnessRun
ToolInvocation
ApprovalRequest
StructuredOutputValidation
ModelUsageRecord
```

Secrets are referenced through `secretRef`; plaintext keys do not belong in application records returned to the browser.

## 11. V1 migration

V1 currently contains a local daily loop. The migration must:

1. read and validate `growpilot.daily-loop.v1`
2. preserve a raw backup
3. map goal, tasks, review and history to V2 entities
4. record migration version and result
5. retry safely without duplicating records
6. provide a user-visible export path before destructive cleanup

V1 data cleanup is a separate, explicitly approved later action.
