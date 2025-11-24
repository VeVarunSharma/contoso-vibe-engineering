import { Rocket, Shield, Zap } from "lucide-react";

export function MissionSection() {
  return (
    <section
      id="mission"
      className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
              Our Mission
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Shipping Safely at Velocity
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We leverage cutting-edge agentic workflows to empower small teams
              to achieve massive scale.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Velocity</h3>
            <p className="text-muted-foreground">
              Rapid iteration cycles enabled by AI-driven development pipelines.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Safety</h3>
            <p className="text-muted-foreground">
              Robust guardrails and automated testing ensure production
              stability.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Agentic Upgrades</h3>
            <p className="text-muted-foreground">
              Autonomous agents handling routine tasks, freeing humans for
              creativity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
