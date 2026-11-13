# TrustFix — Trust Finder Connect

**A worker-discovery and service-request platform built with React, TypeScript, TanStack Start, and Supabase.**

TrustFix is a web application intended to help people discover service providers, review worker information, and manage service requests. The codebase includes authenticated and administrative routes, worker profiles, request workflows, support pages, smart-match logic, and Supabase integration.

> **Status:** Application code and database migrations are present. Confirm the deployed environment and production readiness independently; this README describes the repository implementation, not a guarantee that every workflow is live.

## Main areas

- User registration, login, and onboarding routes.
- Authenticated dashboard and service-request pages.
- Worker profile pages and worker cards.
- Smart-match interface and supporting functions.
- Job-chat interface.
- Administrative routes and user/broadcast management functions.
- Supabase client, authentication middleware, and SQL migrations.
- Responsive UI components built with Radix UI and Tailwind CSS.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite
- Supabase
- Tailwind CSS
- Radix UI
- React Query and React Hook Form
- Bun lockfile and npm-compatible package scripts

## Requirements

- Node.js version compatible with the Vite/TanStack dependencies
- Bun (recommended because the repository includes `bun.lock`)
- A Supabase project for database/auth-backed workflows

## Local setup

```bash
git clone https://github.com/nyohleonard-nlktech/trust-finder-connect.git
cd trust-finder-connect
bun install
```

Configure the Supabase project using the environment variables referenced by the source under `src/integrations/supabase/`. Create a local environment file from your own configuration; never copy production secrets into Git.

Apply the SQL migrations in `supabase/migrations/` to the intended Supabase project using the Supabase CLI or dashboard migration workflow.

Start the development server:

```bash
bun run dev
```

Build and preview:

```bash
bun run build
bun run preview
```

Quality checks:

```bash
bun run lint
bun run format
```

## Codebase structure

```text
.
├── public/                 # Static assets and PWA icons
├── src/
│   ├── components/         # Application and UI components
│   ├── hooks/              # Reusable React hooks
│   ├── integrations/
│   │   └── supabase/       # Supabase clients, auth and generated types
│   ├── lib/                # Auth, workers, smart match and admin functions
│   ├── routes/             # File-based application routes
│   ├── router.tsx
│   ├── server.ts
│   └── styles.css
├── supabase/
│   └── migrations/         # Database schema history
├── package.json
├── vite.config.ts
├── wrangler.jsonc
└── README.md
```

## Data and authentication

The application relies on Supabase integration code and SQL migrations. Before deploying:

1. Create separate development and production Supabase projects.
2. Apply migrations in chronological order.
3. Configure the public project URL and client key using the exact environment-variable names used by the client code.
4. Review Row Level Security policies for every table.
5. Verify administrative operations are protected server-side.
6. Do not expose service-role keys in browser bundles.

## Deployment

The repository contains Vercel and Cloudflare-related configuration. Select one deployment target, configure its environment variables and build settings, and test authentication redirects and server-side functions in that environment. Do not assume that both providers are configured for production simultaneously.

## Security and privacy

This project may process names, contact details, worker profiles, and service requests. Apply data minimization, access controls, consent, rate limiting, and retention policies. Never commit `.env` files or credentials. If a real secret has ever been committed, rotate it even after removing it from the latest commit.

## Contributing

Use focused branches and pull requests. Include migration notes for database changes and tests for authentication, authorization, worker matching, and request ownership.

## License

No license file is currently present. All rights are reserved unless an explicit license is added.
