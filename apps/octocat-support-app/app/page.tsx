import { TicketForm } from "@/components/ticket-form";
import { Badge } from "@workspace/ui/components/badge";
import { GitPullRequestArrow, Headset, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
        <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
          Powered by GitHub Copilot SDK
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          How can we{" "}
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            help you
          </span>{" "}
          today?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Submit a support ticket and our AI-powered triage system will
          automatically parse your request into an actionable GitHub issue —
          routed to the right team instantly.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-center rounded-md bg-blue-500/10 p-2">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Triage</p>
            <p className="text-xs text-muted-foreground">
              Smart categorization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-center rounded-md bg-purple-500/10 p-2">
            <GitPullRequestArrow className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium">GitHub Issues</p>
            <p className="text-xs text-muted-foreground">Direct integration</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-center rounded-md bg-green-500/10 p-2">
            <Shield className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Fast Response</p>
            <p className="text-xs text-muted-foreground">Prioritized routing</p>
          </div>
        </div>
      </div>

      {/* Ticket Form */}
      <div className="max-w-2xl mx-auto">
        <TicketForm />
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto mt-20">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mx-auto rounded-full bg-primary/10 w-12 h-12">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold">Describe Your Issue</h3>
            <p className="text-sm text-muted-foreground">
              Fill out the form with details about your bug, feature request, or
              question.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mx-auto rounded-full bg-primary/10 w-12 h-12">
              <Headset className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">AI Parses &amp; Triages</h3>
            <p className="text-sm text-muted-foreground">
              GitHub Copilot SDK analyzes your input and structures it into an
              actionable, labeled issue.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mx-auto rounded-full bg-primary/10 w-12 h-12">
              <span className="text-lg font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold">Issue Created</h3>
            <p className="text-sm text-muted-foreground">
              A GitHub issue is created with proper labels, priority, and
              structure — ready for the team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
