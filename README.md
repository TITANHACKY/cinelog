# CineLog

CineLog is a Next.js application using the App Router, Redux Toolkit, Redux Saga, Zod, Drizzle ORM, and Turso.

## Requirements

- Node.js 20 or newer
- Yarn 4
- A Turso account and database

## Install Dependencies

Install the project dependencies from the repository root:

```bash
yarn install
```

## Development

Start the Next.js development server:

```bash
yarn dev
```

The same command can be run with the explicit Yarn `run` syntax:

```bash
yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Drizzle Studio

Browse and edit database rows in a local GUI while developing. In a second terminal, run:

```bash
yarn db:studio
```

Drizzle Studio opens at [https://local.drizzle.studio](https://local.drizzle.studio) (default port `4983`). It uses the same `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` from your environment as the app and migration commands.

For a fully offline local database, point `TURSO_CONNECTION_URL` at a SQLite file (no auth token required):

```env
TURSO_CONNECTION_URL=file:./data/local.db
```

Then run `yarn db:migrate` once to create the schema before starting the app or Studio.

## Production

Create an optimized production build:

```bash
yarn build
```

Start the production server after the build completes:

```bash
yarn start
```

The production server runs at [http://localhost:3000](http://localhost:3000) by default.

## Turso Setup

Install and authenticate with the [Turso CLI](https://docs.turso.tech/cli/installation), then create or select a database:

```bash
turso auth login
turso db create cinelog-db
```

Get the database URL and create an authentication token:

```bash
turso db show cinelog-db --url
turso db tokens create cinelog-db
```

Copy the URL and token into a local environment file. Use `.env.local` for local development:

```env
TURSO_CONNECTION_URL=libsql://your-database-your-org.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
TMDB_API_KEY=your-tmdb-api-key
```

Do not commit `.env.local` or expose `TURSO_AUTH_TOKEN` or `TMDB_API_KEY` in client-side code. The database connection and TMDB requests are made on the server.

## Database Migrations

The Drizzle schema is defined in `src/db/schema.ts`, and the Drizzle configuration is in `drizzle.config.ts`.

After changing the schema, generate a migration:

```bash
yarn db:generate
```

Apply pending migrations to the configured Turso database:

```bash
yarn db:migrate
```

The migration command uses `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` from your environment. Make sure those variables are available before running it.

## Useful Commands

```bash
yarn lint
yarn lint:fix
yarn format
yarn format:check
yarn typecheck
yarn audit
yarn build
yarn start
```

`yarn lint` checks all project files and prints lint errors in the CLI. It exits
silently when there are no ESLint errors or warnings. Use `yarn lint:fix` to
apply safe automatic fixes. `yarn format` applies Prettier across the repo; use
`yarn format:check` in CI or before committing to verify formatting without
writing files. `yarn typecheck` reports TypeScript errors; those errors do not
have a reliable automatic fixer and must be corrected in source.

`yarn audit` scans the full dependency tree for known vulnerabilities at **high**
severity or above. Pull requests run the same check in CI (see
[`.github/workflows/pr-checks.yml`](.github/workflows/pr-checks.yml)).

## Catalog sync

Local dry-run and execute:

```bash
yarn catalog:sync
yarn catalog:sync:execute
```

To run the same job on a daily GitHub Actions schedule (and on demand from the Actions tab), follow [docs/catalog-sync-github-actions.md](docs/catalog-sync-github-actions.md).
