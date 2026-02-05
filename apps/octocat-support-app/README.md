# Octocat Support App 🎫

An AI-powered support ticket portal that converts user-submitted tickets into structured, actionable GitHub Issues — routed to the right team instantly. Built with Next.js 15, GitHub Copilot SDK, and Zod.

## Features

- 🤖 **AI-powered triage** via GitHub Copilot SDK (`gpt-4o`) with smart categorization
- 📋 **Template-based fallback** — direct triage mode with no external AI dependency
- ✅ **Zod validation** on both client and server for type-safe ticket submission
- 🐙 **GitHub Issues integration** — tickets are created as real GitHub Issues with labels and structured bodies
- 🏷️ **Auto-labeling** — category labels (`bug`, `enhancement`, `question`, `documentation`, `security`) and priority labels (`priority:low` through `priority:critical`)
- 🌙 **Dark/light mode** with `next-themes`
- 📱 **Fully responsive** design with mobile navigation
- 🎨 **Design system** — uses `@workspace/ui` components exclusively (zero local UI)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI Components**: shadcn/ui (from `@workspace/ui`)
- **Styling**: Tailwind CSS 4
- **AI**: GitHub Copilot SDK (`@github/copilot-sdk`)
- **Validation**: Zod
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode

## How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Ticket Form │────▶│  POST /api/tickets│────▶│  Triage Engine      │────▶│ GitHub Issue  │
│  (Client)    │     │  Zod Validation   │     │  Copilot SDK or     │     │ Created with  │
│              │     │                   │     │  Direct Templates   │     │ labels & body │
└──────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────┘
```

1. **User submits a ticket** — fills out name, email, category, priority, subject, and description
2. **Server validates** — Zod schema validates all fields server-side
3. **Triage runs** — one of two modes depending on `USE_COPILOT_SDK` env var:
   - **Copilot SDK mode**: Creates a session with `gpt-4o`, provides a system prompt with triage rules, defines a `create_github_issue` tool — the model triages and calls the tool
   - **Direct mode** (default): Template-based triage maps categories to labels, generates structured issue bodies with category-specific templates, and creates the issue via the GitHub REST API
4. **GitHub Issue created** — returns issue URL, number, title, and labels to the client

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- A GitHub Personal Access Token (PAT) with `repo` scope

### Installation

1. Install dependencies from the monorepo root:

```bash
cd contoso-vibe-engineering
pnpm install
```

2. Copy the environment file and configure it:

```bash
cd apps/octocat-support-app
cp .env.local.example .env.local
```

3. Edit `.env.local` with your values:

```env
# GitHub PAT with `repo` scope for creating issues
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Target repository for issue creation
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo

# (Optional) Set to "true" to enable AI triage via Copilot SDK
# When omitted or "false", uses direct template-based triage
USE_COPILOT_SDK=false
```

4. Start the development server:

```bash
pnpm dev
```

The app will be running at [http://localhost:3002](http://localhost:3002).

## Environment Variables

| Variable          | Required | Description                                                                    |
| ----------------- | -------- | ------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`    | ✅       | PAT with `repo` scope for creating issues                                      |
| `GITHUB_OWNER`    | ✅       | Target repository owner (e.g., `VeVarunSharma`)                                |
| `GITHUB_REPO`     | ✅       | Target repository name (e.g., `contoso-vibe-engineering`)                      |
| `USE_COPILOT_SDK` | ❌       | Set to `"true"` to enable AI triage via Copilot SDK. Defaults to direct triage |

## Ticket Categories & Labels

| Category         | GitHub Label    | Title Prefix | Template                                     |
| ---------------- | --------------- | ------------ | -------------------------------------------- |
| Bug Report       | `bug`           | `[Bug]`      | Steps to reproduce, expected/actual behavior |
| Feature Request  | `enhancement`   | `[Feature]`  | Summary, motivation, acceptance criteria     |
| General Question | `question`      | `[Question]` | Summary, details, expected outcome           |
| Documentation    | `documentation` | `[Docs]`     | Summary, details, expected outcome           |
| Security Concern | `security`      | `[Security]` | Summary, severity assessment, next steps     |

## Project Structure

```
apps/octocat-support-app/
├── app/
│   ├── layout.tsx              # Root layout — Geist fonts, metadata, providers
│   ├── page.tsx                # Home page — hero section + ticket form
│   └── api/
│       └── tickets/
│           └── route.ts        # POST /api/tickets — Zod validation + triage
├── components/
│   ├── providers.tsx           # ThemeProvider wrapper (dark mode default)
│   ├── site-header.tsx         # Sticky header with nav, theme toggle, mobile menu
│   ├── site-footer.tsx         # 4-column footer with links
│   └── ticket-form.tsx         # Client Component — full ticket submission form
├── lib/
│   ├── types.ts                # Zod schemas, TypeScript types, constants
│   ├── prompts.ts              # System prompt for Copilot SDK triage
│   ├── copilot-triage.ts       # AI-powered triage via @github/copilot-sdk
│   └── direct-triage.ts        # Template-based triage (no SDK dependency)
├── .env.local.example          # Example environment variables
├── next.config.mjs             # Next.js config (transpiles @workspace/ui)
├── package.json
└── tsconfig.json               # Extends @workspace/typescript-config
```

## Available Scripts

| Script           | Description                               |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Start dev server on port 3002 (Turbopack) |
| `pnpm build`     | Production build                          |
| `pnpm start`     | Start production server                   |
| `pnpm lint`      | Run ESLint                                |
| `pnpm lint:fix`  | Run ESLint with auto-fix                  |
| `pnpm typecheck` | TypeScript type checking                  |

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting: `pnpm lint`
4. Run type checking: `pnpm typecheck`
5. Submit a pull request

## License

MIT
