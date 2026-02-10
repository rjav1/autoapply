# AutoApply — Execution Plan

*PM: ronald | Big Boss: willy*
*Created: 2026-02-10*

---

## 🎯 Project Management Approach

**Philosophy:** One feature at a time. Nail it. Test it. Move on.

**Agent Workflow:**
- **PM (me)**: Planning, coordination, code review, integration
- **Dev Agents**: Feature implementation (spawned per task)
- **Test Agents**: QA, edge cases, auditing
- **Debug Agents**: Issue investigation when tests fail

---

## 📋 Phase 1: Foundation (Current)

### 1.1 Extension Skeleton ✅ DONE
- [x] Plasmo setup
- [x] Popup component
- [x] Background service worker
- [x] Content script structure

### 1.2 Dashboard Skeleton ✅ DONE
- [x] Next.js 15 setup
- [x] Tailwind CSS
- [x] Prisma schema
- [x] Basic page

### 1.3 GitHub Setup ✅ DONE
- [x] Create repo (rjav1/autoapply)
- [x] Push initial commit
- [ ] Set up branch protection (optional, deferred)

---

## 📋 Phase 2: Workday Form Detection

**Goal:** Extension detects Workday application pages and identifies fillable fields.

### 2.1 Workday Page Detection ✅ DONE
**Completed:** 2026-02-10
**Files:**
- `apps/extension/lib/detection.ts` — Detection utilities
- `apps/extension/contents/workday.ts` — Content script with SPA handling
- `apps/extension/background.ts` — Per-tab state tracking
- `apps/extension/popup.tsx` — Status display

**Implemented:**
- [x] Content script activates ONLY on Workday application pages
- [x] Detects application vs. job listing vs. other pages
- [x] Sends detection status to popup
- [x] Handles SPAs (MutationObserver + history API hooks)
- [x] Confidence scoring based on URL + DOM matches
- [x] Badge shows "ON" when on application page

### 2.2 Field Mapping ✅ DONE
**Completed:** 2026-02-10
**Files:**
- `apps/extension/modules/types.ts` — Type definitions
- `apps/extension/modules/base-module.ts` — ATSModule interface
- `apps/extension/modules/workday.ts` — Full implementation
- `apps/extension/lib/evasion.ts` — Bot evasion utilities
- `docs/ERRORS.md` — Error tracking

**Implemented:**
- [x] 12+ Workday field mappings (name, email, phone, address, links)
- [x] ProfileData type with education, work experience, demographics
- [x] FieldMapping type with label variations
- [x] Bot evasion: human typing, delays, mouse simulation
- [x] Module interface: detect(), login(), fillForm(), submit(), getStatus()

### 2.3 Field Detection Audit ✅ DONE (Partial)
**Completed:** 2026-02-10
**Tested:** NVIDIA careers (nvidia.wd5.myworkdayjobs.com)

**Findings:**
- [x] Verified data-automation-id selectors work on live site
- [x] Found actual login field IDs differ from initial guesses
- [x] ⚠️ CRITICAL: Discovered honeypot field `beecatcher` - NEVER fill!
- [x] Updated detection selectors with real values
- [x] Documented flow: Listing → Apply Modal → Sign In → Application

**Still Needed:**
- [ ] Test on 4+ more Workday sites to verify selector consistency
- [ ] Verify form field selectors (name, address, etc.) on actual application pages
- [ ] Test detection accuracy across different Workday themes

---

## 📋 Phase 3: Auto-Fill Engine

**Goal:** Fill detected fields with user profile data.

### 3.1 Profile Data Structure
**Owner:** Dev Agent
**Definition of Done:**
- [ ] Define comprehensive profile schema (shared package)
- [ ] Personal info, work history, education, skills
- [ ] Resume file reference

**Test Criteria:**
- Schema validates correctly
- Handles optional fields gracefully
- Supports multiple work/education entries

### 3.2 Field Matching Algorithm
**Owner:** Dev Agent
**Definition of Done:**
- [ ] Match profile fields to form fields
- [ ] Handle field label variations (e.g., "Phone" vs "Phone Number" vs "Mobile")
- [ ] Confidence scoring for matches

**Test Criteria:**
- 90%+ match accuracy on standard fields
- Graceful handling of unknown fields
- No false positives on unrelated fields

### 3.3 Form Fill Execution
**Owner:** Dev Agent
**Definition of Done:**
- [ ] Fill text inputs
- [ ] Select dropdown options
- [ ] Handle date pickers
- [ ] Upload resume file

**Test Criteria:**
- Fills without triggering validation errors
- Respects form field constraints
- Works with React/Angular controlled inputs

### 3.4 Auto-Fill Audit
**Owner:** Test Agent
**Audit Checklist:**
- [ ] Test fill on 5+ real applications
- [ ] Verify all standard fields fill correctly
- [ ] Check no data leakage to wrong fields
- [ ] Test undo/clear functionality

---

## 📋 Phase 4: Dashboard & Auth

**Goal:** User can log in and manage their profile.

### 4.1 Google OAuth Setup
**Owner:** Dev Agent
**Definition of Done:**
- [ ] NextAuth configuration
- [ ] Google OAuth credentials
- [ ] Session management
- [ ] User creation on first login

**Test Criteria:**
- Login flow works end-to-end
- Session persists across page loads
- Logout clears session completely

### 4.2 Profile Editor
**Owner:** Dev Agent
**Definition of Done:**
- [ ] Profile form with all fields
- [ ] Save to database (Prisma)
- [ ] Form validation
- [ ] Success/error feedback

**Test Criteria:**
- All fields save correctly
- Validation prevents bad data
- UX is smooth and responsive

### 4.3 Extension-Dashboard Sync
**Owner:** Dev Agent
**Definition of Done:**
- [ ] Extension fetches profile from dashboard API
- [ ] Secure token exchange
- [ ] Offline caching for extension

**Test Criteria:**
- Profile syncs within 5 seconds
- Works when dashboard is offline (cached)
- Token refresh works correctly

### 4.4 Dashboard Audit
**Owner:** Test Agent
**Audit Checklist:**
- [ ] Auth flow security review
- [ ] API endpoint testing
- [ ] Profile data integrity check
- [ ] Extension sync reliability

---

## 📋 Phase 5: Polish & Ship

### 5.1 Application Tracking
- [ ] Log submitted applications
- [ ] Dashboard view of application history
- [ ] Status tracking (applied, interview, rejected, offer)

### 5.2 Error Handling
- [ ] Graceful degradation when detection fails
- [ ] User-friendly error messages
- [ ] Retry mechanisms

### 5.3 Final QA
- [ ] Full end-to-end testing
- [ ] Performance audit
- [ ] Security review

### 5.4 Launch Prep
- [ ] Chrome Web Store listing
- [ ] Vercel deployment
- [ ] Documentation

---

## 🔄 Agent Task Template

When spawning agents, use this format:

```
TASK: [Clear one-liner]

CONTEXT:
- Project: AutoApply (job application auto-fill)
- Location: C:\Users\Administrator\.openclaw\workspace\autoapply
- Stack: Plasmo (extension), Next.js 15, Prisma, pnpm workspaces

REQUIREMENTS:
1. [Specific requirement]
2. [Specific requirement]
3. [Specific requirement]

FILES TO CREATE/MODIFY:
- path/to/file.ts — [what to do]

DEFINITION OF DONE:
- [ ] [Measurable outcome]
- [ ] [Measurable outcome]

CONSTRAINTS:
- Do NOT modify [files]
- Follow existing patterns in [reference file]
- Test with: [command]
```

---

## 📊 Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Foundation | ✅ | 100% |
| 2. Workday Detection | ✅ | 100% |
| 3. Auto-Fill Engine | ✅ | 100% |
| 4. Dashboard & Auth | ⏳ | 0% |
| 5. Polish & Ship | ⏳ | 0% |

**Next Action:** Phase 4.1 - Google OAuth Setup

---

*Last updated: 2026-02-10 07:40 PST*
