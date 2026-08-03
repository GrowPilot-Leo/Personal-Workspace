# GrowPilot V2 Agent Harness and RAG

## 1. Responsibility split

The repository owner defines real use cases, supplies representative knowledge, confirms intent categories and judges whether results are useful.

Codex implements the architecture, adapters, retrieval components, validation, tests, traces and tuning controls.

RAG quality is therefore a joint product-and-engineering activity.

## 2. Harness flow

```text
User request
-> authentication and authorization
-> intent classification
-> context assembly
-> knowledge retrieval
-> tool selection
-> provider routing
-> structured output validation
-> approval gate
-> state write
-> trace and feedback
```

## 3. Harness components

```text
platform/ai-harness/
├── context/
├── intents/
├── planning/
├── tools/
├── approvals/
├── validation/
├── tracing/
├── policies/
└── public.ts
```

The harness does not own learning, career, English or fitness domain rules. It calls their public tools.

## 4. Provider adapters

```text
platform/llm-providers/
├── contracts/
├── deepseek/
├── openai-compatible/
├── registry/
└── tests/
```

Suggested provider configuration:

- display name
- protocol
- base URL
- model ID
- text capability
- image capability
- embedding capability
- structured-output capability
- timeout
- secret reference

Custom base URLs require server-side validation. Never make browser-direct provider requests with persistent keys.

## 5. RAG pipeline

```text
Question
-> intent
-> query rewrite
-> scope and metadata filters
-> keyword retrieval
-> vector retrieval
-> result fusion
-> reranking
-> context building
-> response or plan proposal
-> citations
-> user feedback
-> evaluation trace
```

Target structure:

```text
platform/rag/
├── ingestion/
│   ├── parsers/
│   ├── chunkers/
│   └── metadata/
├── query/
│   ├── intent/
│   ├── rewrite/
│   └── filters/
├── retrieval/
│   ├── keyword/
│   ├── vector/
│   └── hybrid/
├── ranking/
│   ├── fusion/
│   └── reranker/
├── generation/
│   ├── context-builder/
│   └── citation/
├── evaluation/
│   ├── datasets/
│   ├── metrics/
│   └── feedback/
└── public.ts
```

## 6. Domain-aware policies

One global pipeline is insufficient.

Learning retrieval prioritizes the current space, level, active task and versioned sources.

Career retrieval may use target roles, job descriptions, evidence and freshness metadata. A single job description never becomes an industry-wide fact.

English retrieval uses level, scenario and skill dimension.

Fitness retrieval combines confirmed structured profile data and training history with scoped knowledge. Raw image guesses and pending observations are excluded.

## 7. Chunking

Chunk source text before embeddings.

Strategies remain replaceable:

- structured documents: heading-aware
- PDF: heading and page aware
- notes: concept aware
- tables: entity or row aware
- workout material: exercise, goal, instruction and caution aware
- reviews: date and topic aware

Every chunk retains resource ID, version, source location and scope.

## 8. Plan revision approval

A knowledge-triggered proposal contains:

- affected plan and version
- changed fields or tasks
- reason
- supporting citations
- confidence or uncertainty
- before/after diff
- expected time impact
- approval status

Statuses:

```text
pending -> accepted | edited | rejected
```

Only accepted or user-edited revisions produce a new active plan version.

## 9. Evaluation

Before tuning models, build a representative question set with the owner.

Evaluate separately:

- intent correctness
- retrieval relevance
- source coverage
- citation correctness
- answer usefulness
- plan-revision usefulness
- unsafe or unsupported claims
- latency and failure rate

User feedback options include wrong intent, irrelevant source, outdated content, too difficult, too simple and unreasonable plan adjustment.

## 10. Demo versus production

The first V2 demo may use deterministic mock adapters behind the real interfaces.

It must label mock output clearly. It must not claim production RAG, vision or autonomous-agent capability until those flows are connected to real data and evaluated.
