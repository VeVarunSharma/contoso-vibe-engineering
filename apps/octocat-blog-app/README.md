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
- pnpm 8+
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

## Project Structure

```
apps/octocat-blog-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
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
├── components/            # React components
│   ├── site-header.tsx    # Navigation header
│   ├── site-footer.tsx    # Footer
│   ├── hero-section.tsx   # Landing hero
│   ├── post-card.tsx      # Post card component
│   ├── author-card.tsx    # Author card component
│   ├── category-badge.tsx # Category badge
│   ├── tag-badge.tsx      # Tag badge
│   └── providers.tsx      # Theme provider
├── src/
│   └── db/               # Database layer
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
5. Submit a pull request

## License

MIT
