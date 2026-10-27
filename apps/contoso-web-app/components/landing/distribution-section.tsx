import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui";
import { ClipboardCheck, Route, ScanLine, ShieldCheck } from "lucide-react";

const services = [
  {
    title: "Scheduled delivery",
    description:
      "Choose dependable delivery windows backed by three regional fulfillment hubs.",
    icon: Route,
  },
  {
    title: "Shelf-ready receiving",
    description:
      "Match case labels, SKUs, and shelf locations to speed up every receiving shift.",
    icon: ScanLine,
  },
  {
    title: "Compliance records",
    description:
      "Keep product, lot, and delivery details together for easier regulated-goods audits.",
    icon: ClipboardCheck,
  },
];

export function DistributionSection() {
  return (
    <section
      id="distribution"
      className="w-full border-t bg-muted/40 py-16 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Badge variant="secondary">Distribution services</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            From warehouse to shelf, simplified
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Tools and logistics that help authorized retailers receive,
            organize, and merchandise regulated inventory.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <service.icon
                  className="h-8 w-8 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>
                  <h3 className="text-lg">{service.title}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>
        <aside
          id="compliance"
          className="mx-auto mt-10 flex max-w-5xl scroll-mt-20 flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center"
          aria-labelledby="compliance-title"
        >
          <ShieldCheck
            className="h-10 w-10 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h3 id="compliance-title" className="font-semibold">
              Built for responsible distribution
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Orders are available only to verified, licensed businesses and
              remain subject to local liquor and cannabis regulations.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
