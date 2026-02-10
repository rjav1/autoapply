# AutoApply — Scratchpad

Progress tracker. Updated after each major step.

## Current Status: Project Initialization

## Completed Steps

- [x] GSD skill installed (v1.18.0)
- [x] `./autoapply/` subdirectory created
- [x] Git repo initialized
- [x] `.planning/PROJECT.md` written
- [x] `.planning/SCRATCHPAD.md` created

## In Progress

- [ ] Workflow config (`config.json`)
- [ ] Research phase (stack, features, architecture, pitfalls)
- [ ] Requirements definition (`REQUIREMENTS.md`)
- [ ] Roadmap creation (`ROADMAP.md`)

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
*Last updated: 2026-02-09*
