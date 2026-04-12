import { z } from "zod";

export const TICKET_CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "General Question" },
  { value: "docs", label: "Documentation" },
  { value: "security", label: "Security Concern" },
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
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  category: z.enum(["bug", "feature", "question", "docs", "security"], {
    message: "Please select a category",
  }),
  priority: z.enum(["low", "medium", "high", "critical"], {
    message: "Please select a priority",
  }),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(120, "Subject must be under 120 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

export interface TicketResponse {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  title?: string;
  labels?: string[];
  error?: string;
}
