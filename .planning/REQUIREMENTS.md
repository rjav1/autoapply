# AutoApply — Requirements

## Core Requirements (MVP)

### 1. Chrome Extension (MV3)
- [ ] Service worker architecture (stateless, chrome.storage for persistence)
- [ ] Content script for ATS form detection
- [ ] Workday module: detect forms, map fields, auto-fill
- [ ] Popup UI: activate/deactivate, status indicator
- [ ] Extension ↔ Backend auth flow via chrome.identity

### 2. Web Dashboard
- [ ] Next.js 15 App Router + Tailwind + shadcn/ui
- [ ] Google OAuth login (identity only, no Drive/Gmail)
- [ ] Profile management: contact info, work history, education
- [ ] Resume upload with text extraction
- [ ] Application history view

### 3. Backend API
- [ ] Next.js API routes (unified with dashboard)
- [ ] Prisma ORM + PostgreSQL
- [ ] User auth (NextAuth.js v5)
- [ ] Resume storage (text + original file)
- [ ] Application tracking CRUD

### 4. Database Schema
- [ ] users (id, email, name, oauth_provider)
- [ ] profiles (user_id, contact, work_history, education)
- [ ] resumes (user_id, filename, text_content, url)
- [ ] applications (user_id, job_url, company, status, applied_at)

## Phase 2 (Post-MVP)
- [ ] Greenhouse module
- [ ] Oracle/Taleo module
- [ ] Job suggestions from scraped listings
- [ ] Application quality scoring
- [ ] Resume versioning

## Non-Requirements (Explicitly Out of Scope)
- Mass auto-apply without review
- Email/LinkedIn scraping
- Full-auto cover letter generation
- Mobile app
- Subscription/payment system

---
*Generated: 2026-02-10*
