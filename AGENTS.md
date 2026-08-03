# GrowPilot repository instructions

## Read first

Before changing V2 code, read these files in order:

1. `docs/v2/INDEX.md`
2. `docs/v2/DECISIONS.md`
3. `docs/v2/PRODUCT_SPEC.md`
4. `docs/v2/MODULE_ARCHITECTURE.md`
5. The target module's own `README.md`, when it exists

V1 is the working baseline. Do not delete, reset, or duplicate the whole V1 application. Evolve it through small, reviewable changes and preserve V1 data through explicit migrations.

## Product truth

GrowPilot is a learning, review, career, English and fitness growth system.

Fixed platform capabilities:

- Today
- Learning Center
- Review Center
- Knowledge
- Badges
- Appearance
- AI Settings
- Data and Privacy

Fixed business modules:

- Career
- English
- Fitness

AI learning, product learning and every other subject are configurable learning spaces. They must not be hard-coded as permanent modules or fixed curricula. AI and product learning may be offered as editable templates only.

English is general English for fluent listening, speaking, reading and writing in daily life and work. It is not limited to job-search English.

## AI confirmation rule

AI output is a proposal, not user truth.

The following changes require explicit user confirmation before persistence or downstream use:

- skill or ability assessment
- learning-roadmap changes
- plan revisions caused by new knowledge
- body-image observations
- fitness-plan changes
- long-term memory updates
- creation of a learning space from an AI-generated template

Keep the original AI output, the user's decision and the final edited value separately.

## Fitness rules

Do not ask users to enumerate all available equipment during profile setup.

Collect training scene and constraints only. When an exercise is unsuitable, allow the user to choose a reason such as no equipment, discomfort, unfamiliar movement, unsuitable location or preference, then offer alternatives.

Body-image analysis is observational and non-diagnostic. Only confirmed or user-edited observations may influence plans.

## Harness and LLM

Business modules call a stable Agent Harness interface. They must not import a provider SDK directly.

The harness owns:

- intent classification
- context assembly
- knowledge retrieval
- tool selection
- provider routing
- structured-output validation
- approval gates
- retries, timeouts and tracing

LLM providers are replaceable adapters. Initial implementation may support DeepSeek and OpenAI-compatible APIs. Secrets must remain server-side.

## Knowledge and RAG

Do not hard-code a single retrieval pipeline for every domain.

Keep ingestion, chunking, intent understanding, query rewriting, filtering, keyword retrieval, vector retrieval, fusion, reranking, context building, citations and evaluation as replaceable components.

Structured facts such as measurements, task status and plan versions belong in the application database, not only in vector storage.

Knowledge updates may create a plan-revision proposal. They must never silently overwrite an active plan.

## Module boundary

Each feature module should converge on this structure:

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

Other modules may import only from `public.ts`. Do not import another module's internal repository, component, hook or domain file.

Routes compose modules. Shared UI contains no business rules. Platform adapters contain no learning, career, English or fitness policy.

## Change discipline

Each change must identify:

- owning module
- reason
- affected data
- affected public contracts
- migration requirement
- verification method
- rollback or feature-flag path

Use focused Conventional Commits. Do not mix unrelated refactors with product work.

## V2 demo boundary

The first V2 demo validates information architecture, themes, module boundaries and dynamic learning-space interactions. It does not pretend that production RAG, vision analysis, cloud persistence or autonomous agents are complete.

Follow `docs/v2/DEMO_IMPLEMENTATION_BRIEF.md` exactly unless the repository owner approves a scope change.
