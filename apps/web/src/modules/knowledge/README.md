# knowledge module

## Responsibility
Shared infrastructure with scoped namespaces. Ingestion, chunking, retrieval, fusion, reranking and citations are replaceable components. Structured facts stay in the application database, not only in vector storage.

## Non-responsibility
- Does not silently overwrite an active plan
- Does not hard-code a single retrieval pipeline for every domain

## Public API (`public.ts`)
- `KnowledgeScope` type: global | learning-space | english | career | fitness
- `ResourceProcessingState` type
- `PlanRevisionProposal` re-export from core plans (approval-first)

## Dependencies
- `core/identity`, `core/plans`, `core/events`

## Data
Raw resources and normalized text are authoritative. Chunks and embeddings are derived and replaceable.
