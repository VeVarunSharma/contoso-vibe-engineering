# Recommended Azure DevOps Branch Policies

Configure these policies in Azure DevOps to maintain code quality and enforce best practices.

## Setup Instructions

Navigate to: **Azure DevOps > Repos > Branches > main > ⋮ > Branch policies**

---

## 1. Require Pull Requests

Prevents direct pushes to the main branch.

- ✅ **Enable**: Require a minimum number of reviewers
- **Minimum reviewers**: 1 (or more for critical branches)
- ✅ Allow requestors to approve their own changes: **No**
- ✅ Prohibit the most recent pusher from approving: **Yes**
- ✅ Reset code reviewer votes when there are new changes: **Yes**

---

## 2. Build Validation

Link the Azure Pipeline for automated CI.

| Setting            | Value                 |
| ------------------ | --------------------- |
| Build pipeline     | `azure-pipelines.yml` |
| Trigger            | Automatic             |
| Policy requirement | Required              |
| Build expiration   | Immediately           |
| Display name       | `Build Validation`    |

---

## 3. Work Item Linking

Require linked work items for traceability.

- ✅ **Enable**: Check for linked work items
- **Policy**: Required

---

## 4. Comment Resolution

Ensure all PR comments are addressed.

- ✅ **Enable**: Check for comment resolution
- **Policy**: Required

---

## 5. Merge Strategy

Configure allowed merge types.

- ✅ Squash merge
- ❌ Basic merge (no fast-forward)
- ❌ Rebase and fast-forward
- ❌ Rebase with merge commit

---

## 6. Status Checks (Optional)

Add external status checks if using third-party integrations.

---

## 7. Automatically Include Reviewers

Add required reviewers based on file paths.

| Path Filter               | Reviewers          | Policy   |
| ------------------------- | ------------------ | -------- |
| `/services/medical-api/*` | Security Team      | Required |
| `/packages/ui/*`          | Design System Team | Optional |
| `/infra/*`                | DevOps Team        | Required |

---

## Branch Naming Convention

Enforce branch naming with path-based policies:

| Pattern     | Description          |
| ----------- | -------------------- |
| `feature/*` | New features         |
| `fix/*`     | Bug fixes            |
| `hotfix/*`  | Production hotfixes  |
| `release/*` | Release preparation  |
| `develop/*` | Development branches |

---

## Quick Setup Script (Azure CLI)

```bash
# Example: Set minimum reviewers policy
az repos policy approver-count create \
  --branch main \
  --repository-id <repo-id> \
  --blocking true \
  --enabled true \
  --minimum-approver-count 1 \
  --creator-vote-counts false \
  --reset-on-source-push true
```

---

## Additional Resources

- [Azure DevOps Branch Policies Documentation](https://learn.microsoft.com/en-us/azure/devops/repos/git/branch-policies)
- [Azure CLI for Azure Repos](https://learn.microsoft.com/en-us/cli/azure/repos/policy)
