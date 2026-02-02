# Issue Body Templates

Use these templates based on the ticket category when structuring GitHub issue bodies.

---

## Bug Report Template

```markdown
## Description

[Clear 1-2 sentence summary of the bug]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Environment

- Browser/Client: [if applicable]
- OS: [if applicable]
- Version: [if applicable]

## Reporter

- **Name:** [reporter name]
- **Email:** [reporter email]

## Additional Context

[Screenshots, logs, error messages, or any extra info from the description]
```

### Bug Report Guidelines

- Extract reproduction steps from narrative descriptions
- If no clear steps are provided, add `needs-reproduction` label and note: "Reproduction steps need clarification from the reporter."
- Always separate expected vs actual behavior, even if the user didn't
- Infer environment details when possible from context clues

---

## Feature Request Template

```markdown
## Summary

[Clear description of the requested feature]

## Motivation

[Why this feature is needed — infer from user's description and context]

## Proposed Solution

[Suggested approach based on user input; if vague, provide a reasonable suggestion]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Alternatives Considered

[Any alternatives mentioned by the user, or "None specified"]

## Reporter

- **Name:** [reporter name]
- **Email:** [reporter email]

## Additional Context

[Any extra info, mockups, or references]
```

### Feature Request Guidelines

- Translate user wants into concrete acceptance criteria (3-5 checkboxes)
- The motivation section should articulate the "why" even if the user didn't explicitly state it
- Propose at least a high-level solution direction
- Add `breaking-change` label if the feature would modify existing behavior

---

## Question Template

```markdown
## Summary

[Clear description of the question or concern]

## Details

[Full context from the user, restructured for clarity]

## Reporter

- **Name:** [reporter name]
- **Email:** [reporter email]

## Expected Outcome

[What the reporter is hoping to learn or achieve]

## Related Resources

[Link to relevant docs, issues, or discussions if applicable]
```

### Question Guidelines

- Restructure the question for clarity
- If the question can be answered with existing documentation, add a link suggestion
- Add `documentation` label if the question reveals a documentation gap

---

## Documentation Template

```markdown
## Summary

[What documentation needs to be created or updated]

## Current State

[What exists today, if anything]

## Proposed Changes

[What should be added, updated, or removed]

## Reporter

- **Name:** [reporter name]
- **Email:** [reporter email]

## Additional Context

[Why this documentation change is needed]
```

---

## Security Concern Template

```markdown
## Summary

[Brief description of the security concern — keep sensitive details minimal]

## Details

[Relevant context without exposing sensitive information publicly]

## Severity Assessment

[Estimated severity: Low / Medium / High / Critical]

## Reporter

- **Name:** [reporter name]
- **Email:** [reporter email]

## Recommended Next Steps

- [ ] Investigate the reported concern
- [ ] Assess impact and affected systems
- [ ] Determine if a private security advisory is needed
```

### Security Guidelines

- **NEVER** include sensitive details like credentials, tokens, or PII in the issue body
- If the report contains sensitive information, redact it and add a note to follow up privately
- Always add the `security` label
- For critical security issues, also add `priority:critical`
- Consider suggesting the reporter use GitHub's private vulnerability reporting if available
