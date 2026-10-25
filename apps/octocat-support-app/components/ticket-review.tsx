"use client";

import { formatDraftMarkdown } from "@/lib/ticket-draft";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  ticketResponseSchema,
  type IssueDraft,
  type PublishingAvailability,
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
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TicketReviewProps {
  ticket: TicketFormData;
  draft: IssueDraft;
  publishing: PublishingAvailability;
  complete: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onReset: () => void;
}

export function TicketReview({
  ticket,
  draft,
  publishing,
  complete,
  onComplete,
  onEdit,
  onReset,
}: TicketReviewProps) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<Extract<
    TicketResponse,
    { success: true }
  > | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const markdown = formatDraftMarkdown(draft);
  const canPublish =
    publishing.mode === "direct" || publishing.mode === "copilot";

  useEffect(() => {
    headingRef.current?.focus();
  }, [complete]);

  function downloadDraft() {
    setError(null);
    try {
      const url = URL.createObjectURL(
        new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "support-handoff.md";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "Download started: support-handoff.md. Nothing was sent to GitHub.",
      );
      onComplete();
    } catch {
      setError(
        "The download could not start. Copy the Markdown instead, or check your browser's download settings.",
      );
    }
  }

  async function copyDraft() {
    setError(null);
    try {
      await navigator.clipboard.writeText(markdown);
      setNotice("Markdown copied. Nothing was sent to GitHub.");
      onComplete();
    } catch {
      setError(
        "Clipboard access was denied. Download the Markdown handoff instead.",
      );
    }
  }

  async function publishIssue() {
    if (!confirmed || isPublishing || createdIssue) return;
    setError(null);
    setNotice("");
    setIsPublishing(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, confirmSubmission: true }),
        signal: controller.signal,
      });
      const data = ticketResponseSchema.safeParse(await response.json());
      if (!data.success || (!response.ok && data.data.success)) {
        setError(
          "Creation was not confirmed. Check the destination repository before retrying to avoid a duplicate. Your local draft is still available.",
        );
      } else if (!data.data.success) {
        setError(data.data.error);
      } else {
        setCreatedIssue(data.data);
        setConfirmed(false);
        onComplete();
      }
    } catch {
      setError(
        "The connection ended before creation was confirmed. Check the repository before retrying. You can still download the local draft.",
      );
    } finally {
      clearTimeout(timeout);
      setIsPublishing(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl outline-offset-4"
            >
              {createdIssue
                ? "GitHub issue created"
                : complete
                  ? "Your handoff is ready"
                  : "Review the issue draft"}
            </h2>
          </CardTitle>
          <CardDescription>
            {createdIssue
              ? "GitHub confirmed creation. Open the issue to verify its content and choose an owner."
              : complete
                ? "Share the Markdown through your approved channel, then confirm the open questions with engineering."
                : "Check the source report and suggested labels before sharing. This is a template preview, not AI analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert
              variant="destructive"
              aria-label="Handoff action error"
              className="*:data-[slot=alert-description]:text-destructive"
            >
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Action not completed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {complete && !createdIssue && (
            <Alert role="status">
              <CheckCircle2 aria-hidden="true" />
              <AlertTitle>Local handoff only</AlertTitle>
              <AlertDescription>
                {notice} No issue number or assignment has been generated.
              </AlertDescription>
            </Alert>
          )}
          <section aria-label="Issue summary" className="space-y-3">
            <h3 className="text-lg font-semibold leading-snug break-words">
              {createdIssue?.title ?? draft.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(createdIssue?.labels ?? draft.labels).map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </section>
          {complete ? (
            <section className="space-y-3 border-t pt-5">
              <h3 className="font-semibold">
                Next: agree the engineering action
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Confirm the reproduction steps and expected behavior.</li>
                <li>
                  Verify impact and reported priority with the support lead.
                </li>
                <li>
                  Remove sensitive details and choose an engineering owner.
                </li>
              </ul>
              <details className="pt-2">
                <summary className="min-h-11 cursor-pointer rounded-md py-3 text-sm font-medium outline-offset-4 focus-visible:outline-2">
                  Inspect the original template handoff
                </summary>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
                  {markdown}
                </pre>
              </details>
            </section>
          ) : (
            <section aria-label="Markdown preview" className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Issue body / Markdown
              </p>
              <pre
                tabIndex={0}
                aria-label="Issue body"
                className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-4 font-mono text-sm leading-relaxed outline-offset-4 focus-visible:outline-2"
              >
                {draft.body}
              </pre>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Placeholder sections are follow-up questions, not verified
                facts. The export also includes provenance and a handoff
                checklist.
              </p>
            </section>
          )}
          <div className="flex flex-wrap gap-3 border-t pt-5">
            {createdIssue ? (
              <Button asChild className="min-h-11">
                <a
                  href={createdIssue.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View issue #{createdIssue.issueNumber}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <Button
                onClick={downloadDraft}
                disabled={isPublishing}
                className="min-h-11"
              >
                <Download aria-hidden="true" />
                {complete ? "Download again" : "Download handoff"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={copyDraft}
              disabled={isPublishing}
              className="min-h-11"
            >
              <Copy aria-hidden="true" />
              {createdIssue ? "Copy template handoff" : "Copy Markdown"}
            </Button>
            <Button
              variant="ghost"
              onClick={complete ? onReset : onEdit}
              disabled={isPublishing}
              className="min-h-11"
            >
              {!complete && <ArrowLeft aria-hidden="true" />}
              {complete ? "Start another report" : "Edit report"}
            </Button>
          </div>
          {!complete && (
            <p role="status" className="sr-only">
              {notice}
            </p>
          )}
        </CardContent>
      </Card>

      <aside aria-label="Triage evidence" className="space-y-7 lg:pt-2">
        <section className="space-y-4">
          <h2 className="font-semibold">Why these labels?</h2>
          <dl className="space-y-4 text-sm">
            <div className="space-y-1">
              <dt className="text-muted-foreground">
                Category selected by reporter
              </dt>
              <dd className="font-medium">
                {
                  TICKET_CATEGORIES.find(
                    (category) => category.value === ticket.category,
                  )?.label
                }
              </dd>
              <dd className="text-muted-foreground">
                Mapped by the category rule to <code>{draft.labels[0]}</code>.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground">
                Priority selected by reporter
              </dt>
              <dd className="font-medium">
                {
                  TICKET_PRIORITIES.find(
                    (priority) => priority.value === ticket.priority,
                  )?.label
                }
              </dd>
              <dd className="text-muted-foreground">
                Carried through as <code>priority:{ticket.priority}</code>; not
                an SLA or severity assessment.
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-muted-foreground">
            These explain the template draft. Optional AI triage may produce
            different labels.
          </p>
        </section>
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-semibold">What still needs a person?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Reproduce the issue, validate impact, and decide ownership. This
            portal does not investigate the product, route teams, or promise
            response times.
          </p>
        </section>
        <section className="space-y-3 border-t pt-6">
          {canPublish ? (
            <>
              <h2 className="font-semibold">Optional: publish to GitHub</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Destination:{" "}
                <strong className="break-all text-foreground">
                  {publishing.repository}
                </strong>
                . Reporter details will be visible to everyone with access to
                this repository.
              </p>
              {publishing.mode === "copilot" && (
                <Alert>
                  <AlertTitle>Live AI changes the handoff</AlertTitle>
                  <AlertDescription>
                    This sends the report to Copilot for triage and issue
                    creation. AI can change the title, body, and labels shown
                    here. Inspect the created issue before use.
                  </AlertDescription>
                </Alert>
              )}
              {ticket.category === "security" ? (
                <Alert>
                  <AlertTitle>Use a private security channel</AlertTitle>
                  <AlertDescription>
                    Security reports can be exported, but cannot be published by
                    this portal.
                  </AlertDescription>
                </Alert>
              ) : createdIssue ? (
                <p role="status" className="text-sm">
                  Issue creation confirmed. This report cannot be submitted
                  again from this screen.
                </p>
              ) : (
                <fieldset disabled={isPublishing} className="space-y-3">
                  <legend className="sr-only">Confirm live publishing</legend>
                  <Label
                    htmlFor="confirm-publish"
                    className="flex min-h-11 items-start gap-3 py-2 leading-relaxed"
                  >
                    <Input
                      id="confirm-publish"
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    I approve sharing this report and reporter details with
                    GitHub{publishing.mode === "copilot" ? " and Copilot" : ""}.
                  </Label>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full whitespace-normal"
                    disabled={!confirmed || isPublishing}
                    onClick={publishIssue}
                  >
                    {isPublishing && (
                      <Loader2
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    )}
                    {isPublishing
                      ? "Waiting for GitHub confirmation..."
                      : publishing.mode === "copilot"
                        ? "Run AI triage & create issue"
                        : "Create GitHub issue"}
                  </Button>
                </fieldset>
              )}
            </>
          ) : publishing.mode === "unavailable" ? (
            <Alert
              variant="destructive"
              className="*:data-[slot=alert-description]:text-destructive"
            >
              <AlertTitle>Live publishing unavailable</AlertTitle>
              <AlertDescription>{publishing.reason}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Badge variant="secondary">Local preview</Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No GitHub request or model call is made. Download or copy the
                Markdown to complete this handoff.
              </p>
            </>
          )}
        </section>
      </aside>
    </div>
  );
}
