import Link from "next/link";
import { Badge, Button } from "@workspace/ui";
import { ArrowRight, PackageCheck, ShieldCheck, Warehouse } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full overflow-hidden border-b bg-muted/30 py-16 md:py-24">
      <div className="container grid items-center gap-12 px-4 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Badge variant="secondary">Licensed wholesale distribution</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Stock every shelf with confidence.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              One dependable catalog for premium liquor and compliant cannabis,
              including the Mary Jane collection—delivered to authorized
              retailers.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="min-h-11" size="lg" asChild>
              <Link href="#catalog">
                Browse catalog
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button className="min-h-11" variant="outline" size="lg" asChild>
              <Link href="#distribution">View delivery coverage</Link>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Age-restricted products. Business license verification required.
          </p>
        </div>
        <aside
          className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-1"
          aria-label="Distribution highlights"
        >
          <div className="flex items-center gap-4">
            <Warehouse className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold">3 regional hubs</p>
              <p className="text-sm text-muted-foreground">
                Reliable local fulfillment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PackageCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold">99.2% fill rate</p>
              <p className="text-sm text-muted-foreground">
                Inventory you can count on
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
