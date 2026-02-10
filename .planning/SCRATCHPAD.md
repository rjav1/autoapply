# AutoApply — Scratchpad

Progress tracker. Updated after each major step.

---

## 🎯 Original Project Vision

**AutoApply** is an automated job application system that:
1. **Chrome Extension (MV3)** - Detects ATS platforms (Workday, Greenhouse, Oracle/Taleo) and auto-fills application forms
2. **Web Dashboard** - Settings management, application tracking, job suggestions
3. **Backend Server** - Google OAuth (identity only), PostgreSQL database, resume storage

**Target User:** Job seekers who apply to high volumes of positions and want one-click form filling.

**Core Value Prop:** Auto-fill and submit job applications on Workday/Greenhouse with one click using stored resume and profile data.

**Key Technical Decisions:**
- Monorepo: pnpm workspaces + Turborepo
- Extension: Plasmo (MV3), TypeScript
- Dashboard: Next.js 15 + Tailwind + shadcn/ui
- Backend: Next.js API routes + Prisma + PostgreSQL
- Auth: Google OAuth (identity only, no Drive/Gmail scopes)
- Deploy: Vercel for dashboard

**Build Priority:**
1. Workday form detection & filling (highest impact)
2. Greenhouse module
3. Oracle/Taleo module
4. Job suggestions/scraping (deferred)

---

## Current Status: Phase 1 Ready to Start 🚀

## Completed Steps

- [x] GSD skill installed (v1.18.0)
- [x] `./autoapply/` subdirectory created
- [x] Git repo initialized
- [x] `.planning/PROJECT.md` written
- [x] `.planning/SCRATCHPAD.md` created
- [x] **Research phase COMPLETE** (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md)
- [x] **REQUIREMENTS.md created** — MVP requirements defined
- [x] **ROADMAP.md created** — 5-phase plan, ~8 week estimate
- [x] **Monorepo scaffold complete:**
  - Root package.json with pnpm workspaces
  - turbo.json config
  - pnpm-workspace.yaml
- [x] **Folder structure created:**
  - apps/extension/ — Plasmo-based Chrome extension
  - apps/dashboard/ — Next.js 15 dashboard
  - packages/shared/ — Shared types & utils
- [x] **Prisma schema initialized** — User, Profile, Resume, Application models
- [x] **pnpm install** — All dependencies installed
- [x] **Extension builds** — `pnpm plasmo build` works ✅
- [x] **Dashboard builds** — `pnpm next build` works ✅
- [x] **Git commit** — All scaffold files committed

## In Progress

- [ ] GitHub repo creation + push (need `gh` CLI or manual setup)
- [ ] Phase 1.1: Extension skeleton (popup, background, content scripts)
- [ ] Phase 1.2: Dashboard auth setup (NextAuth + Google OAuth)

## Decisions Made

| Question | Answer |
|----------|--------|
| Project location | `./autoapply/` subdirectory |
| Google OAuth purpose | User identity only |
| Database | PostgreSQL |
| Phase 1 ATS priority | Workday |

## Pending Decisions (using sensible defaults)

| Question | Default |
|----------|---------|
| Backend framework | Next.js API routes (dashboard + API in one deploy) |
| Dashboard UI | Next.js + Tailwind (native Vercel) |
| Resume storage | S3/cloud (decide in Phase 2+) |
| Job scraping | Defer to later phase, manual entry first |

---

## 📋 Session Handover Template

### What Got Done This Session
- (list completed work)

### What Worked / What Didn't
- ✅ (successes)
- ❌ (failures & how fixed)

### Key Decisions Made
- (decisions & rationale)

### Lessons Learned / Gotchas
- (things to remember)

### Next Steps
1. (immediate priorities)

### Key Files Map
- `.planning/SCRATCHPAD.md` — this file
- `.planning/PROJECT.md` — project definition
- `.planning/research/` — stack, features, architecture, pitfalls research

---
*Last updated: 2026-02-10 05:18 PST*
