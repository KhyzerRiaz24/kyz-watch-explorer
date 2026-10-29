# Running and deploying KYZ

## Local production preview

```sh
npm ci
npm run setup
npm run build
npm start
```

Node.js 24 LTS is recommended. Open `http://127.0.0.1:4177`. The application requires a Node server; uploading `dist/` alone will not provide the API.

## Docker

Stop any local server using port 4177, then run:

```sh
docker compose up --build -d
docker compose ps
docker compose logs --tail=50
```

The compose file binds to `127.0.0.1:4177`, loads explicitly listed settings from your ignored `.env`, and persists the database in the `kyz-data` named volume. The container runs as an unprivileged user with Linux capabilities dropped. No development dependencies or local credentials are copied into the image.

Before an external deployment, put this service behind a trusted HTTPS reverse proxy and configure `HOST=0.0.0.0` where required. Set `TRUST_PROXY=1` only when exactly one trusted proxy is in front of the process and direct access to the app port is blocked. The public hostname must route both `/api/*` and page routes to the same process. Use a persistent filesystem volume, a long random `ADMIN_TOKEN`, and one application instance. Do not put secrets in image build arguments, source files or a `VITE_` variable.

Optional AI mode requires a private `OPENAI_API_KEY` and a model ID available to that account in `OPENAI_MODEL`. The distributed `.env.example` leaves both empty; the verified local deployment has its replacement key configured privately with `gpt-6-luna`. API usage has provider costs. The old OpenAI key was verified as revoked, and the owner confirmed deletion of the old MongoDB cluster. See the verification record for the evidence and scope of those checks.

### Health and operating checks

`GET /api/health` performs a database query and returns status plus application version. Check the process/container health and server response after restart. The application handles SIGTERM/SIGINT and closes the server and database. Rate limiting is per process; this is not a multi-instance deployment design.

## Backup and restore

For a local process: stop the app cleanly, copy the entire `data/` folder to a secure backup location, then restart it. Do not copy an actively written SQLite file without using a proper SQLite backup API; WAL files may contain uncheckpointed transactions.

For Docker, make a consistent offline archive of the named volume:

```sh
docker compose stop kyz
docker compose run --rm --no-deps --entrypoint sh kyz -c 'tar -C /app/data -czf /app/data/kyz-backup.tar.gz kyz.sqlite'
docker compose cp kyz:/app/data/kyz-backup.tar.gz ./kyz-backup.tar.gz
docker compose run --rm --no-deps --entrypoint sh kyz -c 'rm -f /app/data/kyz-backup.tar.gz'
docker compose start kyz
```

Keep backups private. Stop the app before restoring the database. Restore into the same volume, preserve the non-root file ownership, remove stale `-wal` and `-shm` files from the old database only while stopped, and restart. Verify the catalogue and `/api/health` afterwards. Never remove a volume merely to deploy a new build.

## Rollback

Keep the previous source revision/image and a compatible pre-upgrade database backup. Rebuild or select that image, keeping the persistent volume if its schema is compatible. Schema version 1 is the initial schema; future schema migrations must include explicit forward and rollback planning. A source rollback does not automatically undo catalogue edits.

## CI

The included GitHub Actions workflow runs on pushes to `main` and pull requests. It uses Node 24, runs checks and the dependency audit, installs Chromium, tests browser behaviour and builds the Docker image. It does not deploy to a paid provider or publish a repository automatically.
