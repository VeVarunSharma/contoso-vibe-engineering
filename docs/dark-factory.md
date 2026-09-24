# Dark Factory Operations

The dark factory is an opt-in agentic workflow pipeline for low-risk repository work. GitHub issues and pull requests are the durable state store; GitHub Actions provides isolation; Copilot implements and reviews changes; native GitHub auto-merge performs the final squash merge.

## Prerequisites

- GitHub Actions and Copilot coding agent are enabled for the repository.
- Repository auto-merge and squash merging are enabled.
- `PR_MERGE_AUTOMATION_TOKEN` is configured as a repository secret with permission to assign the Copilot coding agent, request Copilot reviews, update labels, and enable auto-merge.
- The default branch is `main`.
- Protect `main` with a branch ruleset before treating the factory as production automation. At minimum, require pull requests and resolved review conversations. Add required status checks that are consistently reported for every pull request.
- Compile agentic workflow sources with a supported `gh-aw` release and commit the generated `.lock.yml` files.

## Starting Work

1. Create a focused issue with testable acceptance criteria.
2. Confirm the change is safe for autonomous delivery.
3. Apply the `factory:queued` label.

`Dark Factory Dispatch` runs on the label event and every 15 minutes. It selects the oldest eligible issue, assigns the Copilot coding agent, replaces `factory:queued` with `factory:building`, and processes at most one issue per run.

## Pull Request Lifecycle

1. The coding agent creates a `copilot/*` pull request.
2. `Label Copilot PRs for Factory Validation` verifies the trusted Copilot bot identity and applies `factory:validating`.
3. `PR Merge Assistant` requests a Copilot review of the current head commit.
4. Failed checks, requested changes, or unresolved comments cause the coding agent to be assigned back to the pull request.
5. When the current head has a Copilot review, at least one check is reported, every check passes, and all conversations are resolved, the controller applies `automerge` and `factory:merge-ready`, then enables native squash auto-merge with an exact head-SHA match.
6. GitHub applies branch rules and merges the pull request into `main`.

The controller reconciles every 15 minutes and also reacts to ready-for-review, synchronize, reopen, and label events.

## Safety Boundary

Only pull requests satisfying all of these conditions are processed:

- The author is the trusted Copilot coding agent.
- The source branch starts with `copilot/`.
- The base branch is `main`.
- The pull request has the `automerge` label.
- The pull request is not a draft.

The factory stops and applies `factory:human-review` when changed files include:

- `.github/workflows/` or `.github/actions/`
- `infra/`
- Authentication, security, or permissions paths
- Database migration or schema paths

Human-authored and Dependabot pull requests are outside this pipeline.

## State Labels

| Label | Meaning |
| --- | --- |
| `factory:queued` | Explicitly approved for dispatch |
| `factory:building` | Assigned to the coding agent |
| `factory:validating` | Pull request is in automated review and CI |
| `factory:merge-ready` | All automated merge gates passed |
| `factory:human-review` | Automation stopped because the change is high risk |
| `factory:blocked` | Automation cannot continue |
| `automerge` | Pull request opted into guarded native auto-merge |

## Operations

```powershell
# Compile the agentic workflows after editing their Markdown sources
gh aw compile dark-factory-dispatch pr-merge-assistant --approve --actionlint --validate

# View workflow status
gh aw status

# Manually reconcile queued work or pull requests
gh aw run dark-factory-dispatch
gh aw run pr-merge-assistant
```

Do not edit generated `.lock.yml` files directly. Update the corresponding Markdown source and recompile it.
