"use client";

import { TicketReview } from "@/components/ticket-review";
import { SAMPLE_TICKET } from "@/lib/sample-ticket";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  previewResponseSchema,
  ticketFormSchema,
  type IssueDraft,
  type PublishingAvailability,
  type TicketFormData,
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
  ArrowRight,
  Check,
  FileText,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";

const EMPTY_TICKET: TicketFormData = {
  name: "",
  email: "",
  category: "bug",
  priority: "medium",
  subject: "",
  description: "",
};

interface TicketFormProps {
  publishing?: PublishingAvailability;
}

export function TicketForm({
  publishing = { mode: "preview" },
}: TicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>(EMPTY_TICKET);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [draft, setDraft] = useState<IssueDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const currentStep = draft ? (complete ? 2 : 1) : 0;

  function updateField<Key extends keyof TicketFormData>(
    field: Key,
    value: TicketFormData[Key],
  ) {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setNotice("");
    setError(null);
  }

  function resetReport() {
    setFormData(EMPTY_TICKET);
    setDraft(null);
    setComplete(false);
    setErrors({});
    setError(null);
    setNotice("Report cleared. Nothing was stored by this portal.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setError(null);
    setNotice("");

    const parsed = ticketFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const firstField = String(parsed.error.issues[0]?.path[0]);
      formRef.current
        ?.querySelector<HTMLElement>(`[id="${firstField}"]`)
        ?.focus();
      return;
    }

    setIsPreparing(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/tickets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      const data = previewResponseSchema.safeParse(await response.json());
      if (!data.success) {
        setError(
          "The server returned an invalid draft. Your report is still here; try preparing it again.",
        );
      } else if (!data.data.success) {
        setError(data.data.error);
      } else if (!response.ok) {
        setError(
          "The server could not prepare the draft. Your report is still here; try again.",
        );
      } else {
        setFormData(parsed.data);
        setDraft(data.data.draft);
      }
    } catch {
      setError(
        "Could not reach the preview service. Check your connection and try again. Your report has not been cleared.",
      );
    } finally {
      clearTimeout(timeout);
      setIsPreparing(false);
    }
  }

  return (
    <section
      aria-label="Support report workflow"
      className="space-y-8 dark:[--destructive:var(--destructive-foreground)]"
    >
      <ol
        aria-label="Handoff progress"
        className="grid grid-cols-3 gap-3 border-b pb-5"
      >
        {["Describe", "Review", "Handoff"].map((step, index) => (
          <li
            key={step}
            aria-current={index === currentStep ? "step" : undefined}
            className={`flex items-center gap-2 text-sm ${index === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {index < currentStep ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {draft ? (
        <TicketReview
          ticket={formData}
          draft={draft}
          publishing={publishing}
          complete={complete}
          onComplete={() => setComplete(true)}
          onEdit={() => {
            setDraft(null);
            setComplete(false);
          }}
          onReset={resetReport}
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-xl">Describe the problem</h2>
              </CardTitle>
              <CardDescription>
                Give engineering the context needed to take the next step.
              </CardDescription>
              <Button
                variant="outline"
                className="mt-2 min-h-11 justify-self-start"
                disabled={isPreparing}
                onClick={() => {
                  setFormData({ ...SAMPLE_TICKET });
                  setErrors({});
                  setError(null);
                  setNotice(
                    "Synthetic sample loaded. No customer data is included.",
                  );
                }}
              >
                <FlaskConical aria-hidden="true" />
                Use sample report
              </Button>
              <p role="status" className="text-sm leading-relaxed">
                {notice}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  aria-label="Preview error"
                  className="*:data-[slot=alert-description]:text-destructive"
                >
                  <AlertCircle aria-hidden="true" />
                  <AlertTitle>Draft not prepared</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                aria-busy={isPreparing}
              >
                <fieldset disabled={isPreparing} className="space-y-5">
                  <legend className="sr-only">Report details</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Reporter name</Label>
                      <Input
                        id="name"
                        autoComplete="name"
                        placeholder="Your name"
                        required
                        maxLength={100}
                        className="min-h-11"
                        value={formData.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        aria-invalid={!!errors.name}
                        aria-describedby={
                          errors.name ? "name-error" : undefined
                        }
                      />
                      {errors.name && (
                        <p id="name-error" className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Reporter email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        className="min-h-11"
                        value={formData.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        aria-invalid={!!errors.email}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                      />
                      {errors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-destructive"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          updateField(
                            "category",
                            ticketFormSchema.shape.category.parse(value),
                          )
                        }
                      >
                        <SelectTrigger
                          id="category"
                          className="min-h-11 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TICKET_CATEGORIES.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                              className="min-h-11"
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Reported priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          updateField(
                            "priority",
                            ticketFormSchema.shape.priority.parse(value),
                          )
                        }
                      >
                        <SelectTrigger
                          id="priority"
                          className="min-h-11 w-full"
                          aria-describedby="priority-help"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TICKET_PRIORITIES.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                              className="min-h-11"
                            >
                              {priority.label} - {priority.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p
                    id="priority-help"
                    className="text-xs leading-relaxed text-muted-foreground"
                  >
                    You choose the category and priority. The template does not
                    assess severity or assign a team.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      required
                      maxLength={120}
                      placeholder="A short, specific summary"
                      className="min-h-11"
                      value={formData.subject}
                      onChange={(event) =>
                        updateField("subject", event.target.value)
                      }
                      aria-invalid={!!errors.subject}
                      aria-describedby={
                        errors.subject ? "subject-error" : undefined
                      }
                    />
                    {errors.subject && (
                      <p
                        id="subject-error"
                        className="text-sm text-destructive"
                      >
                        {errors.subject}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description and evidence
                    </Label>
                    <Textarea
                      id="description"
                      required
                      maxLength={5000}
                      rows={7}
                      placeholder="What happened? Include steps, expected and actual behavior, business impact, and any workaround. Use synthetic or approved data only."
                      className="min-h-40 resize-y"
                      value={formData.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      aria-invalid={!!errors.description}
                      aria-describedby={
                        errors.description
                          ? "description-error description-count"
                          : "description-help description-count"
                      }
                    />
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      {errors.description ? (
                        <p id="description-error" className="text-destructive">
                          {errors.description}
                        </p>
                      ) : (
                        <p id="description-help">
                          20 characters minimum. Never include credentials.
                        </p>
                      )}
                      <p id="description-count">
                        {formData.description.length} / 5000
                      </p>
                    </div>
                  </div>
                  {formData.category === "security" && (
                    <Alert>
                      <AlertCircle aria-hidden="true" />
                      <AlertTitle>Private handoff only</AlertTitle>
                      <AlertDescription>
                        Use synthetic details here. Security concerns cannot be
                        published by this portal; use your approved private
                        reporting channel.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="min-h-11 w-full"
                    disabled={isPreparing}
                  >
                    {isPreparing ? (
                      <Loader2
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowRight aria-hidden="true" />
                    )}
                    {isPreparing
                      ? "Preparing template draft..."
                      : "Review issue draft"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Preview only. This action does not create a GitHub issue or
                    call AI.
                  </p>
                </fieldset>
              </form>
            </CardContent>
          </Card>

          <aside aria-label="Report guidance" className="space-y-7 lg:pt-2">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="font-semibold">Try a realistic report</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A support team cannot find confirmed orders. Use the synthetic
                example to see what engineering receives.
              </p>
            </section>
            <section className="space-y-3 border-t pt-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <FileText
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                Leave with a useful handoff
              </h2>
              <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>A structured issue title and description.</li>
                <li>Suggested labels with traceable rules.</li>
                <li>A Markdown file and checks for the receiving team.</li>
              </ul>
            </section>
            <section className="space-y-3 border-t pt-6">
              <Badge variant="secondary">Template preview</Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No sign-in required. Reports are processed by this server, not
                stored by the portal. Downloaded files include the reporter
                details.
              </p>
              {publishing.mode === "unavailable" ? (
                <Alert
                  variant="destructive"
                  className="*:data-[slot=alert-description]:text-destructive"
                >
                  <AlertTitle>Live publishing unavailable</AlertTitle>
                  <AlertDescription>{publishing.reason}</AlertDescription>
                </Alert>
              ) : publishing.mode !== "preview" ? (
                <p className="text-sm leading-relaxed">
                  Optional live publishing to{" "}
                  <strong className="break-all">{publishing.repository}</strong>{" "}
                  is available after review and confirmation.
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  GitHub publishing is disabled in this session.
                </p>
              )}
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}
