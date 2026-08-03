# GrowPilot V2 module architecture

## 1. Architecture goals

- A failure or redesign in one business module should not require a system rewrite.
- New learning subjects should be data, templates and configuration rather than new hard-coded pages.
- Providers, retrieval components and storage may be replaced behind interfaces.
- User data, AI proposals and confirmed values remain traceable.
- V1 data migrates forward explicitly.

## 2. Target structure

```text
apps/web/src
├── app/                       route composition only
├── core/
│   ├── identity/
│   ├── goals/
│   ├── tasks/
│   ├── plans/
│   ├── reviews/
│   └── migrations/
├── modules/
│   ├── today/
│   ├── learning/
│   ├── career/
│   ├── english/
│   ├── fitness/
│   ├── review/
│   ├── knowledge/
│   ├── badge/
│   └── settings/
├── platform/
│   ├── ai-harness/
│   ├── llm-providers/
│   ├── vision/
│   ├── persistence/
│   ├── vector-search/
│   └── media/
└── shared/
    ├── ui/
    ├── charts/
    ├── theme/
    ├── motion/
    └── types/
```

This is a convergence target. Refactor V1 gradually; do not move every file in one change.

## 3. Standard feature module

```text
modules/<module>/
├── README.md
├── manifest.ts
├── public.ts
├── domain/
├── application/
├── infrastructure/
├── ui/
├── migrations/
└── tests/
```

- `README.md`: responsibility, non-responsibility, public API, dependencies and data.
- `manifest.ts`: module ID, version, fixed/dynamic status, dependencies, feature flags and schema version.
- `public.ts`: the only cross-module import surface.
- `domain`: entities and rules without React or provider SDKs.
- `application`: commands, queries and use cases.
- `infrastructure`: storage and external adapters.
- `ui`: module-owned pages, components and hooks.
- `migrations`: module data migration.
- `tests`: rule, contract and integration tests.

## 4. Dependency rules

Allowed:

```text
Route -> module public API
Module -> core contract
Module -> platform port
Module -> shared presentation primitive
```

Forbidden:

```text
Career -> Learning internal repository
Fitness -> provider SDK
Today -> direct mutation of another module
UI -> direct database access
Knowledge -> silent plan overwrite
Shared UI -> business decision
```

## 5. Public contracts

Examples:

```ts
type TodayItem = {
  id: string;
  sourceModule: string;
  title: string;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

type PlanRevisionProposal = {
  id: string;
  planId: string;
  reason: string;
  citations: Citation[];
  before: unknown;
  after: unknown;
  status: "pending" | "accepted" | "edited" | "rejected";
};

type ConfirmedObservation<T> = {
  original: T;
  finalValue?: T;
  decision: "pending" | "confirmed" | "edited" | "rejected";
  decidedAt?: string;
};
```

Contracts belong in the owning module's `public.ts` or a core contract. Avoid a global file containing every type.

## 6. Cross-module events

Examples:

- `learning.task.completed`
- `learning.space.archived`
- `career.skill-gap.changed`
- `fitness.session.completed`
- `knowledge.resource.updated`
- `badge.earned`
- `plan.revision.proposed`
- `plan.revision.confirmed`

Minimum event envelope:

```ts
type DomainEvent<T> = {
  eventId: string;
  eventType: string;
  moduleId: string;
  entityId: string;
  schemaVersion: number;
  occurredAt: string;
  payload: T;
};
```

Start with in-process typed events. Do not introduce distributed infrastructure before a real second process needs it.

## 7. Fixed and dynamic module implementation

Fixed platform and business modules have code-owned manifests.

User learning spaces are data-owned instances of the Learning module:

```text
Learning engine
+ versioned template
+ field schema
+ knowledge scope
+ plan
+ records
= user learning space
```

Adding a new subject should normally require no route, database table or new React module.

## 8. Platform ports

Business modules depend on interfaces such as:

- `AiHarnessPort`
- `KnowledgeSearchPort`
- `PlanRevisionPort`
- `MediaStoragePort`
- `VisionObservationPort`
- `ClockPort`

Provider choice stays in adapters.

## 9. Feature flags

Use flags for incomplete or high-impact capabilities:

- `v2Navigation`
- `dynamicLearningSpaces`
- `knowledgePlanSync`
- `customLlmProvider`
- `fitnessVisionAnalysis`
- `dynamicWallpapers`

A flag is a rollback boundary, not a replacement for tests.

## 10. Traceability requirements

Every plan or template change records:

- owning module
- entity ID
- prior version
- next version
- reason
- evidence or citations
- actor
- timestamp
- confirmation state

Every implementation PR states:

- affected modules
- contract changes
- migration changes
- verification
- rollback or flag
