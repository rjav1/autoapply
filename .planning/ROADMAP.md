# AutoApply — Roadmap

## Phase 1: Foundation (Current)
**Goal:** Monorepo scaffold + basic auth + empty extension

### Milestones
1. ✅ Research complete (stack, features, architecture, pitfalls)
2. 🔄 Monorepo setup (pnpm workspaces + Turborepo)
3. ⏳ Folder structure (apps/extension, apps/dashboard, packages/shared)
4. ⏳ Basic Prisma schema
5. ⏳ GitHub repo + CI setup

### Deliverable
- Running monorepo with empty packages
- DB migrations ready
- Extension loads in Chrome (empty popup)

---

## Phase 2: Auth + Dashboard Shell
**Goal:** User can log in and see empty dashboard

### Milestones
1. NextAuth.js v5 + Google OAuth
2. Dashboard layout (sidebar, header)
3. Profile settings page (empty form)
4. Extension auth flow (chrome.identity → backend)

### Deliverable
- User can log in via Google
- Extension can authenticate with backend
- Profile page renders

---

## Phase 3: Profile + Resume
**Goal:** User can save profile data and upload resume

### Milestones
1. Profile form (contact, work history, education)
2. Resume upload + text extraction
3. API endpoints for profile/resume CRUD
4. Extension can fetch user profile

### Deliverable
- Complete profile editing
- Resume stored and parsed

---

## Phase 4: Workday Integration
**Goal:** Auto-fill Workday application forms

### Milestones
1. Workday form detection (content script)
2. Field mapping (Workday fields → profile data)
3. Auto-fill logic with fallback chains
4. Popup UI for activation
5. Application tracking (save to DB)

### Deliverable
- One-click Workday form fill
- Applications logged to dashboard

---

## Phase 5: Polish + Greenhouse
**Goal:** Second ATS + UX improvements

### Milestones
1. Greenhouse module
2. Application history dashboard
3. Error handling + retry logic
4. User feedback collection

---

## Timeline Estimate
- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 1-2 weeks
- Phase 4: 2-3 weeks
- Phase 5: 2 weeks

**Total MVP: ~8 weeks**

---
*Generated: 2026-02-10*
