# GrowPilot V2 confirmed decisions

Last updated: 2026-08-03

## Version strategy

- Preserve V1 through Git history and a future `v1.0.0` release tag.
- Build V2 incrementally from V1.
- Do not keep complete duplicated `web-v1`, `web-v2` and `web-v3` applications.
- Reuse working V1 rules, tests, PWA setup and build pipeline.
- Migrate V1 data explicitly; never overwrite it silently.

## Product center

- The primary loop is goal, plan, daily action, record, review, adjustment and traceable outcome.
- Product-manager daily office work is not the center of the system.
- Learning content must be user-configurable and knowledge-aware.
- AI output is always a proposal until confirmed when it changes user facts, plans or memory.

## Fixed capabilities

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

## Dynamic learning

- AI learning and product learning are not fixed modules.
- They may exist as editable recommended templates.
- Users may add, hide, pause, archive and, with explicit confirmation, delete learning spaces.
- Templates use controlled configurable fields and are versioned.
- New knowledge may propose a learning-plan revision; the user approves the diff.

## English

- English is general English for daily communication and work.
- It aims at fluent listening, speaking, reading and writing.
- It is not restricted to job-search, interview or technical English.
- Content and difficulty adapt to the user's level and goals.

## Career

The fixed Career module covers:

- career goals
- target roles
- skill maps
- skill gaps
- learning routes
- learning-space links
- daily, weekly and monthly tasks
- evidence and milestones
- reviews and target assessment

Career orchestrates learning spaces; it does not duplicate their course content.

## Badges

- Planned: gray.
- In progress: gray-to-gold illumination.
- Completed: gold.
- Verified: gold with an evidence marker.
- Clicking complete records an action but does not by itself prove ability.
- Every badge has a traceable evidence page.

## Fitness

- Profile setup does not request an exhaustive equipment list.
- Exercise-level feedback handles missing equipment and alternatives.
- Plans support monthly direction, weekly scheduling and daily sessions.
- Plans include exercise visuals, volume, intensity, rest, rationale and alternatives.
- Image observations require confirmation, editing or rejection.
- Rejected or pending observations cannot affect plans.
- Fitness output is non-diagnostic and does not guarantee physical results.

## Knowledge and RAG

- Knowledge is shared infrastructure with scoped namespaces.
- Learning, career, English and fitness may use different retrieval policies.
- RAG includes intent, rewrite, metadata filters, keyword retrieval, vector retrieval, fusion, reranking, citations and evaluation.
- Chunking occurs before embeddings; vectors themselves are not "sliced."
- Structured application facts remain in the database.
- Knowledge changes create proposals, never silent plan mutations.

## Agent Harness and providers

- Harness means Agent Harness, not Harness.io.
- The harness is stable; LLM providers are replaceable adapters.
- Business modules do not call provider SDKs directly.
- Initial provider scope may include DeepSeek and OpenAI-compatible APIs.
- Custom provider secrets remain server-side.
- Tool actions that change state use approval gates.

## Appearance

Default themes:

- Day
- Night
- Dusk

Built-in wallpapers:

- two static wallpapers
- four dynamic seasonal wallpapers

Seasonal interaction language:

- spring: petals and new growth
- summer: water ripple
- autumn: falling leaves
- winter: frost or short ice-crack effect

Users may upload static images or looped media as wallpapers. Executable scripts are forbidden. Motion supports full, reduced, off and system preference.

## Open implementation choices

These are not yet product decisions:

- final database and object-storage provider
- embedding model
- vector database provider
- reranking model
- vision provider
- production authentication provider
- exact wallpaper media limits
- final design tokens and asset files

Use replaceable interfaces until these choices are approved.
