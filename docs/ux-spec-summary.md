# UX Spec Summary — Support Request Form

> **Reference:** [ux-spec.md](./ux-spec.md) v2.1 · 2025-11-15 · Approved by Design Review Board

## Form Fields

| # | Field | Type | Min Length |
|---|-------|------|-----------|
| 1 | Full Name | text | 2 chars |
| 2 | Email Address | email | valid format |
| 3 | Category | select | 1 selected |
| 4 | Priority | radio | 1 selected |
| 5 | Subject | text | 10 chars |
| 6 | Description | textarea | 30 chars |

## Quick Reference Checklist

```
✅ 6 required fields (Name, Email, Category, Priority, Subject, Description)
✅ 5 UI states (Default, Validation Error, Submitting, Success, Error)
✅ Consent checkbox required before submission
✅ CTA: "Submit Request" / "Cancel"
✅ Full accessibility (labels, aria-required, aria-describedby, focus management)
✅ Inline validation on blur and on submit
✅ Success state shows "Request ID: SR-XXXXX" reference
✅ Max form width 640px, 16px spacing, design system components
❌ Must NOT collect: phone, address, payment info
❌ Must NOT auto-subscribe to marketing
❌ Must NOT allow file uploads (planned for v3.0)
```

## Key Behaviors

- **Submitting →** Button shows "Submitting..." + spinner; all fields disabled.
- **Success →** Form replaced by green ✓ confirmation + request ID + "Submit Another Request" link.
- **Error →** Alert banner above form; form stays editable for retry.

---

*Full specification: [ux-spec.md](./ux-spec.md)*
