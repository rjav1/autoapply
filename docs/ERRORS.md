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

## Testing Notes

### Real Workday Testing (NVIDIA careers site)

**URL Tested:** `nvidia.wd5.myworkdayjobs.com`

**Application Flow:**
1. Job listing page → Click "Apply" → Modal with options
2. Modal: "Autofill with Resume", "Apply Manually", "Use My Last Application", "Apply With LinkedIn"
3. Apply Manually → Sign In page (step 1/7)
4. Sign In page: Google OAuth or Email/Password
5. Create Account option: Email, Password, Verify Password, "I agree" checkbox

**Actual `data-automation-id` values found:**

Login/Account:
- `signInContent` - sign in section wrapper
- `GoogleSignInButton` - Google OAuth button
- `SignInWithEmailButton` - email sign in button
- `email` - email input (type="text")
- `password` - password input
- `verifyPassword` - confirm password
- `signInSubmitButton` - submit button
- `createAccountLink` - create account button
- `createAccountCheckbox` - terms checkbox
- `forgotPasswordLink` - forgot password

**⚠️ CRITICAL: Honeypot Detection**
- `beecatcher` - hidden honeypot field, input name="website"
- NEVER fill fields with these automation IDs!

Navigation:
- `progressBar` - application progress indicator (step X of Y)
- `backToJobPosting` - back button
- `jobTitleHeading` - job title display

Page Structure:
- `header`, `headerTitle`, `navigationContainer`
- `footerContainer`, `followUs`, `socialIcon`

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

---

## Lessons Learned

*(Add insights here as development progresses)*
