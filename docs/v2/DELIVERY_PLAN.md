# GrowPilot V2 delivery plan

## Stage 0: protect V1

- preserve the current V1 commit
- create the V2 development branch
- document V1 behavior
- add migration fixtures and tests

Exit: V1 behavior is reproducible and recoverable.

## Stage 1: modular foundation

- module manifests
- public module APIs
- typed domain events
- V2 schema boundary
- feature flags
- gradual folder refactor

Exit: one module can change without importing another module's internals.

## Stage 2: design and navigation

- Day, Night and Dusk tokens
- responsive navigation
- action-first Today layout
- chart palettes
- route and button feedback
- wallpaper foundation
- reduced motion

Exit: all main routes are readable on desktop and mobile in three themes.

## Stage 3: configurable learning and review

- template engine
- controlled field schema
- learning-space lifecycle
- daily, weekly and monthly plan hierarchy
- records and outputs
- daily, weekly and monthly reviews
- V1 daily-loop migration

Exit: a user can add a subject without adding code.

## Stage 4: Knowledge and badges

- scoped resource model
- ingestion states
- citation prototype
- plan-revision approval
- traceable badge progress
- badge evidence detail

Exit: new knowledge proposes a reviewable diff, and badges show their evidence.

## Stage 5: Career and English

- target role
- editable skill map
- skill gaps
- learning-space links
- evidence and milestones
- general English skill dashboard
- adaptive goals and records

Exit: career tasks reach Today without copying learning content; English covers listening, speaking, reading and writing.

## Stage 6: Fitness

- profile without equipment enumeration
- goal and confirmed observations
- monthly, weekly and daily plans
- illustrated exercise contract
- exercise suitability feedback
- workout check-in
- recovery and pain feedback
- plan revision approval

Exit: pending or rejected image observations cannot influence a plan.

## Stage 7: production Harness and RAG

- provider adapters
- tool registry
- context assembly
- retrieval components
- output validation
- approval gates
- tracing and evaluation dataset
- server-side secret management

Exit: real calls are evaluated and traceable; business modules remain provider-independent.

## Stage 8: final wallpaper assets

- two static assets
- four dynamic seasonal assets
- custom uploads
- performance limits
- poster and pause behavior
- full/reduced/off/system modes

Exit: visual personalization does not break readability, performance or accessibility.

## Product acceptance

- AI and product learning are editable templates, not fixed modules.
- Career, English and Fitness are fixed business modules.
- English is general daily and workplace English.
- Users may add, pause, archive and remove configurable learning spaces safely.
- Knowledge-triggered plan updates require approval.
- Badge evidence is traceable.
- Fitness image observations require confirmation.
- Career skills link to learning spaces rather than duplicating them.

## Architecture acceptance

- routes compose modules through public APIs
- no business module imports another module's internals
- no business module imports a provider SDK
- storage, RAG, vision and providers use adapters
- structured facts remain outside vector-only storage
- important entities and proposals are versioned
- high-impact features have rollback flags

## Engineering acceptance

- existing tests remain green
- migration tests pass
- typecheck passes
- production build passes
- desktop and mobile core flows pass
- three themes and reduced motion pass
- secrets and private user media are absent from Git
- PR description names modules, contracts, migration, verification and rollback

## Decisions required before production data

Before accepting personal photos, documents or persistent provider keys, approve:

- authentication strategy
- database provider
- private object-storage provider
- deletion and export behavior
- secret storage
- retention rules
- vision provider and user consent copy

The interactive V2 demo may precede those decisions only with deterministic mock adapters and non-sensitive sample data.
