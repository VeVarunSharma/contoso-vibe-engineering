import { TicketForm } from "@/components/ticket-form";
import { getPublishingAvailability } from "@/lib/support-config";
import { Badge } from "@workspace/ui/components/badge";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section aria-labelledby="page-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="page-title" className="text-3xl font-bold tracking-tight">
            Turn a support report into an engineering handoff
          </h1>
          <Badge variant="outline">Preview before sharing</Badge>
        </div>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Capture the problem, review a structured issue draft, and leave with a
          Markdown handoff. Keep the evidence visible and the next action clear.
        </p>
      </section>
      <TicketForm publishing={getPublishingAvailability()} />
    </div>
  );
}
