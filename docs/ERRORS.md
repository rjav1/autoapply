# Error Tracking Document

**Purpose:** Document all errors encountered during development with cause and fix.
Check this file BEFORE implementing similar patterns.

---

## How to Use

When you encounter ANY error:
1. Document it here with cause + fix
2. Check this file before implementing similar patterns
3. Never repeat the same mistake twice

---

## Errors Log

### 2026-02-10

| Error | Cause | Fix | Files |
|-------|-------|-----|-------|
| (none yet) | - | - | - |

---

## 🧪 COMPREHENSIVE WORKDAY SELECTOR TESTING (2026-02-10)

**Sites Tested:**
1. NVIDIA - `nvidia.wd5.myworkdayjobs.com`
2. Adobe - `adobe.wd5.myworkdayjobs.com`  
3. Salesforce - `salesforce.wd12.myworkdayjobs.com`

### ✅ CONSISTENT SELECTORS (Work across ALL sites)

#### Job Listing Page
| Automation ID | Element | Description |
|--------------|---------|-------------|
| `jobPostingPage` | DIV | Main job detail wrapper |
| `jobPostingHeader` | H2 | Job title heading |
| `adventureButton` | A | **Apply button** (NOT `applyButton`!) |
| `job-posting-details` | DIV | Job details container |
| `locations` | DIV | Location info |
| `time` | DIV | Job type (Full time etc) |
| `postedOn` | DIV | Posted date |
| `requisitionId` | DIV | Job requisition ID |
| `jobPostingDescription` | DIV | Job description |
| `jobSidebar` | DIV | Sidebar wrapper |

#### Apply Modal
| Automation ID | Element | Description |
|--------------|---------|-------------|
| `closeButton` | BUTTON | Close modal X |
| `wd-popup-content` | DIV | Modal content wrapper |
| `autofillWithResume` | A | Autofill option |
| `applyManually` | A | Manual apply option |
| `useMyLastApplication` | A | Reuse previous app |
| `applyWithLinkedIn` | IFRAME | LinkedIn apply (optional - not on Salesforce) |

#### Sign In / Create Account Page
| Automation ID | Element | Description |
|--------------|---------|-------------|
| `signInContent` | DIV | Sign in section |
| `signInFormo` | FORM | Form wrapper (note: typo is intentional in Workday) |
| `formField-email` | DIV | Email field container |
| `email` | INPUT | Email input |
| `formField-password` | DIV | Password field container |
| `password` | INPUT | Password input |
| `formField-verifyPassword` | DIV | Confirm password container |
| `verifyPassword` | INPUT | Confirm password input |
| `createAccountCheckbox` | INPUT | Terms checkbox |
| `forgotPasswordLink` | BUTTON | Forgot password |
| `progressBar` | OL | Application progress (step X of Y) |
| `progressBarActiveStep` | LI | Current step |
| `progressBarInactiveStep` | LI | Other steps |

#### Navigation
| Automation ID | Element | Description |
|--------------|---------|-------------|
| `applyFlowPage` | DIV | Application flow wrapper |
| `backToJobPosting` | BUTTON | Back to job |
| `jobTitleHeading` | H3 | Job title in apply flow |

### ⚠️ SITE-SPECIFIC VARIATIONS

| Automation ID | NVIDIA | Adobe | Salesforce |
|--------------|--------|-------|------------|
| `GoogleSignInButton` | ✅ | ✅ | ❌ |
| `SignInWithEmailButton` | ✅ | ✅ | ❌ |
| `signInSubmitButton` | ✅ (sign in) | ✅ | ❌ |
| `createAccountSubmitButton` | ❌ | ❌ | ✅ (default) |
| `createAccountLink` | ✅ | ✅ | ❌ |
| `signInLink` | ❌ | ❌ | ✅ |
| `remoteType` | ❌ | ❌ | ✅ |
| `similarJobsCard` | ❌ | ❌ | ✅ |

**Key Difference:** NVIDIA/Adobe default to "Sign In" mode; Salesforce defaults to "Create Account" mode.

### 🚨 CRITICAL: HONEYPOT DETECTION

**ALL sites have the same honeypot:**
```
data-automation-id="beecatcher"
name="website"
```

This is a hidden field designed to catch bots. **NEVER FILL THIS FIELD!**

Our workday.ts already correctly handles this in `honeypotSelectors`:
```typescript
honeypotSelectors: [
  '[data-automation-id="beecatcher"]',
  'input[name="website"]'
]
```

### 🔧 MODULE UPDATES NEEDED

1. **Update `applyButton` selector:**
   - Current: `'button[data-automation-id="applyButton"]'`
   - Should be: `'[data-automation-id="adventureButton"]'` (it's an `<a>` tag, not `<button>`!)

2. **Add site-specific sign-in detection:**
   - Check for both `signInSubmitButton` and `createAccountSubmitButton`
   - Some sites show create account first, others show sign in first

3. **Add remote type detection:**
   - `[data-automation-id="remoteType"]` - present on some sites

---

## Application Flow Analysis

### Standard Flow (all sites)
```
1. Job Search Page → Job Listing Page
2. Click Apply (adventureButton) → Apply Modal
3. Choose: Autofill/Manual/LastApp/LinkedIn
4. Apply Manually → Sign In or Create Account
5. Progress through 6-7 steps
6. Submit
```

### URL Patterns Confirmed
- Listing: `/en-US/{site}/job/{location}/{title}_{reqId}`
- Apply: `/en-US/{site}/job/{location}/{title}_{reqId}/apply/applyManually`
- Job search: `/en-US/{site}` (sometimes `External_Career_Site`, sometimes custom name)

### Domain Patterns
- `{company}.wd{N}.myworkdayjobs.com` where N = 1, 5, 12, etc.
- All use same underlying Workday platform with consistent selectors

---

## Common Patterns to Avoid

### TypeScript

1. **Implicit any** - Always define types explicitly
2. **Optional chaining without null check** - Use `?.` but handle undefined case

### Plasmo/Extension

1. **Content script import paths** - Use `~` alias for root imports
2. **Chrome API in content scripts** - Some APIs only work in background

### Workday Specific

1. **React controlled inputs** - Must dispatch `input`, `change`, AND `blur` events
2. **Custom dropdowns** - Not standard `<select>`, need to click and search options
3. **SPA navigation** - URL changes without full page reload
4. **Apply button is `<a>` tag** - Not `<button>`, use `[data-automation-id="adventureButton"]`
5. **Form ID has typo** - `signInFormo` not `signInForm`

---

## Lessons Learned

### 2026-02-10 - Cross-site Testing
- Workday selectors are highly consistent across companies
- The `adventureButton` ID is used for Apply, NOT `applyButton`
- Honeypot `beecatcher` present on all tested sites
- Sign-in vs Create Account default varies by company config
- LinkedIn apply is optional (company configurable)
