import { Button } from "@workspace/ui";

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 border-b">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Contoso Vibe Engineering
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Agentic upgrades for the modern enterprise. Run by the Fantastic
              Four.
            </p>
          </div>
          <div className="space-x-4">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
