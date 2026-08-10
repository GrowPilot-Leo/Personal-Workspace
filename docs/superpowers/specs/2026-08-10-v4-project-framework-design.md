# GrowPilot V4 Project Framework Design

**Date:** 2026-08-10  
**Status:** Approved design baseline pending written-spec review  
**Branch:** `codex/v3-calm-timeline`  
**Draft PR:** #6

## 1. Purpose

Define the complete delivery framework, module boundaries, data flow, implementation sequence, security limits, release gates and acceptance standards for the next GrowPilot development cycle.

The selected strategy is stage-gated delivery. The project closes the configurable-learning foundation before Knowledge and Badges, then builds Career and English, then Fitness, and only then connects production Agent Harness and RAG capabilities.

## 2. Verified Current State

- The V1 local daily loop remains the editable data source.
- The current loop supports goal, daily tasks, completion, review and next-day rollover.
- Learning hands tasks to Today through the shared repository.
- Today owns execution; Review owns reflection and rollover.
- Desktop sidebar and mobile navigation have separate display and route responsibilities.
- Day, Night and Dusk themes, responsive navigation, reduced motion, CI, Playwright and axe checks exist.
- Career, English, Fitness, Knowledge and Badges are still placeholders or partial prototypes.
- Configurable learning spaces do not yet meet the Stage 3 exit condition.
- Draft PR #6 is not merged into `main`.

## 3. Selected Delivery Approach

### Selected: stage gates with minimum complete loops

```text
Integrate current prototype
-> close Stage 3
-> Stage 4 Knowledge and Badges
-> Stage 5 Career and English
-> Stage 6 Fitness
-> Stage 7 Agent Harness and RAG
-> production gate
```

This path reuses one task, plan, review, evidence and approval model instead of building separate infrastructure inside each business module.

### Rejected alternatives

- **Career-first vertical slice:** faster visible business output, but would require later migration of tasks, plans and evidence.
- **Parallel module and AI development:** creates duplicated domain rules, unstable provider coupling and a large unreviewable PR.

## 4. Project Architecture

```text
Routes
  -> Module Public API
  -> Core Contracts and Repositories
  -> Local Storage Adapter (prototype)
  -> Database Adapter (production)

Business Module
  -> AiHarnessPort
  -> Agent Harness
  -> Provider Adapter
  -> DeepSeek or another compatible provider
```

Rules:

- Routes compose modules; they do not contain business rules.
- Modules may use core contracts and platform ports.
- Modules do not import another module's internal files.
- Today does not own another module's plans.
- Business modules do not import provider SDKs.
- UI components do not access storage directly.
- New directories and abstractions are created only when the owning stage needs them.
- No distributed event infrastructure is introduced while the application remains one process.

## 5. Module Ownership

| Module | Owns | Does not own |
|---|---|---|
| Today | Daily aggregation, start, completion | Long-term plan creation |
| Learning | Learning spaces, goals, plans, learning records | Global daily review |
| Review | Daily, weekly and monthly reflection and rollover | Business-module content |
| Knowledge | Resources, versions, scopes, citations, proposals | Silent plan mutation |
| Badges | Progress states and evidence references | Independent ability claims |
| Career | Target roles, skill maps, gaps, milestones, evidence | Copied course content |
| English | Listening, speaking, reading, writing and scenarios | Generic learning-space lifecycle |
| Fitness | Profile, plans, sessions and feedback | Diagnosis or rehabilitation |
| Settings | Appearance, data, privacy and provider configuration | Domain plans |

## 6. Core Contracts

### 6.1 Task

```ts
type Task = {
  id: string;
  ownerModule: "learning" | "career" | "english" | "fitness";
  ownerEntityId: string;
  title: string;
  scheduledDate: string;
  durationMinutes: number;
  status: "planned" | "active" | "done";
  completedAt: string | null;
  createdAt: string;
};
```

A single core task model powers Today. Domain modules retain their own goals, plans and records while referencing scheduled tasks by stable ID.

### 6.2 Plan and versions

```ts
type Plan = {
  id: string;
  ownerModule: "learning" | "career" | "english" | "fitness";
  ownerEntityId: string;
  cadence: "monthly" | "weekly" | "daily";
  activeVersionId: string;
};

type PlanVersion = {
  id: string;
  planId: string;
  version: number;
  goal: string;
  taskIds: string[];
  reason: string;
  createdAt: string;
};
```

An accepted or user-edited proposal creates a new version. Rejected proposals do not modify the active version.

### 6.3 Knowledge proposal

```ts
type PlanRevisionProposal = {
  id: string;
  planId: string;
  baseVersionId: string;
  reason: string;
  citationIds: string[];
  before: unknown;
  after: unknown;
  status: "pending" | "accepted" | "edited" | "rejected";
  createdAt: string;
  decidedAt: string | null;
};
```

### 6.4 Evidence

```ts
type EvidenceReference = {
  id: string;
  evidenceType: "task" | "output" | "review" | "resource";
  entityId: string;
  label: string;
  createdAt: string;
};
```

Badges store evidence references rather than copying source content.

### 6.5 Stage 3–4 records

```ts
type LearningSpace = {
  id: string;
  name: string;
  goal: string;
  status: "draft" | "planned" | "active" | "paused" | "completed" | "archived";
  templateId: string | null;
  currentMonthlyPlanId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  cadence: "daily" | "weekly" | "monthly";
  scopeModule: "workspace" | "learning" | "career" | "english" | "fitness";
  scopeEntityId: string | null;
  date: string;
  summary: string;
  blockers: string;
  adjustment: string;
  createdAt: string;
};

type KnowledgeResource = {
  id: string;
  title: string;
  sourceType: "text";
  scopeModule: "global" | "learning" | "career" | "english" | "fitness";
  scopeEntityId: string | null;
  status: "queued" | "ready" | "failed" | "deleted";
  version: number;
  content: string;
  createdAt: string;
};

type Citation = {
  id: string;
  resourceId: string;
  resourceVersion: number;
  location: string;
  excerpt: string;
};

type Badge = {
  id: string;
  title: string;
  status: "planned" | "active" | "completed" | "verified";
  evidenceIds: string[];
};

type DomainEvent = {
  eventId: string;
  eventType: string;
  moduleId: string;
  entityId: string;
  schemaVersion: number;
  occurredAt: string;
  payload: unknown;
};
```

The prototype accepts real text resources only. File parsing, media storage and vector indexing remain later adapters.

## 7. Prototype Persistence

The prototype uses one validated and versioned local root document:

```ts
type WorkspaceStateV2 = {
  version: 2;
  learningSpaces: LearningSpace[];
  plans: Plan[];
  planVersions: PlanVersion[];
  tasks: Task[];
  reviews: Review[];
  resources: KnowledgeResource[];
  citations: Citation[];
  proposals: PlanRevisionProposal[];
  badges: Badge[];
  evidence: EvidenceReference[];
  events: DomainEvent[];
  updatedAt: string;
};
```

Persistence requirements:

- Read and preserve the raw V1 payload before migration.
- Migration is idempotent and records its result.
- Repository boundaries normalize untrusted stored data.
- A malformed record does not silently erase unrelated valid records.
- Pages use repositories, not direct `localStorage` access.
- Production tables are designed only after database and authentication decisions are approved.

## 8. Cross-Module Data Flows

### 8.1 Daily execution

```text
Learning / Career / English / Fitness
-> create Task with owner identifiers
-> Today queries scheduled tasks
-> user starts or completes task
-> repository updates task
-> domain event records change
-> source module reads result
-> Review summarizes actual records
-> Badge references qualifying evidence
```

### 8.2 Knowledge-triggered plan revision

```text
Import resource
-> validate source and scope
-> create resource version
-> produce citations
-> create pending PlanRevisionProposal
-> show reason and before/after diff
-> user accepts, edits or rejects
-> accepted/edited decision creates PlanVersion
-> rejected decision leaves active plan unchanged
```

## 9. Delivery Stages

### Integration gate

Deliver:

- final review of Draft PR #6
- green CI and Vercel preview
- merge into `main`
- recoverable baseline before new domain work

Exit:

- current visual, navigation and Learning -> Today -> Review loop is accepted
- `main` is the sole base for the next branch

### Stage 3: configurable learning closure

Deliver:

- V2 workspace state, backup and idempotent migration
- learning-space creation from blank or editable template
- edit, pause, archive, export and confirmed deletion
- monthly direction, weekly plan and daily tasks
- source-tagged task handoff to Today
- Review aggregation without plan duplication

Exit:

- a user creates a new learning subject without adding code or a route
- paused spaces stop producing new tasks
- archived spaces are read-only and retain history
- tasks appear in Today with source and return completion state
- V1 migration can run repeatedly without duplicate records

### Stage 4: Knowledge and Badges

Deliver:

- resource model, version, scope and processing state
- real text-resource import
- deterministic citation prototype
- reviewable plan-revision diff
- accept, edit and reject state machine
- badge states, progress and evidence detail

Explicitly excluded:

- production vector database
- production RAG quality claims
- silent plan mutation

Exit:

- citations identify resource, version and location
- uncited proposals cannot claim knowledge support
- only accepted or edited proposals create plan versions
- badge completion and badge verification remain separate
- deleted-resource citations show an invalid state instead of fabricated content

### Stage 5: Career and English

Career deliverables:

- career profile, target role and target date
- user-supplied job description and source
- editable skill map and user-confirmed current state
- skill gaps linked to learning-space IDs
- tasks, milestones and evidence

Career exit:

- job requirements remain traceable to supplied sources
- unknown evidence produces an unknown state, not an invented score
- Career links learning spaces instead of copying content
- Career tasks reach Today with source identifiers

English deliverables:

- goals, scenarios and self-reported starting level
- separate listening, speaking, reading and writing records
- daily and workplace practice
- tasks, outputs, feedback and review

English exit:

- four dimensions remain independently visible
- no practice data means no fabricated improvement
- English tasks reach Today
- the module is not restricted to interview English
- model scoring stays disabled until a rubric and representative samples exist

### Stage 6: Fitness

Deliver:

- lightweight profile, goals and available training days
- monthly direction, weekly schedule and daily session
- exercises, sets, repetitions, load, rest and alternatives
- workout records, difficulty, fatigue, pain and recovery feedback
- mock observation confirmation states without private photo storage

Explicitly excluded:

- diagnosis
- rehabilitation prescription
- guaranteed outcomes
- real image analysis before private media and consent decisions

Exit:

- pending or rejected observations cannot influence plans
- pain feedback cannot automatically increase intensity
- equipment alternatives are handled at exercise level
- sessions reach Today and completion returns to workout records
- plan adjustments retain versions and reasons

### Stage 7A: Agent Harness and DeepSeek

Deliver:

- one `AiHarnessPort`
- server-side DeepSeek adapter
- one controlled use case: structured extraction from a user-supplied job description
- timeout, rate limit, request ID, usage record and visible failure
- feature flag defaulting real calls off in public previews

Exit:

- browser bundles and logs contain no API key
- business modules contain no provider SDK calls
- provider failure never becomes fabricated output
- state-changing tools require approval

### Stage 7B: RAG

Deliver:

- owner-approved evaluation dataset
- scope and metadata filters
- keyword and vector retrieval
- fusion, reranking, context assembly and citations
- user feedback and retrieval traces

Suggested product targets:

- at least 20 representative evaluation questions
- citation correctness at or above 90%
- source coverage at or above 85%
- zero unsupported claims presented as sourced
- zero unapproved writes to plans or user facts

These values are acceptance targets, not current measured results.

## 10. Production Gate

Before real persistent provider keys, private documents or body images:

- choose authentication, database and private object storage
- implement authorization and ownership checks
- implement export and deletion
- define retention rules
- use server-side secret storage
- add rate limiting and budget limits
- redact sensitive logs
- verify backup and rollback
- record user consent for external processing

Dynamic wallpapers, real vision analysis, multi-provider routing and other visual personalization remain optional backlog until core usage justifies them.

## 11. Error and Safety Behavior

- Migration failure preserves V1 and reports a recoverable error.
- Invalid local records are isolated; valid unrelated records remain.
- Provider failure is visible and does not trigger state writes.
- Missing citations block sourced-plan claims.
- Pending proposals cannot modify active plans.
- Fitness pain and rejected observations cannot increase recommendations.
- Deletion requires confirmation and follows export behavior.
- Accessibility, input validation, security and data-loss handling are never simplified away.

## 12. Engineering Acceptance

Every stage requires:

- failing test before non-trivial implementation
- core rule tests passing
- migration fixtures passing when data changes
- TypeScript typecheck passing
- production build passing
- desktop and 390px mobile primary flow passing
- no critical or serious axe violations on affected core pages
- no high-severity dependency audit findings
- no secrets, private photos or private documents in Git
- PR description listing modules, contracts, migration, verification and rollback
- a feature flag or explicit rollback path for high-impact capabilities

## 13. Branch and Review Strategy

1. Finish and accept Draft PR #6.
2. Merge PR #6 into `main` after final smoke verification.
3. Create `codex/v4-stage3-closure` from updated `main`.
4. Use one Draft PR for Stage 3.
5. Start Stage 4 only after Stage 3 exit criteria pass.
6. Continue one stage per Draft PR; do not accumulate unrelated stages in one branch.
7. Keep commits focused and buildable.

## 14. Final Non-Goals

The approved framework does not include:

- parallel construction of Career, English and Fitness
- browser-direct model calls
- autonomous plan mutation
- production RAG before an evaluation dataset
- medical claims
- social features, payments or course marketplace
- automatic job applications
- dynamic wallpaper work before core product acceptance

## 15. Implementation Planning Boundary

This document is the umbrella project framework, not one implementation plan. Each stage receives its own independently reviewable plan and Draft PR. The first implementation plan covers only the integration gate and Stage 3 configurable-learning closure. Stage 4 planning starts only after Stage 3 acceptance evidence exists.
