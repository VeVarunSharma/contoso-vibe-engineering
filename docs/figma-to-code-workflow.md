# Figma → Code Workflow

> Transform Figma designs into production-ready React components using the Figma MCP server and GitHub Copilot.

## Overview

This workflow enables a seamless pipeline from design to deployed code:

```
Figma Design → MCP Server → Copilot → React Component → PR → AI Review
```

No manual export, no pixel-pushing, no copy-pasting CSS values. The entire translation from visual design to code is automated.

## How It Works

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Figma      │────▶│  Figma MCP       │────▶│  GitHub Copilot   │
│   Design     │     │  Server          │     │  (CLI or IDE)     │
│   File       │     │  mcp.figma.com   │     │                   │
└─────────────┘     └──────────────────┘     └────────┬──────────┘
                                                       │
                                                       ▼
                                              ┌───────────────────┐
                                              │  React Component  │
                                              │  @workspace/ui    │
                                              │  Tailwind CSS 4   │
                                              └────────┬──────────┘
                                                       │
                                                       ▼
                                              ┌───────────────────┐
                                              │  Git Commit + PR  │
                                              │  Multi-Model      │
                                              │  Code Review (4x) │
                                              └───────────────────┘
```

### Step 1: Design in Figma

Create your design in Figma. This can be:
- A new component (button, card, form)
- A full page section (hero, feature showcase, pricing)
- A complete page layout

The Figma MCP server supports any node type — frames, components, component sets, and instances.

### Step 2: Pull Design Context

Use the `figma-get_design_context` tool to extract everything Copilot needs:

```
Tool: figma-get_design_context
Parameters:
  fileKey: "your-figma-file-key"     # From the Figma URL
  nodeId: "2:2"                       # Node ID of the target frame
  clientFrameworks: "react,next"
  clientLanguages: "typescript"
```

**What you get back:**
- Generated React + Tailwind CSS code matching the visual design
- Screenshot of the design for reference
- Node metadata (names, hierarchy, layout properties)
- Asset URLs for any images or SVGs

**Example: Extracting the file key and node ID from a Figma URL:**
```
URL: https://www.figma.com/design/dI7ybyAIsCE4r14YlVKsZV/Contoso-Feature-Showcase?node-id=2:2

File Key: dI7ybyAIsCE4r14YlVKsZV
Node ID:  2:2
```

### Step 3: Generate Components

Copilot transforms the raw Figma output into components that follow your project's conventions:

| Figma Output | Converted To |
|---|---|
| Inline hex colors (`#5952de`) | CSS variables (`var(--primary)`) |
| Pixel values | Tailwind utility classes |
| Flat div structure | Compound component pattern (CVA) |
| Static text | Props with TypeScript types |
| Fixed layout | Responsive grid (`md:grid-cols-3`) |

**Component placement:**
- **Design system primitives** → `packages/ui/src/components/`
- **App-specific sections** → `apps/*/components/`
- **Pages** → `apps/*/app/route-name/page.tsx`

### Step 4: Review & Ship

1. Commit the generated components
2. Push to a feature branch
3. The [multi-model code review workflow](.github/workflows/multi-model-code-review.yml) automatically reviews using 4 AI models
4. Merge after review

## Prerequisites

### MCP Configuration (Already Done ✅)

The Figma MCP server is configured in two places:

**VS Code** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

**Copilot Coding Agent** (`.copilot/mcp.json`):
```json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

### Figma Account

You need a Figma account with access to the design files. Authentication is handled automatically by the MCP server through your browser session.

### Design System

Components should follow the `@workspace/ui` patterns:
- **CVA** (class-variance-authority) for variant management
- **Tailwind CSS 4** with CSS custom properties
- **`data-slot`** attributes for component identification
- **`cn()`** utility for class name merging
- **Radix UI** primitives for accessibility

## Component Pattern Reference

Every generated component should follow this structure:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const myComponentVariants = cva(
  "base-tailwind-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function MyComponent({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof myComponentVariants>) {
  return (
    <div
      data-slot="my-component"
      className={cn(myComponentVariants({ variant, className }))}
      {...props}
    />
  )
}

export { MyComponent, myComponentVariants }
```

## Available Figma MCP Tools

| Tool | Purpose |
|---|---|
| `figma-get_design_context` | Extract code + screenshot from a node (primary tool) |
| `figma-get_screenshot` | Get a screenshot of any node |
| `figma-get_metadata` | Get node structure (names, sizes, positions) |
| `figma-get_variable_defs` | Get design tokens (colors, spacing) |
| `figma-use_figma` | Execute Plugin API code to create/modify designs |
| `figma-create_new_file` | Create a new Figma file |
| `figma-search_design_system` | Search existing design system components |
| `figma-generate_figma_design` | Capture a web page into Figma |

## Live Demo

See the workflow in action: **[/figma-demo](/figma-demo)** in the contoso-web-app.

**Source Figma file:** [Contoso Feature Showcase](https://www.figma.com/design/dI7ybyAIsCE4r14YlVKsZV)

### Generated Files

| File | What | Source |
|---|---|---|
| `packages/ui/src/components/feature-card.tsx` | Reusable FeatureCard compound component | Figma "Card" nodes |
| `apps/contoso-web-app/components/landing/feature-showcase.tsx` | Feature showcase section | Figma "Feature Showcase Section" |
| `apps/contoso-web-app/app/figma-demo/page.tsx` | Demo page with workflow explanation | Composed from generated components |

## Tips

1. **Start with `figma-get_design_context`** — it's the primary tool and returns both code and a screenshot
2. **Use `figma-search_design_system`** before creating components to check if similar ones already exist
3. **Ask Copilot to adapt** the generated code to your project's patterns — the raw Figma output uses inline styles that should be converted to design tokens
4. **Batch your requests** — pull multiple nodes in parallel for faster iteration
5. **Use `figma-use_figma`** to programmatically create designs if you need to generate Figma files from code (reverse workflow)
