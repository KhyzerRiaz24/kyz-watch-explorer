# Verification record

Verified locally on 29 October 2026 using Node.js 22.23.2 and an installed Google Chrome browser. Node 24 LTS is the recommended deployment runtime. The original university submission was read for review and left unchanged; work lives in the separate `kyz-watch-explorer` project.

## Completed checks

- TypeScript: `npm run typecheck` passed.
- Development and production servers each returned HTTP 200 from the health endpoint and exited cleanly with code 0 after SIGTERM.
- Code quality: `npm run lint` passed with zero warnings.
- Server tests: 24 passed, covering recommendation limits, reference-specific budgets, currencies, provider success/failure fixtures, input validation, authentication, rate limits, database-backed reads, synthetic history, statistics, SQL-like input, security headers and persistence across restarts.
- Production build: `npm run build` passed. The main JavaScript output is approximately 230 kB (75 kB gzip), with the studio loaded separately. The reviewed original main output was approximately 741 kB (223 kB gzip).
- A rapid filter-change regression was additionally repeated 12 consecutive times after fixing stale URL parameters.
- Browser tests: 19 checks cover search and sorting, filter URL persistence, saved-watch persistence, comparison limits and shared URLs, modal focus and Escape handling, advisor matching, CSV export, protected editor create/update/delete, retry states and unknown routes.
- Responsive checks cover the main routes at 320, 390, 768 and 1440 CSS pixels, including contained comparison-table scrolling and the advisor panel.
- Automated axe scans cover home, catalogue, insights, about, studio sign-in and a mobile product dialog against WCAG A/AA rules. No violations were reported in these scans. This is not a claim of complete accessibility certification.
- Final dependency audit: `npm audit --audit-level=moderate` reported zero known vulnerabilities at verification time. New advisories may emerge later; Dependabot configuration is included.
- A source/build scan found no copies of the original embedded API key or MongoDB credentials. Environment files and runtime data are ignored and excluded from the container build context.
- Desktop, mobile, collection, comparison and insight screenshots are included in `docs/screenshots/`. Visual review confirmed readable layouts and working local images. The mobile page remained 390px wide at a 390px viewport.

## Verification limits

The OpenAI integration was tested with controlled provider responses, including failures, response extraction and model-specific request settings. On 29 October 2026, a replacement project API key was created through the secure OpenAI Developers setup flow and saved only to the ignored local `.env`. The bundled setup check completed a live haiku request using `gpt-6-luna`. A subsequent request through the Docker-hosted `/api/chat` returned HTTP 200 with `mode: ai` and a concise explanation of an automatic watch movement. The container reports AI enabled. No secret is included in source, browser bundles, screenshots or the source archive. The built-in advisor remains functional when external access is not configured.

Docker Desktop’s engine was started locally and the production Docker image built successfully on 29 October 2026 using Node 24. The working SQLite database was backed up and imported into the project’s named volume. The container passed its health check. A temporary authenticated catalogue record survived a container restart and was removed after verification. Mobile browser filtering and the watch-details dialog were tested against the Docker-hosted app; the page remained within a 390px viewport without JavaScript errors. The sanitised source is published at https://github.com/KhyzerRiaz24/kyz-watch-explorer. Its first hosted GitHub Actions verification run passed, including the container build. Public-host deployment status is recorded after it is verified.

On 29 October 2026, the signed-in OpenAI API-key console showed the original “Final year project” key as Revoked. Its masked identifier was matched locally against the credential in the original university source without printing that credential. The replacement “KYZ watch” key was shown as Active and was preserved. The current Atlas account contains a new organisation with one empty project and no clusters or database users; the owner confirmed that the original MongoDB cluster had already been deleted. That deletion is owner-confirmed, rather than independently verified against the old Atlas project. No old credential was used to contact either provider. The new application uses SQLite and does not require a replacement MongoDB password.

## Repeat the checks

```sh
npm ci
npm run check
npm run format:check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=moderate
```

Browser tests use an isolated database (`data/e2e.sqlite`) and a generated test access key, not the working catalogue or private studio key. They serve the production build on port 4181. On macOS with an existing Chrome installation, use:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

The project’s `.github/workflows/ci.yml` performs verification automatically after publication to a GitHub repository. The dependency lockfile is committed to make installations reproducible; the workflow itself needs a real GitHub run before a green CI badge can be claimed.
