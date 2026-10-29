# Engineering decisions

## A working application without the old cloud account

The original catalogue page imported a JavaScript array while a separate MongoDB API went unused. This version routes catalogue reads and edits through a single Express API. SQLite keeps the demonstration persistent and reproducible without provisioning cloud infrastructure or retaining the old database credentials.

Prepared statements separate query values from SQL. Foreign keys cascade removal of a watch’s synthetic history. Seeding runs in a transaction and records a marker so restarts cannot overwrite curator edits or repopulate an intentionally cleared catalogue. The schema is versioned using SQLite `user_version`. Synchronous queries are deliberately bounded to a tiny catalogue; a larger application would need pagination, query profiling and workload-appropriate database access.

## Trust boundaries

- Public endpoints can read catalogue data, statistics and example history.
- Create/update/delete endpoints require a server-side curator token. SHA-256 digests are compared with a constant-time comparison; tokens never become frontend environment variables or browser storage entries.
- JSON bodies have a size limit; watch fields have explicit type, length, range and image URL validation. Images are displayed in the browser; the server does not fetch user-supplied image URLs.
- The application is same-origin. There is no permissive cross-origin API policy, cookie-based authentication or customer identity database.
- Helmet supplies content and framing restrictions. API responses are not cached. The production server omits development tooling and source maps.
- API, chat and failed studio access attempts have separate rate limits. Reverse-proxy trust is explicit. The in-memory limiter is suitable for a single process; multiple replicas would require a shared limit store.
- The studio key is retained only in React component memory and is discarded on sign-out, navigation away or refresh. HTTPS is required outside a trusted local environment. A stolen key is still a credential; change it and restart to revoke access.
- No chat transcript, question or credential is written to the database or application logs. General AI questions may be transmitted to OpenAI only when configured. `store: false` concerns response storage, not a promise about all provider retention policies.

## Recommendations before generation

The original scoring approach rewarded a brand match even when the price failed the requested budget. The replacement first applies hard constraints, then orders the remaining matches by sample price. Supported styles and features are explicit. Missing matches produce a useful empty response rather than an out-of-budget suggestion.

A `k` multiplier is parsed only as a suffix to the number; the letter in “Patek” cannot change a budget. Unsupported currencies request clarification rather than assuming exchange rates. Limits are inclusive, and the parser is deliberately described as bounded rather than full natural-language understanding. Each message is considered independently. General educational answers can use the OpenAI Responses API; deterministic catalogue cards and matching do not depend on a model response.

This project does not train a model or claim recommendation accuracy on real customers. Provider integration is regression-tested using injected responses. The current local deployment additionally passed a live request with the owner’s replacement project key and `gpt-6-luna`. For this verified model, requests set reasoning effort to `none` for short educational explanations; other configured models retain their own defaults. Redirects are rejected to avoid forwarding authenticated requests to another destination. Credentials are not part of this repository.

## Interface and accessibility

The interface uses native landmarks, visible labels, focus indicators and `dialog` for modal focus containment and Escape handling. Dialog cleanup restores focus and document scrolling. The advisor becomes a full-width mobile sheet instead of a fixed 384px box. Comparison tables scroll within their own region so the page itself remains within the viewport.

Saved IDs are validated when read from local storage, storage errors are surfaced, and cross-tab changes update the UI. Filter state and shared comparison selections are encoded in URLs. Loading, error, empty, missing-page and unavailable-data states are explicit. Reduced-motion preferences disable motion, and charts include descriptions and accessible value tables. The UI uses local images and system fonts to avoid runtime reliance on external asset services.

## Delivery

One Node process serves the API and built frontend, avoiding mismatched frontend/backend base URLs. The production container runs as an unprivileged user, uses a named database volume and includes a health probe. CI builds, checks types, lints, tests real API requests, audits packages, tests browser workflows and builds the image. CI is configured here; a successful hosted CI run requires pushing to a GitHub repository.

The deployment is intentionally one instance. Filesystem backups must use SQLite’s backup mechanism or stop the process before copying the database and its WAL state. Documentation includes a consistent offline backup path and rollback notes.
