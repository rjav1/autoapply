# Stack Research: AutoApply

## Recommended Stack

### Core Technology Selections (2025-2026)

This stack prioritizes developer experience, type safety, maintainability, and proven ATS integration patterns. All selections are actively maintained and widely used in production job automation systems.

#### Key Principles
- **TypeScript everywhere** - eliminates runtime type errors in form filling logic
- **Monorepo-first** - shared types between extension, dashboard, and backend
- **Open source** - no vendor lock-in for critical components
- **Production-proven** - each library has real-world adoption in similar projects

---

## Chrome Extension (MV3)

### Build Tooling & Development

**Primary Stack:**
- **Plasmo** v0.80+ - MV3-first framework with HMR, TypeScript support, and built-in popup/content script handling
  - Rationale: Purpose-built for MV3, eliminates webpack boilerplate, automatic service worker reloading
  - Handles: manifest.json generation, CSRF tokens, declarative permissions

- **TypeScript** v5.3+ - strict mode enabled
  - Rationale: Form filling involves complex DOM traversal; types prevent selector typos

- **PNPM** v8.15+ - monorepo package manager
  - Rationale: Faster installations, strict dependency resolution, native monorepo support

### DOM Manipulation & Form Filling

**Core Libraries:**
- **Cheerio** v1.0+ - for server-side HTML parsing and element inspection
  - Why: Lightweight jQuery-like API, works in service workers, no DOM dependencies
  - Use case: Analyze ATS form structure before filling

- **dom-query** or native `querySelector`
  - For runtime DOM manipulation in content scripts
  - Avoid full jQuery - too heavy for extensions

- **Playwright** v1.40+ - for testing ATS platforms locally
  - For integration tests, NOT production code
  - Rationale: Test form filling against real Workday/Greenhouse instances

### Content Script Architecture

**Recommended Pattern:**
```typescript
// content.ts
- Listener for messages from popup
- DOM traversal helpers (typed)
- Form detection logic (regex-based ATS platform detection)
- Auto-fill implementation with error handling
- Response messages back to popup
```

**Libraries:**
- **zod** v3.22+ - runtime validation for API responses
  - Rationale: Validate form data before submitting, catch ATS schema changes

- **ky** v1.1+ - HTTP client for content scripts
  - Rationale: Lighter than axios, better for extension context, fewer dependencies

### State Management in Popup/Options

**Recommendation:**
- **Chrome Storage API** v1 (native)
  - With typed wrapper library: **exenv** or **webext-base-js**
  - Avoid Redux/Zustand - unnecessary complexity for popup state

- Local state in React hooks if using popup as React component

### Message Passing & Types

**Pattern:**
- Define shared types in `packages/shared/types/messages.ts`
- Use discriminated unions for type-safe message handling
- Example:
```typescript
type ContentScriptMessage =
  | { type: 'FORM_DETECTED'; payload: FormMetadata }
  | { type: 'FILL_FORM'; payload: ApplicationData }
  | { type: 'ERROR'; payload: string }
```

---

## Dashboard (Next.js on Vercel)

### Core Framework & Deployment

**Stack:**
- **Next.js** v15.0+ (app router, not pages router)
  - Rationale: Vercel integration, native API routes, edge functions for auth
  - Server components by default, client components only when needed

- **Vercel** deployment platform
  - Native Next.js optimization
  - Edge functions for OAuth callback
  - Built-in analytics and monitoring

### UI & Component Development

**Primary Stack:**
- **shadcn/ui** v0.8+ - composable React components on Tailwind
  - Rationale: Copy-paste components, full TypeScript support, heavily customizable
  - Pairs perfectly with: Radix UI primitives (built into shadcn)

- **Tailwind CSS** v3.4+ - utility-first styling
  - Rationale: Integrates with shadcn/ui, Vercel-optimized, zero runtime overhead

- **Zod** v3.22+ - form validation
  - Shared with backend and extension

- **React Hook Form** v7.48+ - lightweight form state
  - Rationale: Minimal re-renders, integrates with Zod, small bundle impact

### State Management & Data Fetching

**Recommendation:**
- **TanStack Query (React Query)** v5.28+ for server state
  - Rationale: Industry standard, handles caching, refetching, pagination
  - Works well with Next.js App Router
  - Eliminates need for global state in most cases

- **Zustand** v4.4+ for local UI state only (modals, filters, sidebar)
  - Rationale: Minimal boilerplate, 2KB library, no provider hell
  - NOT for API/server state

- No Redux - overkill for this use case

### Authentication & Session Management

**Stack:**
- **NextAuth.js** v5.0+ (or **Auth.js** - rebrand of NextAuth)
  - Google OAuth provider built-in
  - Session middleware for API routes
  - Automatic CSRF protection

- Stored in **httpOnly cookies** (default NextAuth behavior)
  - Rationale: Secure from XSS, automatic CORS handling

### API Client Communication

**Recommendation:**
- **Fetch API** (modern browsers) with typed wrappers
  - Or: **ky** v1.1+ for small bundle and better error handling

- **Shared types** from `packages/shared/types`
  - Generated from backend with **tRPC** (optional but recommended)
  - OR: Manual type file updated with OpenAPI spec generation

### Charts & Data Visualization

**Optional but Recommended:**
- **Recharts** v2.10+ - React-native charts, built on D3
  - For application dashboard, success rates, ATS platform breakdowns
  - Lightweight, accessible, Tailwind-compatible

---

## Backend

### Runtime & HTTP Framework

**Stack:**
- **Node.js** v20 LTS (or v22, depends on hosting support)
  - Rationale: JavaScript/TypeScript compatibility, large ecosystem

- **Express.js** v4.18+ OR **Hono** v4.1+
  - Express: Mature, widely understood, massive middleware ecosystem
  - Hono: Newer, edge-runtime compatible, built-in streaming, better TS support
  - Recommendation: **Express** for traditional Node.js, **Hono** if deploying on Vercel functions

- **TypeScript** v5.3+ - strict mode
  - Rationale: Type safety for database queries, API responses, OAuth flows

### Database & ORM

**Primary Stack:**
- **PostgreSQL** v15+ (managed service like Neon, Supabase, or RDS)

- **Prisma** v5.8+ - ORM and schema management
  - Rationale: Best developer experience for TypeScript, automatic migrations, type-safe queries
  - Excellent for rapid API development
  - Strong MongoDB support if pivot needed
  - Cons: Slightly slower than raw SQL, but worth the trade-off for safety

- Alternative: **Drizzle** v0.29+ if you want lighter weight + query builder control
  - Better for complex queries, more control
  - Steeper learning curve than Prisma

### Authentication & OAuth

**Stack:**
- **Passport.js** v0.7+ with `passport-google-oauth20` strategy
  - OR: **NextAuth.js** v5 (if backend is within Next.js)
  - OR: **Auth0** managed service (if you want less code)

- **Recommendation: NextAuth.js v5** - handles OAuth end-to-end
  - Database adapter for Prisma/PostgreSQL built-in
  - Automatic token refresh
  - PKCE flow for security

- JWT refresh tokens stored in **httpOnly cookies**
  - Access tokens in memory or sessionStorage
  - Rationale: Secure from XSS, works with API routes

### Session/Token Management

**Pattern:**
```typescript
// OAuth Flow
1. User clicks "Sign in with Google" on dashboard
2. NextAuth redirects to Google consent screen
3. Google returns auth code
4. Backend exchanges code for access + refresh tokens
5. Refresh token stored in httpOnly cookie (never sent to client JS)
6. Access token in memory (NextAuth session)
7. Automatic refresh on token expiration
```

### File Storage (Resumes)

**Recommendation:**
- **AWS S3** or **Vercel Blob** storage
  - Rationale: CDN-optimized, resume retrieval in milliseconds
  - Encryption at rest
  - Access control per user

- Prisma migration: store S3 URL in database, not file content
  ```sql
  CREATE TABLE resumes (
    id UUID PRIMARY KEY,
    userId UUID NOT NULL,
    fileName VARCHAR(255),
    s3Url VARCHAR(2048),
    uploadedAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
  ```

### API Design

**Architecture:**
- **RESTful** with clear resource structure
  - `POST /api/oauth/callback` - OAuth redirect
  - `GET /api/me` - current user profile
  - `POST /api/resumes` - upload resume
  - `GET /api/resumes` - list user resumes
  - `POST /api/applications` - start job application
  - `GET /api/applications` - list applications with filters

- OR: **tRPC** v10.43+ for end-to-end type safety
  - Rationale: Automatic API validation, types shared with frontend
  - Eliminates OpenAPI spec management
  - Better DX than REST + types

**Recommendation: tRPC** for this project size
- Reduces boilerplate significantly
- Type safety from backend to frontend automatically

### Error Handling

**Pattern:**
- **Custom error classes** extending Error
- **Zod** for runtime validation of inputs
- **HTTP status codes**: 400 (validation), 401 (auth), 403 (forbidden), 500 (server error)

### Logging

**Recommendation:**
- **Winston** v3.11+ or **Pino** v8.17+
  - Structured logging (JSON format)
  - Log levels: error, warn, info, debug
  - Integration with Vercel logs if deployed serverless

---

## Monorepo Tooling

### Package Manager & Workspace Setup

**Stack:**
- **PNPM** v8.15+ (monorepo manager)
  - Rationale: Strict dependency resolution, faster than npm, native workspace support
  - `pnpm-workspace.yaml` at root
  - Phantom dependencies are impossible

- **Turborepo** v1.11+ (optional but recommended for builds)
  - Rationale: Incremental builds, parallel task execution, caching
  - Especially useful as project grows
  - Alternative: native pnpm scripts if keeping simple

### Directory Structure

```
autoapply/
├── packages/
│   ├── shared/          # Shared types, validators, utilities
│   ├── extension/       # Chrome Extension MV3
│   ├── dashboard/       # Next.js app
│   └── backend/         # Express/Hono server
├── pnpm-workspace.yaml
├── turbo.json           # (optional, if using Turborepo)
└── README.md
```

### Shared Packages Strategy

**packages/shared/**
```typescript
// types/
- messages.ts          (Content script <-> Popup messages)
- api.ts              (Dashboard <-> Backend API contracts)
- ats.ts              (Workday, Greenhouse, Oracle form schemas)
- user.ts             (User, Resume, Application types)

// validators/
- forms.ts            (Zod schemas, shared between backend & frontend)
- oauth.ts

// utils/
- ats-detection.ts    (Platform detection regex)
- storage-helpers.ts  (Chrome storage helpers)
```

**Key Principle:** Never import backend or dashboard code into extension, and vice versa.

### TypeScript Configuration

**Root `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./packages/*/src/*"],
      "@shared/*": ["./packages/shared/src/*"]
    }
  }
}
```

**Per-package overrides** in `tsconfig.json` for React, Node.js targets

### Version Management

**Recommendation:**
- Use **pnpm up** for upgrades
- Pin major versions in workspace
- Single version of TypeScript, React across projects
- Example:
  ```yaml
  # pnpm-workspace.yaml
  packages:
    - 'packages/*'

  pnpm:
    overrides:
      typescript: '5.3.3'
      react: '18.2.0'
  ```

### CI/CD Integration

**GitHub Actions workflow:**
```yaml
- Lint (ESLint) - all packages
- Type check (tsc) - all packages
- Test (Vitest) - unit tests
- Build - all packages
  - Extension: Plasmo build
  - Dashboard: Next.js build
  - Backend: TypeScript compile
- Deploy (if main branch)
  - Extension: Chrome Web Store API
  - Dashboard: Vercel
  - Backend: Cloud Run / Railway / Vercel Functions
```

---

## What NOT to Use

### Anti-Recommendations & Reasoning

#### For Chrome Extension
- **Webpack** directly - Use Plasmo instead
  - Plasmo handles MV3 manifest generation, content script bundling automatically
  - Manual webpack setup is 500+ lines of config

- **CRA/Vite** for extension popup - Use Plasmo's built-in React support
  - CRA is too heavy; Vite doesn't understand MV3 specifics

- **jQuery** - Use native DOM APIs or querySelector
  - Adds 30KB+ to extension size
  - jQuery patterns don't map well to content scripts

- **Riot.js, Vue in extension** - Use React or vanilla JS
  - React has best extension ecosystem (wxt, plasmo templates)
  - Vue lacks content script tooling

- **Multiple message passing libraries** - Use Chrome's native messaging API
  - Avoid zmq, EventEmitter, socket.io
  - Native API is secure and sufficient

#### For Dashboard
- **Redux** - Use Zustand + TanStack Query instead
  - Redux boilerplate (actions, reducers, selectors) is overkill
  - TanStack Query already solves server state
  - Zustand handles local UI state in 1/10th the code

- **Apollo Client without GraphQL backend** - Use TanStack Query + REST
  - Apollo assumes GraphQL; adds complexity for REST

- **styled-components or Emotion** - Use Tailwind CSS
  - Tailwind has better Vercel integration
  - Smaller CSS output with purging
  - shadcn/ui components assume Tailwind

- **Material-UI** - Use shadcn/ui instead
  - MUI is heavier (bundle size)
  - MUI customization is harder
  - shadcn/ui is copy-paste, fully customizable

- **Client-side rendering for authenticated pages** - Use Next.js server components
  - App router handles streaming, security automatically
  - No client-side auth state management needed

#### For Backend
- **Sequelize** - Use Prisma instead
  - Sequelize is older, less intuitive for TypeScript
  - Prisma migrations are clearer

- **TypeORM** - Use Prisma instead
  - TypeORM has decorator hell
  - Prisma schema is more readable
  - Prisma has better Next.js integration

- **MongoDB without strong need** - Stick with PostgreSQL
  - PostGres handles JSON better now
  - Transactions are critical for job applications (atomicity)
  - MongoDB complicates auth session storage

- **Custom JWT implementation** - Use NextAuth.js
  - Token refresh logic is easy to get wrong
  - NextAuth handles PKCE, state validation automatically

- **Session storage in database** - Use httpOnly cookies
  - Cookies are more secure from CSRF
  - Simpler for stateless API design

- **AWS RDS with default settings** - Use Supabase, Neon, or Railway
  - Rationale: Managed backups, automatic scaling
  - RDS requires more operational overhead
  - Supabase/Neon have free tiers for development

#### For Monorepo
- **npm workspaces** - Use pnpm workspaces
  - pnpm is faster, stricter dependency management
  - npm workspaces are newer, less mature

- **Yarn** (classic) - Use pnpm
  - pnpm is faster, more consistent
  - Yarn v4 is better but pnpm is still preferred for Node

- **Lerna** alone - Use pnpm + Turborepo
  - Lerna is task management only; pnpm is the foundation
  - Turborepo builds on top of monorepo structure better

- **Single tsconfig.json** - Use per-package configs
  - Different targets: browser (extension, dashboard) vs Node (backend)
  - Mixing targets causes subtle TypeScript errors

---

## Recommended Dependency Versions Summary

### Shared Across All Packages
```json
{
  "typescript": "^5.3.3",
  "pnpm": "^8.15.0",
  "zod": "^3.22.4"
}
```

### Chrome Extension Package
```json
{
  "plasmo": "^0.80.0",
  "cheerio": "^1.0.0-rc.12",
  "ky": "^1.1.3"
}
```

### Next.js Dashboard Package
```json
{
  "next": "^15.0.0",
  "react": "^18.2.0",
  "tailwindcss": "^3.4.1",
  "shadcn-ui": "^0.8.0",
  "react-hook-form": "^7.48.1",
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.4.1",
  "next-auth": "^5.0.0"
}
```

### Backend Package
```json
{
  "express": "^4.18.2",
  "prisma": "^5.8.1",
  "@prisma/client": "^5.8.1",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "winston": "^3.11.0"
}
```

---

## Decision Summary Table

| Component | Technology | Why | Alternative |
|-----------|------------|-----|-------------|
| Extension Build | Plasmo | MV3-native, HMR, zero-config | wxt, crxjs |
| Extension DOM | Native APIs | Lightweight, secure | jQuery |
| Dashboard Framework | Next.js 15 (App Router) | Vercel native, server components | SvelteKit, Remix |
| UI Components | shadcn/ui + Tailwind | Type-safe, customizable, lightweight | Material-UI, Chakra |
| Form State | React Hook Form | Minimal re-renders | Formik |
| Server State | TanStack Query | Standard, powerful caching | SWR |
| Local State | Zustand | Minimal boilerplate | Recoil, Jotai |
| Auth | NextAuth.js v5 | Complete OAuth, secure, Prisma adapter | Auth0, Clerk |
| Backend Framework | Express.js | Mature, ecosystem | Hono (newer) |
| Database | PostgreSQL + Prisma | Type safety, migrations, DX | MySQL + Drizzle |
| Monorepo Manager | PNPM | Fast, strict, workspace-native | npm (v7+) |
| Build Orchestration | Turborepo | Caching, parallelization | Just pnpm scripts |
| Resume Storage | Vercel Blob / S3 | CDN, encryption, scale | Cloudinary |

---

## Rationale for This Stack

### Why This Combination Works Together

1. **Type Safety Throughout**
   - TypeScript in extension, dashboard, backend
   - Zod for runtime validation (API responses, form data)
   - Shared types in monorepo means frontend/backend never disagree
   - Extension messages are type-checked

2. **Minimal Configuration**
   - Plasmo abstracts MV3 complexity
   - Next.js app router is simpler than pages
   - Prisma schema is easier than raw migrations
   - TanStack Query replaces Redux boilerplate
   - shadcn/ui is copy-paste, not opinionated

3. **Performance by Default**
   - Next.js streaming SSR
   - TanStack Query caching reduces API calls
   - Tailwind CSS purges unused styles
   - Extension stays small (Plasmo bundles efficiently)
   - Vercel edge functions for OAuth callback (global latency)

4. **Maintainability**
   - Monorepo keeps code DRY
   - Shared types prevent integration bugs
   - Clear separation: extension, dashboard, backend each own their domain
   - Standard library ecosystem (express, prisma, nextauth are industry standard)

5. **Scaling & Growth**
   - PostgreSQL + Prisma handles complex application tracking
   - TanStack Query caching works from 1 user to 1M
   - Turborepo build times stay fast as codebase grows
   - Vercel scales with traffic automatically

---

## Next Steps

1. **Initialize Monorepo**
   ```bash
   pnpm init
   mkdir -p packages/{shared,extension,dashboard,backend}
   ```

2. **Create pnpm-workspace.yaml**

3. **Set up TypeScript root config**

4. **Scaffold each package:**
   - Extension: `pnpm create plasmo@latest`
   - Dashboard: `pnpm create next-app@latest`
   - Backend: Express template from starter repo

5. **Define shared types in packages/shared**

6. **Set up CI/CD** with GitHub Actions

7. **Deploy infrastructure:**
   - PostgreSQL: Supabase or Neon
   - Dashboard: Vercel
   - Backend: Vercel Functions or Railway
   - Storage: Vercel Blob

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │  Chrome Extension    │◄─────►  │   Dashboard (Next.js)│  │
│  │     (MV3, TS)        │ HTTPS   │   (Vercel, TS)      │  │
│  └──────────────────────┘         └──────────────────────┘  │
└──────┬─────────────────────────────────────────────────┬────┘
       │                                                 │
       │ Auto-fill ATS forms                     HTTP/REST API
       │                                                 │
       ▼                                                 ▼
┌─────────────────────────────────┐     ┌──────────────────────────┐
│    ATS Platforms (read-only)    │     │  Backend (Express, TS)   │
│  - Workday                      │     │  - Vercel Functions      │
│  - Greenhouse                   │     │  - PostgreSQL (Neon)     │
│  - Oracle                       │     │  - OAuth, Sessions       │
└─────────────────────────────────┘     │  - Resume Storage (S3)   │
                                        │  - Job Application Data  │
                                        └──────────────────────────┘
```

---

## File Structure (pnpm monorepo)

```
autoapply/
├── .github/
│   └── workflows/
│       └── ci.yml
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── messages.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── ats.ts
│   │   │   │   └── user.ts
│   │   │   ├── validators/
│   │   │   │   └── forms.ts
│   │   │   └── utils/
│   │   │       ├── ats-detection.ts
│   │   │       └── storage.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── extension/
│   │   ├── src/
│   │   │   ├── content-scripts/
│   │   │   ├── popup/
│   │   │   ├── options/
│   │   │   └── background.ts
│   │   ├── plasmo.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (authenticated)/
│   │   │   ├── api/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   │
│   └── backend/
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── db/
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

---

## Summary

This stack balances **modern tooling**, **type safety**, **minimal complexity**, and **real-world adoption**. Every choice has a clear rationale and proven track record in production job automation systems (2025-2026).

The recommendation prioritizes:
1. **Type safety** - catches bugs at compile time in form filling logic
2. **Minimal boilerplate** - Prisma over ORMs, TanStack Query over Redux, Plasmo over webpack
3. **Proven patterns** - Next.js + Vercel, Prisma + PostgreSQL, Express/Hono
4. **Monorepo benefits** - shared types eliminate integration bugs

For your specific use case (ATS form automation), the critical technologies are:
- **Plasmo** for MV3 extension reliability
- **Zod** for runtime form validation
- **Prisma** for atomic job application transactions
- **NextAuth.js** for secure OAuth without sessions in database
- **TanStack Query** for dashboard state (application tracking, filters, pagination)

---

Last Updated: February 2026
Research Scope: Production-ready 2025-2026 job application automation stack
