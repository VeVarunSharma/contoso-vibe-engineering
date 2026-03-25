# Figma Design Contract — Support Request Form

> **Exported from Figma via Design-to-Code MCP Adapter**
>
> Frame: `Support Portal / Submit Request v2.1`
> Last synced: `2025-11-15T14:32:00Z`

---

## 1. Component Tree

```
Page: SubmitSupportRequest
├── PageHeader
│   ├── Title: "Submit a Support Request"
│   └── Subtitle: "We'll route your request to the right team and respond within 24 hours."
├── Card: FormContainer (max-width: 640px, centered)
│   ├── Section: ContactInformation
│   │   ├── FormField: FullName (TextInput, required)
│   │   └── FormField: EmailAddress (TextInput, required)
│   ├── Section: RequestDetails
│   │   ├── FormField: Category (Select, required)
│   │   │   └── Options: ["Account Access", "Billing & Licensing", "Technical Issue", "Feature Request", "Security Concern"]
│   │   ├── FormField: Priority (RadioGroup, required)
│   │   │   └── Options: ["Low", "Medium", "High", "Critical"]
│   │   ├── FormField: Subject (TextInput, required)
│   │   └── FormField: Description (Textarea, required, minRows: 4)
│   ├── Section: Consent
│   │   └── Checkbox: DataUsageConsent (required)
│   │       └── Label: "I agree that submitted data may be used to improve our support services"
│   └── Section: Actions
│       ├── Button: Cancel (variant: outline)
│       └── Button: SubmitRequest (variant: primary, label: "Submit Request")
├── State: SuccessConfirmation (replaces FormContainer)
│   ├── Icon: CheckCircle (color: success, size: 48px)
│   ├── Text: "Your support request has been submitted successfully."
│   ├── Text: "A member of our team will follow up within 24 hours."
│   └── Link: "Submit Another Request" → resets to Default state
└── State: ErrorBanner (above FormContainer)
    └── Alert: "Something went wrong. Please try again or contact us directly at support@contoso.com."
```

---

## 2. Design Tokens

| Token                | Value                          | Usage                          |
| -------------------- | ------------------------------ | ------------------------------ |
| `spacing-form-gap`   | `16px`                         | Between form groups            |
| `spacing-section`    | `24px`                         | Between form sections          |
| `color-error`        | `red-600` (`#DC2626`)          | Error text and borders         |
| `color-success`      | `green-600` (`#16A34A`)        | Success icons and text         |
| `color-primary`      | `blue-600` (`#2563EB`)         | Primary button background      |
| `color-outline`      | `gray-300` (`#D1D5DB`)         | Outline button border          |
| `radius-card`        | `8px`                          | Form card border radius        |
| `radius-input`       | `6px`                          | Input field border radius      |
| `font-page-title`    | `24px / bold`                  | Page heading                   |
| `font-section-label` | `14px / uppercase / medium`    | Section headers                |
| `font-body`          | `16px / regular`               | Form labels and body text      |
| `shadow-card`        | `0 1px 3px rgba(0,0,0,0.1)`   | Card elevation                 |

---

## 3. Required States (from Figma Frames)

| State              | Frame Name                              | Description                                                                 |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------- |
| **Default**        | `Submit Request / Default`              | Empty form, all fields in their default idle state.                         |
| **ValidationError**| `Submit Request / Validation Error`     | One or more fields display inline error messages with red borders.          |
| **Submitting**     | `Submit Request / Submitting`           | Submit button shows a loading spinner; all fields are disabled.             |
| **Success**        | `Submit Request / Success`              | Form is replaced by a success confirmation message with a check icon.      |
| **Error**          | `Submit Request / Error`                | A dismissible error banner appears above the form; fields remain editable. |

---

## 4. Visual Hierarchy

1. **Page title and subtitle** — establishes context before the user interacts.
2. **Form fields** — equal visual weight; no single field dominates.
3. **Consent checkbox** — must be visible but not visually compete with form fields.
4. **Action buttons** — Primary CTA (`Submit Request`) is dominant; `Cancel` is secondary.
5. **Success / Error states** — contextual; only visible when triggered by user action.

---

## 5. Constraints from Design Review

- Form card **must not exceed `640px`** in width and must be horizontally centered.
- **Submit button must be the primary visual action** — uses `variant: primary` with brand color.
- **Cancel must be visually secondary** — uses `variant: outline` (ghost / outline style).
- **Error messages must appear directly below their respective fields**, not grouped at the top.
- **Success state replaces the entire form** — it is not an overlay, modal, or toast.
- The form must be keyboard-navigable and meet **WCAG 2.1 AA** contrast requirements.
- All required fields must show a **visible required indicator** (asterisk or label annotation).

---

## 6. Figma-to-Code Mapping

| Figma Component      | Expected Code Component                            |
| -------------------- | -------------------------------------------------- |
| `TextInput`          | `<Input>` from `@workspace/ui`                     |
| `Select`             | `<Select>` from `@workspace/ui`                    |
| `RadioGroup`         | `<RadioGroup>` from `@workspace/ui`                |
| `Textarea`           | `<Textarea>` from `@workspace/ui`                  |
| `Checkbox`           | `<Checkbox>` from `@workspace/ui`                  |
| `Button (primary)`   | `<Button>` from `@workspace/ui`                    |
| `Button (outline)`   | `<Button variant="outline">` from `@workspace/ui`  |
| `Card`               | `<Card>` from `@workspace/ui`                      |
| `Alert`              | `<Alert>` from `@workspace/ui`                     |
| `CheckCircle Icon`   | `<CheckCircle>` from `lucide-react`                |

---

> **Note:** This contract was generated by the **Design-to-Code MCP adapter**. It reflects the
> component structure, tokens, and constraints defined in the canonical Figma source of truth.
> For the full Figma source, see the linked frame in the
> [Contoso Design System workspace](https://figma.com/file/contoso-design-system).
>
> Any implementation that deviates from this contract should be flagged during CI design-drift checks.
