# Database migrations

This project uses the **Supabase CLI** to manage schema changes. Previously,
migrations were written as `.sql` files but applied by hand in the Supabase
SQL Editor — there was no record of what had actually been run against the
live database, and applying a change required someone to remember to do it
manually. That stops now: schema changes always go through a migration file
and `supabase db push`.

## One-time setup (run once per machine)

```bash
cd toureez-backend
npm install                       # installs the supabase CLI as a devDependency

# Log in (opens a browser to authenticate with your Supabase account)
npx supabase login

# Link this repo to the actual Supabase project (the one in SUPABASE_URL)
npx supabase link --project-ref <your-project-ref>
```

The project ref is the subdomain in your Supabase URL, e.g. for
`https://rtyvmyvidkrwmeeeioww.supabase.co` the ref is `rtyvmyvidkrwmeeeioww`.

## Existing migrations were applied manually — mark them as such

The 7 files already in `supabase/migrations/` were run by hand in the SQL
Editor before this CLI setup existed. The CLI has no record of that, so its
first `db push` would try to re-run all of them. They're all written
defensively (`if not exists`, `do $$ ... end $$` guards) so re-running is
safe, but the correct fix is to tell the CLI they're already applied:

```bash
npx supabase migration repair --status applied 20260525
npx supabase migration repair --status applied 20260610
npx supabase migration repair --status applied 20260613   # run once per 20260613_* file —
                                                            # repair takes one version per call,
                                                            # the date prefix is the version
npx supabase migration repair --status applied 20260617
```

Run `npx supabase migration list` afterward — every local file should show
as applied on the remote, with no pending migrations.

## Going forward: how to make a schema change

```bash
npx supabase migration new add_some_column
# edit the generated supabase/migrations/<timestamp>_add_some_column.sql

npx supabase db push          # applies pending migrations to the linked project
npx supabase migration list   # confirms it applied cleanly
```

Or via the npm script aliases:

```bash
npm run db:new -- add_some_column
npm run db:push
npm run db:status
```

**Never** apply a schema change directly in the SQL Editor again — if it's
not a migration file, the next `db push` won't know about it and the CLI's
view of the schema drifts from reality.

## Local development database (optional)

`supabase/config.toml` also supports running a full local Postgres + Auth +
Storage stack via Docker for offline development:

```bash
npx supabase start   # requires Docker
npx supabase db reset  # rebuilds the local DB from supabase/migrations/*
```

This project currently develops against the hosted Supabase project
directly (see `SUPABASE_URL` in `.env`), so this is optional — useful if you
want to test a migration before pushing it to the shared project.
