# AutoApply — Developer Handoff Document

**Date:** 2026-02-10  
**Repo:** https://github.com/rjav1/autoapply  
**Status:** Phase 3 Complete, Phase 4 Ready to Start

---

## 🎯 Project Overview

**AutoApply** is a Chrome extension + web dashboard for automating job applications on ATS platforms (Workday, Greenhouse, Oracle/Taleo).

### Core Value Proposition
- User fills out profile once in dashboard
- Extension detects job application pages
- One-click auto-fill of all form fields
- Human-like input simulation to avoid bot detection

### Target Users
Job seekers applying to high volumes of positions who want friction-free form filling.

---

## 🏗️ Architecture

```
autoapply/
├── apps/
│   ├── extension/          # Chrome extension (Plasmo MV3)
│   │   ├── popup.tsx       # Extension popup UI
│   │   ├── background.ts   # Service worker, tab state tracking
│   │   ├── contents/       # Content scripts
│   │   │   └── workday.ts  # Workday content script
│   │   ├── modules/        # ATS-specific modules
│   │   │   ├── base-module.ts
│   │   │   ├── types.ts
│   │   │   └── workday.ts  # Workday field mappings (12+ fields)
│   │   └── lib/
│   │       ├── detection.ts      # URL + DOM detection
│   │       ├── evasion.ts        # Human-like typing, delays
│   │       └── field-matcher.ts  # Smart field matching
│   │
│   └── dashboard/          # Next.js 15 web app
│       ├── app/
│       │   ├── api/        # API routes
│       │   │   ├── auth/   # NextAuth (scaffolded, not configured)
│       │   │   └── profile/
│       │   ├── login/
│       │   ├── profile/
│       │   └── applications/
│       ├── prisma/
│       │   └── schema.prisma   # User, Profile, Resume, Application models
│       └── lib/
│           └── prisma.ts
│
├── packages/
│   └── shared/             # Shared types between extension & dashboard
│       └── src/index.ts
│
├── docs/
│   └── ERRORS.md           # Testing findings, selector docs
│
└── .planning/              # Project management artifacts
    ├── PROJECT.md
    ├── SCRATCHPAD.md
    ├── EXECUTION-PLAN.md
    └── research/           # Initial research docs
```

### Tech Stack
| Component | Technology |
|-----------|------------|
| Extension | Plasmo (MV3), TypeScript, React |
| Dashboard | Next.js 15, Tailwind CSS, shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google OAuth planned) |
| Monorepo | pnpm workspaces + Turborepo |

---

## ✅ What's Done (Phases 1-3)

### Phase 1: Foundation ✅
- Monorepo structure with pnpm workspaces
- Extension scaffolding (Plasmo MV3)
- Dashboard scaffolding (Next.js 15)
- Prisma schema with 4 models
- Both apps build successfully

### Phase 2: Workday Detection ✅
- **URL Detection:** Matches `*.myworkdayjobs.com`, `*.workday.com`, etc.
- **DOM Detection:** Looks for Workday-specific `data-automation-id` attributes
- **Page Type Classification:** Distinguishes job listing vs. application vs. search
- **SPA Handling:** MutationObserver + history API hooks for single-page nav
- **Confidence Scoring:** 0-1 score based on URL + DOM signal strength

### Phase 3: Auto-Fill Engine ✅
- **Field Mappings:** 12+ Workday fields mapped (name, email, phone, address, LinkedIn, etc.)
- **5-Strategy Matcher:**
  1. `data-automation-id` exact match
  2. Label text matching (with variations)
  3. Placeholder text
  4. `aria-label`
  5. `name`/`id` attributes
- **Bot Evasion:**
  - Human-like typing with variable speed
  - Random delays between actions
  - Mouse movement simulation
  - Removes automation fingerprints
- **Honeypot Protection:** Filters out `beecatcher` field (present on ALL Workday sites)

### Testing Done
Tested on 3 live Workday sites:
- NVIDIA (`nvidia.wd5.myworkdayjobs.com`)
- Adobe (`adobe.wd5.myworkdayjobs.com`)
- Salesforce (`salesforce.wd12.myworkdayjobs.com`)

All use consistent `data-automation-id` selectors. See `docs/ERRORS.md` for detailed findings.

---

## 🔜 What's Next (Phase 4)

### Phase 4.1: Google OAuth Setup
**Goal:** Users can log in with Google to save their profile.

**TODO:**
1. Create Google Cloud project + OAuth credentials
2. Configure NextAuth with Google provider
3. Connect to PostgreSQL database
4. Create/update User record on first login
5. Session management + protected routes

**Files to modify:**
- `apps/dashboard/auth.ts` — NextAuth config (scaffolded, needs credentials)
- `apps/dashboard/app/api/auth/[...nextauth]/route.ts`
- `apps/dashboard/.env` — Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`

### Phase 4.2: Profile Editor
**Goal:** User can fill out their job application profile.

**TODO:**
1. Build profile form UI with all fields
2. API route to save/update profile
3. Form validation (Zod recommended)
4. Success/error feedback

**Profile fields needed:**
- Personal: firstName, lastName, email, phone
- Address: street, city, state, zip, country
- Links: linkedIn, github, portfolio, website
- Work history: array of {company, title, startDate, endDate, description}
- Education: array of {school, degree, field, startDate, endDate, gpa}
- Demographics: veteranStatus, disabilityStatus, gender, ethnicity (optional)

### Phase 4.3: Extension-Dashboard Sync
**Goal:** Extension fetches user profile from dashboard API.

**TODO:**
1. Auth token exchange (extension → dashboard)
2. Profile fetch endpoint
3. Local caching in extension (chrome.storage)
4. Token refresh mechanism

---

## 🐛 Known Issues & Gotchas

### Critical: Extension Loading
**Problem:** Can't automate Chrome's native file picker to load unpacked extension.

**Workaround:** Manual load required:
1. `pnpm build` in `apps/extension`
2. Chrome → `chrome://extensions/` → Developer mode ON
3. "Load unpacked" → select `apps/extension/build/chrome-mv3-prod`

### Workday Specifics
- **Honeypot:** NEVER fill `data-automation-id="beecatcher"` — it's a bot trap
- **Apply button:** It's `adventureButton`, not `applyButton`
- **Login fields:** `email`, `password`, `signInContent` (not what you'd guess)
- **SPA navigation:** Workday uses client-side routing, need MutationObserver

### Build Notes
- Extension name was empty in manifest — fixed by adding `displayName` to package.json
- CRLF warnings on Windows — cosmetic, ignore them
- Plasmo warns about new version — can upgrade but not required

---

## 🔧 Development Setup

```bash
# Clone
git clone https://github.com/rjav1/autoapply
cd autoapply

# Install
pnpm install

# Build extension
cd apps/extension
pnpm build
# Output: build/chrome-mv3-prod/

# Run dashboard dev server
cd apps/dashboard
pnpm dev
# Opens http://localhost:3000

# Run both with Turbo
pnpm dev  # from root
```

### Environment Variables (Dashboard)
Create `apps/dashboard/.env`:
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-a-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 📁 Key Files to Understand

| File | Purpose |
|------|---------|
| `apps/extension/modules/workday.ts` | Heart of the extension — field mappings, fill logic |
| `apps/extension/lib/field-matcher.ts` | Smart matching algorithm |
| `apps/extension/lib/evasion.ts` | Bot detection avoidance |
| `apps/extension/lib/detection.ts` | Page detection logic |
| `apps/dashboard/prisma/schema.prisma` | Database models |
| `packages/shared/src/index.ts` | Shared TypeScript types |
| `docs/ERRORS.md` | Testing findings, selector documentation |
| `.planning/EXECUTION-PLAN.md` | Full phase breakdown with tasks |

---

## ❓ Questions to Clarify Before Proceeding

Before diving in, please clarify:

1. **Database hosting:** Where will PostgreSQL be hosted? (Supabase, Vercel Postgres, Railway, self-hosted?)

2. **Google OAuth:** Do you have a Google Cloud project set up, or should I create one?

3. **Dashboard deployment:** Vercel? Self-hosted? This affects environment variable setup.

4. **Resume storage:** Where should uploaded resumes be stored? (S3, Cloudflare R2, local filesystem?)

5. **Priority:** Should I focus on completing the dashboard (auth + profile) first, or do you want more ATS modules (Greenhouse, Taleo)?

6. **Testing approach:** Do you have test Workday accounts, or should I use real job postings for testing?

---

## 🚀 Recommended Next Steps

1. **Set up database** — Get a PostgreSQL instance running
2. **Configure Google OAuth** — Create credentials, add to .env
3. **Implement auth flow** — NextAuth + database adapter
4. **Build profile form** — UI + API + validation
5. **Extension sync** — Connect extension to dashboard API
6. **Test end-to-end** — Full flow from login → profile → auto-fill

---

## 📞 Contact

If anything is unclear, ASK. Don't guess. The codebase is straightforward but the Workday quirks are tricky.

Check `.planning/` folder for more context on decisions made and rationale.

Good luck! 🚀
