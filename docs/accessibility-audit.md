# Accessibility audit

_Audit date: 2026-11-18_

## Scope and method

- Reviewed all routes and shared interactive components in `contoso-web-app`, `octocat-blog-app`, and `octocat-support-app`.
- Ran automated `axe` checks through `jest-axe` against each app's primary interactive surface.
- Manually reviewed landmarks, headings, accessible names, keyboard focus, mobile navigation, and 44×44 pixel targets.
- Severity order: critical, serious, moderate, low. Axe checks in Jest do not replace a browser audit of database-backed and live published content.

## Prioritized findings

### Contoso web app

| Priority | Finding                                                                                               | Status                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Serious  | Page content had no main landmark or skip link.                                                       | Fixed with one focusable `<main id="main-content">` and a keyboard-visible skip link. |
| Serious  | “Get Started” and “Learn More” were inert buttons.                                                    | Replaced with links to the mission and team sections.                                 |
| Moderate | Header links and the legacy demo control did not guarantee 44px touch targets or local focus styling. | Fixed; shared buttons also now use a 44px minimum.                                    |
| Moderate | Decorative product and team icons could add noise to the accessibility tree.                          | Marked decorative icons `aria-hidden`.                                                |
| Low      | Route error and loading boundaries could introduce nested main landmarks.                             | Replaced route-local main elements with labeled sections or neutral containers.       |

### Octocat blog app

| Priority | Finding                                                                                                    | Status                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Serious  | The mobile menu button did not expose expanded state or its controlled navigation.                         | Added `aria-expanded`, `aria-controls`, and a named mobile navigation landmark. |
| Serious  | The app had no skip link, and primary/mobile navigation landmarks were unnamed.                            | Fixed; the skip link targets the focusable main landmark.                       |
| Moderate | The mobile logo could lose its accessible name when its text is hidden.                                    | Added a stable accessible label and hid the decorative logo icon.               |
| Moderate | Navigation, footer, filter, badge, author, and sharing controls did not consistently provide 44px targets. | Fixed on shared navigation and the reviewed content surfaces.                   |
| Moderate | The author section skipped from a page-level `<h1>` to `<h3>`.                                             | Changed “About the Author” to `<h2>`.                                           |
| Low      | Decorative action icons were not consistently hidden.                                                      | Fixed in the audited header, hero, footer, badges, and author card.             |

### Octocat support app

| Priority | Finding                                                                  | Status                                                                                                         |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Serious  | The skip link scrolled to main content but the target was not focusable. | Added `tabIndex={-1}` and an end-to-end focus assertion.                                                       |
| Moderate | The intake workflow needed a repeatable semantic audit.                  | Added a `jest-axe` audit covering labels, form structure, and accessible status content.                       |
| Low      | Shared controls used 36–40px defaults.                                   | Shared buttons now meet the 44px minimum; form controls and the publishing confirmation retain 44px hit areas. |

## Automated checks

- Contoso header: axe smoke audit plus skip-link and actionable CTA assertions.
- Blog header: axe smoke audit plus mobile menu state and navigation assertions.
- Support intake: axe audit of the full form plus existing keyboard, validation-focus, and status assertions.
- Support Playwright flow: verifies skip-link keyboard focus.

## Remaining manual checks

1. Run a browser-based axe/Lighthouse pass against deployed builds with representative blog database records.
2. Verify contrast for administrator-supplied category colors in production data.
3. Recheck keyboard order and visible focus at 200% zoom and on touch devices after visual design changes.
