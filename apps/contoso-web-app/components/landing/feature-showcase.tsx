import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import {
  FeatureCard,
  FeatureCardAccent,
  FeatureCardIcon,
  FeatureCardTitle,
  FeatureCardDescription,
  FeatureCardCTA,
} from "@workspace/ui/components/feature-card";
import { Paintbrush, TestTube, GitPullRequest } from "lucide-react";

const features = [
  {
    icon: Paintbrush,
    title: "Design to Code",
    description:
      "Transform Figma designs into production-ready React components with a single command. No more pixel-pushing.",
    cta: "See workflow",
    href: "/figma-demo",
    accent: "primary" as const,
  },
  {
    icon: TestTube,
    title: "AI Test Generation",
    description:
      "Copilot writes comprehensive test suites that match your project conventions — Jest, Playwright, or any framework.",
    cta: "View examples",
    href: "#",
    accent: "blue" as const,
  },
  {
    icon: GitPullRequest,
    title: "Multi-Model Review",
    description:
      "4 AI models review every PR in parallel. Consensus-based findings catch bugs humans miss.",
    cta: "Learn more",
    href: "#",
    accent: "green" as const,
  },
];

export function FeatureShowcase() {
  return (
    <section className="w-full bg-muted/30 py-20 md:py-28">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="text-primary">
            ✨ Powered by AI
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-[42px]">
            Ship Better Software, Faster
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From design to deployment — Copilot accelerates every step of your
            workflow with AI-powered code generation, testing, and review.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} accent={feature.accent}>
              <FeatureCardAccent />
              <FeatureCardIcon>
                <feature.icon className="h-7 w-7" />
              </FeatureCardIcon>
              <FeatureCardTitle>{feature.title}</FeatureCardTitle>
              <FeatureCardDescription>
                {feature.description}
              </FeatureCardDescription>
              <FeatureCardCTA>
                <Link href={feature.href}>
                  {feature.cta} →
                </Link>
              </FeatureCardCTA>
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
