# Architecture Research: AutoApply

## Component Boundaries

### Chrome Extension (MV3)
**Responsibility**: User interaction layer, job detection, form filling, application triggering
- Content scripts: Monitor job listing pages (LinkedIn, Indeed, etc.), detect job postings, extract job data
- Service worker: Handle background tasks, manage OAuth tokens, coordinate between content scripts and backend
- Popup UI: Quick access to settings, pause/resume automation, view recent applications
- Offscreen document: Long-running tasks (file uploads, large data processing)
- Does NOT: Store application logic, perform authentication, persist user state beyond storage

### Backend API (Node.js/Express or similar)
**Responsibility**: Core business logic, data persistence, job scraping, application processing
- Authentication: OAuth token verification and refresh
- Database access: All user data, resume management, application history, job database
- External integrations: Job board APIs (LinkedIn, Indeed, Glassdoor), email services
- Processing: Resume parsing, job matching, application form submission logic
- Does NOT: Handle UI rendering, store browser extension code, manage extension permissions

### Next.js Dashboard
**Responsibility**: User management, analytics, configuration, resume management
- Admin panel: View application history, success metrics, patterns
- Resume management: Upload, edit, store multiple resume versions
- Job preferences: Set automation rules, select job boards, filtering criteria
- Application analytics: Success rates, job board performance, trends
- Settings: Pause/resume, configure credentials, manage OAuth
- Does NOT: Handle job detection, control extension behavior in real-time

### PostgreSQL Database
**Responsibility**: Single source of truth for all application data
- User accounts and OAuth tokens
- Resume versions and metadata
- Job postings and candidate responses
- Application tracking and status
- Logs and audit trails

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Context                              │
│  ┌──────────────┐         ┌──────────────────┐                 │
│  │   Content    │         │   Service Worker │                 │
│  │   Scripts    ◄────────►│   (Background)   │                 │
│  │              │ chrome  │                  │                 │
│  │ - Detect     │  API    │ - Token Management
│  │ - Extract    │ Messages │ - Fetch Jobs    │                 │
│  │ - Monitor    │         │ - Process Apps  │                 │
│  └──────────────┘         └─────────┬────────┘                 │
│                                     │                           │
│  ┌──────────────────────────────────▼────────────────┐         │
│  │            Popup / UI                            │         │
│  │  - Settings                                       │         │
│  │  - Status Display                                │         │
│  └──────────────────────────────────────────────────┘         │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ (Backend API calls with auth tokens)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend API Server                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Express/Node.js Server                                  │  │
│  │ - /auth/*           (OAuth token exchange, refresh)     │  │
│  │ - /api/jobs/*       (Job scraping, filtering)          │  │
│  │ - /api/applications/* (Application history, status)    │  │
│  │ - /api/resumes/*    (Resume CRUD)                      │  │
│  │ - /api/users/*      (User settings, preferences)       │  │
│  └────────────────────┬────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────────┐
   │PostgreSQL│  │External │  │Email Service│
   │Database  │  │Job APIs │  │(Notifications)
   └─────────┘  └──────────┘  └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Dashboard (Vercel)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ React Components + API Routes                           │  │
│  │ - /dashboard/applications   (Browse history)            │  │
│  │ - /dashboard/resumes        (Manage resumes)            │  │
│  │ - /dashboard/settings       (Config automation)         │  │
│  │ - /dashboard/analytics      (View metrics)              │  │
│  │ - /api/auth/*               (OAuth callback handling)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Flow Patterns:**

1. **Job Detection Flow**:
   - User opens LinkedIn job listing
   - Content script extracts job data
   - Service worker receives message with job details
   - Service worker sends to backend: `/api/jobs/match` with resume ID
   - Backend evaluates job against user preferences
   - Backend responds with decision (apply/skip/hold)
   - Service worker receives decision and either proceeds or pauses

2. **Application Flow**:
   - Service worker receives apply decision
   - Content script fills form fields with data from backend
   - Service worker logs application to database
   - Dashboard updates in real-time via polling or webhooks
   - Email notification sent to user

3. **Resume Sync Flow**:
   - User uploads resume to dashboard
   - Dashboard stores in PostgreSQL and S3/storage service
   - Service worker fetches available resumes via API
   - Service worker caches resume list locally (chrome.storage)
   - Extension uses cached list for offline operation

---

## Chrome Extension MV3 Architecture

### Service Worker (Background Script)
**Role**: The long-running coordinator that persists across browser sessions

```javascript
// Key responsibilities:
- Manage OAuth tokens (store, refresh, validate)
- Listen for messages from content scripts
- Handle alarms/scheduled tasks (job checking intervals)
- Make backend API calls
- Manage chrome.storage data
- Control content script injection based on URL patterns
```

**Critical MV3 Constraints**:
- Service worker can be terminated and restarted by Chrome at any time (no persistent background pages)
- Cannot have a persistent timer - use `chrome.alarms` instead of `setInterval`
- Cannot use XMLHttpRequest - must use `fetch` API
- Cannot access localStorage - must use `chrome.storage`
- Max execution time: 5 minutes for event handlers
- Service worker wakes up only when:
  - Content script sends a message
  - User clicks extension icon
  - An alarm fires
  - An external event triggers (tab update, URL navigation, etc.)

**Service Worker Lifecycle Management**:
```javascript
// On startup/injection
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize storage, set up alarms
    chrome.alarms.create('job-check', { periodInMinutes: 15 });
  }
});

// On alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'job-check') {
    // Resume any paused scanning, check settings
  }
});

// Always assume service worker may be terminated
// Use chrome.storage.local for temporary state
// Use chrome.storage.sync for user preferences
```

### Content Scripts
**Role**: Eyes and hands on the job listing pages

```javascript
// Injected into: *.linkedin.com/*, *.indeed.com/*, etc.

// Responsibilities:
- Detect job listing elements
- Extract job metadata (title, company, salary, description)
- Monitor for user scrolling/navigation
- Fill application forms with data
- Report back to service worker via messages

// Cannot:
- Access extension background pages directly
- Store extension-wide state
- Modify other extensions
- Access chrome:// URLs
```

**Message Pattern**:
```javascript
// Content script → Service Worker
chrome.runtime.sendMessage({
  action: 'jobDetected',
  data: {
    jobId: '123456',
    title: 'Senior Software Engineer',
    company: 'Company XYZ',
    url: 'https://linkedin.com/jobs/view/123456'
  }
}, (response) => {
  if (response.shouldApply) {
    // Fill form and submit
  }
});

// Service Worker → Content Script
chrome.tabs.sendMessage(tabId, {
  action: 'fillForm',
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    resumeData: {...}
  }
});
```

### Popup UI
**Role**: Quick user controls and status display

```javascript
// Popup runs in a restricted context:
- Can access chrome.* APIs
- Can send messages to service worker
- Cannot directly access content scripts
- Cannot access page DOM of active tab
- Maximum complexity: quick settings and status display
```

### Manifest.json Structure
```json
{
  "manifest_version": 3,
  "name": "AutoApply - Job Application Automation",
  "permissions": [
    "storage",
    "alarms",
    "webRequest",
    "scripting",
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "https://linkedin.com/*",
    "https://indeed.com/*",
    "https://glassdoor.com/*",
    "https://your-backend-api.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://linkedin.com/*"],
      "js": ["linkedin-content.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

---

## Auth Flow

### Google OAuth for Chrome Extension

**Phase 1: Extension Launch & Authorization**
```
1. User opens extension popup
2. Extension checks chrome.storage for existing token
3. If no token:
   - Show "Connect with Google" button in popup
   - User clicks button
   - Extension calls chrome.identity.launchWebAuthFlow()
   - Google OAuth consent screen appears (in browser)
   - User grants permissions
   - Extension receives authorization code

4. Extension sends authorization code to backend:
   POST /auth/exchange
   {
     "code": "auth_code_from_google",
     "redirectUrl": "https://[extension-id].chromiumapp.org/"
   }

5. Backend:
   - Exchanges code for access_token + refresh_token
   - Creates or updates user in PostgreSQL
   - Returns session_token (JWT or signed session)
   - Stores refresh_token securely (DB only, never to client)

6. Extension stores in chrome.storage.sync:
   {
     "user": { name, email, userId },
     "session_token": "jwt_token_here",
     "expires_at": timestamp
   }
```

**Phase 2: API Requests with Auth**
```
Content Script/Service Worker makes API call:
GET /api/resumes
Authorization: Bearer {session_token}

Backend validates session_token:
- Check signature
- Check expiration
- Look up user in PostgreSQL
- Return data

If token expired:
POST /auth/refresh
{
  "userId": "123",
  "sessionToken": "expired_token"
}

Backend:
- Uses stored refresh_token to get new access_token
- Returns new session_token
- Extension updates chrome.storage
```

**Phase 3: Dashboard Sign-In (Next.js)**
```
User visits https://autoapply.vercel.app/login

Next.js OAuth route handler:
1. Generates state parameter + code_verifier (PKCE)
2. Redirects to Google OAuth with state
3. Google redirects back to /api/auth/callback?code=...&state=...
4. Backend verifies state, exchanges code
5. Creates session cookie (httpOnly, secure, sameSite)
6. Redirects to dashboard

Dashboard now authenticated via secure cookie
All API calls to backend include cookie
```

**Key Security Patterns:**
- Extension stores tokens in `chrome.storage.sync` (encrypted by Chrome browser)
- Backend NEVER returns refresh_token to extension
- Backend validates all requests against database user record
- Dashboard uses httpOnly cookies (cannot be stolen by XSS)
- Extension uses PKCE for OAuth (protection against token interception)

---

## Database Schema Patterns

### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Sessions table (for extension + dashboard)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token_hash VARCHAR(500),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_type VARCHAR(50), -- 'extension' or 'dashboard'
  user_agent TEXT
);

-- Resumes table
CREATE TABLE resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_storage_key VARCHAR(500), -- S3 key or similar
  raw_text TEXT, -- extracted text from PDF
  parsed_skills TEXT[], -- array of skills
  contact_info JSONB, -- email, phone, linkedin, etc
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, filename)
);

-- Job boards / Integrations
CREATE TABLE job_boards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_name VARCHAR(100), -- 'linkedin', 'indeed', 'glassdoor'
  is_enabled BOOLEAN DEFAULT true,
  auth_token TEXT, -- encrypted token for board API
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, board_name)
);

-- Job postings table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(500), -- job board's ID
  board_name VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  currency VARCHAR(10),
  job_url TEXT UNIQUE NOT NULL,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  posted_at TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,

  -- ML/Matching fields
  extracted_skills TEXT[],
  experience_level VARCHAR(50),
  employment_type VARCHAR(50),

  INDEX (board_name, posted_at),
  INDEX (company),
  UNIQUE(board_name, external_id)
);

-- Application tracking
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  resume_id INTEGER NOT NULL REFERENCES resumes(id),

  application_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50), -- 'applied', 'rejected', 'interview', 'offer', 'withdrawn'
  status_updated_at TIMESTAMP,

  -- How the application was made
  application_method VARCHAR(50), -- 'automated', 'manual'
  form_fields_used JSONB, -- which fields were filled

  -- Tracking
  user_notes TEXT,
  rating INTEGER, -- user can rate the opportunity (1-5)
  is_starred BOOLEAN DEFAULT false,

  -- Follow-up
  follow_up_at DATE,
  follow_up_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX (user_id, application_timestamp),
  UNIQUE (user_id, job_id, resume_id)
);

-- User preferences & automation rules
CREATE TABLE automation_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Filtering
  min_salary INTEGER,
  max_salary INTEGER,
  location_keywords TEXT[],
  excluded_companies TEXT[],
  required_keywords TEXT[],
  rejected_keywords TEXT[],

  -- Automation behavior
  auto_apply BOOLEAN DEFAULT true,
  require_confirmation BOOLEAN DEFAULT false,
  only_easy_apply BOOLEAN DEFAULT false,

  -- Board selection
  enabled_boards TEXT[], -- array of board names

  -- Timing
  check_interval_minutes INTEGER DEFAULT 15,
  max_applications_per_day INTEGER DEFAULT 10,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application logs (for debugging and analytics)
CREATE TABLE application_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  application_id INTEGER REFERENCES applications(id),

  event_type VARCHAR(100), -- 'job_detected', 'form_filled', 'submitted', 'error'
  message TEXT,
  error_details JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX (user_id, created_at),
  INDEX (application_id)
);

-- Extension sync state (tracks what the extension has processed)
CREATE TABLE extension_sync_state (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  last_job_check TIMESTAMP,
  last_board_sync TIMESTAMP,
  extension_version VARCHAR(50),
  is_enabled BOOLEAN DEFAULT true,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id)
);
```

### Database Indexing Strategy
```sql
-- Speed up common queries
CREATE INDEX idx_applications_user_date ON applications(user_id, application_timestamp DESC);
CREATE INDEX idx_jobs_board_posted ON jobs(board_name, posted_at DESC);
CREATE INDEX idx_applications_status ON applications(user_id, status);
CREATE INDEX idx_job_url_lookup ON jobs(job_url);

-- For analytics
CREATE INDEX idx_applications_user_month ON applications(user_id, DATE_TRUNC('month', application_timestamp));
```

---

## Build Order

**Phase 1: Foundation (Weeks 1-2)**
Priority: Backend infrastructure and core APIs

1. **Backend Setup** (Node.js/Express)
   - Set up Express server with TypeScript
   - Configure PostgreSQL connection pool
   - Implement database migrations (Knex/Prisma)
   - Create /auth endpoints for OAuth exchange
   - Set up environment configuration and secrets management

2. **Database Schema**
   - Create all core tables (users, sessions, resumes, jobs, applications)
   - Set up indexes and relationships
   - Create migration scripts

3. **User Management API**
   - POST /auth/exchange (OAuth code → session)
   - POST /auth/refresh (refresh token)
   - GET /api/users/me (get current user)
   - POST /api/users/preferences (save automation rules)

4. **Resume API**
   - POST /api/resumes (upload and parse)
   - GET /api/resumes (list user resumes)
   - GET /api/resumes/:id (fetch specific resume)
   - DELETE /api/resumes/:id

**Phase 2: Extension Core (Weeks 3-4)**
Priority: Functional extension that can communicate with backend

1. **Service Worker**
   - OAuth token management (acquire, store, refresh)
   - Message routing to content scripts
   - Backend API client with auth headers
   - Chrome alarms for periodic job checking
   - Basic error handling and logging

2. **Content Scripts**
   - LinkedIn job detection and extraction
   - Form filling logic (name, email, resume selection)
   - User interaction detection (scrolling, clicking "Easy Apply")
   - Error handling for malformed pages

3. **Popup UI**
   - Sign-in button (trigger OAuth flow)
   - Extension status display
   - Basic pause/resume toggle
   - Recent applications list

4. **Extension Manifest**
   - Set up permissions (minimal, based on needs)
   - Configure OAuth configuration
   - Set up content script injection rules

**Phase 3: Dashboard (Weeks 5-6)**
Priority: Management interface for users

1. **Next.js Setup**
   - Configure Vercel deployment
   - Set up API routes for OAuth callback handling
   - Implement session middleware (httpOnly cookies)
   - Set up database client

2. **Dashboard Pages**
   - /login (Google OAuth sign-in)
   - /dashboard/applications (table of applications with filters)
   - /dashboard/resumes (upload and manage)
   - /dashboard/settings (automation rules configuration)

3. **Dashboard API Routes**
   - /api/auth/callback (OAuth callback)
   - /api/applications (fetch user applications)
   - /api/analytics (get metrics and statistics)

**Phase 4: Integration & Polish (Weeks 7-8)**
Priority: Making all pieces work together smoothly

1. **Real-time Updates**
   - Set up job scraping pipeline (cron job on backend)
   - Implement WebSocket or polling for dashboard updates
   - Set up email notifications

2. **Analytics**
   - Application success rate tracking
   - Job board performance metrics
   - Time-to-response metrics

3. **Error Handling & Monitoring**
   - Centralized logging (Sentry or similar)
   - Error alerts for failed applications
   - User-facing error messages

4. **Testing**
   - Unit tests for API endpoints
   - Integration tests for extension messaging
   - E2E tests for critical user flows

### Dependency Tree

```
┌─────────────────────────────────────────┐
│ Database (PostgreSQL)                   │
│ - Schema migrations                     │
│ - Connection pooling                    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Backend API (Node.js/Express)           │
│ - OAuth endpoints                       │
│ - User/Resume/Job APIs                  │
│ - Database access layer                 │
└────────────┬────────────────────────────┘
             │
   ┌─────────┴──────────┬──────────────┐
   │                    │              │
┌──▼──────────────────┐ │   ┌──────────▼────────────┐
│ Chrome Extension    │ │   │ Next.js Dashboard    │
│ - Service Worker    │ │   │ - Admin UI           │
│ - Content Scripts   │ │   │ - Settings           │
│ - Popup            │ │   │ - Analytics          │
└────────────────────┘ │   └─────────────────────┘
                       │
                ┌──────▼────────┐
                │ Job Scraper   │
                │ (Cron backend)│
                └───────────────┘
```

### Critical Path

**Minimum Viable Product (MVP) Timeline:**
- **Week 1**: Database + basic backend auth (can demo sign-in)
- **Week 2**: Service worker + content script on LinkedIn (can detect jobs)
- **Week 3**: Resume upload + form filling (can submit applications)
- **Week 4**: Dashboard basic UI (can view applications)

Do NOT implement:
- Email notifications
- Analytics dashboard
- Multiple job board support
- Advanced matching algorithms
- Rate limiting / quota management

Implement only:
- Single job board (LinkedIn or Indeed)
- Basic OAuth flow
- Resume upload and parsing
- Job detection and form filling
- Application history tracking

---

## Security Considerations

### Extension Security
- All sensitive data (auth tokens) stored in `chrome.storage.sync` (Chrome handles encryption)
- Never log auth tokens or user PII to console
- Use CSP (Content Security Policy) in manifest to prevent inline scripts
- Validate all messages from content scripts before processing
- Use chrome.runtime.id to verify requests

### Backend Security
- All API endpoints require valid session token
- Refresh tokens stored hashed in database, never transmitted to client
- Use HTTPS only (enforced in production)
- Implement rate limiting on auth endpoints
- Database queries use parameterized statements (prevent SQL injection)
- File uploads validated (file type, size, virus scan if applicable)

### Dashboard Security
- Session cookies: httpOnly, secure, sameSite
- CSRF protection on state-changing endpoints
- Sanitize all user inputs before display
- Implement automatic session timeout

---

## Deployment Architecture

### Development
```
localhost:3000 (Dashboard)
localhost:5000 (Backend API)
localhost:5432 (PostgreSQL)
Extension loaded unpacked in Chrome
```

### Production
```
Frontend: Next.js Dashboard on Vercel
  - Automatic deployments from GitHub
  - Serverless functions for API routes
  - Edge functions for auth

Backend: Node.js on Railway/Fly.io/DigitalOcean
  - Docker container
  - PM2 for process management
  - Environment variables from secret manager

Database: PostgreSQL on Render/Heroku
  - Managed backups
  - SSL connections enforced
  - Connection pooling (pgBouncer)

Extension: Chrome Web Store
  - Distributed to users
  - Automatic updates every few hours
  - Backward compatibility maintained
```

---

## Key Technical Decisions

1. **Why Service Worker instead of persistent background page?**
   - MV3 requirement
   - More secure (browser can terminate at any time)
   - Better resource efficiency
   - No localStorage, must use chrome.storage

2. **Why multiple resume versions?**
   - Different job types may need different resumes
   - Easy A/B testing of resume performance
   - Users can optimize for specific industries

3. **Why OAuth instead of username/password?**
   - No password storage/hashing complexity
   - Better security (delegated to Google)
   - Familiar to users
   - PKCE support for native apps

4. **Why PostgreSQL?**
   - Relational data structure fits perfectly
   - Advanced features (arrays, JSONB for flexibility)
   - ACID compliance for application transactions
   - Excellent indexing for reporting queries

5. **Why Next.js for dashboard?**
   - Full-stack JavaScript
   - API routes simplify backend integration
   - Vercel deployment simplicity
   - Built-in SEO if needed for marketing site

6. **Why not use extension service worker for all logic?**
   - Service workers can be terminated unexpectedly
   - Backend provides reliable, persistent processing
   - Enables API access from dashboard independently
   - Better separation of concerns

---

## Summary Table

| Component | Technology | Primary Role | Constraints |
|-----------|-----------|--------------|-------------|
| Extension | Chrome MV3 | User interaction, job detection | Service worker terminated anytime |
| Service Worker | JavaScript | Token mgmt, message routing | 5-min execution timeout, must use chrome.storage |
| Content Script | JavaScript | Page scraping, form filling | No direct background access, site-specific |
| Backend API | Node.js/Express | Business logic, persistence | HTTPS only, rate limited |
| Dashboard | Next.js + React | Admin UI, analytics | Served on Vercel, httpOnly cookies |
| Database | PostgreSQL | Single source of truth | Proper indexing required, backup strategy |
