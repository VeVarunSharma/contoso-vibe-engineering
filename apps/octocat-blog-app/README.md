# Octocat Blog App 🐙

A GitHub-themed blog application built with Next.js 15, shadcn/ui, and PostgreSQL. This blog is designed to discuss GitHub releases, features, and changelog updates.

## Features

- 🎨 **GitHub-inspired design** with dark/light mode support
- 📝 **Blog posts** with categories, tags, and authors
- 🔍 **Category and tag filtering**
- 👤 **Author profiles**
- 📱 **Fully responsive** design
- ⚡ **Server Components** for optimal performance
- 🗄️ **PostgreSQL database** with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui (from @workspace/ui)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Drizzle ORM
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

### Installation

1. Navigate to the app directory:

```bash
cd apps/octocat-blog-app
```

2. Copy the environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/octocat_blog
```

3. Install dependencies from the monorepo root:

```bash
cd ../..
pnpm install
```

4. Create the database:

```bash
createdb octocat_blog
```

5. Push the schema to the database:

```bash
cd apps/octocat-blog-app
pnpm db:push
```

6. Seed the database with initial data:

```bash
pnpm db:seed
```

7. Start the development server:

```bash
pnpm dev
```

The app will be running at [http://localhost:3001](http://localhost:3001).

## Database Commands

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:push` - Push schema directly to database (development)
- `pnpm db:studio` - Open Drizzle Studio to browse data
- `pnpm db:seed` - Seed the database with sample data

## Testing

This app includes a comprehensive test suite using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (used in GitHub Actions)
pnpm test:ci
```

### Test Structure

Tests are **co-located** with the code they test, following the pattern of placing `__tests__/` folders alongside the source files:

```
apps/octocat-blog-app/
├── app/
│   └── api/
│       ├── posts/
│       │   ├── __tests__/
│       │   │   └── route.test.ts    # Tests for /api/posts
│       │   └── route.ts
│       ├── categories/
│       │   ├── __tests__/
│       │   │   └── route.test.ts    # Tests for /api/categories
│       │   └── route.ts
│       └── tags/
│           ├── __tests__/
│           │   └── route.test.ts    # Tests for /api/tags
│           └── route.ts
├── components/
│   ├── __tests__/                   # Component unit tests
│   │   ├── post-card.test.tsx
│   │   ├── author-card.test.tsx
│   │   ├── category-badge.test.tsx
│   │   ├── tag-badge.test.tsx
│   │   ├── hero-section.test.tsx
│   │   ├── site-header.test.tsx
│   │   └── site-footer.test.tsx
│   └── *.tsx                        # Component files
├── src/
│   └── db/
│       ├── __tests__/
│       │   └── schema.test.ts       # Database schema tests
│       └── *.ts                     # Database files
└── config/
    └── jest/
        ├── __mocks__/               # Shared test mocks
        │   └── db.ts                # Database mock for API tests
        └── *.js                     # Jest configuration
```

### Writing Tests

- **Component Tests**: Use React Testing Library to test component rendering and interactions. Place tests in `components/__tests__/`.
- **API Tests**: Mock the database layer using `@test-mocks/db` and test route handlers in isolation. Place tests in `app/api/[route]/__tests__/`.
- **Schema Tests**: Verify database schema exports and type definitions. Place tests in `src/db/__tests__/`.

## Project Structure

```
apps/octocat-blog-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (with co-located __tests__/)
│   │   ├── posts/         # Posts API
│   │   ├── categories/    # Categories API
│   │   └── tags/          # Tags API
│   ├── post/[slug]/       # Individual post page
│   ├── category/[slug]/   # Category listing page
│   ├── tag/[slug]/        # Tag listing page
│   ├── author/[username]/ # Author profile page
│   ├── posts/             # All posts page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components (with co-located __tests__/)
│   ├── __tests__/         # Component unit tests
│   ├── site-header.tsx    # Navigation header
│   ├── site-footer.tsx    # Footer
│   ├── hero-section.tsx   # Landing hero
│   ├── post-card.tsx      # Post card component
│   ├── author-card.tsx    # Author card component
│   ├── category-badge.tsx # Category badge
│   ├── tag-badge.tsx      # Tag badge
│   └── providers.tsx      # Theme provider
├── config/
│   └── jest/              # Jest configuration
│       ├── __mocks__/     # Shared mock implementations
│       ├── jest.config.js
│       └── jest.setup.js
├── src/
│   └── db/               # Database layer (with co-located __tests__/)
│       ├── __tests__/    # Database schema tests
│       ├── index.ts      # Database connection
│       ├── schema.ts     # Drizzle schema
│       └── seed.ts       # Seed script
├── drizzle.config.ts     # Drizzle configuration
└── package.json
```

## API Endpoints

| Endpoint            | Method | Description               |
| ------------------- | ------ | ------------------------- |
| `/api/posts`        | GET    | Get all published posts   |
| `/api/posts/[slug]` | GET    | Get a single post by slug |
| `/api/categories`   | GET    | Get all categories        |
| `/api/tags`         | GET    | Get all tags              |

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting: `pnpm lint`
4. Run type checking: `pnpm typecheck`
5. Run tests: `pnpm test`
6. Ensure all tests pass before submitting
7. Submit a pull request

### CI/CD

This project uses GitHub Actions for continuous integration. On every push and pull request:

- ✅ Unit and integration tests are run
- ✅ Linting is checked
- ✅ TypeScript type checking is performed
- ✅ Coverage reports are generated

## License

MIT
