import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const featureCardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-4 rounded-2xl border px-7 py-8 transition-shadow hover:shadow-md",
  {
    variants: {
      accent: {
        primary: "[--accent-color:var(--primary)]",
        blue: "[--accent-color:oklch(0.55_0.15_250)]",
        green: "[--accent-color:oklch(0.65_0.17_155)]",
        destructive: "[--accent-color:var(--destructive)]",
      },
    },
    defaultVariants: {
      accent: "primary",
    },
  }
)

function FeatureCard({
  className,
  accent,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof featureCardVariants>) {
  return (
    <div
      data-slot="feature-card"
      className={cn(featureCardVariants({ accent, className }))}
      {...props}
    />
  )
}

function FeatureCardAccent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-card-accent"
      className={cn("h-1 w-12 rounded-sm bg-[var(--accent-color)]", className)}
      {...props}
    />
  )
}

function FeatureCardIcon({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-card-icon"
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function FeatureCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="feature-card-title"
      className={cn("text-xl font-semibold leading-none", className)}
      {...props}
    />
  )
}

function FeatureCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feature-card-description"
      className={cn(
        "text-muted-foreground text-[15px] leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function FeatureCardCTA({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="feature-card-cta"
      className={cn(
        "mt-auto text-sm font-semibold text-[var(--accent-color)] cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export {
  FeatureCard,
  FeatureCardAccent,
  FeatureCardIcon,
  FeatureCardTitle,
  FeatureCardDescription,
  FeatureCardCTA,
  featureCardVariants,
}
