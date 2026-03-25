# Figma Design Contract — Support Request Form

> **Exported from Figma via MCP (Model Context Protocol)**
>
> **Figma File:** [`Contoso Support Portal — UX Design`](https://www.figma.com/design/vDrNlg5h48P3K4JfDC5D3W)
> **File Key:** `vDrNlg5h48P3K4JfDC5D3W`
> **Page:** `Submit Support Request`
> **Last synced:** `2026-03-25T15:56:00Z`
> **Exported by:** Figma MCP (`https://mcp.figma.com/mcp`)

---

## 1. Component Tree

Extracted from Figma node tree via `get_design_context` MCP tool.

```
Page: Submit Support Request
│
├── Frame: "Submit Request / Default" (nodeId: 3:2)
│   ├── PageHeader
│   │   ├── Title: "Submit a Support Request" (24px / Inter Bold)
│   │   └── Subtitle: "We'll route your request to the right team and respond within 24 hours." (16px / Inter Regular)
│   └── Card: FormContainer (max-width: 640px, centered, cornerRadius: 8px, shadow: 0 1px 3px rgba(0,0,0,0.1))
│       ├── Section: ContactInformation
│       │   ├── SectionHeader: "CONTACT INFORMATION" (12px / Inter Semi Bold / uppercase / letter-spacing: 5%)
│       │   ├── FormField: Full Name (TextInput, required, placeholder: "Enter your full name")
│       │   └── FormField: Email Address (TextInput, required, placeholder: "you@company.com")
│       ├── Section: RequestDetails
│       │   ├── SectionHeader: "REQUEST DETAILS" (12px / Inter Semi Bold / uppercase / letter-spacing: 5%)
│       │   ├── FormField: Category (Select, required, placeholder: "Select a category")
│       │   │   └── Options: ["Account Access", "Billing & Licensing", "Technical Issue", "Feature Request", "Security Concern"]
│       │   ├── FormField: Priority (RadioGroup, required)
│       │   │   ├── Radio: Low — General inquiry
│       │   │   ├── Radio: Medium — Impacting work
│       │   │   ├── Radio: High — Blocking issue
│       │   │   └── Radio: Critical — System down
│       │   ├── FormField: Subject (TextInput, required, placeholder: "Brief summary of your issue")
│       │   └── FormField: Description (Textarea, required, height: 96px, placeholder: "Describe your issue in detail...")
│       ├── Section: Consent
│       │   ├── SectionHeader: "CONSENT" (12px / Inter Semi Bold / uppercase / letter-spacing: 5%)
│       │   └── Checkbox: DataUsageConsent (required)
│       │       └── Label: "I agree that submitted data may be used to improve our support services"
│       └── Section: Actions (right-aligned, gap: 12px)
│           ├── Button: Cancel (variant: outline, cornerRadius: 6px, border: #D1D5DB)
│           └── Button: Submit Request (variant: primary, cornerRadius: 6px, fill: #2563EB)
│
├── Frame: "Submit Request / Validation Error" (nodeId: 4:2)
│   └── Card: FormContainer
│       ├── All fields show inline error messages with ⚠ warning icon prefix
│       ├── Error text color: #DC2626 (12px / Inter Regular)
│       ├── Error fields have red borders (stroke: #DC2626, strokeWeight: 2px)
│       ├── FormField: Full Name → "Full name must be at least 2 characters."
│       ├── FormField: Email Address → "Please enter a valid email address."
│       ├── FormField: Category → "Please select a category."
│       ├── FormField: Priority → "Please select a priority level."
│       ├── FormField: Subject → "Subject must be at least 10 characters."
│       ├── FormField: Description → "Description must be at least 30 characters."
│       └── Checkbox: DataUsageConsent → "You must agree to continue." (checkbox border: #DC2626)
│
├── Frame: "Submit Request / Submitting" (nodeId: 6:2)
│   └── Card: FormContainer
│       ├── All fields disabled (opacity: 0.6, background: #F3F4F6)
│       ├── Labels dimmed (color: #6B7280)
│       ├── Checkbox shown as checked (fill: #2563EB)
│       ├── Button: Cancel (disabled, opacity: 0.5)
│       └── Button: Submitting (fill: #5E8DE7, spinner icon + "Submitting..." label)
│           └── Spinner: 16px circle, stroke: white, dashPattern: [8, 8]
│
├── Frame: "Submit Request / Success" (nodeId: 7:2)
│   └── Card: SuccessConfirmation (replaces FormContainer, centered content)
│       ├── Icon: CheckCircle (48px, green circle background: #DCFCE7, checkmark: #16A34A)
│       ├── Text: "Your support request has been submitted successfully." (18px / Inter Medium)
│       ├── Text: "A member of our team will follow up within 24 hours." (14px / Inter Regular / #6B7280)
│       ├── Text: "Request ID: SR-48291" (14px / Inter Medium / #6B7280)
│       └── Link: "Submit Another Request" (14px / Inter Medium / #2563EB / underline) → resets to Default
│
└── Frame: "Submit Request / Error" (nodeId: 7:13)
    ├── Alert: ErrorBanner (above FormContainer)
    │   ├── Background: #FEE2E2, Border: #DC2626 (1px), cornerRadius: 8px
    │   ├── Icon: ⚠ (16px, #DC2626)
    │   └── Text: "Something went wrong. Please try again or contact support@contoso.com." (#DC2626)
    └── Card: FormContainer (identical to Default but with filled-in values, fully editable)
```

---

## 2. Design Tokens (Figma Variables)

Extracted from Figma variable collections via `get_variable_defs` MCP tool.

### Collection: Spacing

| Variable               | Type    | Value   | Usage                          |
| ---------------------- | ------- | ------- | ------------------------------ |
| `spacing/form-gap`     | `FLOAT` | `16px`  | Between form field groups      |
| `spacing/section`      | `FLOAT` | `24px`  | Between form sections          |

### Collection: Colors

| Variable                   | Type    | Value                 | Usage                           |
| -------------------------- | ------- | --------------------- | ------------------------------- |
| `color/error`              | `COLOR` | `#DC2626` (red-600)   | Error text and borders          |
| `color/success`            | `COLOR` | `#16A34A` (green-600) | Success icons and text          |
| `color/primary`            | `COLOR` | `#2563EB` (blue-600)  | Primary button fill             |
| `color/outline`            | `COLOR` | `#D1D5DB` (gray-300)  | Outline button border           |
| `color/background`         | `COLOR` | `#FFFFFF`             | Card and input backgrounds      |
| `color/surface`            | `COLOR` | `#F9FAFB` (gray-50)   | Page background                 |
| `color/text-primary`       | `COLOR` | `#111827` (gray-900)  | Headings, labels, body text     |
| `color/text-secondary`     | `COLOR` | `#6B7280` (gray-500)  | Subtitles, helper text          |
| `color/error-background`   | `COLOR` | `#FEE2E2` (red-50)    | Error alert banner background   |
| `color/success-background` | `COLOR` | `#DCFCE7` (green-50)  | Success icon circle background  |

### Collection: Radius

| Variable           | Type    | Value  | Usage                     |
| ------------------ | ------- | ------ | ------------------------- |
| `radius/card`      | `FLOAT` | `8px`  | Form card border radius   |
| `radius/input`     | `FLOAT` | `6px`  | Input field border radius |

### Typography (from text styles)

| Token                | Value                              | Usage                          |
| -------------------- | ---------------------------------- | ------------------------------ |
| `font-page-title`    | `24px / Inter Bold`                | Page heading                   |
| `font-section-label` | `12px / Inter Semi Bold / uppercase / letter-spacing: 5%` | Section headers |
| `font-field-label`   | `14px / Inter Medium`              | Form field labels              |
| `font-body`          | `16px / Inter Regular`             | Subtitle and body text         |
| `font-input`         | `14px / Inter Regular`             | Input text and placeholders    |
| `font-error`         | `12px / Inter Regular`             | Inline error messages          |

### Effects

| Token            | Value                              | Usage                          |
| ---------------- | ---------------------------------- | ------------------------------ |
| `shadow-card`    | `0 1px 3px rgba(0,0,0,0.1)`       | Card drop shadow               |

---

## 3. Required States (from Figma Frames)

| State              | Frame Name                              | Node ID  | Description                                                                 |
| ------------------ | --------------------------------------- | -------- | --------------------------------------------------------------------------- |
| **Default**        | `Submit Request / Default`              | `3:2`    | Empty form, all fields in their default idle state. Submit enabled.          |
| **ValidationError**| `Submit Request / Validation Error`     | `4:2`    | All fields display inline ⚠ error messages with red borders (#DC2626).      |
| **Submitting**     | `Submit Request / Submitting`           | `6:2`    | Spinner on submit button ("Submitting..."); all fields disabled (opacity 0.6). |
| **Success**        | `Submit Request / Success`              | `7:2`    | Form replaced by success card with CheckCircle icon, request ID, and reset link. |
| **Error**          | `Submit Request / Error`                | `7:13`   | Error alert banner (#FEE2E2 bg) above form; form remains fully editable.    |

---

## 4. Visual Hierarchy

1. **Page title and subtitle** — establishes context before the user interacts.
2. **Form card** — white card with `8px` radius and subtle drop shadow, max-width `640px`, centered.
3. **Section headers** — `12px` uppercase labels with `5%` letter-spacing create clear grouping.
4. **Form fields** — equal visual weight; `16px` vertical gap between field groups.
5. **Consent checkbox** — visible but visually subordinate to form fields.
6. **Action buttons** — right-aligned; Primary CTA (`Submit Request`, `#2563EB`) is dominant; `Cancel` is outline/secondary.
7. **Success / Error states** — contextual; only visible when triggered by user action.

---

## 5. Constraints from Design Review

- Form card **must not exceed `640px`** in width and must be horizontally centered.
- Form card uses `cornerRadius: 8px` and `shadow: 0 1px 3px rgba(0,0,0,0.1)`.
- Input fields use `cornerRadius: 6px` and `1px` gray-300 border (`#D1D5DB`).
- **Submit button must be the primary visual action** — uses `variant: primary` with `fill: #2563EB`.
- **Cancel must be visually secondary** — uses `variant: outline` with `border: #D1D5DB`.
- **Error messages must appear directly below their respective fields**, not grouped at the top.
- Error messages use `⚠` icon prefix + `#DC2626` red text at `12px`.
- **Success state replaces the entire form** — it is not an overlay, modal, or toast.
- Success icon is a `48px` green circle with `#DCFCE7` background and `#16A34A` checkmark.
- The form must be keyboard-navigable and meet **WCAG 2.1 AA** contrast requirements.
- All required fields must show a **visible required indicator** (asterisk `*` in label text).
- Section headers use `12px / Semi Bold / uppercase / 5% letter-spacing` in `#6B7280`.

---

## 6. Figma-to-Code Mapping

| Figma Component       | Expected Code Component                            |
| --------------------- | -------------------------------------------------- |
| `TextInput`           | `<Input>` from `@workspace/ui`                     |
| `Select`              | `<Select>` from `@workspace/ui`                    |
| `RadioGroup`          | `<RadioGroup>` from `@workspace/ui`                |
| `Textarea`            | `<Textarea>` from `@workspace/ui`                  |
| `Checkbox`            | `<Checkbox>` from `@workspace/ui`                  |
| `Button (primary)`    | `<Button>` from `@workspace/ui`                    |
| `Button (outline)`    | `<Button variant="outline">` from `@workspace/ui`  |
| `Card`                | `<Card>` from `@workspace/ui`                      |
| `Alert`               | `<Alert>` from `@workspace/ui`                     |
| `CheckCircle Icon`    | `<CheckCircle>` from `lucide-react`                |
| `SectionHeader`       | `<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">` |
| `ErrorMessage`        | `<p className="text-xs text-red-600">⚠ {message}</p>` |

---

## 7. Figma Source References

| Resource                     | URL / Identifier                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **Figma File**               | [`Contoso Support Portal — UX Design`](https://www.figma.com/design/vDrNlg5h48P3K4JfDC5D3W) |
| **File Key**                 | `vDrNlg5h48P3K4JfDC5D3W`                                                            |
| **MCP Server**               | `https://mcp.figma.com/mcp`                                                          |
| **Variable Collections**     | `Spacing` (2 vars), `Colors` (10 vars), `Radius` (2 vars)                           |
| **Frame: Default**           | `nodeId: 3:2`                                                                         |
| **Frame: Validation Error**  | `nodeId: 4:2`                                                                         |
| **Frame: Submitting**        | `nodeId: 6:2`                                                                         |
| **Frame: Success**           | `nodeId: 7:2`                                                                         |
| **Frame: Error**             | `nodeId: 7:13`                                                                        |

---

> **Note:** This contract was exported via the **Figma MCP server** (`https://mcp.figma.com/mcp`)
> using `use_figma`, `get_design_context`, and `get_variable_defs` tools. It reflects the
> component structure, design tokens, and constraints defined in the canonical Figma source of truth.
>
> The Figma file contains 3 variable collections (Spacing, Colors, Radius) with 14 design tokens
> and 5 state frames covering all required UI states from the UX specification.
>
> **CI Integration:** This file is committed to the repository because the Figma MCP requires
> browser authentication and cannot run headless in CI. The CI agent
> (`.github/agents/figma-design-review.agent.md`) reads this committed contract to evaluate
> design drift, rather than querying Figma directly.
>
> Any implementation that deviates from this contract should be flagged during CI design-drift checks.
