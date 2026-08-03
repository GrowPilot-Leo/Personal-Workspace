# GrowPilot — Personal Growth System

GrowPilot is a modular personal growth application centered on learning execution and review. It connects configurable learning spaces with fixed Career, English and Fitness modules through shared knowledge, traceable badges and replaceable AI providers.

## Repository status

### V1 working baseline

The current application provides a mobile-first daily loop:

```text
goal -> daily tasks -> completion -> review -> next-day rollover
```

V1 data is stored locally in the current browser. Existing V1 behavior, tests, PWA setup and CI are the foundation for incremental V2 development.

### V2 product blueprint

V2 is documented but not yet fully implemented.

Start here:

- [V2 documentation index](docs/v2/INDEX.md)
- [Confirmed decisions](docs/v2/DECISIONS.md)
- [Product specification](docs/v2/PRODUCT_SPEC.md)
- [Module architecture](docs/v2/MODULE_ARCHITECTURE.md)
- [Data model](docs/v2/DATA_MODEL.md)
- [Agent Harness and RAG](docs/v2/AI_HARNESS_RAG.md)
- [Design system](docs/v2/DESIGN_SYSTEM.md)
- [Local demo brief](docs/v2/DEMO_IMPLEMENTATION_BRIEF.md)
- [Delivery plan](docs/v2/DELIVERY_PLAN.md)

Codex and contributors must read [AGENTS.md](AGENTS.md) before V2 changes.

## V2 product boundaries

Fixed platform capabilities:

- Today
- Learning Center
- Review
- Knowledge
- Badges
- Appearance
- AI Settings
- Data and Privacy

Fixed business modules:

- Career
- English
- Fitness

AI learning, product learning and other subjects are configurable learning spaces. They are not permanent hard-coded modules.

English supports daily and workplace listening, speaking, reading and writing. It is not limited to interview or job-search English.

AI-generated skill assessments, plan revisions, body-image observations and memory updates require user confirmation.

## Architecture principle

```text
Routes
-> module public APIs
-> core contracts and platform ports
-> replaceable storage, RAG, vision and LLM adapters
```

Modules do not import another module's internal files. New learning subjects should normally require template data, not new application code.

## Local development

Requirements:

- Node.js 22 or newer
- npm

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Existing V1 documentation

- [V1 product specification](docs/PRODUCT_SPEC.md)
- [V1 architecture](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT_GUIDE.md)
- [V1 module boundaries](docs/MODULES.md)
- [MVP plan](docs/MVP_PLAN.md)

V1 documents remain as historical context. V2 decisions live under `docs/v2`.

## Change discipline

Use focused Conventional Commits such as:

```text
feat(learning): add configurable learning-space schema
feat(career): connect skill gaps to learning spaces
feat(fitness): confirm vision observations before planning
feat(knowledge): propose cited plan revisions
feat(theme): add day night and dusk tokens
```

Every change should identify its owning module, data impact, public contract changes, migration requirement, verification and rollback path.
