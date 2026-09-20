# Workflow Noise Reduction

This document records the September 2026 investigation and remediation of excessive GitHub Actions runs, failures, issues, and pull request comments in this repository.

## Baseline

The original seven-day measurement retrieved all 376 workflow runs from September 6 through September 13, 2026:

| Metric                      | Baseline |
| --------------------------- | -------: |
| Workflow runs               |      376 |
| Failed runs                 |      329 |
| `action_required` runs      |       26 |
| Successful runs             |       21 |
| PR Merge Assistant runs     |      331 |
| PR Merge Assistant failures |      328 |

PR Merge Assistant accounted for 99.7% of failures. Its half-hour schedule repeatedly loaded a generated workflow containing an unavailable `github/gh-aw-actions/setup@v0.84.1` reference.

Secondary sources included:

- empty multi-model review reports in unsupported authentication contexts;
- clean-result Dependency Review comments;
- invalid Dependabot labels and generated workflow updates;
- a per-push AI security assessment using stale credentials;
- invalid or excessively broad Dependabot update targets.

## Deployed controls

The remediation was delivered in [#436](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/436), [#440](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/440), and [#442](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/442).

| Surface                         | Control                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| PR Merge Assistant              | Manual dispatch only; no schedule, pull request trigger, recursive dispatch, or redundant transition comments                    |
| Generated gh-aw workflow        | Recompiled with the official gh-aw v0.85.4 compiler and immutable runtime references                                             |
| Automation incidents            | One canonical issue per normalized failure signature, with at most one update per 24 hours                                       |
| Multi-model review              | Human-authored, non-draft, same-repository pull requests only; valid-review quorum required; one stable consensus comment        |
| Dependency Review               | Security and license enforcement retained; pull request comments only on failure                                                 |
| Security Agent                  | Weekly Wednesday schedule plus manual dispatch; scoped built-in authentication and read-only Copilot tools                       |
| Terraform Dependabot            | Retargeted to child directories that contain Terraform manifests                                                                 |
| npm/pnpm Dependabot             | Routine monorepo version scans paused after repeated 55-minute cancellations; alerts and grouped security updates remain enabled |
| Generated workflow dependencies | gh-aw lock workflows excluded from isolated Dependabot action updates and upgraded through recompilation instead                 |

Historical incidents were preserved and cross-linked rather than automatically closed.

## Verification

### First 24 hours

Measurement window: `2026-09-15T08:44:09Z` through `2026-09-16T08:44:09Z`.

| Metric                                      |           Result |
| ------------------------------------------- | ---------------: |
| Workflow runs                               |               18 |
| Successful runs                             |               16 |
| Skipped runs                                |                2 |
| Failed, canceled, or `action_required` runs |                0 |
| PR Merge Assistant runs                     |                0 |
| Expected weekly Security Agent runs         | 1 successful run |
| Dependabot jobs                             |   9/9 successful |
| Combined npm/pnpm version scans             |                0 |
| New issues                                  |                0 |
| Targeted workflow comments                  |                0 |
| Inline review comments                      |                0 |

Compared with the baseline daily averages:

- run volume fell from 53.7 to 18 runs per day, a 66.5% reduction;
- failures fell from 47 to 0 per day, a 100% reduction;
- the failure rate fell from 87.5% to 0%.

The Security Agent run produced only its report artifact. Automation Incident Reporter observed a successful upstream run, skipped as designed, and made no issue or comment writes. The two generic conversation touches in the window were unrelated Vercel and Dependabot housekeeping.

### Interim checkpoint

Through `2026-09-19T22:52:18Z`, the cumulative totals remained unchanged:

- 18 runs: 16 successful, 2 skipped, and 0 failed;
- 0 PR Merge Assistant runs;
- 1 expected successful weekly Security Agent run;
- 0 combined npm/pnpm version scans;
- 0 incident issue events or GitHub Actions comments;
- 0 new consensus, Dependency Review, or inline review comments;
- 0 new issues.

The partial-window rate was approximately 3.9 runs per day, 92.7% below the original baseline.

## Operational guidance

- Keep PR Merge Assistant manual-only unless a new trigger policy is explicitly approved and measured.
- Edit `.github/workflows/pr-merge-assistant.md`, then recompile its `.lock.yml`; never hand-edit the generated lock.
- Keep `report-failure-as-issue` disabled in gh-aw while the deterministic incident reporter is active.
- Treat the weekly Security Agent run as expected activity. Investigate additional non-manual runs.
- Do not re-enable the combined npm/pnpm version updater until its workspace runtime and package-age behavior are bounded and validated.
- Preserve Dependabot alerts and security-update pull requests even while routine version scans are paused.
- Measure notification-producing writes separately from workflow runs: issues, issue comments, pull request comments, inline review comments, and issue reopen events.
- Compare timestamps as raw ISO UTC strings when filtering GitHub API results.

## Monitoring

The final seven-day measurement covers `2026-09-15T08:44:09Z` through `2026-09-22T08:44:09Z`. It should verify:

- zero PR Merge Assistant runs;
- zero unexpected Security Agent runs;
- no unintended incident issue or comment writes;
- no combined npm/pnpm version scans;
- healthy Dependabot security and ecosystem jobs;
- at most one canonical multi-model verdict per eligible pull request;
- Dependency Review comments only on failure;
- materially lower run, failure, and repository-write counts than the original baseline.
