# Contoso Support Portal — UX Specification

> **Version:** v2.1  
> **Date:** 2025-11-15  
> **Status:** Final  
> **Approved by:** Design Review Board

---

## 1. Product Overview

| Attribute | Detail |
|-----------|--------|
| **Goal** | Enable enterprise customers to submit categorized support requests with minimal friction |
| **Target User** | Enterprise IT administrators and technical staff needing product support |
| **Success Metric** | 90%+ form completion rate, <2 min average submission time |

---

## 2. Page Structure

- **Page title:** "Submit a Support Request"
- **Subtitle:** "We'll route your request to the right team and respond within 24 hours."
- Single-page form rendered inside a **Card** container
- Maximum form width: **640px**, horizontally centered
- Form sections appear in the following order:

```
┌──────────────────────────────────────┐
│  Submit a Support Request            │
│  We'll route your request to the     │
│  right team and respond within 24h.  │
├──────────────────────────────────────┤
│  § Contact Information               │
│    Full Name                         │
│    Email Address                     │
├──────────────────────────────────────┤
│  § Request Details                   │
│    Category                          │
│    Priority                          │
│    Subject                           │
│    Description                       │
├──────────────────────────────────────┤
│  § Consent                           │
│    ☐ Consent checkbox                │
├──────────────────────────────────────┤
│  § Actions                           │
│    [ Cancel ]  [ Submit Request ]    │
└──────────────────────────────────────┘
```

---

## 3. Required Fields

All fields listed below are **required** and must appear in the specified order.

| # | Field | Type | Label | Placeholder | Required |
|---|-------|------|-------|-------------|----------|
| 1 | Full Name | text input | "Full Name" | "Enter your full name" | Yes |
| 2 | Email Address | email input | "Email Address" | "you@company.com" | Yes |
| 3 | Category | select dropdown | "Category" | "Select a category" | Yes |
| 4 | Priority | radio group | "Priority" | n/a | Yes |
| 5 | Subject | text input | "Subject" | "Brief summary of your issue" | Yes |
| 6 | Description | textarea | "Description" | "Describe your issue in detail..." | Yes |

### 3a. Category Options

The **Category** dropdown must present exactly these options in the listed order:

1. Account Access
2. Billing & Licensing
3. Technical Issue
4. Feature Request
5. Security Concern

### 3b. Priority Options

The **Priority** radio group must present exactly these options in the listed order:

| Value | Display Label |
|-------|---------------|
| `low` | Low — General inquiry |
| `medium` | Medium — Impacting work |
| `high` | High — Blocking issue |
| `critical` | Critical — System down |

---

## 4. Required Validations

Validation must run **on blur** (per-field) and **on submit** (all fields).

| Field | Rule | Error Message |
|-------|------|---------------|
| Full Name | Required, minimum 2 characters | "Full name must be at least 2 characters." |
| Email Address | Required, valid email format | "Please enter a valid email address." |
| Category | Required, must select one option | "Please select a category." |
| Priority | Required, must select one option | "Please select a priority level." |
| Subject | Required, minimum 10 characters | "Subject must be at least 10 characters." |
| Description | Required, minimum 30 characters | "Description must be at least 30 characters." |
| Consent | Must be checked | "You must agree to continue." |

### Additional Validation Behaviors

- **Subject** and **Description** fields must display a character count hint (e.g., "4 / 10 characters") beneath the input to guide the user toward the minimum requirement.
- All validation error messages must appear **inline**, directly below the associated field.
- Error messages must be styled in red text with a ⚠ warning icon prefix.

---

## 5. Required UI States

The form must support exactly five mutually exclusive states:

### 5a. Default

- Empty form with all fields rendered and clear labels visible.
- Submit button is enabled; Cancel button is enabled.
- No error messages displayed.

### 5b. Validation Error

- Inline red error messages appear directly below each invalid field.
- Fields with errors receive a red border highlight.
- Focus moves to the **first** field with an error on failed submission.
- The form remains fully editable.

### 5c. Submitting

- The **Submit Request** button text changes to **"Submitting..."** with a spinner icon.
- All form fields and buttons become **disabled** to prevent duplicate submissions.
- The Cancel button is also disabled during this state.

### 5d. Success

- The entire form is **replaced** by a success confirmation panel containing:
  - A **green checkmark icon** (✓)
  - Message: **"Your support request has been submitted successfully."**
  - Reference number: **"Request ID: SR-XXXXX"** (where XXXXX is a server-assigned identifier)
  - A link: **"Submit Another Request"** that resets the form to the Default state.

### 5e. Error

- An **alert banner** appears **above** the form with the message:  
  _"Something went wrong. Please try again or contact support@contoso.com."_
- The alert uses the design system's destructive/error Alert variant.
- The form **remains editable** so the user can retry submission.

---

## 6. Required Consent

A consent checkbox must appear between the last form field (Description) and the action buttons.

| Property | Value |
|----------|-------|
| **Type** | Checkbox |
| **Label** | "I agree that submitted data may be used to improve our support services" |
| **Default** | Unchecked |
| **Validation** | Must be checked before submission is allowed |
| **Error** | "You must agree to continue." |

The consent checkbox is **not optional** — the form cannot be submitted without it.

---

## 7. Call-to-Action (CTA)

The action bar is right-aligned and contains two buttons:

| Button | Style | Label | Behavior |
|--------|-------|-------|----------|
| Cancel | Ghost / outline (secondary) | "Cancel" | Resets form or navigates away |
| Submit | Primary / filled | "Submit Request" | Submits the form |

**Layout:** Cancel button appears to the **left** of the Submit button.

**During submission:**
- Submit button label changes to **"Submitting..."** with a spinner.
- Both buttons become disabled.

---

## 8. Accessibility Requirements

All of the following accessibility standards are **mandatory** and must be verified:

| Requirement | Implementation |
|-------------|----------------|
| Labels | Every form input must have an associated `<label>` element |
| Required indicator | Required fields must include `aria-required="true"` |
| Error association | Error messages must be linked to their field via `aria-describedby` |
| Focus management | On failed submission, focus must move to the **first** error field |
| Disabled state | Submit button must set `aria-disabled="true"` while the form is submitting |
| Live regions | Success and error state containers must use `role="alert"` for screen reader announcement |
| Non-color indicators | Color must **not** be the sole indicator of errors — always include icons and descriptive text |

---

## 9. Design Constraints

| Constraint | Value |
|------------|-------|
| Component library | Shared design system: `Button`, `Input`, `Label`, `Select`, `Textarea`, `Card`, `Alert`, `Badge` |
| Max form width | 640px, horizontally centered |
| Field spacing | 16px vertical gap between form groups |
| Section headers | Medium weight, 14px, uppercase letter-spacing |
| Responsive | Form must remain usable at 320px viewport width |

---

## 10. Must-Not Constraints

The following are **explicitly out of scope** for v2.1 and must not be implemented:

| Constraint | Rationale |
|------------|-----------|
| ❌ Do **NOT** collect phone number | Not required for support routing |
| ❌ Do **NOT** collect physical address | Not required for digital support |
| ❌ Do **NOT** auto-subscribe user to marketing communications | Violates consent boundaries |
| ❌ Do **NOT** allow file uploads | Out of scope for v2.1; planned for v3.0 |
| ❌ Do **NOT** store credit card or payment information | Security and PCI compliance boundary |

---

*End of specification. For implementation questions, contact the UX team or refer to the design system documentation.*
