# MCP Setup Guide — Guardrails, Governance & Configuration

> **Audience**: Engineering teams adopting MCP (Model Context Protocol) with GitHub Copilot.
> This guide walks through every configuration file in this repository and explains how to govern MCP usage across your organization.

---

## Table of Contents

1. [What Is MCP?](#what-is-mcp)
2. [Configuration Files at a Glance](#configuration-files-at-a-glance)
3. [VS Code MCP Config (`.vscode/mcp.json`)](#vs-code-mcp-config)
4. [Copilot Coding Agent MCP Config (`.copilot/mcp.json`)](#copilot-coding-agent-mcp-config)
5. [Tool Allowlists — Restricting What Copilot Can Do](#tool-allowlists)
6. [Guardrails & Governance](#guardrails--governance)
7. [Adding a New MCP Server](#adding-a-new-mcp-server)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What Is MCP?

**Model Context Protocol (MCP)** is an open standard that lets AI assistants like GitHub Copilot connect to external tools and data sources. Think of it as a USB port for AI — it provides a standardized way for Copilot to:

- **Read data** from databases, APIs, and file systems
- **Take actions** like creating GitHub issues, running browser tests, or fetching documentation
- **Stay scoped** to only the tools and permissions you explicitly allow

```
┌──────────────────┐     MCP Protocol      ┌──────────────────┐
│  GitHub Copilot  │ ◄──────────────────► │   MCP Server     │
│  (AI Assistant)  │    Tool calls &       │  (e.g. GitHub,   │
│                  │    Responses          │   Playwright)    │
└──────────────────┘                       └──────────────────┘
```

Each MCP server exposes a set of **tools** (functions the AI can call) and optionally **resources** (data the AI can read). You control which servers are available and which tools can be invoked.

---

## Configuration Files at a Glance

This repository contains two MCP configuration files, each targeting a different Copilot surface:

| File | Surface | Who Uses It | When It Runs |
|------|---------|-------------|--------------|
| `.vscode/mcp.json` | VS Code Copilot Chat | Developers in their IDE | Interactive coding sessions |
| `.copilot/mcp.json` | Copilot Coding Agent | Automated agent in GitHub Actions | When agent works on issues/PRs |

### Why Two Files?

- **VS Code** can use interactive prompts (`${input:...}`) to ask developers for tokens or org names at runtime. This is great for local development.
- **The Coding Agent** runs headlessly in CI — it cannot prompt for input. It relies on environment variables and GitHub Secrets for authentication.

---

## VS Code MCP Config

**Location**: `.vscode/mcp.json`

This file is automatically read by VS Code when you open the workspace. Copilot Chat discovers the MCP servers listed here and can invoke their tools during your conversations.

### Configured Servers

| Server | Package | Purpose |
|--------|---------|---------|
| `github` | `@modelcontextprotocol/server-github` | Interact with GitHub repos, issues, PRs, and Actions |
| `ado` | `@azure-devops/mcp` | Interact with Azure DevOps work items and pipelines |
| `playwright` | `@playwright/mcp` | Browser automation for testing web UIs |
| `fetch` | `@modelcontextprotocol/server-fetch` | Fetch and convert web pages to markdown |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Read files within the workspace |

### How Tool Approval Works in VS Code

When Copilot wants to invoke an MCP tool, VS Code shows a confirmation dialog:

```
┌─────────────────────────────────────────────────────────┐
│  Copilot wants to run: github > create_issue            │
│                                                         │
│  Parameters:                                            │
│    title: "Fix login redirect bug"                      │
│    body: "The login page redirects to /404..."          │
│                                                         │
│  [ Allow Once ]  [ Allow for Session ]  [ Deny ]        │
└─────────────────────────────────────────────────────────┘
```

This is your **first line of defense**: no tool runs without your explicit approval.

### Restricting Tools with VS Code Settings

You can limit which tools from each MCP server are available to Copilot by adding a `toolApprovalPolicy` in `.vscode/settings.json`:

```jsonc
// .vscode/settings.json
{
  // Auto-approve read-only tools, require approval for write operations
  "chat.mcp.toolApprovalPolicy": {
    // Allow all tools from the fetch server (read-only by nature)
    "fetch": "allowAlways",
    // Require manual approval for GitHub operations
    "github": "askAlways",
    // Block the filesystem server entirely if not needed
    "filesystem": "disabled"
  }
}
```

**Policy options:**
- `"allowAlways"` — Tools run without confirmation (use for read-only servers)
- `"askAlways"` — Always show the confirmation dialog (default, safest)
- `"disabled"` — Server's tools are completely hidden from Copilot

---

## Copilot Coding Agent MCP Config

**Location**: `.copilot/mcp.json`

This file configures MCP servers for the **Copilot Coding Agent** — the autonomous agent that runs in GitHub Actions to implement issues and PRs.

### Key Differences from VS Code Config

| Aspect | `.vscode/mcp.json` | `.copilot/mcp.json` |
|--------|---------------------|----------------------|
| Authentication | Interactive prompts (`${input:...}`) | Environment variables / GitHub Secrets |
| Approval model | Human confirms each tool call | Policy-based (allowlist or auto-approve) |
| Execution | Local developer machine | GitHub Actions runner |
| Headless support | No (has a UI) | Yes (no UI available) |

### How It Works

1. When Copilot Coding Agent starts working on an issue, it reads `.copilot/mcp.json`
2. It spins up the listed MCP servers as child processes
3. The agent can then invoke tools from these servers while implementing changes
4. Tool usage is logged in the agent's session for auditability

---

## Tool Allowlists

Allowlists let you control **exactly which tools** from each MCP server are available. This is critical for governance — you may trust a server for read operations but want to block write operations.

### Approach 1: VS Code Tool Approval Policy

As shown above, use `chat.mcp.toolApprovalPolicy` in `.vscode/settings.json` to control approval behavior per server.

### Approach 2: Copilot Coding Agent Allowed Tools

For the Coding Agent, you can restrict available tools at the **organization or repository level** through GitHub settings:

1. Go to **Organization Settings → Copilot → Policies → Coding Agent**
2. Under **MCP servers**, configure which servers the agent can use
3. Set **tool-level restrictions** to allow or deny specific tools

### Approach 3: Custom Instructions

Add restrictions in `.github/copilot-instructions.md` to provide soft governance:

```markdown
## MCP Tool Usage Rules

- **NEVER** use MCP tools to modify production databases
- **ALWAYS** prefer read-only MCP tools when gathering information
- **NEVER** use the filesystem MCP server to write files outside the workspace
- **ALWAYS** verify MCP tool outputs before using them in code changes
```

These instructions are read by Copilot and influence its behavior, but they are not enforced at the protocol level. Combine with technical controls (allowlists) for defense in depth.

---

## Guardrails & Governance

### Layer 1: Repository-Level Controls

| Control | Where | What It Does |
|---------|-------|--------------|
| MCP server list | `.vscode/mcp.json`, `.copilot/mcp.json` | Defines which servers are available |
| Tool approval policy | `.vscode/settings.json` | Controls approval flow per server |
| Custom instructions | `.github/copilot-instructions.md` | Guides AI behavior with rules |
| Input variables | `.vscode/mcp.json` `inputs` | Avoids hardcoding secrets in config |

### Layer 2: Organization-Level Controls

| Control | Where | What It Does |
|---------|-------|--------------|
| Copilot policies | GitHub Org Settings | Enable/disable MCP for the Coding Agent |
| Allowed MCP servers | GitHub Org Settings | Restrict which servers the agent can use |
| Secret management | GitHub Actions Secrets | Securely provide credentials to MCP servers |
| Audit logs | GitHub Audit Log | Track MCP tool invocations across repos |

### Layer 3: Network & Runtime Controls

| Control | Where | What It Does |
|---------|-------|--------------|
| Path restrictions | MCP server args (e.g., filesystem paths) | Limit server access to specific directories |
| Scoped tokens | Environment variables | Use fine-grained PATs with minimal permissions |
| Headless mode | `--headless` flag on Playwright | Prevent browser windows from opening in CI |

### Governance Decision Tree

Use this to determine how to configure MCP for your team:

```
Is the MCP server read-only?
├── Yes → Add to both .vscode/mcp.json and .copilot/mcp.json
│         Set toolApprovalPolicy to "allowAlways" in VS Code
│
└── No (can write/modify data)
    ├── Is it needed by the Coding Agent?
    │   ├── Yes → Add to .copilot/mcp.json with scoped credentials
    │   │         Document allowed operations in copilot-instructions.md
    │   └── No  → Only add to .vscode/mcp.json
    │
    └── Does it require credentials?
        ├── Yes → Use ${input:...} in VS Code, GitHub Secrets for agent
        └── No  → Add directly (but still restrict via allowlists)
```

---

## Adding a New MCP Server

### Step 1: Evaluate the Server

Before adding any MCP server, answer these questions:

- [ ] **What tools does it expose?** Run it locally and inspect with `npx @modelcontextprotocol/inspector`
- [ ] **Does it need credentials?** If yes, plan for secret management
- [ ] **Is it read-only or read-write?** Read-write servers need stricter controls
- [ ] **Is it from a trusted source?** Prefer servers from official orgs (e.g., `@modelcontextprotocol/*`, `@playwright/*`)
- [ ] **Does it match a business need?** Every MCP server should serve a clear purpose

### Step 2: Add to Configuration

**For VS Code** (`.vscode/mcp.json`):

```jsonc
{
  "servers": {
    "my-new-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@scope/my-mcp-server"],
      "env": {
        "API_KEY": "${input:my_api_key}"
      }
    }
  },
  "inputs": [
    {
      "id": "my_api_key",
      "type": "promptString",
      "description": "API key for My Service",
      "password": true
    }
  ]
}
```

**For Copilot Coding Agent** (`.copilot/mcp.json`):

```jsonc
{
  "servers": {
    "my-new-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@scope/my-mcp-server"]
      // Credentials come from GitHub Secrets → environment variables
    }
  }
}
```

### Step 3: Test Locally

```bash
# Start the MCP server and inspect its tools
npx @modelcontextprotocol/inspector npx -y @scope/my-mcp-server

# Or test directly in VS Code:
# 1. Reload VS Code (Cmd+Shift+P → "Reload Window")
# 2. Open Copilot Chat
# 3. Look for the MCP server in the tools icon (🔧)
```

### Step 4: Document and Review

- Add a comment block in the config file explaining the server's purpose
- Update this guide if the server introduces new governance considerations
- Submit a PR for team review before merging MCP config changes

---

## Security Best Practices

### Credential Management

| Surface | Method | Example |
|---------|--------|---------|
| VS Code | Interactive prompts | `"${input:my_token}"` with `"password": true` |
| Coding Agent | GitHub Actions Secrets | Set in repo/org settings, accessed via env vars |

**Rules:**
- ❌ **NEVER** hardcode tokens, API keys, or passwords in MCP config files
- ❌ **NEVER** commit `.env` files containing MCP credentials
- ✅ **ALWAYS** use `${input:...}` with `"password": true` for VS Code
- ✅ **ALWAYS** use GitHub Secrets for Coding Agent credentials
- ✅ **ALWAYS** use fine-grained PATs with the minimum required scopes

### Token Scoping

When creating tokens for MCP servers, follow least-privilege:

```
GitHub PAT for MCP:
  ✅ repo:read      — Read repository contents
  ✅ issues:write   — Create/update issues (if needed)
  ❌ admin:org      — Not needed for MCP operations
  ❌ delete_repo    — Never grant destructive permissions
```

### Audit Checklist

Run this checklist quarterly or when adding new MCP servers:

- [ ] Review all MCP servers in `.vscode/mcp.json` and `.copilot/mcp.json`
- [ ] Verify each server is still needed and actively maintained
- [ ] Check that no credentials are hardcoded in config files
- [ ] Confirm tool approval policies are appropriate
- [ ] Review GitHub Audit Log for unexpected MCP tool usage
- [ ] Update this guide if any governance patterns have changed

---

## Troubleshooting

### MCP Server Not Appearing in VS Code

1. Check that the server is correctly defined in `.vscode/mcp.json`
2. Reload VS Code (`Cmd+Shift+P` → "Developer: Reload Window")
3. Open the Output panel (`Cmd+Shift+U`) and select "MCP" from the dropdown
4. Look for error messages from the server process

### MCP Server Fails to Start

```bash
# Test the server command manually in your terminal
npx -y @modelcontextprotocol/server-github

# If it fails, you may need to:
# 1. Check your Node.js version (requires Node 18+)
# 2. Clear the npx cache: npx clear-npx-cache
# 3. Check for authentication issues in the server's output
```

### Coding Agent Cannot Use MCP Server

1. Verify the server is listed in `.copilot/mcp.json` (not just `.vscode/mcp.json`)
2. Check that any required secrets are set in the repository's GitHub Settings
3. Review the Coding Agent's session logs for MCP connection errors
4. Ensure the MCP server package is available on npm (the agent uses `npx`)

### Tools Not Showing in Copilot Chat

1. Click the tools icon (🔧) in the Copilot Chat input
2. Check if the MCP server is listed and toggle it on
3. If the server is listed but has no tools, the server may have failed silently
4. Check the MCP output panel for detailed error information

---

## Quick Reference

### File Locations

```
contoso-vibe-engineering/
├── .vscode/
│   ├── mcp.json          ← MCP servers for VS Code Copilot Chat
│   └── settings.json     ← Tool approval policies (toolApprovalPolicy)
├── .copilot/
│   └── mcp.json          ← MCP servers for Copilot Coding Agent
├── .github/
│   └── copilot-instructions.md  ← Soft guardrails via custom instructions
└── docs/
    └── mcp-setup-guide.md       ← This guide
```

### Common MCP Servers

| Server | Package | Type | Use Case |
|--------|---------|------|----------|
| GitHub | `@modelcontextprotocol/server-github` | Read/Write | Issues, PRs, repos |
| Fetch | `@modelcontextprotocol/server-fetch` | Read-Only | Fetch web pages |
| Filesystem | `@modelcontextprotocol/server-filesystem` | Read/Write | Local file access |
| Playwright | `@playwright/mcp` | Read/Write | Browser automation |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Read/Write | Database queries |
| Azure DevOps | `@azure-devops/mcp` | Read/Write | Work items, pipelines |

### MCP Inspector (Debug Tool)

```bash
# Inspect any MCP server's tools and resources
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-github
```
