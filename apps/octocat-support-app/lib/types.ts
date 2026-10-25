import { z } from "zod";

export const TICKET_CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "General Question" },
  { value: "docs", label: "Documentation" },
  { value: "security", label: "Security Concern (private handoff only)" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low", description: "Minor issue, no rush" },
  { value: "medium", label: "Medium", description: "Affects workflow" },
  { value: "high", label: "High", description: "Significant impact" },
  { value: "critical", label: "Critical", description: "Blocking / outage" },
] as const;

export const ticketFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.email({ error: "Please enter a valid email address" }),
  category: z.enum(["bug", "feature", "question", "docs", "security"], {
    error: "Please select a category",
  }),
  priority: z.enum(["low", "medium", "high", "critical"], {
    error: "Please select a priority",
  }),
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(120, "Subject must be under 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

export const createTicketSchema = ticketFormSchema.extend({
  confirmSubmission: z.literal(true, {
    error: "Confirm sharing this report before creating a GitHub issue.",
  }),
});

export const issueDraftSchema = z.object({
  title: z.string().min(1).max(72),
  body: z.string().min(1),
  labels: z.array(z.string()),
});

export type IssueDraft = z.infer<typeof issueDraftSchema>;

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export const previewResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    mode: z.literal("template-preview"),
    draft: issueDraftSchema,
  }),
  errorResponseSchema,
]);

export type PreviewResponse = z.infer<typeof previewResponseSchema>;

export const ticketResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    issueUrl: z.url().refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "github.com" &&
        /^\/[^/]+\/[^/]+\/issues\/\d+$/.test(url.pathname)
      );
    }),
    issueNumber: z.number().int().positive(),
    title: z.string().min(1),
    labels: z.array(z.string()),
  }),
  errorResponseSchema,
]);

export type TicketResponse = z.infer<typeof ticketResponseSchema>;

export type PublishingAvailability =
  | { mode: "preview" }
  | { mode: "unavailable"; reason: string }
  | { mode: "direct" | "copilot"; repository: string };
