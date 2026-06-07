# `@workspace/ui`

> Shared design system for the Vibe Engineering monorepo. Thin shadcn/ui-style React 19 components built on Radix primitives, styled with Tailwind CSS 4.

Used by all three apps (`contoso-web-app`, `octocat-blog-app`, `octocat-support-app`) via `"@workspace/ui": "workspace:*"`.

## Components

All components live in [`src/components/`](src/components/) and are exported individually:

| Component | Source |
| --------- | ------ |
| `Alert`, `AlertTitle`, `AlertDescription` | [`alert.tsx`](src/components/alert.tsx) |
| `Badge` | [`badge.tsx`](src/components/badge.tsx) |
| `Button` (variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) | [`button.tsx`](src/components/button.tsx) |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | [`card.tsx`](src/components/card.tsx) |
| `Input` | [`input.tsx`](src/components/input.tsx) |
| `Label` | [`label.tsx`](src/components/label.tsx) |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | [`select.tsx`](src/components/select.tsx) |
| `Separator` | [`separator.tsx`](src/components/separator.tsx) |
| `Textarea` | [`textarea.tsx`](src/components/textarea.tsx) |

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@workspace/ui";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

Each component accepts `className` (merged via `tailwind-merge`) and forwards refs.

## Design tokens & global styles

Consumers import the Tailwind layer once in their app:

```tsx
// app/layout.tsx
import "@workspace/ui/globals.css";
```

This exposes the design tokens (CSS custom properties for colors, radius, spacing) used by every component variant.

## Tailwind config

Apps share the PostCSS config:

```js
// postcss.config.mjs
export { default } from "@workspace/ui/postcss.config";
```

## Tests

```bash
pnpm --filter @workspace/ui test
```

Tests use Jest + React Testing Library + jsdom. See [`src/components/__tests__/`](src/components/__tests__/).

> The Radix `Select` dropdown test only covers the trigger because jsdom lacks `PointerEvent` support — see issue [#294](https://github.com/VeVarunSharma/contoso-vibe-engineering/issues/294) for the polyfill that would unlock those tests.

## Lint

```bash
pnpm --filter @workspace/ui lint
```

## Hooks

`src/hooks/` is currently empty (only `.gitkeep`). The `./hooks/*` export pattern is reserved for future shared hooks.
