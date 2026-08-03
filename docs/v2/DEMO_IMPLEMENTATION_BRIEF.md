# GrowPilot V2 local demo implementation brief

## 1. Objective

Build the second interactive demo on top of V1 without deleting the working daily loop.

The demo validates:

- corrected information architecture
- modular ownership
- Day, Night and Dusk themes
- configurable learning spaces
- fixed Career, English and Fitness presence
- review, knowledge and badge relationships
- approval-first AI interaction patterns

It does not claim production RAG, body-image analysis or autonomous agents.

## 2. Before coding

1. Read root `AGENTS.md`.
2. Read every file in `docs/v2`.
3. Run existing tests, typecheck and production build.
4. Record current V1 behavior.
5. Create a focused implementation branch.
6. Do not remove V1 local-storage data or service-worker behavior without a migration and test.

## 3. Demo navigation

Desktop and mobile navigation should expose:

- Today
- Learning
- Career
- English
- Fitness
- Review
- Knowledge
- Badges
- Settings

LLM providers live under Settings.

## 4. Demo interactions

### Today

- aggregate real V1 daily-loop tasks
- show module source on each item
- remove invented progress values
- show a clearly labeled rule or mock suggestion

### Learning

- list user learning spaces
- add a space from a template or blank draft
- edit name, goal and controlled fields
- pause or archive a space
- show AI learning and product learning as editable templates
- never hard-code them as permanent navigation items

### Career

- capture a target and target date
- display an editable skill-map draft
- link a skill to a learning space
- show monthly, weekly and daily task levels
- show evidence placeholders with truthful empty states

### English

- present listening, speaking, reading and writing
- use daily and workplace communication examples
- avoid labeling the module as job-search English

### Fitness

- capture a lightweight profile without equipment enumeration
- show monthly, weekly and daily plan hierarchy
- provide exercise-level "not suitable" feedback
- prototype image observation cards with confirm, edit and reject states
- label all image analysis as mock until a real validated adapter exists

### Review

- show daily, weekly and monthly views
- continue using real V1 daily reviews where possible

### Knowledge

- show scoped resources and processing states
- prototype citation display
- prototype a plan-revision diff with accept, edit and reject
- do not pretend a vector database is connected

### Badges

- show planned gray, active gray-to-gold, completed gold and verified states
- open a badge evidence detail
- use real demo records where available

### Settings

- switch Day, Night and Dusk
- persist preference
- show two static and four seasonal wallpaper choices
- show full, reduced, off and system motion settings
- show provider configuration UI without collecting or exposing real keys in the browser

## 5. First refactor boundary

Do not refactor the entire repository at once.

Recommended first extraction:

```text
modules/
├── today/
├── learning/
├── career/
├── english/
├── fitness/
├── review/
├── knowledge/
├── badge/
└── settings/
```

For each touched module, add a minimal `README.md`, `manifest.ts` and `public.ts`. Untouched V1 files may remain until their owning change.

## 6. Demo state

Use typed repositories and adapters.

Existing local storage may remain for demo persistence, but new state uses a V2 schema and migration boundary. Do not mix uncontrolled JSON writes throughout components.

Mock AI, RAG and vision adapters must:

- implement the same interface intended for production
- return deterministic fixtures
- show a visible mock label
- avoid fabricated confidence or scientific claims

## 7. Visual direction

- reduce card and shadow noise
- use a consistent spacing and typography scale
- keep the dashboard action-first
- add subtle route and press feedback
- keep wallpaper behind a readability overlay
- verify desktop and mobile layouts
- avoid decorative motion in dense reading and chart areas

## 8. Required verification

- existing V1 rule tests
- V1-to-V2 migration tests
- typecheck
- production build
- dynamic learning-space rule tests
- plan-approval state tests
- theme persistence
- reduced-motion behavior
- mobile navigation
- no client-side secrets
- no real personal images or private documents in the repository

## 9. Suggested commits

```text
refactor(core): introduce V2 module contracts and migration boundary
feat(theme): add day night and dusk theme tokens
feat(learning): add configurable learning-space demo
feat(career): add goal skill-map and learning links
feat(english): add general English skill dashboard
feat(fitness): add confirmation-first fitness planning demo
feat(knowledge): add scoped resource and plan-diff prototype
feat(badge): add traceable badge states and evidence view
test(v2): cover migration themes and approval flows
```

Each commit should remain buildable and explain its affected module.
