# Vibe Engineering Demo (Monorepo Edition) 🚀

This project demonstrates the transition from "Single Player Vibe Coding" to "Multiplayer Vibe Engineering". It is a **Turborepo** monorepo containing frontend applications, shared packages, and backend microservices.

## Tech Stack

| Layer               | Technology                                        |
| ------------------- | ------------------------------------------------- |
| **Package Manager** | pnpm                                              |
| **Build System**    | Turborepo                                         |
| **Frontend**        | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| **Backend**         | Node.js, Express.js, Drizzle ORM, Zod             |
| **Database**        | PostgreSQL                                        |
| **AI Integration**  | GitHub Copilot SDK (`@github/copilot-sdk`)        |
| **Testing**         | Jest, React Testing Library, @swc/jest            |

## Repository Structure

```
contoso-vibe-engineering/
├── apps/                      # Frontend applications
│   ├── contoso-web-app/       # Vibe Engineering demo (legacy vs. secure)
│   ├── octocat-blog-app/      # GitHub-themed blog with PostgreSQL
│   └── octocat-support-app/   # AI-powered support ticket portal
├── packages/                  # Shared libraries & config
│   ├── ui/                    # Shared design system (shadcn/ui)
│   ├── eslint-config/         # Shared ESLint configurations
│   └── typescript-config/     # Shared TypeScript configurations
├── services/                  # Backend microservices (deployed independently)
│   ├── platform-api/          # Core platform API (Express + Drizzle)
│   ├── medical-api/           # Medical data API (PIPA-compliant)
│   ├── ai-tool-digest/        # AI tool digest Azure Function
│   ├── dotnet-to-angular-agent/ # Migration agent
│   └── rigidport/              # Full-stack ASP.NET Core 9 logistics platform (Razor Pages, EF Core SQLite, Chart.js)
└── infra/                     # Infrastructure-as-code (Terraform)
```

## Applications

### Contoso Web App (`apps/contoso-web-app`)

Demonstrates the core "Vibe Engineering" philosophy side-by-side:

- **Legacy Vibe** (`app/legacy-vibe/`) — Hardcoded styles, SQL injection vulnerabilities, no validation.
- **Secure Vibe** (`app/secure-vibe/`) — Uses `@workspace/ui`, Drizzle ORM, and Zod validation. Returns only safe DTOs.

### Octocat Blog App (`apps/octocat-blog-app`)

A GitHub-themed blog for discussing releases, features, and changelog updates. Built with PostgreSQL, Drizzle ORM, and full Server Components. See [its README](apps/octocat-blog-app/README.md) for details.

### Octocat Support App (`apps/octocat-support-app`)

An AI-powered support ticket portal that converts user-submitted tickets into structured GitHub Issues. Features dual triage modes — AI triage via GitHub Copilot SDK and template-based direct triage. See [its README](apps/octocat-support-app/README.md) for details.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL (for apps that require a database)

### Installation

```bash
# Clone the repository
git clone https://github.com/VeVarunSharma/contoso-vibe-engineering.git
cd contoso-vibe-engineering

# Install all dependencies
pnpm install

# Run all apps in development mode
pnpm dev
```

### Available Scripts

| Script       | Description                        |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Start all apps in development mode |
| `pnpm build` | Build all apps and packages        |
| `pnpm lint`  | Run linting across the monorepo    |
| `pnpm test`  | Run tests across the monorepo      |

### Dev Servers

| App                 | URL                                            |
| ------------------- | ---------------------------------------------- |
| Contoso Web App     | [http://localhost:3000](http://localhost:3000) |
| Octocat Blog App    | [http://localhost:3001](http://localhost:3001) |
| Octocat Support App | [http://localhost:3002](http://localhost:3002) |
| RigidPort           | [http://localhost:5100](http://localhost:5100) |

## Configuration

The rules for the AI Agent are defined in [.github/copilot-instructions.md](.github/copilot-instructions.md).

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Submit a pull request

## License

MIT
