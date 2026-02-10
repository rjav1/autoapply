# AutoApply

## What This Is

An automated job application system that fills out ATS forms (Workday, Greenhouse, Oracle) via a Chrome extension, backed by a web dashboard for settings/tracking and a backend server handling auth and data storage. Targets job seekers who apply to high volumes of positions.

## Core Value

Users can auto-fill and submit job applications on Workday with one click, using their stored resume and profile data.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Chrome Extension (MV3) with Workday form-filling
- [ ] Greenhouse form-filling module
- [ ] Oracle form-filling module
- [ ] Web dashboard for settings and application tracking
- [ ] Job suggestions/search in dashboard
- [ ] Google OAuth authentication (identity only)
- [ ] Resume upload and storage
- [ ] PostgreSQL database (users, resumes, applications, jobs)
- [ ] Backend API server
- [ ] Monorepo structure (extension + dashboard + backend)

### Out of Scope

- Google Drive/Gmail API integration — identity-only auth, no workspace access
- Mobile app — web dashboard + extension only
- Real-time chat/messaging — not relevant to job applications
- Payment/subscription system — free tool for now

## Context

- Chrome Extension uses Manifest V3 (MV2 deprecated)
- Workday is the highest-priority ATS target (most common enterprise ATS)
- Dashboard deploys to Vercel
- Google OAuth for user identity only (no Drive/Gmail scopes)
- PostgreSQL for structured job/application data

## Constraints

- **Platform**: Chrome Extension (MV3) — no Firefox/Safari initially
- **Auth**: Google OAuth — identity only, no additional scopes
- **Database**: PostgreSQL
- **Hosting**: Vercel for dashboard
- **Architecture**: Monorepo — extension, dashboard, backend in one repo

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo over polyrepo | Shared types, simpler CI, atomic changes | — Pending |
| Google OAuth (identity only) | Simplest auth, no permission prompts | — Pending |
| PostgreSQL over MongoDB | Structured data (users, jobs, applications) fits relational model | — Pending |
| Workday first | Most common enterprise ATS, highest impact | — Pending |
| Subdirectory in workspace | Convenient co-location with other projects | — Pending |

---
*Last updated: 2026-02-09 after initialization*
