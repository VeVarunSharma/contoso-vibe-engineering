import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui";
import {
  FeatureCard,
  FeatureCardIcon,
  FeatureCardTitle,
  FeatureCardDescription,
} from "@workspace/ui/components/feature-card";
import { Figma, ArrowRight, Workflow, Code2, Layers, Eye } from "lucide-react";
import Link from "next/link";
import { FeatureShowcase } from "@/components/landing/feature-showcase";

const workflowSteps = [
  {
    step: "01",
    icon: Figma,
    title: "Design in Figma",
    description:
      "Create your design using Figma's visual editor. The Figma MCP server is already configured in this repo.",
  },
  {
    step: "02",
    icon: Code2,
    title: "Pull Design Context",
    description:
      "Use figma-get_design_context to extract code, metadata, and screenshots from any Figma node.",
  },
  {
    step: "03",
    icon: Layers,
    title: "Generate Components",
    description:
      "Copilot converts the Figma output into React components following your @workspace/ui design system patterns.",
  },
  {
    step: "04",
    icon: Eye,
    title: "Review & Ship",
    description:
      "Components are committed, pushed, and auto-reviewed by 4 AI models via the multi-model code review workflow.",
  },
];

export default function FigmaDemoPage() {
  return (
    <div className="flex flex-col min-h-svh">
      {/* Hero */}
      <section className="w-full py-16 md:py-24 border-b">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Badge variant="outline" className="gap-2">
              <Figma className="h-3.5 w-3.5" />
              Figma MCP Integration
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              From Figma to{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Production Code
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              This page was generated from a Figma design using the Figma MCP
              server. Every component below was pulled from a design file and
              converted into React + Tailwind CSS following the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                @workspace/ui
              </code>{" "}
              design system.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link
                  href="https://www.figma.com/design/dI7ybyAIsCE4r14YlVKsZV"
                  target="_blank"
                >
                  View Figma Source <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/figma-demo#workflow">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase — generated from Figma design */}
      <FeatureShowcase />

      {/* Workflow Steps */}
      <section id="workflow" className="w-full py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <Badge variant="secondary">
              <Workflow className="mr-1.5 h-3.5 w-3.5" />
              The Workflow
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How Figma → Code Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Four steps from design to deployed, reviewed code.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {workflowSteps.map((step) => (
              <FeatureCard key={step.step} accent="primary">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground/50">
                    {step.step}
                  </span>
                  <FeatureCardIcon>
                    <step.icon className="h-6 w-6" />
                  </FeatureCardIcon>
                </div>
                <FeatureCardTitle>{step.title}</FeatureCardTitle>
                <FeatureCardDescription>
                  {step.description}
                </FeatureCardDescription>
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Config Reference */}
      <section className="w-full border-t bg-muted/30 py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-semibold mb-4">
              Already configured in this repo
            </h3>
            <div className="rounded-lg bg-background border p-6 text-left font-mono text-sm">
              <pre className="overflow-x-auto text-muted-foreground">
                {`// .vscode/mcp.json & .copilot/mcp.json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}`}
              </pre>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              The Figma MCP server connects Copilot to your Figma files — no
              plugins, no export steps, no manual translation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
