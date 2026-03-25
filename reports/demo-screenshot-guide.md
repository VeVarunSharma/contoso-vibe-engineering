# 📸 Demo Screenshot Guide

> Top screenshots for the "Non-Deterministic CI Gates" presentation.
> Each screenshot tells a specific part of the story.

---

## Slide 1: "The Source of Truth"

**File:** `docs/ux-spec.md`
**What to capture:** The top ~40 lines showing the product overview, page structure wireframe, and required fields table.
**Why it works:** Immediately establishes that there's a formal, human-readable spec — not test assertions or Figma pixels. The audience sees: "This is what was *intended*."
**Framing:** "Every feature starts with a design spec. But how do you ensure the implementation stays true to the intent?"

---

## Slide 2: "The AI Agent"

**File:** `.github/agents/ux-design-review.agent.md`
**What to capture:** The Role section + Evaluation Criteria (8 dimensions) + Classification Rules (PASS/WARN/FAIL). Aim for the first ~85 lines.
**Why it works:** Shows the audience a structured prompt that *reasons* about UX intent — not a regex, not a test, not a pixel diff. This is the "non-deterministic" moment.
**Framing:** "Instead of writing brittle tests for every design decision, we give an AI agent the spec and ask: does this implementation match the intent?"

---

## Slide 3: "The CI Pipeline"

**File:** `.github/workflows/ux-design-alignment.yml`
**What to capture:** The full workflow file. Focus on the job name "UX Design Alignment Review", the agent invocation step, and the gate decision step.
**Why it works:** Shows this is a real GitHub Actions workflow — it triggers on PRs, runs the agent, posts comments, and blocks on FAIL. It's production-grade CI/CD, not a toy.
**Framing:** "This runs automatically on every pull request. No human has to remember to check the spec."

---

## Slide 4: "PASS — Aligned with Spec" ✅

**File:** `reports/examples/ux-alignment-report-pass.md`
**What to capture:** The entire report — it should fit in one screenshot since it's concise.
**Why it works:** Clean, fast, confident. The audience sees 7/7 checks passed, 96% confidence, "No action required." This is what good looks like.
**Framing:** "When the implementation matches the spec, the gate passes cleanly. Ship it."

---

## Slide 5: "FAIL — Design Drift Detected" ❌

**File:** `reports/examples/ux-alignment-report-fail.md`
**What to capture:** The full report. Emphasize the 9-row findings table, the "Why This Matters" section, and the remediation priorities.
**Why it works:** This is the money slide. The audience sees: consent removed, unauthorized data collected, accessibility degraded — things no linter would catch. The "Why This Matters" callout explicitly says: "No test failed. No linter flagged a warning. The code compiles and renders. But the UX has materially changed."
**Framing:** "This is what falls through the cracks in traditional CI/CD. The code works. The tests pass. But the user experience has drifted from what was approved."

---

## Bonus Screenshots

### Bonus A: "Figma-Aware Design Drift"
**File:** `reports/examples/figma-alignment-report.md`
**Framing:** "The same concept works with Figma as the source of truth — via MCP or design contract export."

### Bonus B: "The Contrast" (side-by-side)
**Files:** PASS report on left, FAIL report on right
**Framing:** "Same CI gate, same spec, different implementation. One passes, one fails."

### Bonus C: "The UX Spec Summary"
**File:** `docs/ux-spec-summary.md`
**Framing:** Quick reference showing the checklist format — useful for audience who wants to understand the spec at a glance.

---

## Presentation Tips

- Use **dark mode** in your editor/terminal for better contrast in screenshots
- Crop screenshots to show just the relevant content — no browser chrome
- For the FAIL report, highlight or annotate the "Why This Matters" section
- If showing live, use `demo/ux-aligned-pass` and `demo/ux-drift-fail` branches
- The strongest single slide is **Slide 5** (FAIL report) — lead with impact
