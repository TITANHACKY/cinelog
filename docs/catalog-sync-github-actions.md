# Catalog sync with GitHub Actions

This guide walks through automating `scripts/sync-catalog.ts` on GitHub: the workflow file, secrets, a first test run, the daily schedule, and how to read the results.

The script loads every movie and series from Turso, compares them with TMDB, and (in `execute` mode) writes updates. It also refreshes languages, countries, and genres. Reports land in `temp/` as CSV and JSON files.

Do **not** run this job on pull requests. It talks to production Turso when you point the secrets at production.

## What you already have in the repo

| File | Role |
| --- | --- |
| [`scripts/sync-catalog.ts`](../scripts/sync-catalog.ts) | The sync CLI |
| [`package.json`](../package.json) | `yarn catalog:sync` (dry-run) and `yarn catalog:sync:execute` |
| [`.github/workflows/catalog-sync.yml`](../.github/workflows/catalog-sync.yml) | The GitHub Action |
| [`.github/workflows/pr-checks.yml`](../.github/workflows/pr-checks.yml) | Unrelated PR lint/typecheck. Leave it alone. |

The catalog workflow does two things:

1. **Schedule** — every day at 06:00 UTC it runs `--mode execute`.
2. **Manual run** — from the Actions tab you pick `dry-run` or `execute`.

## 1. Push the workflow to GitHub

GitHub only sees workflows that exist on the **default branch** (usually `main`). Scheduled jobs also run only from that branch.

If this file is not on `main` yet:

```bash
git add .github/workflows/catalog-sync.yml docs/catalog-sync-github-actions.md
git commit -m "Add scheduled catalog sync GitHub Action"
git push origin HEAD
```

Open a PR if your default branch is protected, merge it, then continue.

Confirm the file exists on GitHub:

`https://github.com/<owner>/<repo>/blob/main/.github/workflows/catalog-sync.yml`

Replace `<owner>/<repo>` with your repository, for example `you/cinelog`.

## 2. Turn Actions on

1. Open the repo on GitHub.
2. Click **Settings**.
3. In the left sidebar, **Actions** → **General**.
4. Under **Actions permissions**, allow Actions (typically **Allow all actions and reusable workflows**).
5. Save.

You also need permission to **add secrets** and **run workflows**. Repo admins have this. Collaborators need write access plus Actions enabled for the repo.

## 3. Add repository secrets

The job injects the same variables as `.env.example`. GitHub stores them encrypted. They are available to the job as `secrets.*` and are **not** printed in logs if you only pass them as `env` (do not `echo` them).

### Values to copy

From your local `.env` or `.env.local` (never commit those files):

| Secret name | Same as | Example shape |
| --- | --- | --- |
| `TURSO_CONNECTION_URL` | Turso database URL | `libsql://….turso.io` |
| `TURSO_AUTH_TOKEN` | Turso auth token | long token string |
| `TMDB_API_KEY` | TMDB API key | TMDB v3 key |

Use the **production** Turso database if that is the catalog you want updated. A staging URL is safer for the first `dry-run` if you have one.

### Where to click

1. GitHub repo → **Settings**.
2. Left sidebar: **Secrets and variables** → **Actions**.
3. **New repository secret**.
4. Name: `TURSO_CONNECTION_URL` (exact spelling, all caps).
5. Value: paste the URL, no quotes, no trailing space.
6. **Add secret**.
7. Repeat for `TURSO_AUTH_TOKEN` and `TMDB_API_KEY`.

You should see three secrets listed. GitHub will not show the values again. To rotate one, click **Update** and paste a new value.

### Repo secrets vs Environment secrets

This workflow uses **repository secrets** (`secrets.TURSO_CONNECTION_URL`). That is enough.

GitHub **Environments** (Settings → Environments) are optional. Use them later if you want a required reviewer before `execute`, or different Turso URLs for staging vs production. The YAML would then need an `environment:` key; it does not today.

### Forks and pull requests

Secrets are **not** available to workflows from forks. That is another reason this job is `schedule` + `workflow_dispatch` only, never `pull_request`.

## 4. Enable the workflow once it appears

After the YAML is on `main`:

1. Click **Actions** in the repo header.
2. If GitHub shows **I understand my workflows, go ahead and enable them**, click it.
3. In the left list you should see **Catalog Sync**.
4. If it is disabled (pause icon), open it → **Enable workflow**.

Scheduled workflows stay off until you enable them. Manual **Run workflow** also requires the workflow to be enabled.

## 5. Test run (do this before trusting the schedule)

Always do a **dry-run** first. Dry-run talks to TMDB and Turso **reads**, computes diffs, writes reports, and does **not** apply catalog mutations.

### Start a manual run

1. **Actions** → **Catalog Sync**.
2. Right side: **Run workflow**.
3. Branch: **main** (must match where the YAML lives).
4. **Sync mode**: choose **dry-run**.
5. **Run workflow**.

GitHub queues a run named after the workflow. Click it.

### What you should see in the log

Expand **Sync catalog from TMDB** → **Run catalog sync**.

Typical lines:

```text
Catalog sync mode: dry-run
Database host: ….turso.io
Languages: TMDB …; DB …
Countries: TMDB …; DB …
Genres: TMDB … unique …
Loaded N movies, M series from DB in …ms
[n/N] movies
[n/M] series
Dry run complete. Would write K row changes.
Timing: total …ms …
Diffs: temp/catalog-sync-…-diffs.csv
Errors: temp/catalog-sync-…-errors.csv
Summary: temp/catalog-sync-…-summary.json
```

If `Database host: missing TURSO_CONNECTION_URL`, the secret is missing or misspelled. Fix secrets and re-run.

If TMDB fails with 401/403, `TMDB_API_KEY` is wrong.

### Download reports

At the bottom of the run page, **Artifacts** → **catalog-sync-reports**. Unzip it. You get:

| File | Contents |
| --- | --- |
| `catalog-sync-<timestamp>-diffs.csv` | Field-level changes the job would apply |
| `catalog-sync-<timestamp>-errors.csv` | Titles TMDB could not fetch (404, timeouts, …) |
| `catalog-sync-<timestamp>-summary.json` | Counts, timings, TMDB request stats |

The upload step uses `if: always()`, so you still get artifacts when the job fails, as long as `temp/catalog-sync-*` was written.

### Second test: execute

When the dry-run summary looks right (`would_write`, error count, database host):

1. **Run workflow** again.
2. **Sync mode**: **execute**.
3. Watch the log for `Execute complete. Wrote N row changes.`

`execute` writes to Turso. There is no undo in the script. Re-running is safe in the sense that it diffs again; it does not “roll back” the previous run.

## 6. How the daily schedule works

### The cron line

In [`.github/workflows/catalog-sync.yml`](../.github/workflows/catalog-sync.yml):

```yaml
on:
  schedule:
    - cron: "0 6 * * *"
```

GitHub uses **standard five-field cron, UTC only**:

```text
┌──────────── minute (0–59)
│ ┌────────── hour (0–23)
│ │ ┌──────── day of month (1–31)
│ │ │ ┌────── month (1–12)
│ │ │ │ ┌──── day of week (0–6, Sunday = 0)
│ │ │ │ │
0 6 * * *
```

`0 6 * * *` means **06:00 UTC every day**.

India is UTC+5:30, so 06:00 UTC is **11:30 IST**. Change the hour if you want a different local time. Examples:

| Goal | Cron | UTC | IST |
| --- | --- | --- | --- |
| Current default | `0 6 * * *` | 06:00 | 11:30 |
| Late night IST | `0 18 * * *` | 18:00 | 23:30 |
| Weekdays only | `0 6 * * 1-5` | 06:00 Mon–Fri | 11:30 Mon–Fri |

After you edit cron, **merge to `main`**. GitHub reads the schedule from the default branch, not from a feature branch.

Hobby-style “once a day” is not a GitHub limit. GitHub Actions can run every 5 minutes, but this job is heavy (TMDB + full catalog). Daily is enough.

### How GitHub actually fires it

1. GitHub stores the cron from `main`.
2. Around that UTC minute it **queues** a `schedule` event.
3. A runner (`ubuntu-latest`) checks out `main`, installs Yarn deps, and runs:

   ```bash
   yarn tsx scripts/sync-catalog.ts --mode execute
   ```

   Scheduled runs have no `inputs.mode`, so the workflow defaults to **execute**.

4. Reports upload as artifacts and expire after **14 days**.

### Delays and skipped runs

- GitHub does **not** guarantee the exact minute. Under load the start can be **several minutes late**, sometimes more.
- If a previous **Catalog Sync** run is still in progress, GitHub may overlap jobs unless you add concurrency. This workflow does not serialize runs. If a sync can take a long time, avoid kicking a manual execute while the daily job is running.
- **Public repos:** GitHub disables scheduled workflows after **60 days of inactivity** on the repo. A push or a manual Actions run counts as activity. Private repos do not have that 60-day disable.
- Schedules do **not** run on forks until you enable Actions there, and forks still will not see your secrets.
- If you rename the default branch, confirm the workflow still lives on the new default branch.

### Seeing scheduled vs manual in the UI

**Actions** → **Catalog Sync** → run list.

| Event | How it is labeled |
| --- | --- |
| Manual | `workflow_dispatch` — you chose the branch and mode |
| Daily | `schedule` — no mode dropdown; always execute |

Click a run → **Annotate** / the first job log shows `Catalog sync mode: execute` or `dry-run`.

You cannot “run the schedule early” except by **Run workflow** with mode `execute`. That is the same code path.

### Turning the schedule off without deleting the file

**Actions** → **Catalog Sync** → **…** (or the gear) → **Disable workflow**.

That stops both schedule and the Run workflow button. To pause only the clock, comment out the `schedule:` block in YAML, merge to `main`, and keep `workflow_dispatch`.

## 7. What the job steps do

1. **Checkout** — clones the commit GitHub selected (`main` for schedule).
2. **Corepack + Node 20 + yarn install --immutable** — same as PR checks, so `tsx` (a devDependency) is installed. Production Vercel installs do not need this.
3. **Run catalog sync** — sets Turso and TMDB env vars from secrets, then runs the CLI.
4. **Upload sync reports** — even on failure (`if: always()`), so you can still grab `temp/` files.

`timeout-minutes: 60` kills the job if TMDB or Turso hangs. Increase it if a large library regularly hits the cap.

## 8. Minutes, logs, and privacy

- **Private repo:** GitHub Free includes a monthly budget of Actions minutes (2,000 on the free private plan, shared with other jobs). A daily 5–15 minute sync is usually well inside that. PR checks also consume minutes.
- **Public repo:** Actions minutes for standard `ubuntu-latest` are free, but **logs are public**. Do not print secrets. Database hostnames in the script log are visible; tokens are not, as long as they stay in `env`.
- Artifact zips are visible to anyone who can see Actions for that repo.

## 9. Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Workflow missing under Actions | YAML not on default branch, or Actions disabled | Merge to `main`, enable Actions |
| `missing TURSO_CONNECTION_URL` | Secret name mismatch | Recreate secret; names must match YAML exactly |
| `TURSO_AUTH_TOKEN is not configured` | Empty or unset secret | Update the secret; no quotes |
| TMDB 401 | Bad API key | Update `TMDB_API_KEY` |
| Job cancelled at 60m | Catalog too large or TMDB throttling | Re-run; consider raising `timeout-minutes` |
| No artifact | Script crashed before writing `temp/` | Read the sync step log |
| Schedule never fires | Workflow disabled, not on default branch, or public-repo inactivity | Enable workflow, merge to `main`, push or run manually |
| Dry-run looks fine, execute writes 0 | Nothing changed since last execute | Expected; check `would_write` vs `written` in summary JSON |

Local equivalent (does not use GitHub secrets):

```bash
yarn catalog:sync
yarn catalog:sync:execute
```

Those read `.env` / `.env.local` on your machine.

## 10. Checklist

1. Workflow file is on `main`.
2. Actions are enabled for the repo.
3. Three repository secrets are set.
4. Manual **dry-run** succeeded; reports downloaded.
5. Manual **execute** succeeded against the intended database.
6. Leave the workflow enabled so `0 6 * * *` UTC can queue daily execute runs.
