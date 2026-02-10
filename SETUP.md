# AutoApply Extension - Setup Guide

## Quick Setup (5 minutes)

### 1. Clone the repo
```bash
git clone https://github.com/rjav1/autoapply
cd autoapply
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Build the extension
```bash
cd apps/extension
pnpm build
```

### 4. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the folder: `apps/extension/build/chrome-mv3-prod`

### 5. Test on Workday

1. Go to any Workday careers site, e.g.:
   - https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite
   - https://adobe.wd5.myworkdayjobs.com/adobe_global
   - https://salesforce.wd12.myworkdayjobs.com/External_Career_Site
2. Click on a job posting
3. Click the **AutoApply** extension icon in toolbar
4. You should see detection status (e.g., "Workday job listing")

---

## What's Built

### Extension (`apps/extension/`)
- **popup.tsx** — Status UI with enable toggle
- **background.ts** — Tab state tracking
- **contents/workday.ts** — Content script with SPA detection
- **modules/workday.ts** — Field mappings (12+ selectors)
- **lib/detection.ts** — URL + DOM detection
- **lib/evasion.ts** — Human-like input simulation
- **lib/field-matcher.ts** — Smart field matching (5 strategies)

### Dashboard (`apps/dashboard/`)
- Next.js 15 + Tailwind
- Prisma schema (User, Profile, Resume, Application)
- Auth scaffolding (Google OAuth - not yet configured)

---

## Build Output

After `pnpm build`, the extension is at:
```
apps/extension/build/chrome-mv3-prod/
├── manifest.json
├── popup.html
├── popup.*.js
├── workday.*.js (content script)
├── static/background/index.js
└── icon*.png
```

---

## Tested Workday Sites

| Site | URL Pattern | Status |
|------|-------------|--------|
| NVIDIA | nvidia.wd5.myworkdayjobs.com | ✅ |
| Adobe | adobe.wd5.myworkdayjobs.com | ✅ |
| Salesforce | salesforce.wd12.myworkdayjobs.com | ✅ |

All use consistent `data-automation-id` selectors.
