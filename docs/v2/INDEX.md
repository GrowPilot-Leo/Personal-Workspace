# GrowPilot V2 documentation index

Status: product baseline for review and local V2 demo development.

## Purpose

These documents synchronize product decisions between the repository owner, remote Codex work and later local Codex sessions. V1 remains the working baseline; V2 is an incremental redesign, not a second copied application.

## Reading order

1. [Confirmed decisions](DECISIONS.md)
2. [Product specification](PRODUCT_SPEC.md)
3. [Module architecture](MODULE_ARCHITECTURE.md)
4. [Data model](DATA_MODEL.md)
5. [Agent Harness and RAG](AI_HARNESS_RAG.md)
6. [Design system](DESIGN_SYSTEM.md)
7. [Local demo implementation brief](DEMO_IMPLEMENTATION_BRIEF.md)
8. [Delivery and acceptance](DELIVERY_PLAN.md)

## Document ownership

| Document | Owns | Does not own |
|---|---|---|
| DECISIONS | confirmed product constraints | implementation details |
| PRODUCT_SPEC | users, flows, scope and business rules | folder structure |
| MODULE_ARCHITECTURE | boundaries, dependencies and public contracts | visual styling |
| DATA_MODEL | entities, versions and auditability | provider selection |
| AI_HARNESS_RAG | model, tool, retrieval and approval flow | page layout |
| DESIGN_SYSTEM | themes, charts, wallpaper and motion | domain rules |
| DEMO_IMPLEMENTATION_BRIEF | next local demo scope | production completion claims |
| DELIVERY_PLAN | stages, verification and acceptance | low-level component design |

## Conflict rule

When documents conflict:

1. Newer explicit owner decisions win.
2. `DECISIONS.md` wins over descriptive examples.
3. Product and safety constraints win over convenience.
4. Record the resolution in `DECISIONS.md` before implementing it.
