# CodeQL SARIF Output Reference

Detailed reference for the SARIF v2.1.0 output produced by CodeQL analysis. Use this when interpreting or processing CodeQL scan results.

## About SARIF

SARIF (Static Analysis Results Interchange Format) is a standardized JSON format for representing static analysis tool output. CodeQL produces SARIF v2.1.0 (specification: `sarifv2.1.0`).

- Specification: [OASIS SARIF v2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)
- Schema: [sarif-schema-2.1.0.json](https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json)
- Format type: `sarifv2.1.0` (passed to `--format` flag)

## Top-Level Structure

### `sarifLog` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `$schema` | ✅ | Link to the SARIF schema |
| `version` | ✅ | SARIF specification version (`"2.1.0"`) |
| `runs` | ✅ | Array containing a single `run` object per language |

### `run` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `tool` | ✅ | Tool information (`toolComponent`) |
| `artifacts` | ✅ | Array of artifact objects for every file referenced in a result |
| `results` | ✅ | Array of `result` objects |
| `newLineSequences` | ✅ | Newline character sequences |
| `columnKind` | ✅ | Column counting method |
| `properties` | ✅ | Contains `semmle.formatSpecifier` identifying the format |

## Tool Information

### `tool` Object

Contains a single `driver` property.

### `toolComponent` Object (Driver)

| Property | Always Generated | Description |
|---|:---:|---|
| `name` | ✅ | `"CodeQL command-line toolchain"` |
| `organization` | ✅ | `"GitHub"` |
| `version` | ✅ | CodeQL release version (e.g., `"2.19.0"`) |
| `rules` | ✅ | Array of `reportingDescriptor` objects for available/run rules |

## Rules

### `reportingDescriptor` Object (Rule)

| Property | Always Generated | Description |
|---|:---:|---|
| `id` | ✅ | Rule identifier from `@id` query property (e.g., `cpp/unsafe-format-string`). Uses `@opaqueid` if defined. |
| `name` | ✅ | Same as `@id` property from the query |
| `shortDescription` | ✅ | From `@name` query property |
| `fullDescription` | ✅ | From `@description` query property |
| `defaultConfiguration` | ❌ | `reportingConfiguration` with `enabled` (true/false) and `level` based on `@severity`. Omitted if no `@severity` specified. |

### Severity Mapping

| CodeQL `@severity` | SARIF `level` |
|---|---|
| `error` | `error` |
| `warning` | `warning` |
| `recommendation` | `note` |

## Results

### `result` Object

By default, results are grouped by unique message format string and primary location. Two results at the same location with the same message appear as a single result. Disable grouping with `--ungroup-results`.

| Property | Always Generated | Description |
|---|:---:|---|
| `ruleId` | ✅ | Rule identifier (matches `reportingDescriptor.id`) |
| `ruleIndex` | ✅ | Index into the `rules` array |
| `message` | ✅ | Problem description. May contain SARIF "Message with placeholder" linking to `relatedLocations`. |
| `locations` | ✅ | Array containing a single `location` object |
| `partialFingerprints` | ✅ | Dictionary with at least `primaryLocationLineHash` for deduplication |
| `codeFlows` | ❌ | Populated for `@kind path-problem` queries with one or more `codeFlow` objects |
| `relatedLocations` | ❌ | Populated when message has placeholder options; each unique location included once |
| `suppressions` | ❌ | If suppressed: single `suppression` object with `@kind: IN_SOURCE`. If not suppressed but other results are: empty array. Otherwise: not set. |

### Fingerprints

`partialFingerprints` contains:
- `primaryLocationLineHash` — fingerprint based on the context of the primary location

Used by GitHub to track alerts across commits and avoid duplicate notifications.

## Locations

### `location` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `physicalLocation` | ✅ | Physical file location |
| `id` | ❌ | Present in `relatedLocations` array |
| `message` | ❌ | Present in `relatedLocations` and `threadFlowLocation.location` |

### `physicalLocation` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `artifactLocation` | ✅ | File reference |
| `region` | ❌ | Present for text file locations |
| `contextRegion` | ❌ | Present when location has an associated snippet |

### `region` Object

Two types of regions may be produced:

**Line/Column Offset Regions:**

| Property | Always Generated | Description |
|---|:---:|---|
| `startLine` | ✅ | Starting line number |
| `startColumn` | ❌ | Omitted if equal to default value of 1 |
| `endLine` | ❌ | Omitted if identical to `startLine` |
| `endColumn` | ✅ | Ending column number |
| `snippet` | ❌ | Source code snippet |

**Character Offset Regions:**

| Property | Always Generated | Description |
|---|:---:|---|
| `charOffset` | ✅ | Character offset from start of file |
| `charLength` | ✅ | Length in characters |
| `snippet` | ❌ | Source code snippet |

> Consumers should handle both region types robustly.

## Artifacts

### `artifact` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `location` | ✅ | `artifactLocation` object |
| `index` | ✅ | Index of the artifact |
| `contents` | ❌ | Populated with `artifactContent` when using `--sarif-add-file-contents` |

### `artifactLocation` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `uri` | ✅ | File path (relative or absolute) |
| `index` | ✅ | Index reference |
| `uriBaseId` | ❌ | Set when file is relative to a known abstract location (e.g., source root) |

## Code Flows (Path Problems)

For queries of `@kind path-problem`, results include code flow information showing the data flow path.

### `codeFlow` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `threadFlows` | ✅ | Array of `threadFlow` objects |

### `threadFlow` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `locations` | ✅ | Array of `threadFlowLocation` objects |

### `threadFlowLocation` Object

| Property | Always Generated | Description |
|---|:---:|---|
| `location` | ✅ | A `location` object for this step in the flow |

## Automation Details

The `category` value from `github/codeql-action/analyze` appears as `<run>.automationDetails.id` in the SARIF output.

Example:
```json
{
  "automationDetails": {
    "id": "/language:javascript-typescript"
  }
}
```

## Key CLI Flags for SARIF

| Flag | Effect |
|---|---|
| `--format=sarif-latest` | Produce SARIF v2.1.0 output |
| `--sarif-category=<cat>` | Set `automationDetails.id` for result categorization |
| `--sarif-add-file-contents` | Include source file content in `artifact.contents` |
| `--ungroup-results` | Report every occurrence separately (no deduplication by location + message) |
| `--output=<file>` | Write SARIF to specified file |

## Backwards Compatibility

- Fields marked "always generated" will never be removed in future versions
- Fields not always generated may change circumstances under which they appear
- New fields may be added without breaking changes
- Consumers should be robust to both presence and absence of optional fields
