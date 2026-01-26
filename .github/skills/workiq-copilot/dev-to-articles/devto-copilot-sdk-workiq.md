# When Your CI Knows What Your Team Decided in Yesterday's Meeting

**Building Context-Aware GitHub Actions with the Copilot SDK and Microsoft WorkIQ**

---

## TL;DR for the Busy Dev

- **Problem**: Enterprise devs waste hours on rework because they miss decisions made in meetings they didn't attend
- **Solution**: GitHub Copilot SDK + Microsoft WorkIQ = CI that queries your M365 meetings and fails PRs that violate team agreements
- **Stack**: GitHub Actions + `@github/copilot-sdk` npm package + `@microsoft/workiq` via MCP
- **Outcome**: Three-state CI check (PASS/WARN/FAIL) with PR comments linking violations to specific meeting decisions
- **When to use**: Enterprise teams already on M365 who want to enforce institutional knowledge automatically
- **When to skip**: Small teams, async-first orgs, or repos without feature-scoped meetings

**Show me the code**: [Full implementation on GitHub](https://github.com/VeVarunSharma/contoso-vibe-engineering)

---

## The $50,000 Problem Nobody Talks About

Picture this: Your team spends 2 hours in a planning meeting deciding to use PostgreSQL for the new user service. Three developers nod along. Two weeks later, someone opens a PR adding MongoDB.

The code review catches it. Eventually. After 40 hours of development.

This isn't a made-up scenario. According to a 2024 study by Stripe, developers spend **17.3 hours per week** on maintenance tasks, with a significant portion attributed to "undoing work that shouldn't have been done in the first place."

The root cause? **Context fragmentation**.

Your decisions live in:

- Meeting transcripts (Teams/Zoom)
- Email threads
- Slack messages
- Confluence pages
- Someone's head

Your CI/CD pipeline? It only knows about your code.

**What if your CI could attend your meetings?**

---

## Enter the Dynamic Duo: Copilot SDK + WorkIQ

### GitHub Copilot SDK

The [Copilot SDK](https://docs.github.com/copilot/sdk) (`@github/copilot-sdk`) lets you build agentic workflows that leverage GitHub's AI infrastructure. Think of it as programmable Copilot—you define the prompt, the tools, and the outcome.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

// Create a session with MCP servers for tool access
const session = await CopilotClient.createSession({
  token: process.env.COPILOT_GITHUB_TOKEN,
  mcpServers: {
    workiq: {
      command: "npx",
      args: ["-y", "@microsoft/workiq", "mcp"],
    },
  },
});

// Send prompt and wait for response
const response = await session.sendAndWait([
  { role: "system", content: "You are a compliance analyst..." },
  { role: "user", content: "Analyze this PR for meeting compliance" },
]);
```

**What it brings to the table:**

- Structured prompts with MCP tool access
- File system and repository awareness
- Configurable MCP servers for external integrations
- Runs in CI environments with `sendAndWait()` for synchronous responses

### Microsoft WorkIQ

[WorkIQ](https://www.npmjs.com/package/@microsoft/workiq) is Microsoft's natural language interface to your M365 data. It's currently in public preview and supports:

| Data Source | Example Query                                          |
| ----------- | ------------------------------------------------------ |
| Emails      | "What did Sarah say about the deadline?"               |
| Meetings    | "Summarize decisions from yesterday's sprint planning" |
| Documents   | "Find PowerPoints about Q4 roadmap"                    |
| Teams       | "What blockers came up in #engineering today?"         |
| People      | "Who's working on Project Alpha?"                      |

```bash
npm i -g @microsoft/workiq

# Query your M365 data
workiq ask -q "What architectural decisions were made this week?"
```

**What it brings to the table:**

- Natural language queries to M365
- Meeting transcripts and decisions
- Cross-platform context (Teams, Outlook, SharePoint)
- MCP server mode for tool integration

---

## Why Together They're Batman and Robin

Separately, they're powerful. Together, they're transformative.

| Copilot SDK Alone         | WorkIQ Alone              | Combined                                 |
| ------------------------- | ------------------------- | ---------------------------------------- |
| Analyzes code             | Queries meetings          | Validates code against meeting decisions |
| Generates reports         | Summarizes context        | Links violations to specific discussions |
| Runs in CI                | Requires human invocation | Fully automated compliance               |
| No organizational context | No code awareness         | Full-stack intelligence                  |

**The magic**: WorkIQ provides the _institutional memory_. Copilot SDK provides the _reasoning engine_. Together, they close the loop between "what we decided" and "what we built."

---

## Real Implementation: Decision Compliance CI Check

Here's what we built—a GitHub Action that fails PRs violating team agreements.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Pull Request Opened                       │
├──────────────────────────────────────────────────────────────┤
│  1. Extract keywords from branch (feature/user-auth → auth)  │
│  2. CopilotClient.createSession() with WorkIQ MCP server     │
│  3. session.sendAndWait() → WorkIQ queries M365 meetings     │
│  4. Analyze PR diff against those decisions                  │
│  5. Generate structured report (JSON + Markdown)             │
│  6. Post PR comment with findings                            │
│  7. CI outcome: ✅ PASS / ⚠️ WARN / ❌ FAIL                   │
└──────────────────────────────────────────────────────────────┘
```

### The Workflow (Simplified)

```yaml
# .github/workflows/workiq-decision-compliance.yml
name: Meeting Decision Compliance

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  compliance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install and build SDK script
        working-directory: .github/scripts/workiq-decision-compliance
        run: |
          npm ci
          npm run build

      - name: Run Decision Compliance Agent
        working-directory: .github/scripts/workiq-decision-compliance
        env:
          COPILOT_GITHUB_TOKEN: ${{ secrets.COPILOT_GITHUB_TOKEN }}
          WORKIQ_TENANT_ID: ${{ secrets.WORKIQ_TENANT_ID }}
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          CHANGED_FILES: ${{ steps.changed-files.outputs.all_changed_files }}
          LOOKBACK_DAYS: "7"
        run: node dist/index.js
```

### The SDK Script (Key Sections)

```typescript
// src/index.ts - Main entry point
import { CopilotClient } from "@github/copilot-sdk";
import { configSchema } from "./config";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import { parseComplianceResult } from "./types";

async function main() {
  const config = configSchema.parse(process.env);

  // Create session with WorkIQ as MCP server
  const session = await CopilotClient.createSession({
    token: config.COPILOT_GITHUB_TOKEN,
    mcpServers: {
      workiq: {
        command: "npx",
        args: ["-y", "@microsoft/workiq", "mcp", "-t", config.tenantId],
      },
    },
  });

  // Send prompt and wait for structured response
  const response = await session.sendAndWait([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(config) },
  ]);

  // Parse and act on results
  const result = parseComplianceResult(response.text);

  // Exit code based on status
  process.exit(result.status === "FAIL" ? 1 : 0);
}
```

### What Developers See

When a PR is analyzed, they get a comment like:

```
## 📋 Meeting Decision Compliance Report

| Status | Decisions Checked | Violations | Warnings |
|--------|-------------------|------------|----------|
| ⚠️ WARN | 3 | 0 | 1 |

### Decisions Analyzed
1. **2026-01-20 Sprint Planning**: Use Zod for all API validation
2. **2026-01-18 Architecture Review**: REST endpoints use noun-based naming

### Warnings
- **Naming Convention** (2026-01-18): Endpoint `/api/getUsers` uses verb prefix
  - 💡 Recommendation: Rename to `/api/users` for REST consistency

### Compliance Evidence
- ✅ Found Zod schemas in src/validators/
- ✅ Database uses PostgreSQL via Drizzle ORM
```

---

## The Enterprise Impact

For teams already invested in M365, this is a force multiplier:

### Before

```
Developer → Writes code → PR review → "Wait, didn't we decide X?"
→ Rework → Re-review → Merge (3-5 days)
```

### After

```
Developer → Writes code → CI checks decisions → Fix before review
→ PR review → Merge (1-2 days)
```

### ROI Calculation (Conservative)

| Metric                 | Before | After | Savings           |
| ---------------------- | ------ | ----- | ----------------- |
| Rework incidents/month | 8      | 2     | 6 incidents       |
| Hours per incident     | 4      | 0     | 24 hours/month    |
| Developer cost/hour    | $75    | -     | **$1,800/month**  |
| Team of 10 devs        | -      | -     | **$18,000/month** |

And that's just direct rework. The indirect benefits—faster onboarding, preserved institutional knowledge, reduced meeting FOMO—compound over time.

---

## More Use Cases (Beyond Compliance)

Once you have this pipeline, the possibilities expand:

| Use Case                     | WorkIQ Query                               | Copilot SDK Action                |
| ---------------------------- | ------------------------------------------ | --------------------------------- |
| **Sprint Alignment**         | "What's committed for this sprint?"        | Verify PR implements sprint items |
| **Stakeholder Notification** | "Who discussed this feature?"              | Auto-tag relevant people on PR    |
| **ADR Validation**           | "What architecture decisions exist?"       | Check code against ADRs           |
| **Onboarding Context**       | "What decisions led to this code?"         | Generate context for new devs     |
| **Risk Assessment**          | "Were there concerns about this approach?" | Surface historical objections     |
| **Meeting Prep**             | "What PRs relate to tomorrow's review?"    | Auto-generate meeting agendas     |

---

## Honest Pros and Cons

### ✅ Pros

| Benefit                            | Impact                                            |
| ---------------------------------- | ------------------------------------------------- |
| **Automated institutional memory** | Decisions become enforceable, not just documented |
| **Reduced meeting FOMO**           | Miss a meeting? CI has your back                  |
| **Faster code reviews**            | Reviewers focus on logic, not policy              |
| **Self-documenting PRs**           | Context travels with the code                     |
| **Graceful degradation**           | WARN state handles ambiguity without blocking     |

### ❌ Cons

| Challenge                         | Mitigation                                               |
| --------------------------------- | -------------------------------------------------------- |
| **M365 admin consent required**   | One-time setup, but needs IT involvement                 |
| **Meeting quality matters**       | Garbage in, garbage out—transcripts need clear decisions |
| **False positives possible**      | WARN state prevents blocking on uncertain cases          |
| **Keyword matching is imperfect** | Future: Use embeddings for semantic matching             |
| **Public preview (WorkIQ)**       | APIs may change; not for mission-critical yet            |
| **Cost**                          | Copilot license + M365 license + compute time            |

---

## When to Use This (And When Not To)

### ✅ Good Fit

- Enterprise teams (50+ devs) on M365
- Regulated industries needing audit trails
- Teams with frequent architectural discussions
- Repos with long-lived feature branches
- Organizations fighting "tribal knowledge" loss

### ❌ Skip It If

- Small teams (< 10 devs) with high context sharing
- Async-first orgs (decisions in docs, not meetings)
- Open source projects (no M365 integration)
- Repos with no feature-scoped meetings
- Teams that don't record/transcribe meetings

---

## Getting Started

### Prerequisites

1. GitHub Copilot license
2. Microsoft 365 with Teams/Outlook
3. WorkIQ admin consent ([guide](https://aka.ms/workiq-admin-consent))
4. Node.js 22+

### Quick Setup

```bash
# 1. Clone the reference implementation
git clone https://github.com/VeVarunSharma/contoso-vibe-engineering
cd contoso-vibe-engineering/.github/scripts/workiq-decision-compliance

# 2. Install dependencies
npm install

# 3. Accept WorkIQ EULA (first time only)
npx -y @microsoft/workiq accept-eula

# 4. Test the WorkIQ connection
npx -y @microsoft/workiq ask -q "What meetings do I have this week?"

# 5. Add secrets to your repo
gh secret set COPILOT_GITHUB_TOKEN
gh secret set WORKIQ_TENANT_ID
```

### Full Implementation

The reference implementation includes:

```bash
# Key files:
# .github/workflows/workiq-decision-compliance.yml  - GitHub Actions workflow
# .github/scripts/workiq-decision-compliance/       - TypeScript SDK script
#   ├── src/index.ts    - Main entry point
#   ├── src/config.ts   - Zod config validation
#   ├── src/prompts.ts  - System and user prompts
#   └── src/types.ts    - TypeScript interfaces
# .github/skills/workiq-copilot/                    - Documentation
```

---

## What's Next?

This is just the beginning. The Copilot SDK + MCP ecosystem is evolving fast:

- **Semantic matching**: Replace keyword extraction with embeddings
- **Bi-directional sync**: Push PR outcomes back to meeting notes
- **Multi-repo awareness**: Cross-repo decision enforcement
- **Slack/Discord integration**: Beyond M365

The future of CI isn't just testing code—it's validating intent.

---

## Wrapping Up

The Copilot SDK gives you programmable AI reasoning. WorkIQ gives you access to your organization's collective memory. Together, they bridge the gap between what your team _decided_ and what your code _does_.

For enterprise developers drowning in meetings, context switches, and "I didn't know we decided that" moments—this is the escape hatch.

**Your CI can finally attend your meetings. It just won't complain about them going overtime.**

---

_Have questions or built something similar? Drop a comment below or find me on [Twitter/X](https://twitter.com/yourusername)._

_Tags: #github #copilot #microsoft365 #devops #cicd #enterprisedev #ai_
