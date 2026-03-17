---
name: codeql
description: Comprehensive guide for setting up and configuring CodeQL code scanning via GitHub Actions workflows and the CodeQL CLI. This skill should be used when users need help with code scanning configuration, CodeQL workflow files, CodeQL CLI commands, SARIF output, security analysis setup, or troubleshooting CodeQL analysis.
---

# CodeQL Code Scanning

This skill provides procedural guidance for configuring and running CodeQL code scanning — both through GitHub Actions workflows and the standalone CodeQL CLI.

## When to Use This Skill

Use this skill when the request involves:

- Creating or customizing a `codeql.yml` GitHub Actions workflow
- Choosing between default setup and advanced setup for code scanning
- Configuring CodeQL language matrix, build modes, or query suites
- Running CodeQL CLI locally (`codeql database create`, `database analyze`, `github upload-results`)
- Understanding or interpreting SARIF output from CodeQL
- Troubleshooting CodeQL analysis failures (build modes, compiled languages, runner requirements)
- Setting up CodeQL for monorepos with per-component scanning
- Configuring dependency caching, custom query packs, or model packs

## Supported Languages

CodeQL supports the following language identifiers:

| Language | Identifier | Alternatives |
|---|---|---|
| C/C++ | `c-cpp` | `c`, `cpp` |
| C# | `csharp` | — |
| Go | `go` | — |
| Java/Kotlin | `java-kotlin` | `java`, `kotlin` |
| JavaScript/TypeScript | `javascript-typescript` | `javascript`, `typescript` |
| Python | `python` | — |
| Ruby | `ruby` | — |
| Rust | `rust` | — |
| Swift | `swift` | — |
| GitHub Actions | `actions` | — |

> Alternative identifiers are equivalent to the standard identifier (e.g., `javascript` does not exclude TypeScript analysis).

## Core Workflow — GitHub Actions

### Step 1: Choose Setup Type

- **Default setup** — Enable from repository Settings → Advanced Security → CodeQL analysis. Best for getting started quickly. Uses `none` build mode for most languages.
- **Advanced setup** — Create a `.github/workflows/codeql.yml` file for full control over triggers, build modes, query suites, and matrix strategies.

To switch from default to advanced: disable default setup first, then commit the workflow file.

### Step 2: Configure Workflow Triggers

Define when scanning runs:

```yaml
on:
  push:
    branches: [main, protected]
  pull_request:
    branches: [main]
  schedule:
    - cron: '30 6 * * 1'  # Weekly Monday 6:30 UTC
```

- `push` — scans on every push to specified branches; results appear in Security tab
- `pull_request` — scans PR merge commits; results appear as PR check annotations
- `schedule` — periodic scans of the default branch (cron must exist on default branch)
- `merge_group` — add if repository uses merge queues

To skip scans for documentation-only PRs:

```yaml
on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - '**/*.txt'
```

> `paths-ignore` controls whether the workflow runs, not which files are analyzed.

### Step 3: Configure Permissions

Set least-privilege permissions:

```yaml
permissions:
  security-events: write   # Required to upload SARIF results
  contents: read            # Required to checkout code
  actions: read             # Required for private repos using codeql-action
```

### Step 4: Configure Language Matrix

Use a matrix strategy to analyze each language in parallel:

```yaml
jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: python
            build-mode: none
```

For compiled languages, set the appropriate `build-mode`:
- `none` — no build required (supported for C/C++, C#, Java, Rust)
- `autobuild` — automatic build detection
- `manual` — custom build commands (advanced setup only)

> For detailed per-language autobuild behavior and runner requirements, search `references/compiled-languages.md`.

### Step 5: Configure CodeQL Init and Analysis

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4

  - name: Initialize CodeQL
    uses: github/codeql-action/init@v4
    with:
      languages: ${{ matrix.language }}
      build-mode: ${{ matrix.build-mode }}
      queries: security-extended
      dependency-caching: true

  - name: Perform CodeQL Analysis
    uses: github/codeql-action/analyze@v4
    with:
      category: "/language:${{ matrix.language }}"
```

**Query suite options:**
- `security-extended` — default security queries plus additional coverage
- `security-and-quality` — security plus code quality queries
- Custom query packs via `packs:` input (e.g., `codeql/javascript-queries:AlertSuppression.ql`)

**Dependency caching:** Set `dependency-caching: true` on the `init` action to cache restored dependencies across runs.

**Analysis category:** Use `category` to distinguish SARIF results in monorepos (e.g., per-language, per-component).

### Step 6: Monorepo Configuration

For monorepos with multiple components, use the `category` parameter to separate SARIF results:

```yaml
category: "/language:${{ matrix.language }}/component:frontend"
```

To restrict analysis to specific directories, use a CodeQL configuration file (`.github/codeql/codeql-config.yml`):

```yaml
paths:
  - apps/
  - services/
paths-ignore:
  - node_modules/
  - '**/test/**'
```

Reference it in the workflow:

```yaml
- uses: github/codeql-action/init@v4
  with:
    config-file: .github/codeql/codeql-config.yml
```

### Step 7: Manual Build Steps (Compiled Languages)

If `autobuild` fails or custom build commands are needed:

```yaml
- language: c-cpp
  build-mode: manual
```

Then add explicit build steps between `init` and `analyze`:

```yaml
- if: matrix.build-mode == 'manual'
  name: Build
  run: |
    make bootstrap
    make release
```

## Core Workflow — CodeQL CLI

### Step 1: Install the CodeQL CLI

Download the CodeQL bundle (includes CLI + precompiled queries):

```bash
# Download from https://github.com/github/codeql-action/releases
# Extract and add to PATH
export PATH="$HOME/codeql:$PATH"

# Verify installation
codeql resolve packs
codeql resolve languages
```

> Always use the CodeQL bundle, not a standalone CLI download. The bundle ensures query compatibility and provides precompiled queries for better performance.

### Step 2: Create a CodeQL Database

```bash
# Single language
codeql database create codeql-db \
  --language=javascript-typescript \
  --source-root=src

# Multiple languages (cluster mode)
codeql database create codeql-dbs \
  --db-cluster \
  --language=java,python \
  --command=./build.sh \
  --source-root=src
```

For compiled languages, provide the build command via `--command`.

### Step 3: Analyze the Database

```bash
codeql database analyze codeql-db \
  javascript-code-scanning.qls \
  --format=sarif-latest \
  --sarif-category=javascript \
  --output=results.sarif
```

Common query suites: `<language>-code-scanning.qls`, `<language>-security-extended.qls`, `<language>-security-and-quality.qls`.

### Step 4: Upload Results to GitHub

```bash
codeql github upload-results \
  --repository=owner/repo \
  --ref=refs/heads/main \
  --commit=<commit-sha> \
  --sarif=results.sarif
```

Requires `GITHUB_TOKEN` environment variable with `security-events: write` permission.

### CLI Server Mode

To avoid repeated JVM initialization when running multiple commands:

```bash
codeql execute cli-server
```

> For detailed CLI command reference, search `references/cli-commands.md`.

## Troubleshooting

### Common Issues

| Problem | Solution |
|---|---|
| Workflow not triggering | Verify `on:` triggers match event; check `paths`/`branches` filters; ensure workflow exists on target branch |
| `Resource not accessible` error | Add `security-events: write` and `contents: read` permissions |
| Autobuild failure | Switch to `build-mode: manual` and add explicit build commands |
| Cache miss every run | Verify `dependency-caching: true` on `init` action; check cache key includes lockfile hash |
| SARIF upload fails | Ensure `GITHUB_TOKEN` has `security-events: write`; verify `--ref` and `--commit` match |
| Slow analysis on self-hosted runners | Check hardware meets minimums (see table below); use SSD with ≥14 GB disk |

### Hardware Requirements (Self-Hosted Runners)

| Codebase Size | RAM | CPU |
|---|---|---|
| Small (<100K LOC) | 8 GB+ | 2 cores |
| Medium (100K–1M LOC) | 16 GB+ | 4–8 cores |
| Large (>1M LOC) | 64 GB+ | 8 cores |

All sizes: SSD with ≥14 GB free disk space.

### Action Versioning

Pin CodeQL actions to a specific major version:

```yaml
uses: github/codeql-action/init@v4      # Recommended
uses: github/codeql-action/autobuild@v4
uses: github/codeql-action/analyze@v4
```

For maximum security, pin to a full commit SHA instead of a version tag.

## Reference Files

For detailed documentation, load the following reference files as needed:

- `references/workflow-configuration.md` — Full workflow trigger, runner, and configuration options
  - Search patterns: `trigger`, `schedule`, `paths-ignore`, `db-location`, `model packs`, `alert severity`, `merge protection`
- `references/cli-commands.md` — Complete CodeQL CLI command reference
  - Search patterns: `database create`, `database analyze`, `upload-results`, `resolve packs`, `cli-server`, `installation`
- `references/sarif-output.md` — SARIF v2.1.0 object model and schema
  - Search patterns: `sarifLog`, `result`, `location`, `region`, `codeFlow`, `fingerprint`, `suppression`
- `references/compiled-languages.md` — Build modes and autobuild behavior per language
  - Search patterns: `C/C++`, `C#`, `Java`, `Go`, `Rust`, `Swift`, `autobuild`, `build-mode`, `hardware`
