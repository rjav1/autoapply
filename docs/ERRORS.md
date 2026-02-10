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
