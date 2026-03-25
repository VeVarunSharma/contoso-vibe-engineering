---
name: check-ux-spec-alignment
description: Quick UX spec alignment check for frontend changes
---

## Task

Compare the provided frontend implementation files against the UX specification at `docs/ux-spec.md`.

## Steps

1. Read the UX specification document
2. Read the changed frontend files
3. For each spec requirement, check if the implementation satisfies it
4. Classify the overall result as PASS, WARN, or FAIL
5. List any mismatches with specific file and line references

## Classification

- **PASS** — Implementation matches the spec. All fields, states, validations, consent, CTAs, and accessibility present.
- **WARN** — Mostly aligned. Minor wording drift, one missing non-critical state, or suggested accessibility improvement.
- **FAIL** — Significant divergence. Missing required field, missing consent, unauthorized data collection, missing error state, or removed accessibility semantics.

## Output

Provide a brief report with:
- Overall status (PASS / WARN / FAIL)
- Confidence percentage
- List of findings with severity, description, and file reference
- Remediation suggestions for any WARN or FAIL items
