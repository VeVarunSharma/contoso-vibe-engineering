# Accessibility Audit (Issue #414)

Static audit of the shared shell (root layout and site header) in each app, against the project design standards: semantic HTML, visible focus indicators, 44x44px touch targets, and screen-reader support.

## Summary

| App | Critical | Serious | Moderate | Status |
| --- | --- | --- | --- | --- |
| octocat-support-app | 0 | 0 | 0 | Reference pattern, no changes |
| octocat-blog-app | 1 | 3 | 2 | Remediated |
| contoso-web-app | 1 | 3 | 1 | Remediated |

## octocat-support-app

Used as the reference pattern: skip link, `min-h-11` logo link, `size-11` icon buttons, labelled icon buttons, `aria-hidden` decorative icons, `outline-offset-4 focus-visible:outline-2`. No changes needed.

## octocat-blog-app

| Priority | Finding | Remediation |
| --- | --- | --- |
| Critical | No skip link to bypass the header navigation | Added skip link in `app/layout.tsx` targeting `#main-content` |
| Serious | Content target is not focusable, so the skip link does not move focus | `<main id="main-content" tabIndex={-1}>` |
| Serious | Nav links and icon buttons below 44px touch target | `min-h-11` on links, `size-11` on buttons |
| Serious | Mobile menu toggle lacks expanded state | Added `aria-expanded` and `aria-controls="mobile-nav"` |
| Moderate | Theme toggle used `theme` (can be "system"), giving wrong toggle state | Use `resolvedTheme` |
| Moderate | Unlabelled nav landmarks, decorative icons exposed | `aria-label` on navs, `aria-hidden` on icons, visible focus outlines |

## contoso-web-app

| Priority | Finding | Remediation |
| --- | --- | --- |
| Critical | No skip link to bypass the header navigation | Added skip link in `app/layout.tsx` targeting `#main-content` |
| Serious | Skip target missing and not focusable | Wrapper `<div id="main-content" tabIndex={-1}>` (not `<main>`, because `not-found`, `error` and `loading` pages render their own `<main>`) |
| Serious | Nav links and GitHub button below 44px touch target | `min-h-11` |
| Serious | Two unlabelled nav landmarks, icon-only logo link without name on small screens | Nav labels "Main" and "Account", logo `aria-label`, external link announces new tab |
| Moderate | No visible focus indicators on header links | `outline-offset-4 focus-visible:outline-2` |

## Follow-ups (not done)

- Colour contrast and screen-reader testing need a browser; this audit was static.
- An automated check (for example jest-axe or axe in CI) is optional and not added here.
