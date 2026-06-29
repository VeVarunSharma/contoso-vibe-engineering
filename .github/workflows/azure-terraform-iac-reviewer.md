---
emoji: 🏗️
name: Azure Terraform IaC Reviewer
description: SOC 2-aligned Azure Terraform infrastructure-as-code reviewer for pull requests.
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - "**/*.tf"
      - "**/*.tfvars"
      - "**/*.tfvars.json"
      - "**/*.hcl"
      - ".terraform.lock.hcl"
      - "**/.terraform.lock.hcl"
permissions:
  contents: read
  issues: read
  pull-requests: read
strict: true
network:
  allowed:
    - defaults
    - github
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
  bash: [cat, find, gh, grep, head, jq, ls, sed, wc]
steps:
  - name: Prefetch Terraform PR context
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      PR_NUMBER: ${{ github.event.pull_request.number }}
      REPO: ${{ github.repository }}
    run: |
      mkdir -p /tmp/gh-aw/data

      gh pr view "$PR_NUMBER" \
        --repo "$REPO" \
        --json number,title,url,author,baseRefName,headRefName,files \
        --jq '{number,title,url,author: .author.login,baseRefName,headRefName,files:[.files[] | {path, additions, deletions}]}' \
        > /tmp/gh-aw/data/pr-files.json

      jq '[.files[] | select((.path | test("\\.(tf|tfvars|tfvars\\.json|hcl)$")) or (.path | endswith("/.terraform.lock.hcl")) or (.path == ".terraform.lock.hcl"))]' \
        /tmp/gh-aw/data/pr-files.json \
        > /tmp/gh-aw/data/iac-files.json

      gh pr diff "$PR_NUMBER" --repo "$REPO" --patch > /tmp/gh-aw/data/pr.diff

      awk '
        /^diff --git / {
          keep = ($0 ~ /\.(tf|tfvars|tfvars\.json|hcl)([[:space:]]|$)/ || $0 ~ /\/\.terraform\.lock\.hcl([[:space:]]|$)/ || $0 ~ /[[:space:]]\.terraform\.lock\.hcl([[:space:]]|$)/)
        }
        keep { print }
      ' /tmp/gh-aw/data/pr.diff > /tmp/gh-aw/data/iac.diff
safe-outputs:
  add-comment:
    max: 1
    hide-older-comments: true
  create-check-run:
    name: "Azure Terraform IaC Review"
    max: 1
  noop:
    report-as-issue: false
  missing-data:
    create-issue: false
  missing-tool:
    create-issue: false
  report-incomplete:
    create-issue: false
timeout-minutes: 15
---

# Azure Terraform IaC Reviewer

Review pull request Terraform infrastructure-as-code changes for Azure security, SOC 2-aligned control risks, leaked secrets, and Terraform best practices.

## Task

1. Read the pre-fetched context:
   - `/tmp/gh-aw/data/pr-files.json`
   - `/tmp/gh-aw/data/iac-files.json`
   - `/tmp/gh-aw/data/iac.diff`
2. Review only the Terraform/IaC files listed in `/tmp/gh-aw/data/iac-files.json` and only the relevant hunks in `/tmp/gh-aw/data/iac.diff`.
3. If no scoped IaC files are present or the required context files are unavailable, call `noop` with a short explanation.
4. Do not run `terraform apply`, authenticate to Azure, inspect live Azure resources, or request cloud credentials.
5. Do not create issues, pull requests, labels, or direct GitHub writes. Use only the configured safe outputs.

## Review Criteria

Classify findings by severity:

- `critical`: leaked secrets, plaintext credentials, live tokens/keys, public exposure of sensitive stores, missing identity controls for sensitive compute/data paths, or Terraform outputs that expose secrets without `sensitive = true`.
- `warning`: risky but not immediately exploitable gaps such as missing diagnostics, incomplete private networking, overly broad RBAC, weak TLS/HTTPS posture, missing resilience controls, or required governance tags missing from changed resources.
- `note`: low-risk maintainability or best-practice suggestions that do not block the PR.

Check for:

1. **Secret leakage and handling**
   - Hardcoded passwords, connection strings, certificates, client secrets, storage keys, API keys, or tokens.
   - Secrets in `app_settings`, variables, locals, outputs, provider blocks, or `.tfvars`/`.tfvars.json`.
   - App/runtime secrets that should use Azure Key Vault references such as `@Microsoft.KeyVault(SecretUri=...)`.
   - Sensitive outputs that are missing `sensitive = true`.
2. **Azure identity and access controls**
   - Missing `SystemAssigned` or appropriate managed identity on Azure compute resources.
   - SQL authentication where Entra ID authentication and disabled local authentication are expected.
   - Broad RBAC role assignments, wildcard scopes, or privilege that exceeds least privilege.
3. **Network and perimeter controls**
   - Public network access on databases, storage accounts, Key Vaults, or other sensitive services where private endpoints should be used.
   - Firewall rules such as `0.0.0.0/0` or broad CIDR ranges without justification.
   - Missing `https_only = true`, `minimum_tls_version = "1.2"` or stronger, or HTTP/2 where applicable.
4. **SOC 2-aligned controls**
   - Security: encryption, authentication, authorization, least privilege, and secret management.
   - Availability: redundancy, backups, recovery, health checks, and zone or region resilience when relevant.
   - Confidentiality and privacy: unnecessary public exposure, weak retention controls, or sensitive data in logs.
   - Change management and auditability: diagnostic settings, logging, required tags, ownership, and traceability.
5. **Terraform quality**
   - Missing provider or Terraform version constraints.
   - Unsafe or unclear backend/state practices.
   - Missing required tags on changed Azure resources: `Environment`, `CostCenter`, and `Owner`.
   - Duplicated, overly broad, or hard-to-review module/resource organization.

## Scoring and Check Policy

Start at `score = 100`, then deduct:

- `critical`: -35 each
- `warning`: -10 each
- `note`: -2 each

Clamp the final score to `0..100`.

Create exactly one check run:

- Use `conclusion: failure` when one or more `critical` findings exist.
- Use `conclusion: success` when there are no critical findings, including warning-only and clean outcomes.
- Put the score and status in the check title.
- Summarize the most important findings and remediation in the check summary.

## PR Comment

Always post one concise PR comment for normal in-scope analysis runs using `add-comment`.

Use GitHub-flavored Markdown with this structure:

```markdown
## Azure Terraform IaC Review: <status> (<score>/100)

### Summary
<one or two sentences>

### Reviewed Scope
<list changed IaC files>

### Findings
| Severity | SOC 2 area | Path | Evidence | Remediation |
| --- | --- | --- | --- | --- |
| ... |

### Result
<pass/warn/fail explanation>
```

If there are no findings, include a short green pass comment with the reviewed scope and state that no blocking Azure Terraform IaC risks were found.
