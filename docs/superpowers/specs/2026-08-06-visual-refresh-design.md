# GrowPilot Visual Refresh — Notion/Linear-style Workbench

> Status: owner-specified direction (2026-08-06), implementing Phase 1
> Source of truth: this document + user design brief

## 1. Goal

Rebuild GrowPilot's visual layer as a modern personal workbench in the style
of Notion / Linear / Raycast / Vercel / ChatGPT: minimal, modern, silky motion,
premium feel, low noise. No cyberpunk styling. Phase 1 delivers the visual
skeleton and the Dashboard home page only — no backend, no database, no
complex AI.

## 2. Tech stack (owner-specified)

- Next.js 16 (existing) + React 19
- Tailwind CSS 4 (existing)
- shadcn/ui (new — init with the existing Tailwind 4 setup)
- Motion for React (framer-motion successor)
- Light usage of Magic UI / Aceternity UI background & motion components
  (grid background, radial fade, subtle noise — CSS-first, no heavy bundles)

## 3. Design language

- **Layout**: left Sidebar + top TopBar + main workspace
- **Theme**: light / dark toggle (maps onto existing day/night tokens; dusk
  stays as a bonus)
- **Background**: low-opacity grid, gentle radial gradient, faint noise
- **Motion**: restrained — page enter (opacity 0→1, y 8→0), card hover
  (y −2 + slightly stronger shadow), Dialog/Sheet open (scale + fade),
  smooth sidebar collapse
- **Reference feel**: Notion (quiet surfaces), Linear (sharp but warm,
  motion-first), Raycast (command palette energy, restraint), Vercel
  (geist-like clarity), ChatGPT (calm canvas)

## 4. Phase 1 scope

1. Project structure initialization (add shadcn/ui, motion, folder layout)
2. AppShell (Sidebar + TopBar + main)
3. Sidebar — collapsible with smooth transition
4. TopBar — search placeholder, theme toggle, settings
5. Dashboard home with Bento Grid
6. Bento Grid cards (8 modules below)
7. Base theme system (light/dark)
8. Page-switch + card-hover motion

## 5. Dashboard modules (8 cards)

| Module | Card content | Data source |
|---|---|---|
| 今日重点 | top 1-3 focus items | V1 daily-loop goal + top tasks |
| 今日任务 | task checklist w/ progress | V1 daily-loop tasks |
| 学习进度 | progress bar per active space | learning manifest summary (static for now) |
| 知识库最近更新 | recent resources list | static demo rows |
| AI 建议 | suggestion card | `buildNextDaySuggestion` (V1 rule) |
| 项目进度 | project list w/ % bars | static demo rows |
| 快捷 Prompt | prompt chips | static demo rows |
| 最近复盘 | recent reviews | V1 daily-loop history |

## 6. Folder structure (owner-specified)

```text
components/
├── layout/          AppShell, Sidebar, TopBar, SidebarToggle
├── dashboard/       BentoGrid, card modules (8)
├── ai/              AiSuggestionCard (suggestion)
├── knowledge/       KnowledgeUpdatesCard
├── tasks/           TodayTasksCard
├── ui/              shadcn/ui primitives
lib/                 utils (cn), data helpers
styles/              global styles, theme tokens
```

## 7. Motion contract (restrained)

- Page enter: `opacity 0 → 1`, `y 8 → 0`, duration ~0.3s, ease-out
- Card hover: `y: -2`, shadow `0 4px 20px rgba(0,0,0,0.08)`, 0.2s
- Dialog/Sheet: `scale 0.96 → 1` + `opacity 0 → 1`, 0.2s
- Sidebar collapse: width 260 → 64, 0.25s ease
- Respect `prefers-reduced-motion` and existing `data-motion` tokens
- No layout-thrashing animations; animate transform/opacity only

## 8. Verification

- All existing tests stay green (35+)
- typecheck clean
- production build compiles
- visual acceptance: Bento Grid readable in light/dark, motion feels smooth
  and quiet, sidebar collapse animates, no flash on theme switch
