# Research Summary: AutoApply

## Stack
- **Monorepo**: pnpm workspaces + Turborepo
- **Extension**: Plasmo (MV3), TypeScript, native DOM APIs, Zod validation
- **Dashboard**: Next.js 15 (App Router) + Tailwind + shadcn/ui, TanStack Query, NextAuth.js v5
- **Backend**: Next.js API routes (unified deployment), Prisma ORM + PostgreSQL
- **Shared**: TypeScript types + Zod validators in `packages/shared/`
- **Storage**: Vercel Blob or S3 for resumes (deferred)

## Table Stakes Features
1. ATS form detection & auto-fill (Workday priority)
2. Resume upload & storage with text extraction
3. Profile data management (contact info, experience)
4. Application tracking & history
5. Google OAuth authentication (identity only)
6. Form field mapping & customization
7. Extension popup UI with one-click activation

## Differentiators (Phase 2+)
- Application quality scoring
- Smart defaults from job context
- Deduplication & de-ghosting
- Interview tracking & follow-up reminders
- Resume versioning & A/B testing
- Data export & analytics

## Anti-Features (Do NOT Build)
- Mass auto-apply without review
- Email/LinkedIn scraping
- Job board scraping (manual entry first)
- Full-auto cover letter generation
- Subscription model in v1

## Architecture Key Points
- Extension service worker: stateless, use chrome.storage for persistence
- MV3 constraint: 5-min execution timeout, no persistent background
- Auth flow: chrome.identity → backend token exchange → session in chrome.storage
- Dashboard auth: NextAuth.js with httpOnly cookies
- DB schema: users, sessions, resumes, jobs, applications, automation_rules

## Critical Pitfalls
1. **ATS DOM changes**: Workday/Greenhouse update frequently — use resilient selectors with fallback chains
2. **MV3 service worker termination**: Store ALL state in chrome.storage, not memory
3. **OAuth token refresh**: Proactively refresh 5min before expiry, handle 401 gracefully
4. **Rate limiting**: ATS platforms detect rapid submissions — enforce delays
5. **ToS risk**: Add clear disclaimers, require per-application user confirmation
6. **Workday shadow DOM**: Custom picklists, file upload widgets need special handling
7. **Greenhouse dynamic loading**: Questions load asynchronously — use MutationObserver

## Build Order
1. Monorepo + shared types + DB schema (foundation)
2. Backend auth + user API + resume API
3. Extension service worker + Workday content script
4. Dashboard auth + application tracking UI
5. Form field mapping + customization
6. Greenhouse + Oracle support

---
*Synthesized: 2026-02-09*
