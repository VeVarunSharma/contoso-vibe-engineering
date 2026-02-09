"use client";

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  ticketFormSchema,
  type TicketFormData,
  type TicketResponse,
} from "@/lib/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export function TicketForm() {
  const [formData, setFormData] = useState<Partial<TicketFormData>>({
    name: "",
    email: "",
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TicketResponse | null>(null);

  function updateField(field: keyof TicketFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setResult(null);

    // Validate
    const parsed = ticketFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data: TicketResponse = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      setResult(data);

      // Reset form on success
      if (data.success) {
        setFormData({
          name: "",
          email: "",
          subject: "",
          description: "",
        });
      }
    } catch {
      setResult({
        success: false,
        error: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {result?.success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle className="text-green-500 font-semibold">
            Ticket Created Successfully!
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Your support ticket has been filed as GitHub Issue{" "}
              <strong>#{result.issueNumber}</strong> and will be triaged by our
              team.
            </p>
            {result.title && (
              <p className="text-sm font-medium">{result.title}</p>
            )}
            {result.labels && result.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
            {result.issueUrl && (
              <a
                href={result.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-green-500 hover:underline mt-2"
              >
                View on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {result && !result.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit a Support Ticket
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by GitHub Copilot — your message will be intelligently
            parsed into an actionable, triageable GitHub issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name & Email row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Category & Priority row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField("category", value)}
                >
                  <SelectTrigger id="category" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => updateField("priority", value)}
                >
                  <SelectTrigger id="priority" aria-invalid={!!errors.priority}>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        <div className="flex flex-col">
                          <span>{pri.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {pri.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority}</p>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue or request"
                value={formData.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                aria-invalid={!!errors.subject}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail. For bugs, include steps to reproduce. For features, describe the desired behavior and why it matters."
                rows={6}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                aria-invalid={!!errors.description}
                className="resize-y min-h-[120px]"
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-sm text-destructive">
                    {errors.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Min 20 characters
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description?.length ?? 0} / 5000
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is triaging your ticket...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
