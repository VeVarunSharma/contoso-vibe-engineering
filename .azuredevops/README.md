# Azure DevOps Integration

This repository integrates GitHub with Azure DevOps for enhanced CI/CD and project management capabilities.

## Features

| Feature             | Platform     | Description                                  |
| ------------------- | ------------ | -------------------------------------------- |
| **Azure Boards**    | Azure DevOps | Work item tracking with `AB#<id>` linking    |
| **Azure Pipelines** | Azure DevOps | CI/CD for build, test, and deployment        |
| **GitHub Actions**  | GitHub       | Security scanning, automation, and workflows |
| **Code Scanning**   | GitHub       | CodeQL analysis for security vulnerabilities |
| **MCP Integration** | VS Code      | Query Azure DevOps from Copilot Chat         |

## Quick Start

### 1. Azure DevOps Setup

1. Create an Azure DevOps organization at [dev.azure.com](https://dev.azure.com)
2. Create a new project or use an existing one
3. Connect your GitHub repository:
   - Go to **Project Settings > GitHub connections**
   - Authorize and select this repository

### 2. Configure Service Connections

#### In Azure DevOps:

1. **Project Settings > Service connections > New**
2. Select **GitHub** and authenticate
3. Name it `github-connection`

#### In GitHub:

1. **Settings > Secrets and variables > Actions**
2. Add these secrets:
   - `ADO_PAT`: Azure DevOps Personal Access Token
   - `ADO_ORG`: Your Azure DevOps organization name
   - `ADO_PROJECT`: Your Azure DevOps project name

### 3. Configure Pipelines

Import pipelines from this repository:

| Pipeline File                                           | Purpose                |
| ------------------------------------------------------- | ---------------------- |
| `azure-pipelines.yml`                                   | Main CI build pipeline |
| `.azuredevops/pipelines/contoso-web-app-unit-tests.yml` | Web app unit tests     |

## Pipelines

### Main Pipeline (`azure-pipelines.yml`)

**Triggers:**

- Push to `main` or `develop/*` branches
- Pull requests to `main`

**Stages:**

1. **Build & Test**: Lint, build, and run tests
2. **Security Scan**: Dependency audit

### Web App Unit Tests (`.azuredevops/pipelines/contoso-web-app-unit-tests.yml`)

**Triggers:**

- Changes to `apps/contoso-web-app/**`
- Changes to `packages/ui/**`

**Features:**

- Jest unit tests with coverage
- JUnit test result publishing
- Code coverage reporting

## Work Item Linking

Link commits and PRs to Azure Boards work items using these patterns:

| Pattern         | Effect                              |
| --------------- | ----------------------------------- |
| `AB#123`        | Links to work item 123              |
| `Fixes AB#123`  | Links and transitions to "Resolved" |
| `Closes AB#123` | Links and transitions to "Closed"   |

### Examples

```bash
# Feature with work item link
git commit -m "feat(web): add user dashboard AB#1234"

# Bug fix that closes work item
git commit -m "fix(api): resolve null reference Fixes AB#5678"

# Link multiple work items
git commit -m "refactor: update shared components AB#1234 AB#5678"
```

## Branch Policies

Configure these in Azure DevOps for the `main` branch:

1. **Require pull request reviews** (minimum 1 reviewer)
2. **Build validation** (link `azure-pipelines.yml`)
3. **Require linked work items**
4. **Check for comment resolution**

See [BRANCH_POLICIES.md](BRANCH_POLICIES.md) for detailed setup instructions.

## MCP Server Integration

Use the Azure DevOps MCP server in VS Code to query work items from Copilot Chat:

```json
// .vscode/mcp.json
{
  "servers": {
    "ado": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@azure-devops/mcp", "your-org-name"]
    }
  }
}
```

Then use `@ado` in Copilot Chat to:

- Query work items
- Get sprint information
- Check pipeline status

## Testing Checklist

Use this checklist to verify the integration is working:

- [ ] **AB# linking**: Create commit with `AB#<id>`, verify link in Azure Boards
- [ ] **PR automation**: Open PR, check work item status updates
- [ ] **Pipeline triggers**: Push to `develop/*`, verify Azure Pipeline runs
- [ ] **GitHub status**: Check PR shows Azure Pipeline status
- [ ] **MCP integration**: Use `@ado` in Copilot Chat to query work items
- [ ] **CODEOWNERS**: Open PR touching `/packages/ui/`, verify auto-reviewer
- [ ] **Security scans**: Open PR, check CodeQL and dependency review run

## Troubleshooting

### Pipeline not triggering

1. Check branch filters in pipeline YAML
2. Verify service connection permissions
3. Check webhook configuration in GitHub

### Work items not linking

1. Ensure `AB#` syntax is correct (case-sensitive)
2. Verify Azure Boards connection in GitHub
3. Check PAT permissions include "Work Items (Read & Write)"

### MCP server not connecting

1. Ensure `npx` is available in PATH
2. Check organization name is correct
3. Verify Azure DevOps authentication

## Resources

- [Azure DevOps Documentation](https://learn.microsoft.com/en-us/azure/devops/)
- [GitHub + Azure Boards Integration](https://learn.microsoft.com/en-us/azure/devops/boards/github/)
- [Azure Pipelines YAML Schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/)
