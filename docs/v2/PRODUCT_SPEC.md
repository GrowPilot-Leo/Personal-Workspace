# GrowPilot V2 product specification

## 1. Positioning

GrowPilot is a personal growth system centered on learning execution and review. It connects configurable learning spaces with fixed Career, English and Fitness modules through one daily loop, shared knowledge infrastructure, traceable badges and an Agent Harness.

Core loop:

```text
Goal
-> plan
-> daily/weekly/monthly tasks
-> execution
-> record
-> review
-> AI proposal
-> user confirmation
-> versioned adjustment
```

## 2. Product goals

V2 should help a user:

- define changing learning goals without hard-coded curricula
- turn goals into daily, weekly and monthly actions
- connect learning plans to the user's knowledge base
- preserve records, outputs, reviews and evidence
- see progress through traceable badges
- align learning with career goals
- improve general English communication
- create and adapt fitness plans from confirmed personal data
- choose models without binding business logic to one provider

## 3. Information architecture

```text
GrowPilot
├── Today
├── Learning Center
│   ├── English
│   ├── User learning spaces
│   └── Add learning space
├── Career
├── Fitness
├── Review
├── Knowledge
├── Badges
└── Settings
    ├── Appearance
    ├── AI providers
    ├── Data
    └── Privacy
```

## 4. Today

Today aggregates public summaries from other modules.

It shows:

- current focus
- learning tasks
- career tasks
- English tasks
- fitness session
- due reviews
- prior review insight
- an explainable next-action proposal

Today never owns another module's task or plan data.

## 5. Configurable learning spaces

A user may create a space from:

- a recommended editable template
- a saved personal template
- a blank schema
- an AI-generated draft based on natural-language goals

A learning space contains:

- goal
- stages
- controlled custom fields
- daily, weekly and monthly plans
- tasks
- outputs
- reviews
- knowledge scope
- badge rule
- versioned AI instructions

Lifecycle:

```text
draft -> planned -> active -> paused -> completed -> archived
```

AI learning and product learning are templates, not fixed features.

## 6. English

English is a fixed learning experience for fluent daily and workplace listening, speaking, reading and writing.

Users may focus on:

- daily conversation
- workplace communication
- listening
- speaking
- reading
- writing
- vocabulary
- grammar
- scenario practice

Content, level and route remain dynamic.

## 7. Career

Career turns a target into a skills-and-evidence roadmap.

It includes:

- career profile
- target role and target date
- editable skill map
- user-confirmed current state
- skill gaps
- linked learning spaces
- daily, weekly and monthly tasks
- milestones
- portfolio and evidence
- daily, weekly and monthly review
- readiness assessment

Career readiness and getting an offer are different states. The system does not guarantee employment.

## 8. Fitness

Fitness includes:

- body profile
- present-state description
- expected state and improvement direction
- standardized front, side and back images
- AI observation confirmation
- monthly direction
- weekly schedule based on available training days
- daily illustrated sessions
- volume, intensity, rest, rationale and alternatives
- exercise-level suitability feedback
- check-in, fatigue, pain and recovery feedback
- versioned plan adjustment

The initial profile does not ask users to enumerate equipment. Missing equipment is handled at exercise level.

## 9. Knowledge and plan updates

Resources may be linked to one or more scopes:

- global
- a learning space
- English
- Career
- Fitness

When relevant knowledge changes, the system may propose:

- a new task
- a changed learning order
- an updated explanation
- a changed fitness recommendation

The proposal must show source citations, reason, affected tasks and before/after differences. No plan changes until approval.

## 10. Badges

Badge states:

- planned: gray
- active: gray-to-gold
- completed: gold
- verified: gold plus evidence indicator

A badge details:

- goal
- dates
- tasks
- time
- sources
- outputs
- assessment
- reviews
- plan revisions
- evidence links

Badges document a journey. They are not external qualifications.

## 11. Appearance

The system provides Day, Night and Dusk themes with separate chart palettes.

Wallpapers:

- two built-in static choices
- spring, summer, autumn and winter dynamic choices
- user-uploaded static or looped media

Motion offers full, reduced, off and system-preference modes.

## 12. Out of scope for the first V2 demo

- production RAG quality claims
- medical diagnosis
- rehabilitation prescription
- guaranteed fitness outcomes
- autonomous plan mutation
- arbitrary third-party wallpaper scripts
- social community
- payments
- public course marketplace
- automatic job applications
